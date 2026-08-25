"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FlagCard } from "@/components/report/flag-card";
import { PolicyPanel } from "@/components/report/policy-panel";
import { ProvenanceChip } from "@/components/report/provenance-chip";
import { PublicToggle } from "@/components/report/public-toggle";
import { capFirst, formatDate, formatDateTime, formatEUR, formatPercent, numberWord } from "@/lib/format";
import { evaluatePolicy, formatPolicyLine } from "@/lib/policy";
import type { Analysis, FlagFull } from "@/lib/types";
import { tpl, useLang } from "@/providers/lang";
import { cx } from "@/utils/cx";

/**
 * The full report document (R7-1…R7-8): §1 verdict · §2 flags · §3 liability ·
 * §4 rent · §5 financing · §6 years · §7 tests, then the footer. Rendered in
 * place of the free summary on the same route once the account owns the
 * report — the seam opens, never a confetti moment. Every figure is
 * engine-published in the fixture; this file formats and lays out only (§6.2).
 * §7's compact marks are DERIVED from the slice-2 policy fixtures (balanced
 * evaluation) — the fourteen tests are not duplicated (per slice brief).
 */

/* ── Bolds engine-published substrings inside engine prose (the board bolds
   figures inside flag bodies, basis paragraphs and chat answers). The strongs
   arrive from the fixture per language — no UI-side number picking. ── */
export function StrongText({ text, strongs }: { text: string; strongs?: string[] }) {
    if (!strongs?.length) return <>{text}</>;
    // Split on each strong (first occurrence), preserving order.
    const parts: (string | { strong: string })[] = [text];
    for (const s of strongs) {
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (typeof part !== "string") continue;
            const at = part.indexOf(s);
            if (at === -1) continue;
            parts.splice(i, 1, part.slice(0, at), { strong: s }, part.slice(at + s.length));
            break;
        }
    }
    return (
        <>
            {parts.map((part, i) =>
                typeof part === "string" ? (
                    <span key={i}>{part}</span>
                ) : (
                    <strong key={i} className="tnum font-bold">
                        {part.strong}
                    </strong>
                ),
            )}
        </>
    );
}

/* ── Document-rhythm quote block (handoff §10 "Document rhythm"): steel-blue
   3 px rule, soft-sky fill, italic Finnish + source line + translation (when
   the UI language differs from the listing's Finnish). ── */
function ReportQuote({ quote, source, translation }: { quote: string; source: string; translation?: string }) {
    const { lang, t } = useLang();
    return (
        <figure className="rounded-r-[10px] border-l-[3px] border-rsm-steel bg-rsm-soft-sky px-3.5 py-2.5">
            <blockquote className="text-[12.5px] leading-[1.55] font-medium wrap-anywhere text-rsm-midnight italic">{quote}</blockquote>
            <figcaption className="mt-0.5 text-[10.5px] leading-[1.5] text-rsm-misty">
                {source}
                {lang !== "fi" && translation ? (
                    <>
                        {" "}
                        · {t.common.translation}: {translation}
                    </>
                ) : null}
            </figcaption>
        </figure>
    );
}

/* ── Section heading: §n marker (Space Grotesk, slate-50) + H2 20/1.25. ── */
function SectionHeading({ n, title, children }: { n: string; title: string; children?: React.ReactNode }) {
    return (
        <div className="mt-8 flex flex-wrap items-center gap-2.5 first:mt-0">
            <span aria-hidden className="tnum font-display text-[11px] leading-[1.3] font-bold tracking-[0.08em] text-rsm-slate-50">
                {n}
            </span>
            <h2 className="font-display text-xl leading-[1.25] font-medium text-rsm-midnight">{title}</h2>
            {children}
        </div>
    );
}

/* ── Severity + cost pill (R7-1): wash + deep label — grayscale-safe (§6.6). ── */
function SeverityCostPill({ severity, cost }: { severity: "high" | "caution"; cost: string }) {
    const { t } = useLang();
    return (
        <span
            className={cx(
                "tnum inline-flex shrink-0 items-center rounded-full px-2.5 py-[3px] text-[10.5px] leading-[1.4] font-bold uppercase",
                severity === "high" ? "bg-rsm-coral-25 text-rsm-coral-deep" : "bg-rsm-amber-25 text-rsm-amber-deep",
            )}
        >
            {severity === "high" ? t.common.high : t.common.caution} · {cost}
        </span>
    );
}

/* ── Grade letter → verdict-scale wash (board shows C = amber, A = seafoam;
   D/E follow the same severity logic to coral — never colour alone: the
   letter itself is the label). ── */
function gradeWash(grade: string): string {
    const g = grade.trim().toUpperCase();
    if (g === "A" || g === "B") return "bg-rsm-seafoam-25 text-rsm-seafoam-deep";
    if (g === "C") return "bg-rsm-amber-25 text-rsm-amber-deep";
    return "bg-rsm-coral-25 text-rsm-coral-deep";
}

