"use client";

import { useState } from "react";
import Link from "next/link";
import { AccountTopBar } from "@/components/account/account-top-bar";
import { RefundSheet, type RefundSubject } from "@/components/account/refund-sheet";
import { WatchSheet } from "@/components/account/watch-sheet";
import { formatDate, formatEUR, formatPercent, maskEmail } from "@/lib/format";
import type { AccountReportRow, Watch } from "@/lib/types";
import { tpl, useLang } from "@/providers/lang";
import { cx } from "@/utils/cx";

type Filter = "all" | "unlocked" | "passing" | "watching";

/**
 * My reports (R10-1 desktop / R10-7 tablet / R10-4 mobile / R10-3 empty).
 * The boards' "drawer of documents" ships as a plain route — see the store
 * comment on listAccountReports for the drawer-vs-route decision. Rows link
 * to the report (≥44 px targets); the row overflow (⋯) carries the R11-1
 * entry menu (open · email support prefilled with the № · request a refund).
 * "Watching" rows arrive with the tracking slice (R12) — the pill stays per
 * the frame and filters to an honestly empty view until then.
 */
export function ReportsView({
    rows,
    balance: initialBalance,
    email,
    watch: initialWatch,
}: {
    rows: AccountReportRow[];
    balance: number;
    email: string;
    watch: Watch | undefined;
}) {
    const { t, lang } = useLang();
    const [balance, setBalance] = useState(initialBalance);
    const [watch, setWatch] = useState(initialWatch);
    const [filter, setFilter] = useState<Filter>("all");
    const [watchSheetOpen, setWatchSheetOpen] = useState(false);
    const [refundSubject, setRefundSubject] = useState<RefundSubject | null>(null);

    const unlockedCount = rows.filter((r) => r.status !== "summary").length;
    const filtered = rows.filter((r) => {
        if (filter === "unlocked") return r.status !== "summary";
        if (filter === "passing") return r.policyPassing;
        if (filter === "watching") return false; // tracking rows land with R12
        return true;
    });

    const watchSummary = watch
        ? watch.maxPrice != null
            ? `${watch.district}, ${t.watch.types[watch.type]}, ≤ ${formatEUR(watch.maxPrice, lang)}`
            : `${watch.district}, ${t.watch.types[watch.type]}`
        : "";

    /* Filter labels: the R10-1 desktop rail reads "Passing my policy"; the
       R10-4/R10-7 frames use the short "Passing" below 1280 px. */
    const FILTERS: { key: Filter; label: string; shortLabel?: string; mobile: boolean }[] = [
        { key: "all", label: t.reports.filterAll, mobile: true },
        { key: "unlocked", label: t.reports.filterUnlocked, mobile: true },
        { key: "passing", label: t.reports.filterPassing, shortLabel: t.reports.filterPassingShort, mobile: true },
        { key: "watching", label: t.reports.filterWatching, mobile: false },
    ];

    return (
        <div className="min-h-dvh">
            <AccountTopBar balance={balance} email={email} />
            <main className="mx-auto w-full max-w-[1120px] px-4 pt-4 pb-20 md:px-8">
                <h1 className="font-display text-3xl font-medium text-rsm-midnight">{t.reports.title}</h1>
                <p className="mt-1.5 text-[13.5px] wrap-anywhere text-rsm-slate">
                    {tpl(rows.length === 1 ? t.reports.sublineOne : t.reports.subline, { a: rows.length, u: unlockedCount, email: maskEmail(email) })}
                </p>

                {/* Filter rail — mobile keeps three pills (R10-4), ≥768 all four (R10-7). */}
                <div className="mt-5 flex flex-wrap gap-1.5" role="group" aria-label={t.reports.title}>
                    {FILTERS.map((f) => (
                        <button
                            key={f.key}
                            type="button"
                            aria-pressed={filter === f.key}
                            onClick={() => setFilter(f.key)}
                            className={cx(
                                "inline-flex min-h-11 items-center rounded-full px-4 text-[13px] font-bold whitespace-nowrap transition-colors duration-200 ease-rsm",
                                f.mobile ? "" : "max-md:hidden",
                                filter === f.key
                                    ? "bg-rsm-midnight text-rsm-paper"
                                    : "text-rsm-midnight shadow-[inset_0_0_0_1px_var(--color-rsm-hairline)] hover:shadow-[inset_0_0_0_1px_var(--color-rsm-steel)]",
                            )}
                        >
                            {f.shortLabel ? (
                                <>
                                    <span className="xl:hidden">{f.shortLabel}</span>
                                    <span className="max-xl:hidden">{f.label}</span>
                                </>
                            ) : (
                                f.label
                            )}
                        </button>
                    ))}
                </div>

                {/* Watch strip (R10-1/R10-5 entry). */}
                <section className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-rsm-card border border-rsm-hairline bg-white px-4 py-3">
                    <p className="text-[13px] leading-[1.5] wrap-anywhere text-rsm-charcoal">
                        {watch ? tpl(t.reports.watchingLine, { summary: watchSummary }) : t.reports.noWatch}
                    </p>
                    <button
                        type="button"
                        onClick={() => setWatchSheetOpen(true)}
                        className="inline-flex min-h-11 items-center rounded-full px-3 text-[13px] font-bold text-rsm-steel transition-colors duration-200 ease-rsm hover:text-rsm-midnight"
                    >
                        {watch ? t.reports.editWatch : t.reports.setWatch}
                    </button>
                </section>

                <div className="mt-4">
                    <Link
                        href="/"
                        className="inline-flex min-h-11 items-center rounded-full px-3 text-[14px] font-bold text-rsm-steel transition-colors duration-200 ease-rsm hover:text-rsm-midnight"
                    >
                        {t.reports.analyseNew}
                    </Link>
                </div>

                {rows.length === 0 ? (
                    /* R10-3 — empty state. */
                    <section className="mt-8 max-w-[420px]">
                        <h2 className="font-display text-xl font-medium text-rsm-midnight">{t.reports.emptyTitle}</h2>
                        <p className="mt-2 text-[14px] leading-[1.6] wrap-anywhere text-rsm-charcoal">{tpl(t.reports.emptyBody, { n: balance })}</p>
                        <Link
                            href="/"
                            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-rsm-lime px-6 text-base font-bold text-rsm-midnight transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75"
                        >
                            {t.reports.emptyCta}
                        </Link>
                    </section>
                ) : filtered.length === 0 ? (
                    <p className="mt-8 text-[14px] text-rsm-slate">{t.reports.filterEmpty}</p>
                ) : (
                    <div className="mt-4">
                        {/* Column header — desktop only (R10-1). */}
                        <div className="hidden grid-cols-[minmax(0,2.2fr)_120px_110px_72px_116px_140px_44px] gap-3 pb-2 text-[11px] font-bold tracking-[0.08em] text-rsm-slate uppercase xl:grid">
                            <span>{t.reports.colListing}</span>
                            <span className="text-right">{t.reports.colYields}</span>
                            <span className="text-right">{t.reports.colLiability}</span>
                            <span>{t.reports.colFlags}</span>
                            <span>{t.reports.colPolicy}</span>
                            <span>{t.reports.colStatus}</span>
                            <span aria-hidden />
                        </div>
                        {filtered.map((row) => (
                            <ReportRow
                                key={row.reportId}
                                row={row}
                                onRefund={() =>
                                    setRefundSubject({
                                        slug: row.slug,
                                        addr: row.addr,
                                        number: row.number,
                                        unlockTs: row.unlockTs ?? Date.parse(row.analysedAt),
                                    })
                                }
                            />
                        ))}
                    </div>
                )}
            </main>

            <WatchSheet watch={watch} open={watchSheetOpen} onClose={() => setWatchSheetOpen(false)} onSaved={setWatch} />
            {refundSubject ? <RefundSheet subject={refundSubject} open onClose={() => setRefundSubject(null)} onBalance={setBalance} /> : null}
        </div>
    );
}

