import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { OfferCalculatorProps } from "@/components/report/offer-calculator";
import { ReportView } from "@/components/report/report-view";
import { NotFoundView, RefusalView } from "@/components/report/state-views";
import { VerdictView } from "@/components/report/verdict-view";
import { parseLang } from "@/lib/i18n";
import { PRIVATE_OG_IMAGE, ogShareText } from "@/lib/og";
import {
    ACCOUNT_COOKIE,
    RUNNER_COOKIE,
    balanceOf,
    chatTurnsLeft,
    computeOffer,
    getAccount,
    getBySlug,
    getPinnedOffer,
    getUnlockInfo,
    hasTrackingChange,
    isPublicReport,
    isUnlocked,
    redactAnalysis,
    unlockAnalysis,
} from "@/lib/store";
import type { Analysis, FlagFull } from "@/lib/types";
import { LangProvider } from "@/providers/lang";

/**
 * /r/:slug — verdict → full report on one URL (unlock in place; public = free tier).
 * Free summary is server-rendered crawlable HTML; locked flags are redacted at
 * the store boundary before anything reaches the client (§6.4, acceptance §12).
 * An account that owns the report (asunto_account cookie) gets the full
 * document (R7-1…R7-8): §1–§7, the docked chat, and full flags — the report
 * payload opens only behind the unlock, the free tier keeps the redacted seam.
 *
 * R8 register: the free tier IS the public page. A shared-link visitor (no
 * runner cookie, not the owner) gets the R8-1 banner and a visitor CTA that
 * routes to / — never to /unlock (a visitor can't buy someone else's report).
 * Ended listings stay published with past-tense strings (R8-3). Private pages
 * (owner toggle, R7-2 footer) drop to noindex + the private-generic OG card
 * (R8-5d) — see generateMetadata.
 */