/* ── §1 Verdict ── */
function VerdictSection({ analysis }: { analysis: Analysis }) {
    const { lang, t } = useLang();
    const { verdict, policy, report } = analysis;
    if (!verdict || !policy || !report) return null;
    // The document states the engine's canonical verdict: Balanced evaluation
    // over engine-published actuals (the §6.2-sanctioned client re-run).
    const run = evaluatePolicy(policy, policy.presets.balanced);
    const tiles = [
        { label: t.verdict.grossYield, value: verdict.grossYield.value, basis: verdict.grossYield.basis, featured: false },
        { label: t.verdict.realYield, value: verdict.realYield.value, basis: verdict.realYield.basis, featured: true },
    ];
    return (
        <section id="s1" aria-labelledby="s1-title" className="scroll-mt-36">
            <SectionHeading n="§1" title={t.report.s1Title}>
                <span
                    className={cx(
                        "tnum ml-auto rounded-full px-2.5 py-[3px] text-[10.5px] leading-[1.4] font-bold uppercase",
                        run.passing ? "bg-rsm-seafoam-25 text-rsm-seafoam-deep" : "bg-rsm-coral-25 text-rsm-coral-deep",
                    )}
                >
                    {tpl(t.report.verdictMark, {
                        verdict: run.passing ? t.policy.passes : t.policy.doesNotPass,
                        preset: t.policy.presets.balanced,
                        n: run.failCount,
                        total: run.total,
                    })}
                </span>
            </SectionHeading>
            <div className="mt-3 grid grid-cols-2 gap-2.5 md:grid-cols-4">
                {tiles.map((tile) => (
                    <div
                        key={tile.label}
                        className={cx("rounded-rsm-input border border-rsm-hairline px-4 py-3.5", tile.featured ? "bg-rsm-editor-bg" : "bg-white")}
                    >
                        <div className="flex items-center gap-1.5">
                            <span className="text-[9.5px] leading-[1.3] font-bold tracking-[0.06em] text-rsm-misty uppercase">{tile.label}</span>
                            {/* §6.1: chips stay adjacent to the figures (the R7-1 frame omits
                               them on the tiles; the rule wins — flagged in the PR). */}
                            <ProvenanceChip basis={tile.basis} />
                        </div>
                        <div className="tnum mt-1 font-display text-2xl leading-none font-medium text-rsm-midnight">{formatPercent(tile.value, lang)}</div>
                    </div>
                ))}
                {[
                    { grade: verdict.grades.company.grade, label: t.verdict.housingCompany },
                    { grade: verdict.grades.municipality.grade, label: `${t.verdict.municipality} · ${verdict.grades.municipality.name}` },
                ].map((tile) => (
                    <div key={tile.label} className="flex items-center gap-2.5 rounded-rsm-input border border-rsm-hairline bg-white px-4 py-3.5">
                        <span
                            className={cx(
                                "tnum flex size-8 shrink-0 items-center justify-center rounded-[8px] font-display text-lg font-medium",
                                gradeWash(tile.grade),
                            )}
                        >
                            {tile.grade}
                        </span>
                        <span className="text-[9.5px] leading-[1.35] font-bold tracking-[0.05em] wrap-anywhere text-rsm-misty uppercase">{tile.label}</span>
                    </div>
                ))}
            </div>
            <p className="mt-3 text-[13.5px] leading-[1.65] wrap-anywhere text-rsm-charcoal">{report.prose[lang]}</p>
            <p className="mt-2.5 text-[11px] leading-[1.5] wrap-anywhere text-rsm-slate-50">{report.proseNote[lang]}</p>
        </section>
    );
}

/* ── §2 The three flags — flag 1 compact (unchanged from the free summary,
   full text expands in place); flags 2–3 now open for the unlocked account. ── */