/* ── Row — one report, three layouts (R10-1 / R10-7 / R10-4) ─────────────── */

function PolicyPill({ row }: { row: AccountReportRow }) {
    const { t } = useLang();
    return (
        <span
            className={cx(
                "tnum inline-flex min-h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] leading-none font-bold",
                row.policyPassing ? "bg-rsm-seafoam-25 text-rsm-seafoam-deep" : "bg-rsm-coral-25 text-rsm-coral-deep",
            )}
        >
            <span aria-hidden className={cx("size-[5px] rounded-full", row.policyPassing ? "bg-rsm-seafoam-deep" : "bg-rsm-coral-deep")} />
            {row.policyPassing ? t.reports.policyPass : tpl(t.reports.policyFails, { n: row.policyFails })}
        </span>
    );
}

function StatusText({ row }: { row: AccountReportRow }) {
    const { t } = useLang();
    const label = row.status === "unlocked" ? t.reports.statusUnlocked : row.status === "ended" ? t.reports.statusEnded : t.reports.statusSummary;
    return (
        <span
            className={cx(
                "text-[12.5px] font-medium",
                row.status === "unlocked" ? "text-rsm-midnight" : row.status === "ended" ? "text-rsm-slate-50" : "text-rsm-steel",
            )}
        >
            {label}
        </span>
    );
}

