"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChatPanel, type YourFigure, readYourFigure } from "@/components/report/chat-panel";
import { LangToggle } from "@/components/report/lang-toggle";
import { ReportDocument } from "@/components/report/report-document";
import { formatDate } from "@/lib/format";
import type { Analysis, PackId } from "@/lib/types";
import { tpl, useLang } from "@/providers/lang";
import { cx } from "@/utils/cx";

/**
 * The unlocked /r/:slug — same route as the free summary, the seam replaced in
 * place by the full document (R7-1): top bar (credits, My reports, PDF), the
 * §-rail with scroll-spy on mobile/tablet (R7-3/R7-7), the document column and
 * the docked chat ≥1280. `changed` is the mock-only ?state=changed trigger for
 * the R7-5 banner (real diffs arrive from tracking, slice 8).
 */

const SECTION_IDS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7"] as const;

/* ── Top bar (R7-1): logomark, credits pill, My reports, Download PDF.
   LangToggle stays for FI parity (the R7 frames don't draw it — noted in the PR). ── */
function ReportTopBar({ slug, balance }: { slug: string; balance: number }) {
    const { t } = useLang();
    return (
        <header className="sticky top-0 z-30 border-b border-rsm-hairline bg-rsm-paper/95 backdrop-blur-[8px]">
            <div className="mx-auto flex h-14 w-full max-w-[800px] items-center justify-between gap-3 px-4 md:h-16 md:max-w-[704px] xl:max-w-none xl:px-12">
                <Link href="/" aria-label="Resimator Report" className="flex min-h-11 items-center">
                    <Image src="/assets/logo/logomark-glyph-positive.svg" alt="" width={28} height={28} priority />
                </Link>
                <nav className="flex items-center gap-2 md:gap-3">
                    <LangToggle />
                    <span className="tnum inline-flex min-h-7 items-center rounded-full px-3 text-[11px] leading-none font-bold text-rsm-midnight shadow-[inset_0_0_0_1px_var(--color-rsm-hairline)]">
                        <span className="max-md:hidden">{tpl(t.report.creditsPill, { n: balance })}</span>
                        <span className="md:hidden">{tpl(t.report.creditsPillShort, { n: balance })}</span>
                    </span>
                    {/* TODO(R10 slice): /reports drawer ships with the account slice. */}
                    <Link
                        href="/reports"
                        className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-rsm-charcoal transition-colors duration-200 ease-rsm hover:text-rsm-steel max-md:hidden"
                    >
                        {t.report.myReports}
                    </Link>
                    <Link
                        href={`/r/${slug}/pdf`}
                        className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-bold text-rsm-midnight shadow-[inset_0_0_0_1px_var(--color-rsm-hairline)] transition-colors duration-200 ease-rsm hover:shadow-[inset_0_0_0_1px_var(--color-rsm-steel)] max-md:hidden"
                    >
                        {t.report.downloadPdf}
                    </Link>
                    <Link href={`/r/${slug}/pdf`} className="inline-flex min-h-11 items-center px-2 text-[13px] font-medium text-rsm-steel md:hidden">
                        {t.report.pdfShort}
                    </Link>
                </nav>
            </div>
        </header>
    );
}

/* ── §-rail (R7-3/R7-7): sticky under the top bar on mobile + tablet, pills
   §1…§7, scroll-spy sets the active pill. All targets ≥44 px. ── */
function SectionRail() {
    const { t } = useLang();
    const [active, setActive] = useState<string>("s1");

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) setActive(entry.target.id);
                }
            },
            // Active = the section crossing the upper third of the viewport.
            { rootMargin: "-30% 0px -60% 0px" },
        );
        for (const id of SECTION_IDS) {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        }
        return () => observer.disconnect();
    }, []);

    return (
        <nav aria-label={t.report.railAria} className="sticky top-14 z-20 border-b border-rsm-hairline bg-rsm-paper/95 backdrop-blur-[8px] md:top-16 xl:hidden">
            <div className="mx-auto scrollbar-hide flex w-full max-w-[800px] gap-1.5 overflow-x-auto px-4 py-2 md:max-w-[704px]">
                {SECTION_IDS.map((id, i) => (
                    <a
                        key={id}
                        href={`#${id}`}
                        aria-current={active === id ? "true" : undefined}
                        className={cx(
                            "inline-flex min-h-11 shrink-0 items-center rounded-full px-3.5 text-[11px] leading-none font-bold whitespace-nowrap transition-colors duration-200 ease-rsm",
                            active === id ? "bg-rsm-midnight text-rsm-paper" : "text-rsm-midnight shadow-[inset_0_0_0_1px_var(--color-rsm-hairline)]",
                        )}
                    >
                        §{i + 1} {t.report.sections[id]}
                    </a>
                ))}
            </div>
        </nav>
    );
}

export function ReportView({
    analysis,
    balance,
    initialTurnsLeft,
    unlockTs,
    unlockPackId,
    changed,
}: {
    analysis: Analysis;
    balance: number;
    initialTurnsLeft: number;
    unlockTs: number;
    unlockPackId?: PackId;
    changed: boolean;
}) {
    const { lang, t } = useLang();
    // The dashed "your figure" card (§4) appears only after the user supplies a
    // figure — today via the 900 € chat what-if (persisted locally); the offer
    // calculator (slice 8) becomes the second producer.
    const [yourFigure, setYourFigure] = useState<YourFigure | null>(null);
    useEffect(() => {
        setYourFigure(readYourFigure(analysis.slug));
    }, [analysis.slug]);

    const unlockDate = formatDate(new Date(unlockTs).toISOString(), lang);
    const unlockOrigin = unlockPackId
        ? t.unlock[`pack${unlockPackId === "five" ? "Five" : unlockPackId === "twenty" ? "Twenty" : "Single"}`].name
        : t.report.originFirstFree;

    return (
        <div className="min-h-screen pb-24 xl:pb-16">
            <ReportTopBar slug={analysis.slug} balance={balance} />
            <SectionRail />
            <main className="mx-auto w-full max-w-[800px] px-4 md:max-w-[704px] md:px-0 xl:max-w-none xl:px-12">
                <div className="items-start justify-center pt-5 xl:flex xl:gap-6 xl:pt-9">
                    <div className="min-w-0 xl:w-[800px] xl:shrink-0">
                        <ReportDocument analysis={analysis} yourFigure={yourFigure} changed={changed} unlockDate={unlockDate} unlockOrigin={unlockOrigin} />
                    </div>
                    <ChatPanel slug={analysis.slug} initialTurnsLeft={initialTurnsLeft} onYourFigure={setYourFigure} />
                </div>
            </main>
        </div>
    );
}
