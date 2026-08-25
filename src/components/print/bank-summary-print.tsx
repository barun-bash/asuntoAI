import { PrintChip, PrintLockup, SectionRow, SheetBottom, SheetFooter, StrongPrint } from "@/components/print/shared";
import type { Dict } from "@/i18n/dict";
import { formatDate } from "@/lib/format";
import type { Lang } from "@/lib/i18n";
import type { Analysis, BankSummaryRow, Provenance } from "@/lib/types";
import { cx } from "@/utils/cx";

/**
 * /r/:slug/bank-summary.pdf — the P4 one-pager (R7-P, handoff §10): the bank's
 * reading order — purchase → loan need → monthly serviceability at base AND
 * stress rate → known liabilities disclosed up front, then the fixed "not a
 * loan offer" disclaimer. Figures are the engine-published CURRENT-version
 * numbers from the fixture (P4 annotation: v2, post price-drop, post
 * documents; the loan need is engine-derived — the UI never recomputes, §6.2).
 */

/* Server-local twin of providers/lang's tpl (that module is "use client";
   the print routes are server-rendered). */
function tpl(template: string, vars: Record<string, string | number>): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}

function KvRow({ row, lang }: { row: BankSummaryRow; lang: Lang }) {
    return (
        <div className={cx("p-kv p-num", row.bold && "p-kv-bold")}>
            <span>{row.label[lang]}</span>
            <span>{row.value[lang]}</span>
        </div>
    );
}

/* The disclosed-liabilities paragraph carries its provenance chip mid-sentence:
   the fixture text marks the spot with {chip} (after the post-renovation uplift
   figure, as on the P4 frame) and this renders the bordered print chip there. */
function LiabilitiesParagraph({ text, chip, strongs, t }: { text: string; chip: Provenance; strongs: string[]; t: Dict }) {
    const parts = text.split("{chip}");
    return (
        <p>
            {parts.map((part, i) => (
                <span key={i}>
                    <StrongPrint text={part} strongs={strongs} />
                    {i < parts.length - 1 ? (
                        <>
                            {" "}
                            <PrintChip basis={chip} t={t} />
                        </>
                    ) : null}
                </span>
            ))}
        </p>
    );
}

export function BankSummaryPrint({ analysis, lang, t }: { analysis: Analysis; lang: Lang; t: Dict }) {
    const { listing, report } = analysis;
    if (!listing || !report) return null;
    const bank = report.bankSummary;

    return (
        <div className="rsm-print">
            <section className="p-sheet" aria-label={t.print.bank.title}>
                <div className="p-sheet-head" style={{ paddingBottom: 16 }}>
                    <PrintLockup />
                    <span className="p-head-right">
                        {t.print.bank.title}
                        <br />
                        <strong className="p-num">
                            № {analysis.number} · {bank.versionTag}
                        </strong>{" "}
                        · <span className="p-num">{formatDate(bank.readAt, lang)}</span>
                    </span>
                </div>

                <h1 className="p-h1-sm p-num">
                    {listing.addr}, {listing.postalCode ? `${listing.postalCode} ` : ""}
                    {listing.city}
                </h1>
                <p className="p-meta-sm p-num">{bank.meta[lang]}</p>

                {/* 1 — purchase → loan need (the frame's two-column split). */}
                <SectionRow mark="1" title={t.print.bank.s1} small marginTop={20} />
                <div className="p-bank-cols">
                    <div>
                        {bank.purchaseLeft.map((row) => (
                            <KvRow key={row.label.en} row={row} lang={lang} />
                        ))}
                    </div>
                    <div>
                        {bank.purchaseRight.map((row) => (
                            <KvRow key={row.label.en} row={row} lang={lang} />
                        ))}
                    </div>
                </div>

                {/* 2 — monthly serviceability at base AND stress rate, P10 rent
                   stated as deliberate (underwriting at P10, rule §6.5). */}
                <SectionRow mark="2" title={t.print.bank.s2} small marginTop={18} />
                <div className="p-thead p-cols-svc" style={{ marginTop: 10 }}>
                    <span />
                    <span className="p-right p-num">{bank.service.baseHeader[lang]}</span>
                    <span className="p-right p-num">{bank.service.stressHeader[lang]}</span>
                </div>
                {bank.service.rows.map((row) => (
                    <div className="p-trow p-trow-tight p-cols-svc" key={row.label.en}>
                        <span className="p-cell-name">
                            {row.label[lang]}
                            {row.chip ? (
                                <>
                                    {" "}
                                    <PrintChip basis={row.chip} t={t} />
                                </>
                            ) : null}
                        </span>
                        <span className="p-cell-num p-right p-num">{row.base}</span>
                        <span className="p-cell-num p-right p-num">{row.stress}</span>
                    </div>
                ))}
                <div className="p-tfoot p-cols-svc">
                    <span className="p-cell-label-bold">{bank.service.totalLabel[lang]}</span>
                    {/* Negative cash flow reads in the deep verdict ink — the words
                       and the U+2212 sign carry the meaning (grayscale-safe). */}
                    <span className="p-cell-label-bold p-right p-num p-cell-neg">{bank.service.baseTotal}</span>
                    <span className="p-cell-label-bold p-right p-num p-cell-neg">{bank.service.stressTotal}</span>
                </div>
                <p className="p-basis-line p-num" style={{ lineHeight: 1.6 }}>
                    {bank.note[lang]}
                </p>

                {/* 3 — known liabilities disclosed to the bank up front (hiding the
                   pipe renovation from a bank helps nobody — P4 annotation). */}
                <SectionRow mark="3" title={t.print.bank.s3} small marginTop={18} />
                <div className="p-liab p-num">
                    <LiabilitiesParagraph
                        text={bank.liabilities[lang]}
                        chip={bank.liabilitiesChip}
                        strongs={bank.liabilitiesStrongs.map((s) => s[lang])}
                        t={t}
                    />
                </div>

                <SheetBottom>
                    {/* Sources + the fixed "not a loan offer" disclaimer (bolded). */}
                    <div className="p-legal p-num" style={{ lineHeight: 1.6 }}>
                        <StrongPrint text={bank.footer[lang]} strongs={[bank.footerStrong[lang]]} />
                    </div>
                    <SheetFooter left={`resimator.fi/r/${analysis.slug}`} right={tpl(t.print.pageOf, { page: 1, total: 1 })} />
                </SheetBottom>
            </section>
        </div>
    );
}
