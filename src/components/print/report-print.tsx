import { Fragment } from "react";
import {
    PrintBarLineChart,
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
import type { Analysis, FlagFull, PinnedOffer, PriceHistory, RentHistory } from "@/lib/types";
import { cx } from "@/utils/cx";

/**
 * /r/:slug/pdf — the A4 print document (R7-P P1–P3 + appendices, handoff §10):
 * P1 cover (verdict), P2 flags + liability, P3 numbers + the fourteen tests,
 * then appendices A (price history) + B (rent history) sharing ONE sheet and
 * C (agent checklist, real checkbox squares) as the report's last page.
 * Server-rendered paginated sheets (see src/styles/print.css for the
 * sheet/@page technique); every figure is engine-published in the fixture —
 * this file formats and lays out only (§6.2). Content data is SHARED with the
 * screen document (report-document.tsx), the layout is the print frames' own.
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
    /** Appendix C's persisted ticks (server-side per account+report, R7-11). */
    checkedIds?: string[];
    /** R5-6 pinned offer — the cover carries it ("your target: 98 500 €") and
       appendix C's header repeats it (the R5-6 contract). */
    pinned?: PinnedOffer | null;
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
function CoverSheet({ analysis, lang, t, page, total, pinned }: SheetProps) {
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

            {/* R5-6 — the pinned offer on the cover ("your target: 98 500 €"),
               with §1 and the checklist header. */}
            {pinned ? (
                <p className="p-pinned p-num">
                    {tpl(t.print.pinnedLine, { price: formatEUR(pinned.offerPrice, lang), date: formatDate(new Date(pinned.pinnedAt).toISOString(), lang) })}
                </p>
            ) : null}

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
                                {i + 1} · {lang === "fi" ? (flag.printTitleFi ?? flag.titleFi) : (flag.printTitle ?? flag.title)}
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

/* ── Appendices A+B · price & rent history on ONE sheet (handoff §10). Same
   data and panel anatomy as the screen's R7-9/10 panels — title, MODELLED
   source note, chart (static SVG twin: misty bars / steel flat deal-line),
   OBSERVED deal legend, the two stat tiles, narrative, the honesty line. The
   screen panels' eyebrows are dropped: the running header already names the
   appendices (noted in the PR). ── */
function HistoryBlock({ mark, history, deal, lang, t }: { mark: "A" | "B"; history: PriceHistory | RentHistory; deal: number; lang: Lang; t: Dict }) {
    const points = history.series.map((p) => ({ label: p.year, value: "medianSqm" in p ? p.medianSqm : p.medianRent }));
    return (
        <div>
            <SectionRow mark={mark} title={history.title[lang]} marginTop={mark === "A" ? undefined : 22} />
            <p className="p-hhonesty" style={{ marginTop: 4 }}>
                <PrintChip basis="MODELLED" t={t} /> {history.sourceNote[lang]}
            </p>
            <PrintBarLineChart points={points} deal={deal} ariaLabel={history.title[lang]} />
            <div className="p-legend p-num">
                <span>
                    <span aria-hidden className="p-swatch-bar" />
                    {history.seriesLabel[lang]}
                </span>
                <span>
                    <span aria-hidden className="p-swatch-line" />
                    {history.dealLabel[lang]} — {history.dealDisplay[lang]} <PrintChip basis="OBSERVED" t={t} />
                </span>
            </div>
            <div className="p-hstats p-num">
                {history.stats.map((stat) => (
                    <div className="p-hstat" key={stat.label.en}>
                        <div className="p-hstat-label">{stat.label[lang]}</div>
                        <div className="p-hstat-value">{stat.value[lang]}</div>
                        <div className="p-hstat-note">{stat.note[lang]}</div>
                    </div>
                ))}
            </div>
            <p className="p-hnarrative p-num">
                <StrongPrint text={history.narrative[lang]} strongs={history.narrativeStrongs.map((s) => s[lang])} />
            </p>
            <p className="p-hhonesty">{history.honesty[lang]}</p>
        </div>
    );
}

function HistorySheet({ analysis, lang, t, page, total }: SheetProps) {
    const { listing, report } = analysis;
    if (!listing || !report) return null;

    return (
        <section className="p-sheet" aria-label={t.print.runningHistory}>
            <RunningHeader left={`№ ${analysis.number} · ${listing.addr}, ${listing.city}`} right={t.print.runningHistory} />

            <HistoryBlock mark="A" history={report.priceHistory} deal={report.priceHistory.dealSqm} lang={lang} t={t} />
            <HistoryBlock mark="B" history={report.rentHistory} deal={report.rentHistory.tenancyRent} lang={lang} t={t} />

            <SheetBottom>
                <SheetFooter left={publicUrl(analysis)} right={tpl(t.print.pageOf, { page, total })} />
            </SheetBottom>
        </section>
    );
}

/* ── Appendix C · the agent checklist, the report's last page (handoff §10).
   Real checkbox squares (☐ empty / ☒ midnight + tick) reflecting the account's
   persisted state — "checkboxes are real print targets" (R7-11 annotation). ── */
function ChecklistSheet({ analysis, lang, t, page, total, checkedIds, pinned }: SheetProps) {
    const { listing, report } = analysis;
    if (!listing || !report) return null;
    const checklist = report.agentChecklist;
    const checked = new Set(checkedIds ?? []);

    return (
        <section className="p-sheet" aria-label={t.print.runningChecklist}>
            <RunningHeader left={`№ ${analysis.number} · ${listing.addr}, ${listing.city}`} right={t.print.runningChecklist} />

            <div className="p-eyebrow" style={{ marginTop: 14 }}>
                {tpl(t.checklist.eyebrow, { n: analysis.number })}
            </div>
            <SectionRow mark="C" title={checklist.title[lang]} marginTop={8} />
            {/* R5-6 — the pinned offer rides the checklist header in print too. */}
            {pinned ? <p className="p-pinned p-num">{tpl(t.checklist.pinnedLine, { price: formatEUR(pinned.offerPrice, lang) })}</p> : null}
            <div className="p-citems p-num">
                {checklist.items.map((item) => {
                    const on = checked.has(item.id);
                    return (
                        <div className="p-citem" key={item.id}>
                            <span aria-hidden className={cx("p-cbox", on && "p-cbox-on")}>
                                {on ? "✓" : ""}
                            </span>
                            <span>
                                <span className="p-cq">
                                    <StrongPrint text={item.question[lang]} strongs={item.questionStrongs.map((s) => s[lang])} />
                                </span>
                                <span className="p-cwhy">{item.why[lang]}</span>
                            </span>
                            <span className={cx("p-chip p-cchip", item.dashed ? "p-chip-est" : "p-chip-doc")}>{item.answersWith[lang]}</span>
                        </div>
                    );
                })}
            </div>
            <p className="p-coutro p-num">
                <StrongPrint text={checklist.outro[lang]} strongs={checklist.outroStrongs.map((s) => s[lang])} />
            </p>

            <SheetBottom>
                <SheetFooter left={publicUrl(analysis)} right={tpl(t.print.pageOf, { page, total })} />
            </SheetBottom>
        </section>
    );
}

/**
 * The sheets, paginated: P1–P3 then the appendices (slice 8) — A (price
 * history) + B (rent history) share ONE sheet, C (agent checklist, real
 * checkboxes) comes last (handoff §10). Page x/y recomputes from the array
 * length; REPORT_PRINT_PAGES lets the route's toolbar hint stay in step.
 */
const SHEETS = [CoverSheet, FlagsSheet, NumbersSheet, HistorySheet, ChecklistSheet];

export const REPORT_PRINT_PAGES = SHEETS.length;

export function ReportPrint({
    analysis,
    lang,
    t,
    checkedIds,
    pinned,
}: {
    analysis: Analysis;
    lang: Lang;
    t: Dict;
    checkedIds?: string[];
    pinned?: PinnedOffer | null;
}) {
    const total = SHEETS.length;
    return (
        <div className="rsm-print">
            {SHEETS.map((Sheet, i) => (
                <Sheet key={i} analysis={analysis} lang={lang} t={t} page={i + 1} total={total} checkedIds={checkedIds} pinned={pinned} />
            ))}
        </div>
    );
}
