"use client";

import Link from "next/link";
import { ProvenanceChip } from "@/components/report/provenance-chip";
import { TopBar } from "@/components/report/top-bar";
import { formatDateTime } from "@/lib/format";
import type { Analysis } from "@/lib/types";
import { useLang } from "@/providers/lang";
import { cx } from "@/utils/cx";

/**
 * Fetch-failed card (R1-9/13). An error state of the flow — retryable,
 * with the support line. Nothing was charged; never a toast.
 */
export function NotFoundView({ url, attempts = 2 }: { url?: string; attempts?: number }) {
    const { t } = useLang();

    return (
        <div className="min-h-screen">
            <TopBar />
            <main className="mx-auto flex w-full max-w-[704px] flex-col gap-6 px-4 py-12 md:py-20">
                <div className="flex flex-col gap-4 rounded-rsm-card border border-rsm-coral-50 bg-white p-6 shadow-rsm-sm md:p-8">
                    <h1 tabIndex={-1} className="font-display text-3xl font-medium wrap-anywhere text-rsm-midnight outline-none">
                        {t.states.notFoundTitle}
                    </h1>
                    <p className="text-[15px] leading-relaxed wrap-anywhere text-rsm-charcoal">{t.states.notFoundBody}</p>
                    {url ? (
                        <p className="tnum text-xs wrap-anywhere text-rsm-misty">
                            {url} · {t.states.triedTwice}
                        </p>
                    ) : null}
                    <div className="mt-2 flex flex-col gap-3 md:flex-row">
                        <Link
                            href="/"
                            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-rsm-lime px-6 text-base font-bold text-rsm-midnight transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75 md:flex-none"
                        >
                            {t.states.pasteAnother}
                        </Link>
                        <Link
                            href="/"
                            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-rsm-hairline bg-white px-6 text-base font-medium text-rsm-charcoal transition-colors duration-200 ease-rsm hover:border-rsm-steel-50 md:flex-none"
                        >
                            {t.states.retry}
                        </Link>
                    </div>
                </div>
                <p className={cx("text-sm text-rsm-misty", attempts > 1 && "rounded-rsm-tile border border-rsm-hairline bg-white p-4")}>
                    {t.states.stillFailing}{" "}
                    <a href="mailto:hello@resimator.fi" className="font-medium text-rsm-steel underline-offset-4 hover:underline">
                        hello@resimator.fi
                    </a>{" "}
                    {t.states.includeLink}
                </p>
            </main>
        </div>
    );
}

/**
 * Refusal (R1-11) and withdrawn (R1-10) — first-class verdict states on the same
 * sheet chrome as a verdict, never an error toast. States what WAS read (§6.3).
 */
export function RefusalView({ analysis }: { analysis: Analysis }) {
    const { lang, t } = useLang();
    const refusal = analysis.refusal;
    if (!refusal) return null;

    const withdrawn = analysis.status === "withdrawn";

    return (
        <div className="min-h-screen">
            <TopBar analyseAnother />
            <main className="mx-auto w-full max-w-[704px] px-4 py-12">
                <div className="flex flex-col gap-6 rounded-rsm-card border border-rsm-hairline bg-white p-6 shadow-rsm-sm md:p-8">
                    <header className="flex flex-col gap-2">
                        <p className="text-xs font-bold tracking-[0.08em] text-rsm-misty uppercase">{withdrawn ? t.analysing.title : t.verdict.eyebrow}</p>
                        <p className="tnum text-xs text-rsm-misty">
                            № {analysis.number} · {formatDateTime(analysis.readAt, lang)}
                        </p>
                        <h1 tabIndex={-1} className="font-display text-3xl font-medium wrap-anywhere text-rsm-midnight outline-none">
                            {lang === "fi" ? refusal.headingFi : refusal.heading}
                        </h1>
                    </header>
                    <p className="text-[15px] leading-relaxed wrap-anywhere text-rsm-charcoal">{lang === "fi" ? refusal.bodyFi : refusal.body}</p>
                    <p className="text-sm font-bold text-rsm-midnight">{t.states.noCredit}</p>

                    <section className="flex flex-col gap-2">
                        <h2 className="text-sm font-bold tracking-[0.06em] text-rsm-midnight uppercase">{t.states.whatWeRead}</h2>
                        <ul className="flex flex-col gap-2">
                            {refusal.read.map((item) => (
                                <li key={item.text} className="flex items-center justify-between gap-3 rounded-rsm-tile border border-rsm-hairline p-3 text-sm">
                                    <span className="wrap-anywhere text-rsm-charcoal">{lang === "fi" ? item.textFi : item.text}</span>
                                    {item.basis === "LOW_CONFIDENCE" ? (
                                        <span className="shrink-0 text-[10px] font-bold tracking-[0.06em] text-rsm-amber-75 uppercase">
                                            {t.common.lowConfidence}
                                        </span>
                                    ) : (
                                        <ProvenanceChip basis={item.basis} />
                                    )}
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="flex flex-col gap-2 rounded-rsm-tile bg-rsm-paper p-4">
                        <h2 className="text-sm font-bold tracking-[0.06em] text-rsm-midnight uppercase">{t.states.whatUnlocks}</h2>
                        <p className="text-sm leading-relaxed wrap-anywhere text-rsm-charcoal">{lang === "fi" ? refusal.unlockFi : refusal.unlock}</p>
                    </section>

                    <div className="flex flex-col gap-3 md:flex-row">
                        <Link
                            href="/"
                            className="inline-flex min-h-12 items-center justify-center rounded-full bg-rsm-lime px-6 text-base font-bold text-rsm-midnight transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75"
                        >
                            {t.states.pasteAnother}
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
