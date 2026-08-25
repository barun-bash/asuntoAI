import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BankSummaryPrint } from "@/components/print/bank-summary-print";
import { PrintToolbar } from "@/components/print/print-toolbar";
import { dict } from "@/i18n/dict";
import { parseLang } from "@/lib/i18n";
import { ACCOUNT_COOKIE, getAccount, getBySlug, isUnlocked, unlockAnalysis } from "@/lib/store";

/**
 * /r/:slug/bank-summary.pdf?lang=fi|en — the P4 one-pager (R7-P, handoff §10):
 * purchase → loan need → base+stress serviceability → liabilities disclosed →
 * the fixed "not a loan offer" disclaimer. Uses the engine-published current-
 * version figures (fixture bankSummary, v2 in the mock). Same A4 sheet/@page
 * treatment and the same unlock gate as /r/:slug/pdf.
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
    const unlocked = !!account && !!analysis && analysis.status === "done" && !!analysis.report && isUnlocked(account.id, analysis.id);
    if (!analysis || !unlocked) redirect(`/r/${slug}${lang === "en" ? "?lang=en" : ""}`);

    const t = dict[lang];
    const suffix = lang === "en" ? "?lang=en" : "";

    return (
        <>
            {/* Screen-only convenience chrome (hidden when printing). */}
            <PrintToolbar
                basePath={`/r/${slug}/bank-summary.pdf`}
                backHref={`/r/${slug}${suffix}`}
                lang={lang}
                hint={t.print.toolbarHint.replace("{pages}", "1")}
                labels={{ back: t.print.toolbarBack, print: t.print.toolbarPrint }}
            />
            <main>
                <BankSummaryPrint analysis={unlockAnalysis(analysis)} lang={lang} t={t} />
            </main>
        </>
    );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const analysis = getBySlug(slug);
    return {
        title: analysis?.listing ? `${analysis.listing.addr}, ${analysis.listing.city} — bank summary` : "Bank summary",
        robots: { index: false, follow: false },
    };
}
