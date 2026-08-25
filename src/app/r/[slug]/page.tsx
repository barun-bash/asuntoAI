import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ReportView } from "@/components/report/report-view";
import { NotFoundView, RefusalView } from "@/components/report/state-views";
import { VerdictView } from "@/components/report/verdict-view";
import { parseLang } from "@/lib/i18n";
import { ACCOUNT_COOKIE, balanceOf, chatTurnsLeft, getAccount, getBySlug, getUnlockInfo, isUnlocked, redactAnalysis, unlockAnalysis } from "@/lib/store";
import { LangProvider } from "@/providers/lang";

/**
 * /r/:slug — verdict → full report on one URL (unlock in place; public = free tier).
 * Free summary is server-rendered crawlable HTML; locked flags are redacted at
 * the store boundary before anything reaches the client (§6.4, acceptance §12).
 * An account that owns the report (asunto_account cookie) gets the full
 * document (R7-1…R7-8): §1–§7, the docked chat, and full flags — the report
 * payload opens only behind the unlock, the free tier keeps the redacted seam.
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
    // Mock-only R7-5 trigger — the real banner is tracking-diff driven (slice 8).
    const changed = sp.state === "changed";

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
                            />
                        );
                    })()
                ) : (
                    <VerdictView analysis={redactAnalysis(analysis)} />
                )
            ) : analysis.status === "refused" || analysis.status === "withdrawn" ? (
                <RefusalView analysis={redactAnalysis(analysis)} />
            ) : (
                <NotFoundView url={`https://asunnot.oikotie.fi/…/${slug}`} />
            )}
        </LangProvider>
    );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const analysis = getBySlug(slug);
    if (!analysis?.listing) return { title: "Analysis" };
    return {
        title: `${analysis.listing.addr}, ${analysis.listing.city} — risk analysis`,
        description:
            analysis.status === "refused"
                ? "Analysis stopped — no verdict issued. No credit was spent."
                : "Apartment risk analysis · free summary — every claim quoted from the source.",
    };
}