export default async function Page({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { slug } = await params;
    const sp = await searchParams;
    const lang = parseLang(sp.lang);
    const analysis = getBySlug(slug);

    const jar = await cookies();
    const account = getAccount(jar.get(ACCOUNT_COOKIE)?.value);
    const unlocked = !!account && !!analysis && isUnlocked(account.id, analysis.id);
    /* R7-5's listing-changed banner is driven by the tracking record (R12):
       once the report is unlocked, a price/status diff in its seeded tracking
       record shows the banner. The mock trigger ?state=changed stays as the
       manual way to flip the state (comment per the slice brief). */
    const changed = sp.state === "changed" || (!!account && !!analysis && unlocked && hasTrackingChange(account.id, analysis.id));
    // Mock-only R8-3 trigger (?state=ended) — the real ended state arrives from
    // the daily listing re-check (R8-1 annotation); fixture default is "live".
    const ended = sp.state === "ended" || analysis?.listingStatus?.state === "ended";
    // R8-1 visitor chrome: the analyst's browser carries RUNNER_COOKIE with
    // this slug (stamped by POST /api/analyses); everyone else on the free
    // tier is a shared-link visitor.
    const visitor = !!analysis && !unlocked && jar.get(RUNNER_COOKIE)?.value !== slug;

    /* R5-6 — the offer calculator's initial payload is computed here, at the
       store boundary (the client never computes, §6.2): at the pinned offer
       when one exists, else at asking. The unpaid tier gets the same payload
       locked at asking (its figures are all free-tier-visible) and never POSTs. */
    let offer: OfferCalculatorProps | undefined;
    const pinned = account && analysis ? getPinnedOffer(account.id, analysis.id) : undefined;
    if (analysis?.offer && analysis.listing && analysis.status === "done") {
        const initial = computeOffer(analysis, unlocked && pinned ? pinned.offerPrice : analysis.listing.askPrice);
        if (initial) {
            offer = {
                slug: analysis.slug,
                initial,
                askPrice: analysis.listing.askPrice,
                sliderMin: analysis.offer.slider.min,
                sliderStep: analysis.offer.slider.step,
                marketNote: analysis.offer.marketNote,
                honesty: analysis.offer.honesty,
                initialPinned: unlocked ? (pinned ?? null) : null,
                unlocked,
            };
        }
    }

    return (
        <LangProvider initialLang={lang}>
            {!analysis ? (
                <NotFoundView url={`https://asunnot.oikotie.fi/…/${slug}`} />
            ) : analysis.status === "done" ? (
                unlocked && account && analysis.report ? (
                    (() => {
                        const unlock = getUnlockInfo(account.id, analysis.id);
                        return (
                            <ReportView
                                analysis={unlockAnalysis(analysis)}
                                balance={balanceOf(account.id)}
                                initialTurnsLeft={chatTurnsLeft(account.id, analysis.id)}
                                unlockTs={unlock?.ts ?? Date.parse(analysis.readAt)}
                                unlockPackId={unlock?.packId}
                                changed={changed}
                                initialPublic={isPublicReport(analysis.id)}
                                offer={offer}
                                pinned={pinned ?? null}
                            />
                        );
                    })()
                ) : (
                    <>
                        <VerdictView
                            analysis={redactAnalysis(analysis)}
                            visitor={visitor}
                            ended={ended}
                            offer={offer}
                            /* R15-2/3: tips fire on the first verdict this
                               account/browser owns — never for shared-link
                               visitors (gated inside the view too). */
                            onboardingSeen={account?.onboardingSeen ?? false}
                            hasAccount={!!account}
                        />
                        {isPublicReport(analysis.id) ? <JsonLd analysis={redactAnalysis(analysis)} lang={lang} /> : null}
                    </>
                )
            ) : analysis.status === "refused" || analysis.status === "withdrawn" ? (
                <RefusalView analysis={redactAnalysis(analysis)} />
            ) : (
                <NotFoundView url={`https://asunnot.oikotie.fi/…/${slug}`} />
            )}
        </LangProvider>
    );
}

/* JSON-LD Product + FAQPage from flag titles (R8 handoff notes). Built from
   the REDACTED analysis — locked flag titles never leave the server, so the
   schema can never leak the seam (§6.4). Public pages only. */
function JsonLd({ analysis, lang }: { analysis: Analysis; lang: "fi" | "en" }) {
    const { listing, verdict } = analysis;
    if (!listing || !verdict) return null;
    const openFlags = verdict.flags.filter((f): f is FlagFull => !f.locked);
    const data = [
        {
            "@context": "https://schema.org",
            "@type": "Product",
            name: `${lang === "fi" ? "Asunnon riskianalyysi" : "Apartment risk analysis"} — ${listing.addr}, ${listing.city}`,
            description: `№ ${analysis.number} · resimator.fi/r/${analysis.slug}`,
            brand: { "@type": "Organization", name: "Resimator OY" },
        },
        ...(openFlags.length
            ? [
                  {
                      "@context": "https://schema.org",
                      "@type": "FAQPage",
                      mainEntity: openFlags.map((flag) => ({
                          "@type": "Question",
                          name: lang === "fi" ? flag.titleFi : flag.title,
                          acceptedAnswer: { "@type": "Answer", text: flag.quotes[0]?.text ?? (lang === "fi" ? flag.bodyFi : flag.body) },
                      })),
                  },
              ]
            : []),
    ];
    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export async function generateMetadata({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
    const { slug } = await params;
    const sp = await searchParams;
    const lang = parseLang(sp.lang);
    const analysis = getBySlug(slug);
    if (!analysis?.listing) return { title: "Analysis" };

    /* Share metadata per report state (R8-4 og:title/description; R8-5 mapping).
       Private → noindex + the brand-only card, zero deal data (R8-5d). */
    const isPublic = isPublicReport(analysis.id);
    const share = ogShareText(analysis, lang, isPublic);
    const imageUrl = isPublic ? `/r/${slug}/opengraph-image${lang === "en" ? "?lang=en" : ""}` : PRIVATE_OG_IMAGE;

    return {
        title: `${analysis.listing.addr}, ${analysis.listing.city} — risk analysis`,
        description: share.description,
        // The R8-1 register is "indexed, canonical" — ?lang=/?state= previews
        // must not duplicate the indexed page.
        alternates: { canonical: `/r/${slug}` },
        robots: isPublic ? undefined : { index: false, follow: false },
        openGraph: {
            title: share.title,
            description: share.description,
            type: "article",
            images: [{ url: imageUrl, width: 1200, height: 630, alt: share.alt }],
        },
        twitter: {
            card: "summary_large_image",
            title: share.title,
            description: share.description,
            images: [imageUrl],
        },
    };
}