function Dots({ row, labelled }: { row: AccountReportRow; labelled?: boolean }) {
    const { t } = useLang();
    if (row.dots.length === 0) return <span className="text-[12.5px] text-rsm-slate-50">—</span>;
    const text = row.dots.map((d) => (d === "high" ? t.common.high : t.common.caution)).join(", ");
    return (
        <span className="inline-flex items-center gap-1" role="img" aria-label={text}>
            {row.dots.map((d, i) => (
                <span key={i} aria-hidden className={cx("size-[7px] rounded-full", d === "high" ? "bg-rsm-coral" : "bg-rsm-amber")} />
            ))}
            {labelled ? <span className="sr-only">{text}</span> : null}
        </span>
    );
}

function ReportRow({ row, onRefund }: { row: AccountReportRow; onRefund: () => void }) {
    const { t, lang } = useLang();
    const href = `/r/${row.slug}`;
    const yields = `${formatPercent(row.gross, lang)} → ${formatPercent(row.real, lang)}`;
    const meta = tpl(t.reports.metaLine, { type: lang === "fi" ? (row.typeFi ?? row.type) : row.type, m2: row.m2, date: formatDate(row.analysedAt, lang) });
    const liability = row.liabilityTotal != null ? formatEUR(row.liabilityTotal, lang) : "—";
    const highCount = row.dots.filter((d) => d === "high").length;
    const tabletMeta = `${row.m2} m² · ${tpl(t.reports.tabletLiability, { amount: liability })} · ${tpl(t.reports.tabletFlags, { n: row.dots.length })}${highCount ? `, ${tpl(t.reports.tabletFlagsHigh, { n: highCount })}` : ""}`;
    const mobileSub =
        row.status === "summary"
            ? t.reports.statusSummary
            : row.status === "ended"
              ? t.reports.statusEnded
              : row.policyPassing
                ? t.reports.mobileSubPasses
                : tpl(t.reports.mobileSubFails, { n: row.policyFails, total: row.policyTotal });
    const mobileSubColor =
        row.status === "summary"
            ? "text-rsm-steel"
            : row.status === "ended"
              ? "text-rsm-slate-50"
              : row.policyPassing
                ? "text-rsm-seafoam-deep"
                : "text-rsm-coral-deep";

    return (
        <div className="relative border-t border-rsm-row-line">
            <Link href={href} aria-label={row.addr} className="absolute inset-0 z-0 rounded-[4px]" />
            {/* ≤767 — R10-4: dots, address + subline, real yield. */}
            <div className="flex items-center gap-3 py-3 md:hidden">
                <Dots row={row} />
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium wrap-anywhere text-rsm-midnight">{row.addr}</span>
                    <span className={cx("block text-[12px] leading-[1.4]", mobileSubColor)}>{mobileSub}</span>
                </span>
                <span className="tnum font-display text-[15px] font-medium text-rsm-midnight">{formatPercent(row.real, lang)}</span>
                <RowMenu row={row} onRefund={onRefund} />
            </div>
            {/* 768–1279 — R10-7: liability + dots fold into the subline; grid 1.9fr/108/96/110 + menu. */}
            <div className="hidden grid-cols-[minmax(0,1.9fr)_108px_96px_110px_44px] items-center gap-3 py-3.5 md:grid xl:hidden">
                <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium wrap-anywhere text-rsm-midnight">{row.addr}</span>
                    <span className="tnum block truncate text-[12px] leading-[1.4] text-rsm-slate">{tabletMeta}</span>
                </span>
                <span className="tnum text-right text-[13px] text-rsm-midnight">{yields}</span>
                <PolicyPill row={row} />
                <StatusText row={row} />
                <RowMenu row={row} onRefund={onRefund} />
            </div>
            {/* ≥1280 — R10-1: six columns + overflow. */}
            <div className="hidden grid-cols-[minmax(0,2.2fr)_120px_110px_72px_116px_140px_44px] items-center gap-3 py-3.5 xl:grid">
                <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium wrap-anywhere text-rsm-midnight">{row.addr}</span>
                    <span className="tnum block truncate text-[12px] leading-[1.4] text-rsm-slate">{meta}</span>
                </span>
                <span className="tnum text-right text-[13px] text-rsm-midnight">{yields}</span>
                <span className="tnum text-right text-[13px] text-rsm-midnight">{liability}</span>
                <Dots row={row} labelled />
                <PolicyPill row={row} />
                <StatusText row={row} />
                <RowMenu row={row} onRefund={onRefund} />
            </div>
        </div>
    );
}