function FlagsSection({ analysis }: { analysis: Analysis }) {
    const { lang, t } = useLang();
    const [openFlag1, setOpenFlag1] = useState(false);
    const { verdict } = analysis;
    if (!verdict) return null;
    const flags = verdict.flags.filter((f): f is FlagFull => !f.locked);
    const windowLabel = lang === "fi" ? verdict.liability.windowFi : verdict.liability.window;

    return (
        <section id="s2" aria-labelledby="s2-title" className="scroll-mt-36">
            <SectionHeading n="§2" title={t.report.s2Title}>
                <span className="text-xs leading-[1.4] text-rsm-misty">{t.report.s2Note}</span>
            </SectionHeading>
            <div className="mt-3 flex flex-col gap-2.5">
                {flags.map((flag, i) => {
                    const n = i + 1;
                    const anchor = `s2-flag-${n}`;
                    const border = flag.severity === "high" ? "border-l-rsm-coral" : "border-l-rsm-amber";
                    const dot = flag.severity === "high" ? "bg-rsm-coral" : "bg-rsm-amber";
                    const cost = lang === "fi" ? (flag.costNoteFi ?? flag.costRangeFi) : (flag.costNote ?? flag.costRange);

                    /* Flag 1 — the free-summary flag, carried in compact with an
                       in-place "full text ↗" expander (R7-1). */
                    if (n === 1) {
                        return (
                            <div key={flag.id} id={anchor} className="scroll-mt-36">
                                <div
                                    className={cx("flex items-center gap-2.5 rounded-rsm-input border border-l-[3px] border-rsm-hairline px-4 py-3.5", border)}
                                >
                                    <span aria-hidden className={cx("size-[7px] shrink-0 rounded-full", dot)} />
                                    <span className="min-w-0 flex-1 font-display text-[15px] leading-[1.35] font-medium wrap-anywhere text-rsm-midnight">
                                        {n} · {lang === "fi" ? flag.titleFi : flag.title} — {t.report.flagUnchanged}
                                    </span>
                                    <SeverityCostPill severity={flag.severity} cost={cost} />
                                    <button
                                        type="button"
                                        aria-expanded={openFlag1}
                                        aria-controls={`${anchor}-full`}
                                        onClick={() => setOpenFlag1((v) => !v)}
                                        className="inline-flex min-h-11 shrink-0 items-center text-xs font-medium whitespace-nowrap text-rsm-steel underline-offset-4 hover:underline"
                                    >
                                        {t.report.flagFullText}
                                    </button>
                                </div>
                                {openFlag1 ? (
                                    <div id={`${anchor}-full`} className="mt-2.5">
                                        <FlagCard flag={flag} window={windowLabel} />
                                    </div>
                                ) : null}
                            </div>
                        );
                    }

                    /* Flags 2–3 — open in full for the unlocked account. */
                    return (
                        <article
                            key={flag.id}
                            id={anchor}
                            className={cx("flex scroll-mt-36 flex-col gap-3 rounded-rsm-input border border-l-[3px] border-rsm-hairline px-5 py-4.5", border)}
                        >
                            <div className="flex flex-wrap items-center gap-2.5">
                                <span aria-hidden className={cx("size-[7px] shrink-0 rounded-full", dot)} />
                                <h3 className="min-w-0 flex-1 font-display text-[16.5px] leading-[1.3] font-medium wrap-anywhere text-rsm-midnight">
                                    {n} · {lang === "fi" ? flag.titleFi : flag.title}
                                </h3>
                                <SeverityCostPill severity={flag.severity} cost={cost} />
                            </div>
                            <p className="text-[13.5px] leading-[1.6] wrap-anywhere text-rsm-charcoal">
                                <StrongText text={lang === "fi" ? flag.bodyFi : flag.body} strongs={flag.strongs?.map((s) => s[lang])} />
                            </p>
                            <div className="flex flex-col gap-2.5">
                                {flag.quotes.map((quote) => (
                                    <ReportQuote
                                        key={quote.text}
                                        quote={quote.text}
                                        source={lang === "fi" ? quote.sourceFi : quote.source}
                                        translation={quote.translation}
                                    />
                                ))}
                            </div>
                            {flag.note ? (
                                <p className="flex flex-wrap items-center gap-1.5 text-xs leading-[1.55] text-rsm-slate">
                                    {flag.note.text[lang]} <ProvenanceChip basis={flag.note.basis} />
                                </p>
                            ) : null}
                        </article>
                    );
                })}
            </div>
        </section>
    );
}

