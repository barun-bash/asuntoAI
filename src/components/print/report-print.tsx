import { Fragment } from "react";
import {
    PrintChip,
    PrintLockup,
    PrintQuote,
    RunningHeader,
    SectionRow,
    SheetBottom,
    SheetFooter,
    StrongPrint,
    gradeWashClass,
} from "@/components/print/shared";
import type { Dict } from "@/i18n/dict";
import { capFirst, formatDate, formatDateTime, formatEUR, formatPercent, numberWord } from "@/lib/format";
import type { Lang } from "@/lib/i18n";
import { evaluatePolicy, formatPolicyLine } from "@/lib/policy";
import type { Analysis, FlagFull } from "@/lib/types";
import { cx } from "@/utils/cx";

/**
 * /r/:slug/pdf — the A4 print document (R7-P P1–P3, handoff §10): P1 cover
 * (verdict), P2 flags + liability, P3 numbers + the fourteen tests. Server-
 * rendered paginated sheets (see src/styles/print.css for the sheet/@page
 * technique); every figure is engine-published in the fixture — this file
 * formats and lays out only (§6.2). Content data is SHARED with the screen
 * document (report-document.tsx), the layout is the print frames' own.
 * §7's marks are derived from the policy fixtures (balanced evaluation), the
 * same sanctioned re-run the screen document performs.
 */

/* Server-local twin of providers/lang's tpl (that module is "use client";
   the print routes are server-rendered). */
function tpl(template: string, vars: Record<string, string | number>): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}

interface SheetProps {
    analysis: Analysis;
    lang: Lang;
    t: Dict;
    page: number;
    total: number;
}

function publicUrl(analysis: Analysis): string {
    return `resimator.fi/r/${analysis.slug}`;
}

/* Full flags only — the route is unlock-gated, so every flag arrives open. */
function fullFlags(analysis: Analysis): FlagFull[] {
    return (analysis.verdict?.flags.filter((f): f is FlagFull => !f.locked) ?? []) as FlagFull[];
}

/* ── P1 · A4 cover (the board renders it in Finnish — the primary market's
   artifact; EN parity via ?lang=en) ── */