/* ── Row overflow (R11-1): open · email support (№ prefilled) · refund ───── */

function RowMenu({ row, onRefund }: { row: AccountReportRow; onRefund: () => void }) {
    const { t } = useLang();
    const [open, setOpen] = useState(false);
    const unlocked = row.unlockTs != null;
    const subject = encodeURIComponent(tpl(t.reports.supportSubject, { n: row.number }));

    const itemClass =
        "block w-full rounded-[10px] px-3 py-2.5 text-left text-[13.5px] font-medium whitespace-nowrap text-rsm-charcoal transition-colors duration-200 ease-rsm hover:bg-rsm-paper hover:text-rsm-steel";

    return (
        <span className="relative z-10 inline-flex" onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
            <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={`⋯ ${row.addr}`}
                onClick={() => setOpen((v) => !v)}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-rsm-slate transition-colors duration-200 ease-rsm hover:bg-rsm-midnight/5 hover:text-rsm-midnight"
            >
                <span aria-hidden className="text-lg leading-none">
                    ⋯
                </span>
            </button>
            {open ? (
                <>
                    <button type="button" aria-hidden tabIndex={-1} className="fixed inset-0 z-30 cursor-default" onClick={() => setOpen(false)} />
                    <span
                        role="menu"
                        className="absolute top-full right-0 z-40 mt-1 block w-max min-w-56 rounded-rsm-tile border border-rsm-hairline bg-white p-1.5 shadow-rsm-stack"
                    >
                        <Link role="menuitem" href={`/r/${row.slug}`} onClick={() => setOpen(false)} className={itemClass}>
                            {unlocked ? t.reports.menuOpen : t.reports.menuOpenSummary}
                        </Link>
                        <a role="menuitem" href={`mailto:hello@resimator.fi?subject=${subject}`} onClick={() => setOpen(false)} className={itemClass}>
                            {t.reports.menuSupport}
                        </a>
                        {unlocked ? (
                            <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    setOpen(false);
                                    onRefund();
                                }}
                                className={itemClass}
                            >
                                {t.reports.menuRefund}
                            </button>
                        ) : null}
                    </span>
                </>
            ) : null}
        </span>
    );
}
