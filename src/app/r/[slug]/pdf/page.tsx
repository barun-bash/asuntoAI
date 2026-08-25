import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PrintToolbar } from "@/components/print/print-toolbar";
import { REPORT_PRINT_PAGES, ReportPrint } from "@/components/print/report-print";
import { dict } from "@/i18n/dict";
import { parseLang } from "@/lib/i18n";
import { ACCOUNT_COOKIE, getAccount, getAgentChecklist, getBySlug, isUnlocked, unlockAnalysis } from "@/lib/store";

/**
 * /r/:slug/pdf — the A4 print document (R7-P P1–P3 + appendices A/B/C, handoff
 * §10). Server-rendered paginated sheets + @page stylesheet, so the browser's
 * "Save as PDF" yields the artifact. Gated exactly like the report route:
 * full-report content exists only for the unlocked account — everyone else
 * redirects to /r/:slug (locked data never reaches the client, §6.4).
 * Appendices A (price history) + B (rent history) share one sheet; C (agent
 * checklist) is the last page, its checkbox squares reflecting the account's
 * persisted ticks (R7-11 "checkboxes are real print targets").
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
    // Appendix C prints the account's persisted ticks (R7-11 checked state).
    const checkedIds = getAgentChecklist(account.id, analysis)
        ?.items.filter((item) => item.checked)
        .map((item) => item.id);

    return (
        <>
            {/* Screen-only convenience chrome (hidden when printing) — the
               artifact below is the whole printed output. */}
            <PrintToolbar
                basePath={`/r/${slug}/pdf`}
                backHref={`/r/${slug}${suffix}`}
                lang={lang}
                hint={t.print.toolbarHint.replace("{pages}", String(REPORT_PRINT_PAGES))}
                labels={{ back: t.print.toolbarBack, print: t.print.toolbarPrint }}
            />
            <main>
                <ReportPrint analysis={unlockAnalysis(analysis)} lang={lang} t={t} checkedIds={checkedIds} />
            </main>
        </>
    );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const analysis = getBySlug(slug);
    return {
        title: analysis?.listing ? `${analysis.listing.addr}, ${analysis.listing.city} — A4 print` : "Report — A4 print",
        // Print artifacts are private documents; the crawlable surface is /r/:slug.
        robots: { index: false, follow: false },
    };
}