function CoverSheet({ analysis, lang, t, page, total }: SheetProps) {
    const { listing, verdict, report, policy } = analysis;
    if (!listing || !verdict || !report || !policy) return null;
    const run = evaluatePolicy(policy, policy.presets.balanced);
    const flags = fullFlags(analysis);

    return (
        <section className="p-sheet" aria-label={t.print.docTitle}>
            <div className="p-sheet-head">
                <PrintLockup />
                <span className="p-head-right">
                    {t.print.docTitle}
                    <br />
                    <strong className="p-num">№ {analysis.number}</strong> · <span className="p-num">{formatDate(analysis.readAt, lang)}</span>
                </span>
            </div>

            <div className="p-eyebrow p-cover-eyebrow">{t.print.coverEyebrow}</div>
            <h1 className="p-h1">
                {listing.addr},
                <br />
                {listing.postalCode ? `${listing.postalCode} ` : ""}
                {listing.city}
            </h1>
            <p className="p-meta p-num">
                {listing.type} · {listing.m2} m² · {listing.floor} {t.verdict.meta.floorSuffix}
                {listing.lift ? `, ${t.verdict.meta.lift}` : ""} · {t.print.builtWord} {listing.built}
                {listing.company ? (
                    <>
                        <br />
                        {listing.company}
                        {listing.tenure ? ` · ${listing.tenure[lang]}` : ""}
                    </>
                ) : null}
            </p>

            <div className="p-tiles-2">
                <div className="p-tile">
                    <div className="p-tile-label">{t.verdict.grossYield}</div>
                    <div className="p-tile-value p-num">{formatPercent(verdict.grossYield.value, lang)}</div>
                    <div className="p-tile-sub p-num">{tpl(t.print.grossSub, { rent: report.rent.p50, debtFree: formatEUR(listing.debtFree, lang) })}</div>
                </div>
                <div className="p-tile p-tile-fill">
                    <div className="p-tile-label">{t.verdict.realYield}</div>
                    <div className="p-tile-value p-num">{formatPercent(verdict.realYield.value, lang)}</div>
                    <div className="p-tile-sub p-num">
                        {tpl(t.print.realSub, { total: formatEUR(verdict.liability.total, lang), window: t.print.windowShort })}
                    </div>
                </div>
            </div>

            {/* Verdict banner — 4 px rule + wash + deep label: grayscale-safe (§6.6).
               The explanation is engine prose for the canonical failing verdict; a
               passing artifact carries no failure explanation. */}
            <div className={cx("p-verdict", run.passing && "p-verdict-pass")}>
                <div className="p-verdict-head">
                    <span className="p-verdict-title">{run.passing ? t.print.verdictPass : t.print.verdictFail}</span>
                    <span className="p-verdict-meta p-num">
                        {tpl(run.passing ? t.print.verdictMetaPass : t.print.verdictMetaFail, {
                            n: run.failCount,
                            total: run.total,
                            preset: t.policy.presets.balanced,
                        })}
                    </span>
                </div>
                {run.passing ? null : <p className="p-verdict-body p-num">{report.coverVerdictBody[lang]}</p>}
            </div>

            <div className="p-tiles-3">
                <div className="p-grade">
                    <span className={cx("p-grade-letter", gradeWashClass(verdict.grades.company.grade))}>{verdict.grades.company.grade}</span>
                    <span className="p-grade-label">{t.verdict.housingCompany}</span>
                </div>
                <div className="p-grade">
                    <span className={cx("p-grade-letter", gradeWashClass(verdict.grades.municipality.grade))}>{verdict.grades.municipality.grade}</span>
                    <span className="p-grade-label">
                        {t.verdict.municipality}
                        <br />
                        {verdict.grades.municipality.name}
                    </span>
                </div>
                <div className="p-flagstile">
                    <div className="p-grade-label p-num">{tpl(t.print.flagsTile, { n: verdict.flagCount.total })}</div>
                    <div className="p-flags-lines p-num">
                        {flags.map((flag) => (
                            <span key={flag.id}>
                                <span aria-hidden className={cx("p-dot", flag.severity === "high" ? "p-dot-high" : "p-dot-caution")} />
                                {flag.printLine?.[lang] ?? (lang === "fi" ? flag.titleFi : flag.title)}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <SheetBottom>
                <div className="p-sources">
                    <span className="p-num">{tpl(t.print.sourcesRead, { id: listing.oikotieId, time: formatDateTime(listing.fetchedAt, lang) })}</span>
                    <span>{t.print.sourcesEngine}</span>
                    <span>{t.print.sourcesCert}</span>
                    <span className="p-sources-legal">{t.print.sourcesLegal}</span>
                </div>
                <SheetFooter left={publicUrl(analysis)} right={tpl(t.print.pageOf, { page, total })} />
            </SheetBottom>
        </section>
    );
}

/* ── P2 · flags + liability (§2 claims with their source sentences, §3 the
   component table + total + P80 basis) ── */
function FlagsSheet({ analysis, lang, t, page, total }: SheetProps) {
    const { listing, verdict, report } = analysis;
    if (!listing || !verdict || !report) return null;
    const flags = fullFlags(analysis);

    return (
        <section className="p-sheet" aria-label={t.print.runningFlags}>
            <RunningHeader left={`№ ${analysis.number} · ${listing.addr}, ${listing.city}`} right={t.print.runningFlags} />

            <SectionRow mark="§2" title={t.print.s2Title} />
            <div className="p-flags">
                {flags.map((flag, i) => (
                    <article key={flag.id} className={cx("p-flag", flag.severity === "high" && "p-flag-high")}>
                        <div className="p-flag-head">
                            <span className="p-flag-title p-num">
                                {i + 1} · {lang === "fi" ? flag.titleFi : flag.title}
                            </span>
                            {/* Severity label + cost meta in words — never colour alone. */}
                            <span className={cx("p-pill p-num", flag.severity === "high" ? "p-pill-high" : "p-pill-caution")}>
                                {flag.severity === "high" ? t.common.high : t.common.caution} ·{" "}
                                {flag.printMeta?.[lang] ?? (lang === "fi" ? flag.costRangeFi : flag.costRange)}
                            </span>
                        </div>
                        <p className="p-flag-body p-num">
                            <StrongPrint
                                text={flag.printBody?.[lang] ?? (lang === "fi" ? flag.bodyFi : flag.body)}
                                strongs={flag.strongs?.map((s) => s[lang])}
                            />
                        </p>
                        {/* Every claim shows its Finnish source sentence (§6.1);
                           the print frame cites the short comma source form. */}
                        <PrintQuote quotes={flag.quotes.map((q) => q.text)} source={`${t.common.listingText}, Oikotie ${listing.oikotieId}`} />
                    </article>
                ))}
            </div>

            <SectionRow mark="§3" title={t.print.s3Title} marginTop={24} />
            <div className="p-thead p-cols-liab" style={{ marginTop: 10 }}>
                <span>{t.report.colComponent}</span>
                <span className="p-right">{t.report.colBasis}</span>
                <span className="p-right">{t.print.colShare}</span>
                <span className="p-right">{t.report.colProvenance}</span>
            </div>
            {report.liabilityRows.map((row) => (
                <div className="p-trow p-cols-liab" key={row.name.en}>
                    <span className="p-cell-name">{row.name[lang]}</span>
                    <span className="p-cell-basis p-right p-num">{row.basis[lang]}</span>
                    <span className="p-cell-amt p-right p-num">{row.amount}</span>
                    <span className="p-right">
                        <PrintChip basis={row.chip} t={t} />
                    </span>
                </div>
            ))}
            <div className="p-tfoot p-cols-liab">
                <span className="p-cell-label-bold">{tpl(t.print.totalRow, { window: t.report.windowYears })}</span>
                <span className="p-cell-basis p-right p-num">{tpl(t.print.p80Case, { amount: report.liabilityBasisStrongs[0]?.[lang] ?? "" })}</span>
                <span className="p-cell-amt p-cell-amt-bold p-right p-num">{formatEUR(verdict.liability.total, lang)}</span>
                <span />
            </div>
            <p className="p-basis-line p-num">{report.liabilityBasisPrint[lang]}</p>

            {/* §10: footer = public URL + page x/y on every page (the P2 frame's
               "Resimator · engine v2.3" footer-left yields to the rule — the engine
               tag already rides on P1's sources block and P3's legal line). */}
            <SheetBottom>
                <SheetFooter left={publicUrl(analysis)} right={tpl(t.print.pageOf, { page, total })} />
            </SheetBottom>
        </section>
    );
}

/* ── P3 · numbers + the fourteen tests (§4–5 rent & financing, §6 years,
   §7 the compact test grid derived from the policy fixtures) ── */
function NumbersSheet({ analysis, lang, t, page, total }: SheetProps) {
    const { listing, report, policy } = analysis;
    if (!listing || !report || !policy) return null;
    const fin = report.financing;
    const run = evaluatePolicy(policy, policy.presets.balanced);

    return (
        <section className="p-sheet" aria-label={t.print.runningTests}>
            <RunningHeader left={`№ ${analysis.number} · ${listing.addr}, ${listing.city}`} right={t.print.runningTests} />

            <SectionRow mark="§4–5" title={t.print.s45Title} />
            <div className="p-rent-tiles p-num">
                <div className="p-rent p-rent-featured">
                    <div className="p-rent-label p-rent-label-steel">P10 · {t.report.underwritten}</div>
                    <div className="p-rent-value">{report.rent.p10}</div>
                </div>
                <div className="p-rent">
                    <div className="p-rent-label">P50</div>
                    <div className="p-rent-value">{report.rent.p50}</div>
                </div>
                <div className="p-rent">
                    <div className="p-rent-label">P90</div>
                    <div className="p-rent-value">{report.rent.p90}</div>
                </div>
                <div className="p-rent p-rent-fin">
                    {tpl(t.print.finTile, {
                        equity: fin.equity,
                        loan: fin.loan,
                        rate: fin.rate[lang],
                        term: fin.term[lang],
                        payment: fin.payment[lang],
                        tax: fin.transferTax,
                        cash: fin.cashNeeded,
                    })}
                </div>
            </div>

            <SectionRow mark="§6" title={t.print.s6Title} />
            <div className="p-thead p-cols-years" style={{ marginTop: 10 }}>
                <span>{t.report.colYear}</span>
                <span className="p-right">{t.report.colRent}</span>
                <span className="p-right">{t.report.colCharges}</span>
                <span className="p-right">{t.report.colDebt}</span>
                <span className="p-right">{t.report.colCashflow}</span>
                <span className="p-right">{t.report.colCumulative}</span>
            </div>
            {report.yearRows.map((row) => (
                <div className={cx("p-trow p-trow-tight p-cols-years", row.highlight && "p-row-highlight")} key={row.y}>
                    <span className="p-year">{row.y}</span>
                    <span className="p-cell-num p-right p-num">{row.rent}</span>
                    <span className="p-cell-num p-right p-num">{row.charges}</span>
                    <span className="p-cell-num p-right p-num">{row.debtService}</span>
                    <span className={cx("p-cell-num p-cell-neg-display p-right p-num", row.negative ? "p-cell-neg" : "p-cell-pos")}>{row.cf}</span>
                    <span className={cx("p-cell-num p-right p-num", row.negative ? "p-cell-neg" : "p-cell-pos")}>{row.cum}</span>
                </div>
            ))}
            <p className="p-assumptions p-num">
                {report.yearAssumptions.map((a, i) => (
                    <Fragment key={i}>
                        {i > 0 ? " · " : ""}
                        {a.text[lang]} ({t.print.provenanceLower[a.basis]})
                    </Fragment>
                ))}
                {" · "}
                {report.yearGrowth[lang]}
            </p>

            <SectionRow
                mark="§7"
                title={tpl(t.print.s7Title, {
                    n: lang === "fi" ? capFirst(numberWord(run.total, lang)) : numberWord(run.total, lang),
                    preset: t.policy.presets.balanced,
                })}
            />
            <div className="p-tests">
                {run.results.map((r) => {
                    const name = lang === "fi" ? r.test.labelFi : r.test.label;
                    const actual = lang === "fi" ? r.actual.displayFi : r.actual.display;
                    // The boolean flag test has no numeric line ("—" on the board).
                    const line = r.test.unit === "flag" ? null : formatPolicyLine(r.test, policy.presets.balanced[r.test.key], lang, t.policy.lineRequired);
                    return (
                        <div className="p-test" key={r.test.key}>
                            <span aria-hidden className={cx("p-test-mark", r.pass ? "p-test-pass" : "p-test-fail")}>
                                {r.pass ? "✓" : "✗"}
                            </span>
                            <span className="p-test-name">
                                {name}
                                {line ? <span className="p-num"> {line}</span> : null}
                            </span>
                            <span className="p-test-vals p-num">{actual}</span>
                        </div>
                    );
                })}
            </div>

            <SheetBottom>
                <div className="p-legal p-num">{tpl(t.print.legal, { time: formatDateTime(listing.fetchedAt, lang) })}</div>
                <SheetFooter left={publicUrl(analysis)} right={tpl(t.print.pageOf, { page, total })} />
            </SheetBottom>
        </section>
    );
}

/**
 * The three sheets, paginated. Slice 8 slots the appendices into this array —
 * A (price history) + B (rent history) share one sheet, C (agent checklist,
 * real checkboxes) comes last (handoff §10); page x/y recomputes from the
 * array length, so nothing else changes.
 */
export function ReportPrint({ analysis, lang, t }: { analysis: Analysis; lang: Lang; t: Dict }) {
    const sheets = [CoverSheet, FlagsSheet, NumbersSheet];
    const total = sheets.length;
    return (
        <div className="rsm-print">
            {sheets.map((Sheet, i) => (
                <Sheet key={i} analysis={analysis} lang={lang} t={t} page={i + 1} total={total} />
            ))}
        </div>
    );
}
