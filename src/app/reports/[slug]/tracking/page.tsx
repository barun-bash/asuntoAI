import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TrackingView } from "@/components/account/tracking-view";
import { parseLang } from "@/lib/i18n";
import { PRIVATE_OG_IMAGE } from "@/lib/og";
import { ACCOUNT_COOKIE, balanceOf, getAccount, getBySlug, getTrackingPayload, getTrackingSeededAt, isUnlocked } from "@/lib/store";
import { LangProvider } from "@/providers/lang";

/* R8-5d: the tracking dashboard is a private route — brand-only OG, noindex. */
export const metadata: Metadata = {
    title: "Tracking",
    robots: { index: false, follow: false },
    openGraph: { images: [{ url: PRIVATE_OG_IMAGE, width: 1200, height: 630 }] },
};

/**
 * /reports/:slug/tracking — the R12 dashboard ("what happened after you
 * unlocked"). Auto-on at unlock; the record comes from the store (seeded by
 * the checkout mint). Entry: the My-reports row status link + the report
 * header (the R12 scope guard). One listing, actual vs. read — explicitly NOT
 * the platform's portfolio. Unlock-gated exactly like the report itself:
 * anyone else is routed back to the report's public page.
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
    const unlocked = !!account && !!analysis && analysis.status === "done" && isUnlocked(account.id, analysis.id);
    if (!analysis || !account || !unlocked) redirect(`/r/${slug}${lang === "en" ? "?lang=en" : ""}`);

    const payload = getTrackingPayload(account.id, analysis.id);
    if (!payload || !analysis.listing || !analysis.verdict) redirect(`/r/${slug}${lang === "en" ? "?lang=en" : ""}`);

    return (
        <LangProvider initialLang={lang}>
            <TrackingView
                slug={analysis.slug}
                addr={`${analysis.listing.addr}, ${analysis.listing.city}`}
                number={analysis.number}
                seededAt={getTrackingSeededAt(account.id, analysis.id) ?? Date.parse(analysis.readAt)}
                payload={payload}
                balance={balanceOf(account.id)}
                email={account.email}
            />
        </LangProvider>
    );
}
