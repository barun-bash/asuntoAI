"use client";

import { Lock01 } from "@untitledui/icons";
import Link from "next/link";
import { AccountTopBar } from "@/components/account/account-top-bar";
import { formatDate } from "@/lib/format";
import type { CompareColumn, CompareResponse, CompareRowKey } from "@/lib/types";
import { tpl, useLang } from "@/providers/lang";
import { cx } from "@/utils/cx";

/**
 * Compare table (R13-1 desktop / R13-2 tablet & mobile): 2–4 analysed
 * listings side by side — same engine figures, same provenance, one table.
 * Each column is frozen at its own version + read date; staleness is stated
 * per column (amber) with an inline free re-run. The steel "best in row" dot
 * marks facts only — never the verdict row, whose pills speak for themselves;
 * the lime CTA sits on the only column passing cleanly. Summary-only columns
 * carry the free-tier rows and a lock marker on the §3/financing-derived
 * lines (locked values never reached the client, §6.4).
 *
 * Layout: the label column is sticky left (150 px at 768–1279 per the frame),
 * deal columns are 220 px and scroll horizontally with snap — the third
 * column bleeds the frame edge to say so; ≥1280 the columns grow to fill.
 * (The frame's drag-to-reorder stays engine/platform work — the mock keeps
 * selection order, flagged in the PR.)
 */

interface RowDef {
    key: CompareRowKey | "policy" | "open";
    label: string;
}

/** "29.07" — the header's no-year read date (FI "29.7."). */
function shortDate(iso: string, lang: "fi" | "en"): string {
    return formatDate(iso, lang).replace(/\.\d{4}$/, lang === "fi" ? "." : "");
}

/* ── Column header: address, meta, version + read + staleness ── */
function ColumnHead({ column, t, lang }: { column: CompareColumn; t: ReturnType<typeof useLang>["t"]; lang: "fi" | "en" }) {
    const stale = column.state !== "live";
    const stateLabel =
        column.state === "price-dropped" ? t.compare.stateDropped : column.state === "rerun-pending" ? t.compare.statePending : t.compare.stateLive;
    return (
        <span className="flex min-h-[118px] flex-col gap-1 border-b border-rsm-hairline px-3 py-3">
            <Link
                href={`/r/${column.slug}`}
                className="inline-flex min-h-11 items-start text-[14px] leading-[1.35] font-bold wrap-anywhere text-rsm-midnight underline-offset-4 hover:text-rsm-steel hover:underline"
            >
                {column.addr}
            </Link>
            <span className="text-[11px] leading-[1.4] wrap-anywhere text-rsm-misty">{column.meta[lang]}</span>
            <span className="tnum mt-auto flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] leading-[1.4]">
                <span className="text-rsm-slate">{tpl(t.compare.readMeta, { v: column.versionTag, date: shortDate(column.readAt, lang) })}</span>
                <span aria-hidden className="text-rsm-misty-50">
                    ·
                </span>
                <span className={cx("font-bold", stale ? "text-rsm-amber-deep" : "text-rsm-seafoam-deep")}>{stateLabel}</span>
                {stale ? (
                    <>
                        <span aria-hidden className="text-rsm-misty-50">
                            ·
                        </span>
                        {/* The stale column's inline free re-run (fairness §6.7) —
                           the re-run flow is engine work; the mock routes to the
                           report (comment per the slice brief). */}
                        <Link
                            href={`/r/${column.slug}`}
                            className="inline-flex min-h-11 items-center font-medium text-rsm-steel underline-offset-4 hover:underline"
                        >
                            {t.compare.rerunFree}
                        </Link>
                    </>
                ) : null}
            </span>
        </span>
    );
}

/* ── The steel best-in-row dot (facts only) + its screen-reader label ── */
function BestDot() {
    const { t } = useLang();
    return (
        <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="size-[6px] rounded-full bg-rsm-steel" />
            <span className="sr-only">{t.compare.bestSr}</span>
        </span>
    );
}

/* ── Lock marker for summary-only columns (§6.4) ── */
function LockedCell() {
    const { t } = useLang();
    return (
        <span aria-label={t.compare.lockedCell} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-rsm-misty">
            <Lock01 aria-hidden className="size-3.5" />
            {t.compare.lockedCell}
        </span>
    );
}

/* ── Verdict pill grammar: fail-building coral / pass seafoam / near amber ── */
function VerdictPill({ column, policyTotal }: { column: CompareColumn; policyTotal: number }) {
    const { t } = useLang();
    const label =
        column.verdictKind === "fail-building"
            ? tpl(t.compare.verdictFailBuilding, { n: column.verdictN ?? 0 })
            : column.verdictKind === "pass"
              ? tpl(t.compare.verdictPass, { total: policyTotal })
              : tpl(t.compare.verdictNear, { n: column.verdictN ?? 0 });
    return (
        <span
            className={cx(
                "tnum inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.04em] uppercase",
                column.verdictKind === "fail-building"
                    ? "bg-rsm-coral-25 text-rsm-coral-deep"
                    : column.verdictKind === "pass"
                      ? "bg-rsm-seafoam-25 text-rsm-seafoam-deep"
                      : "bg-rsm-amber-25 text-rsm-amber-deep",
            )}
        >
            <span
                aria-hidden
                className={cx(
                    "size-[5px] rounded-full",
                    column.verdictKind === "fail-building" ? "bg-rsm-coral-deep" : column.verdictKind === "pass" ? "bg-rsm-seafoam-deep" : "bg-rsm-amber-deep",
                )}
            />
            {label}
        </span>
    );
}