/* ── §3 Renovation liability — component table (board grid 1fr/170/120/110). ── */
function LiabilitySection({ analysis }: { analysis: Analysis }) {
    const { lang, t } = useLang();
    const { verdict, report } = analysis;
    if (!verdict || !report) return null;
    const rows = report.liabilityRows;

    return (
        <section id="s3" aria-labelledby="s3-title" className="scroll-mt-36">
            <SectionHeading n="§3" title={tpl(t.report.s3Title, { total: formatEUR(verdict.liability.total, lang), window: t.report.windowYears })} />
            {/* ≥768 — four-column table. */}
            <div className="mt-3 hidden md:block" role="table" aria-label={t.report.s3Title}>
                <div
                    role="row"
                    className="grid grid-cols-[minmax(0,1fr)_170px_120px_110px] gap-x-3.5 border-b border-rsm-hairline px-1 pb-[7px] text-[10px] leading-[1.3] font-bold tracking-[0.06em] text-rsm-misty uppercase"
                >
                    <span role="columnheader">{t.report.colComponent}</span>
                    <span role="columnheader" className="text-right">
                        {t.report.colBasis}
                    </span>
                    <span role="columnheader" className="text-right">
                        {t.report.colThisApt}
                    </span>
                    <span role="columnheader" className="text-right">
                        {t.report.colProvenance}
                    </span>
                </div>
                {rows.map((row) => (
                    <div
                        role="row"
                        key={row.name.en}
                        className="grid grid-cols-[minmax(0,1fr)_170px_120px_110px] items-baseline gap-x-3.5 border-b border-rsm-row-line px-1 py-2.5"
                    >
                        <span role="cell" className="min-w-0">
                            <span className="block text-[13.5px] leading-[1.4] font-medium wrap-anywhere text-rsm-midnight">{row.name[lang]}</span>
                            <span className="block text-[11px] leading-[1.45] wrap-anywhere text-rsm-misty">{row.note[lang]}</span>
                        </span>
                        <span role="cell" className="tnum text-right text-xs leading-[1.4] text-rsm-slate">
                            {row.basis[lang]}
                        </span>
                        <span role="cell" className="tnum text-right font-display text-[15px] leading-[1.3] font-medium text-rsm-midnight">
                            {row.amount}
                        </span>
                        <span role="cell" className="text-right">
                            <ProvenanceChip basis={row.chip} />
                        </span>
                    </div>
                ))}
                <div role="row" className="grid grid-cols-[minmax(0,1fr)_170px_120px_110px] items-baseline gap-x-3.5 border-b-2 border-rsm-midnight px-1 py-3">
                    <span role="cell" className="text-[13.5px] leading-[1.4] font-bold wrap-anywhere text-rsm-midnight">
                        {t.report.totalRow}
                    </span>
                    <span role="cell" className="text-right text-xs leading-[1.4] text-rsm-slate">
                        {t.report.totalWindow}
                    </span>
                    <span role="cell" className="tnum text-right font-display text-[17px] leading-[1.2] font-bold text-rsm-midnight">
                        {formatEUR(verdict.liability.total, lang)}
                    </span>
                    <span role="cell" />
                </div>
            </div>
            {/* ≤767 — stacked rows, one column (R7-3). */}
            <div className="mt-3 flex flex-col md:hidden">
                {rows.map((row) => (
                    <div key={row.name.en} className="flex flex-col gap-1 border-b border-rsm-row-line py-2.5">
                        <span className="text-[13px] leading-snug font-medium wrap-anywhere text-rsm-midnight">{row.name[lang]}</span>
                        <span className="text-[11px] leading-snug wrap-anywhere text-rsm-misty">{row.note[lang]}</span>
                        <span className="tnum flex items-center justify-between gap-2 text-[11.5px] text-rsm-slate">
                            <span className="wrap-anywhere">{row.basis[lang]}</span>
                            <span className="flex shrink-0 items-center gap-2">
                                <span className="font-display text-[14px] font-medium text-rsm-midnight">{row.amount}</span>
                                <ProvenanceChip basis={row.chip} />
                            </span>
                        </span>
                    </div>
                ))}
                <div className="flex items-baseline justify-between gap-2 border-b-2 border-rsm-midnight py-3">
                    <span className="text-[13px] font-bold wrap-anywhere text-rsm-midnight">
                        {t.report.totalRow}
                        <span className="block text-[11px] font-medium text-rsm-slate">{t.report.totalWindow}</span>
                    </span>
                    <span className="tnum shrink-0 font-display text-[16px] font-bold text-rsm-midnight">{formatEUR(verdict.liability.total, lang)}</span>
                </div>
            </div>
            <p className="mt-2.5 text-[12.5px] leading-[1.6] wrap-anywhere text-rsm-slate">
                <StrongText text={report.liabilityBasis[lang]} strongs={report.liabilityBasisStrongs.map((s) => s[lang])} />
            </p>
        </section>
    );
}

/* ── §4 Rent — P10/P50/P90 tiles + the dashed "your figure" card (shown only
   after the user supplies a figure in chat or policy — dashed = user-supplied,
   never engine, never used in any figure, §6.5). ── */
