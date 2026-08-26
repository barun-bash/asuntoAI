import type { Metadata } from "next";
import { cookies } from "next/headers";
import { UnlockView } from "@/components/report/unlock-view";
import { resolveLang } from "@/lib/i18n-server";
import { PRIVATE_OG_IMAGE } from "@/lib/og";
import { ACCOUNT_COOKIE, balanceOf, getAccount, getBySlug, hasAnyUnlock, isUnlocked, packs, redactAnalysis, usedOf } from "@/lib/store";
import { LangProvider } from "@/providers/lang";

/**
 * /unlock — packs + payment, one screen (R6-1…R6-10). The paywall seam links
 * here with ?report=<slug>; ?reason=credits opens the 0-credits state (R6-4).
 * The account (if any) comes from the httpOnly asunto_account cookie; every
 * figure on the page is engine/store-authored — the view only formats.
 */
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const sp = await searchParams;
    const lang = await resolveLang(sp.lang);
    const reportSlug = typeof sp.report === "string" ? sp.report : undefined;
    const reasonCredits = sp.reason === "credits";

    const analysis = reportSlug ? getBySlug(reportSlug) : undefined;
    const redacted = analysis?.status === "done" ? redactAnalysis(analysis) : undefined;

    const jar = await cookies();
    const account = getAccount(jar.get(ACCOUNT_COOKIE)?.value);
    const balance = account ? balanceOf(account.id) : 0;
    const used = account ? usedOf(account.id) : 0;
    const alreadyUnlocked = account && analysis ? isUnlocked(account.id, analysis.id) : false;

    // R6-1 annotation: the banner renders only when the account has no prior
    // full report (the view additionally checks the browser flag on mount).
    const firstFreeEligible = !account || (!account.freeClaimed && !hasAnyUnlock(account.id));

    return (
        <LangProvider initialLang={lang}>
            <UnlockView
                report={
                    redacted?.listing && redacted.verdict
                        ? {
                              id: redacted.id,
                              slug: redacted.slug,
                              addr: redacted.listing.addr,
                              lockedFlags: redacted.verdict.flags.filter((f) => f.locked).length,
                              tests: redacted.policy?.tests.length ?? 14,
                          }
                        : undefined
                }
                reasonCredits={reasonCredits}
                packs={packs}
                hasAccount={!!account}
                balance={balance}
                used={used}
                firstFreeEligible={firstFreeEligible && !!redacted}
                alreadyUnlocked={alreadyUnlocked}
            />
        </LangProvider>
    );
}

/* R8-5d: checkout is a private route (payment state must never be indexed or
   unfurled with deal data) — brand-only OG card, noindex. The receipt/refund
   pages (account slice 7) inherit the same pattern. */
export const metadata: Metadata = {
    title: "Unlock the full report",
    robots: { index: false, follow: false },
    openGraph: { images: [{ url: PRIVATE_OG_IMAGE, width: 1200, height: 630 }] },
};