/* ── Grade letters on the verdict scale (wash + label, grayscale-safe) ── */
function GradeLetters({ company, municipality }: { company: string; municipality: string }) {
    const wash = (grade: string) =>
        grade === "A" || grade === "B"
            ? "bg-rsm-seafoam-25 text-rsm-seafoam-deep"
            : grade === "C"
              ? "bg-rsm-amber-25 text-rsm-amber-deep"
              : "bg-rsm-coral-25 text-rsm-coral-deep";
    return (
        <span className="inline-flex items-center gap-1.5">
            {[company, municipality].map((grade, i) => (
                <span key={i} className={cx("tnum flex size-7 items-center justify-center rounded-[7px] font-display text-[13px] font-medium", wash(grade))}>
                    {grade}
                </span>
            ))}
        </span>
    );
}

export function CompareView({ data, balance, email }: { data: CompareResponse; balance: number; email: string }) {
    const { lang, t } = useLang();
    const { columns, best, policyTotal } = data;

    const rows: RowDef[] = [
        { key: "debtFree", label: t.compare.rowDebtFree },
        { key: "sqm", label: t.compare.rowSqm },
        { key: "yield", label: t.compare.rowYield },
        { key: "liability", label: t.compare.rowLiability },
        { key: "grades", label: t.compare.rowGrades },
        { key: "flags", label: t.compare.rowFlags },
        { key: "cashFlow", label: t.compare.rowCashFlow },
        { key: "cashNeeded", label: t.compare.rowCashNeeded },
        { key: "policy", label: t.compare.rowPolicy },
        { key: "open", label: "" },
    ];

    const cellOf = (column: CompareColumn, key: RowDef["key"]) => {
        if (key === "policy") return <VerdictPill column={column} policyTotal={policyTotal} />;
        if (key === "open") {
            /* The lime CTA sits on the only column passing cleanly. */
            const clean = column.verdictKind === "pass";
            return (
                <Link
                    href={`/r/${column.slug}`}
                    className={cx(
                        "inline-flex min-h-11 items-center justify-center rounded-full px-4 text-[13px] font-bold transition-colors duration-200 ease-rsm",
                        clean ? "bg-rsm-lime text-rsm-midnight hover:bg-rsm-lime-75" : "text-rsm-steel underline-offset-4 hover:underline",
                    )}
                >
                    {t.compare.openReport}
                </Link>
            );
        }
        if (column.lockedRows.includes(key)) return <LockedCell />;
        if (key === "grades") return <GradeLetters company={column.cells.companyGrade} municipality={column.cells.municipalityGrade} />;
        if (key === "yield") {
            return (
                <span className="flex flex-col">
                    <span>{column.cells.yield[lang]}</span>
                    <span className="text-[10.5px] text-rsm-misty">{column.cells.yieldSub[lang]}</span>
                </span>
            );
        }
        const cell = column.cells[key];
        return cell ? <span>{cell[lang]}</span> : null;
    };

    return (
        <div className="min-h-dvh">
            <AccountTopBar balance={balance} email={email} />
            <main className="mx-auto w-full max-w-[1120px] px-4 pt-6 pb-20 md:px-8">
                <Link href="/reports" className="inline-flex min-h-11 items-center text-[13px] font-medium text-rsm-steel underline-offset-4 hover:underline">
                    {t.compare.backToReports}
                </Link>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <h1 className="font-display text-2xl font-medium wrap-anywhere text-rsm-midnight md:text-3xl">{t.compare.titlePolicy}</h1>
                    <p className="text-[12px] wrap-anywhere text-rsm-misty">{t.compare.bestCaption}</p>
                </div>

                {/* The table — sticky label column + 220 px snap columns (R13-2);
                   ≥1280 the columns grow to fill (R13-1). */}
                <div
                    className="-mx-4 mt-5 scrollbar-hide snap-x snap-mandatory overflow-x-auto px-4 md:-mx-8 md:px-8"
                    role="region"
                    aria-label={t.compare.title}
                >
                    <div className="w-max min-w-full xl:w-full" role="table" style={{ ["--ccols" as string]: columns.length }}>
                        {/* Column headers. */}
                        <div
                            role="row"
                            className="grid grid-cols-[136px_repeat(var(--ccols),220px)] md:grid-cols-[150px_repeat(var(--ccols),220px)] xl:grid-cols-[200px_repeat(var(--ccols),minmax(220px,1fr))]"
                        >
                            <span role="columnheader" className="sticky left-0 z-10 snap-none border-b border-rsm-hairline bg-rsm-paper" />
                            {columns.map((column) => (
                                <span key={column.id} role="columnheader" className="snap-start bg-white p-0">
                                    <ColumnHead column={column} t={t} lang={lang} />
                                </span>
                            ))}
                        </div>
                        {rows.map((row) => (
                            <div
                                role="row"
                                key={row.key || "open"}
                                className="grid grid-cols-[136px_repeat(var(--ccols),220px)] md:grid-cols-[150px_repeat(var(--ccols),220px)] xl:grid-cols-[200px_repeat(var(--ccols),minmax(220px,1fr))]"
                            >
                                <span
                                    role="rowheader"
                                    className="sticky left-0 z-10 snap-none border-b border-rsm-row-line bg-rsm-paper py-3 pr-3 text-[11px] leading-[1.4] font-bold tracking-[0.04em] wrap-anywhere text-rsm-misty uppercase"
                                >
                                    {row.label}
                                </span>
                                {columns.map((column) => (
                                    <span
                                        role="cell"
                                        key={column.id}
                                        className="tnum flex snap-start items-center gap-2 border-b border-rsm-row-line bg-white px-3 py-3 text-[13px] leading-[1.45] wrap-anywhere text-rsm-midnight"
                                    >
                                        {row.key !== "policy" && row.key !== "open" && best[row.key] === column.id ? <BestDot /> : null}
                                        {cellOf(column, row.key)}
                                    </span>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