function RentSection({ analysis, yourFigure }: { analysis: Analysis; yourFigure: { display: string; note: string } | null }) {
    const { lang, t } = useLang();
    const { report } = analysis;
    if (!report) return null;
    const rent = report.rent;
    const tiles = [
        { key: "P10", value: rent.p10, note: rent.p10Note[lang], featured: true },
        { key: "P50", value: rent.p50, note: rent.p50Note[lang], featured: false },
        { key: "P90", value: rent.p90, note: rent.p90Note[lang], featured: false },
    ];

    return (
        <section id="s4" aria-labelledby="s4-title" className="scroll-mt-36">
            <SectionHeading n="§4" title={t.report.s4Title} />
            <div className="mt-3 grid grid-cols-2 gap-2.5 md:grid-cols-[1fr_1fr_1fr_1.35fr]">
                {tiles.map((tile) => (
                    <div
                        key={tile.key}
                        className={cx(
                            "rounded-rsm-input border px-4 py-3.5",
                            tile.featured
                                ? "border-rsm-hairline bg-rsm-editor-bg shadow-[inset_0_0_0_1.5px_var(--color-rsm-steel)]"
                                : "border-rsm-hairline bg-white",
                        )}
                    >
                        <div className={cx("text-[9.5px] leading-[1.3] font-bold tracking-[0.06em]", tile.featured ? "text-rsm-steel" : "text-rsm-misty")}>
                            {tile.key}
                            {tile.featured ? ` · ${t.report.underwritten}` : ""}
                        </div>
                        <div className="tnum mt-1 font-display text-2xl leading-none font-medium text-rsm-midnight">{tile.value}</div>
                        <div className="mt-1.5 text-[11px] leading-[1.45] wrap-anywhere text-rsm-misty">{tile.note}</div>
                    </div>
                ))}
                {/* The user's own figure — dashed border, misty value, NEVER used
                   in any computed figure. Renders only when one was supplied
                   (chat what-if or, in a later slice, the offer calculator). */}
                {yourFigure ? (
                    <div className="rounded-rsm-input border border-dashed border-rsm-misty-50 bg-white px-4 py-3.5">
                        <div className="text-[9.5px] leading-[1.3] font-bold tracking-[0.06em] text-rsm-misty">{t.report.yourFigure}</div>
                        <div className="tnum mt-1 font-display text-2xl leading-none font-medium text-rsm-misty">{yourFigure.display}</div>
                        <div className="mt-1.5 text-[11px] leading-[1.45] wrap-anywhere text-rsm-misty">{yourFigure.note}</div>
                    </div>
                ) : null}
            </div>
            <p className="mt-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12.5px] leading-[1.6] wrap-anywhere text-rsm-slate">
                <span>{rent.source[lang]}</span>
                <ProvenanceChip basis="MODELLED" />
                <span aria-hidden>·</span>
                <span>{rent.tenancy[lang]}</span>
                <ProvenanceChip basis="OBSERVED" />
            </p>
            <div className="mt-2.5">
                <ReportQuote
                    quote={rent.tenancyQuote.text}
                    source={lang === "fi" ? rent.tenancyQuote.sourceFi : rent.tenancyQuote.source}
                    translation={rent.tenancyQuote.translation}
                />
            </div>
        </section>
    );
}

/* ── §5 Financing assumed — MAPPED from the user's policy; editing happens in
   the policy panel (#policy), which recomputes. ── */
function FinancingSection({ analysis }: { analysis: Analysis }) {
    const { lang, t } = useLang();
    const { report } = analysis;
    if (!report) return null;
    const fin = report.financing;

    return (
        <section id="s5" aria-labelledby="s5-title" className="scroll-mt-36">
            <SectionHeading n="§5" title={t.report.s5Title}>
                <a href="#policy" className="inline-flex min-h-11 items-center text-xs font-medium text-rsm-steel underline-offset-4 hover:underline">
                    {t.report.s5EditLink}
                </a>
            </SectionHeading>
            <p className="tnum mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] leading-[1.6] text-rsm-charcoal">
                <span>
                    {t.report.finEquity} <strong className="font-bold">{fin.equity}</strong>
                </span>
                <span aria-hidden className="text-rsm-misty-50">
                    ·
                </span>
                <span>
                    <StrongText
                        text={tpl(t.report.finLoan, { loan: fin.loan, rate: fin.rate[lang], term: fin.term[lang], payment: fin.payment[lang] })}
                        strongs={[fin.loan, fin.rate[lang], fin.payment[lang]]}
                    />{" "}
                    <ProvenanceChip basis="MAPPED" />
                </span>
                <span aria-hidden className="text-rsm-misty-50">
                    ·
                </span>
                <span>
                    {tpl(t.report.finTransferTax, { rate: fin.transferTaxRate[lang] })} <strong className="font-bold">{fin.transferTax}</strong>
                </span>
                <span aria-hidden className="text-rsm-misty-50">
                    ·
                </span>
                <span>
                    {t.report.finCashNeeded} <strong className="font-bold">{fin.cashNeeded}</strong>
                </span>
            </p>
        </section>
    );
}

/* ── §6 Year by year — board script yearRows verbatim; debt service constant
   4 560 € per the board template; Y5 wash rgba(255,179,0,.07) board-lifted. ── */
function YearsSection({ analysis }: { analysis: Analysis }) {
    const { lang, t } = useLang();
    const { report } = analysis;
    if (!report) return null;
    const cols = "grid-cols-[64px_repeat(5,minmax(0,1fr))]";

    return (
        <section id="s6" aria-labelledby="s6-title" className="scroll-mt-36">
            <SectionHeading n="§6" title={t.report.s6Title} />
            {/* Mobile scrolls the 560 px table horizontally (no mobile table
               frame on the board — the R7-9 mobile chart pattern applies). */}
            <div className="-mx-1 scrollbar-hide overflow-x-auto px-1">
                <div className="mt-3 min-w-[560px]" role="table" aria-label={t.report.s6Title}>
                    <div
                        role="row"
                        className={cx(
                            "grid gap-x-3 border-b border-rsm-hairline px-1 pb-[7px] text-[10px] leading-[1.3] font-bold tracking-[0.06em] text-rsm-misty uppercase",
                            cols,
                        )}
                    >
                        <span role="columnheader">{t.report.colYear}</span>
                        <span role="columnheader" className="text-right">
                            {t.report.colRent}
                        </span>
                        <span role="columnheader" className="text-right">
                            {t.report.colCharges}
                        </span>
                        <span role="columnheader" className="text-right">
                            {t.report.colDebt}
                        </span>
                        <span role="columnheader" className="text-right">
                            {t.report.colCashflow}
                        </span>
                        <span role="columnheader" className="text-right">
                            {t.report.colCumulative}
                        </span>
                    </div>
                    {report.yearRows.map((row) => (
                        <div
                            role="row"
                            key={row.y}
                            className={cx("grid items-center gap-x-3 border-b border-rsm-row-line px-1 py-2", cols)}
                            /* Y5 renovation-year wash — board-lifted rgba(255,179,0,.07) (amber at 7 %). */
                            style={row.highlight ? { backgroundColor: "rgba(255,179,0,.07)" } : undefined}
                        >
                            <span role="cell" className="font-display text-[13px] leading-[1.3] font-medium text-rsm-midnight">
                                {row.y}
                            </span>
                            <span role="cell" className="tnum text-right text-[13px] leading-[1.3] text-rsm-charcoal">
                                {row.rent}
                            </span>
                            <span role="cell" className="tnum text-right text-[13px] leading-[1.3] text-rsm-charcoal">
                                {row.charges}
                            </span>
                            <span role="cell" className="tnum text-right text-[13px] leading-[1.3] text-rsm-charcoal">
                                {row.debtService}
                            </span>
                            <span
                                role="cell"
                                className={cx(
                                    "tnum text-right font-display text-[13px] leading-[1.3] font-medium",
                                    row.negative ? "text-rsm-coral-deep" : "text-rsm-seafoam-deep",
                                )}
                            >
                                {row.cf}
                            </span>
                            <span
                                role="cell"
                                className={cx("tnum text-right text-[13px] leading-[1.3]", row.negative ? "text-rsm-coral-deep" : "text-rsm-seafoam-deep")}
                            >
                                {row.cum}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11.5px] leading-[1.55] wrap-anywhere text-rsm-misty">
                {report.yearAssumptions.map((a, i) => (
                    <span key={i} className="inline-flex flex-wrap items-center gap-1.5">
                        {i > 0 ? <span aria-hidden>·</span> : null}
                        <span>{a.text[lang]}</span> <ProvenanceChip basis={a.basis} />
                    </span>
                ))}
                <span aria-hidden>·</span>
                <span>{report.yearGrowth[lang]}</span>
            </p>
        </section>
    );
}

/* ── §7 The fourteen tests — compact marks DERIVED from the slice-2 policy
   fixtures (balanced evaluation; the tests themselves are not duplicated).
   "edit thresholds ↗" opens the policy panel, which stays after the document. ── */
function TestsSection({ analysis }: { analysis: Analysis }) {
    const { lang, t } = useLang();
    const { policy } = analysis;
    if (!policy) return null;
    const run = evaluatePolicy(policy, policy.presets.balanced);

    return (
        <section id="s7" aria-labelledby="s7-title" className="scroll-mt-36">
            <SectionHeading
                n="§7"
                title={tpl(t.report.s7Title, {
                    n: lang === "fi" ? capFirst(numberWord(run.total, lang)) : numberWord(run.total, lang),
                    preset: t.policy.presets.balanced,
                })}
            >
                <a
                    href="#policy"
                    className="ml-auto inline-flex min-h-11 items-center text-[12.5px] font-medium text-rsm-steel underline-offset-4 hover:underline"
                >
                    {t.report.editThresholds}
                </a>
            </SectionHeading>
            <div className="mt-3 grid gap-x-5 md:grid-cols-2">
                {run.results.map((r) => {
                    const name = lang === "fi" ? r.test.labelFi : r.test.label;
                    const actual = lang === "fi" ? r.actual.displayFi : r.actual.display;
                    // The boolean flag test has no numeric line ("—" on the board).
                    const line = r.test.unit === "flag" ? null : formatPolicyLine(r.test, policy.presets.balanced[r.test.key], lang, t.policy.lineRequired);
                    return (
                        <div key={r.test.key} className="flex items-baseline gap-2.5 border-b border-rsm-row-line px-0.5 py-[7px]">
                            <span
                                aria-hidden
                                className={cx("w-[15px] shrink-0 text-xs leading-[1.3] font-bold", r.pass ? "text-rsm-seafoam-deep" : "text-rsm-coral-deep")}
                            >
                                {r.pass ? "✓" : "✗"}
                            </span>
                            <span className="min-w-0 flex-1 text-[12.5px] leading-[1.45] wrap-anywhere text-rsm-midnight">
                                {name}
                                {line ? <span className="tnum"> {line}</span> : null}
                            </span>
                            <span className="tnum shrink-0 text-xs leading-[1.4] whitespace-nowrap text-rsm-slate">{actual}</span>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

/* ── R7-5 listing-changed banner — pins under the report header. The mock
   trigger is ?state=changed (real diffs arrive from tracking, slice 8).
   "Keep this version" dismisses locally; "Re-run — free" is a no-op until the
   re-run flow ships with tracking (comment per slice brief). ── */
function ChangedBanner({ analysis }: { analysis: Analysis }) {
    const { lang, t } = useLang();
    const [kept, setKept] = useState(false);
    const { report, listing } = analysis;
    if (!report || !listing || kept) return null;
    const change = report.listingChange;
    const readDay = formatDate(listing.fetchedAt, lang).replace(/\.\d{4}$/, lang === "fi" ? "." : "");

    return (
        <div
            role="status"
            className="mt-4 flex flex-wrap items-center gap-4 rounded-rsm-tile border border-l-4 border-rsm-hairline border-l-rsm-amber bg-white px-6 py-4.5"
        >
            <div className="min-w-0 flex-1">
                <p className="font-display text-[17px] leading-[1.3] font-medium wrap-anywhere text-rsm-midnight">{t.report.changedTitle}</p>
                <p className="tnum mt-1 text-[13px] leading-[1.6] wrap-anywhere text-rsm-slate">
                    <StrongText
                        text={tpl(t.report.changedBody, {
                            now: change.now,
                            was: change.was,
                            seen: formatDateTime(change.seenAt, lang),
                            readDay,
                        })}
                        strongs={[change.now]}
                    />
                </p>
            </div>
            <span className="flex shrink-0 items-center gap-2.5">
                {/* No-op by design — the re-run flow (keep №, append /v2, chat
                   reset) ships with tracking in slice 8. */}
                <button
                    type="button"
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-rsm-lime px-5 text-sm font-bold text-rsm-midnight transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75"
                >
                    {t.report.changedRerun}
                </button>
                <button
                    type="button"
                    onClick={() => setKept(true)}
                    className="inline-flex min-h-11 items-center justify-center rounded-full px-3 text-sm font-medium text-rsm-steel underline-offset-4 hover:underline"
                >
                    {t.report.changedKeep}
                </button>
            </span>
        </div>
    );
}

/**
 * The full document sheet + the policy panel after it (R7-1/R7-2). The
 * `changed` prop is the mock-only ?state=changed trigger for R7-5.
 */
export function ReportDocument({
    analysis,
    yourFigure,
    changed,
    unlockDate,
    unlockOrigin,
    initialPublic,
}: {
    analysis: Analysis;
    yourFigure: { display: string; note: string } | null;
    changed: boolean;
    unlockDate: string;
    unlockOrigin: string;
    /** Owner visibility for the public page — the R7-2 footer toggle (R8). */
    initialPublic: boolean;
}) {
    const { lang, t } = useLang();
    const { listing } = analysis;
    const h1Ref = useRef<HTMLHeadingElement>(null);

    // h1 receives focus on route arrival (a11y §11), same as the free summary.
    useEffect(() => {
        h1Ref.current?.focus();
    }, []);

    if (!listing || !analysis.verdict || !analysis.report) return null;
    const meta = t.verdict.meta;

    return (
        <div className="flex flex-col gap-6">
            <article className="flex flex-col rounded-rsm-card border border-rsm-hairline bg-white p-5 shadow-rsm-sm md:p-8 xl:px-[46px] xl:py-10">
                {/* Header — every surface is a numbered, dated, sourced document. */}
                <header className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-baseline gap-x-3 text-[10.5px] font-bold tracking-[0.09em] uppercase">
                        <p className="text-rsm-steel">{t.report.eyebrow}</p>
                        <p className="tnum ml-auto tracking-[0.04em] text-rsm-slate-50">
                            № {analysis.number} · {formatDate(analysis.readAt, lang)}
                        </p>
                    </div>
                    <h1
                        ref={h1Ref}
                        tabIndex={-1}
                        className="font-display text-[25px] leading-[1.2] font-medium wrap-anywhere text-rsm-midnight outline-none md:text-3xl"
                    >
                        {listing.addr}, {listing.postalCode ? `${listing.postalCode} ` : ""}
                        {listing.city}
                    </h1>
                    <p className="text-[12.5px] leading-[1.6] wrap-anywhere text-rsm-misty md:text-[13px]">
                        {listing.type} · {listing.m2} m² · {listing.floor} {meta.floorSuffix}
                        {listing.lift ? `, ${meta.lift}` : ""} · {meta.built} {listing.built}
                        {listing.company ? ` · ${listing.company}` : ""} · {meta.debtFree} {formatEUR(listing.debtFree, lang)} · Oikotie {listing.oikotieId}
                        {/* Board fidelity: EN reads "read 13:40" (R7-1), FI the full
                           "luettu 28.7.2026 13.40" (R7-6). */}
                        , {t.verdict.readAt} {lang === "fi" ? formatDateTime(listing.fetchedAt, lang) : formatDateTime(listing.fetchedAt, lang).split(" ")[1]}
                    </p>
                    {/* The quiet unlocked strip — in place of the seam, never confetti. */}
                    <p className="mt-1.5 flex items-center gap-2.5 rounded-[10px] border border-rsm-hairline bg-rsm-editor-bg px-3.5 py-2 text-xs leading-[1.5] wrap-anywhere text-rsm-slate">
                        <span
                            aria-hidden
                            className="flex size-5 shrink-0 items-center justify-center rounded-full bg-rsm-midnight text-[10px] font-bold text-rsm-lime"
                        >
                            ✓
                        </span>
                        <span className="max-md:hidden">{tpl(t.report.unlockedStrip, { date: unlockDate, origin: unlockOrigin })}</span>
                        <span className="md:hidden">{tpl(t.report.unlockedStripShort, { date: unlockDate, origin: unlockOrigin })}</span>
                        {/* Mock trigger: opens the R7-5 banner state (?state=changed);
                           the real flow is tracking-diff driven (slice 8). */}
                        <Link
                            href={`/r/${analysis.slug}?state=changed`}
                            className="ml-auto inline-flex min-h-11 shrink-0 items-center text-xs font-medium whitespace-nowrap text-rsm-steel underline-offset-4 hover:underline"
                        >
                            {t.report.rerunLink}
                        </Link>
                    </p>
                    {changed ? <ChangedBanner analysis={analysis} /> : null}
                </header>

                <VerdictSection analysis={analysis} />
                <FlagsSection analysis={analysis} />
                <LiabilitySection analysis={analysis} />
                <RentSection analysis={analysis} yourFigure={yourFigure} />
                <FinancingSection analysis={analysis} />
                <YearsSection analysis={analysis} />
                <TestsSection analysis={analysis} />

                {/* Footer — figures reflect the read moment; legal line. */}
                <footer className="mt-7 flex flex-wrap items-center gap-x-3.5 gap-y-1 border-t-2 border-rsm-midnight pt-4 text-[11.5px] leading-[1.6] wrap-anywhere text-rsm-misty">
                    <span className="tnum">{tpl(t.report.footerMoment, { n: analysis.number, time: formatDateTime(listing.fetchedAt, lang) })}</span>
                    <span className="md:ml-auto">{t.report.footerLegal}</span>
                </footer>
                <div className="mt-4 flex flex-wrap gap-2.5">
                    <Link
                        href={`/r/${analysis.slug}/pdf`}
                        className="inline-flex min-h-11 items-center justify-center rounded-full bg-rsm-lime px-6 text-sm font-bold text-rsm-midnight transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75"
                    >
                        {t.report.downloadPdf}
                    </Link>
                    {/* "Make page public" (R7-2 secondary) — the R8 visibility
                       toggle; "Set up listing alerts" ships with tracking
                       (slice 8) — R7-2 shows both beside this button. */}
                    <PublicToggle slug={analysis.slug} initialPublic={initialPublic} />
                    {/* P4 annotation: the bank summary's entry is "Bank summary
                       (PDF)" in the report footer, next to Download PDF. */}
                    <Link
                        href={`/r/${analysis.slug}/bank-summary.pdf`}
                        className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-medium text-rsm-steel underline-offset-4 hover:underline"
                    >
                        {t.print.bankSummaryLink}
                    </Link>
                </div>
            </article>

            {/* The policy panel stays after the document — §5/§7 links land here. */}
            {analysis.policy ? (
                <PolicyPanel
                    policy={analysis.policy}
                    addr={listing.addr}
                    flagCount={analysis.verdict.flagCount.total}
                    seamAnchorId="s7"
                    showUnlockStrip={false}
                />
            ) : null}
        </div>
    );
}
