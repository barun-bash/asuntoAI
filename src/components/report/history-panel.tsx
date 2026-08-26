"use client";

import { useEffect, useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { DocChip } from "@/components/report/doc-chip";
import { StrongText } from "@/components/report/strong-text";
import type { PriceHistory, RentHistory } from "@/lib/types";
import { tpl, useLang } from "@/providers/lang";

/**
 * R7-9 / R7-10 — the price/rent history panels, expanding IN PLACE from their
 * entry points (the header meta's "2 185 €/m² · district median" stat →
 * "price history ▸"; §4's "27 lettings, 24 months" source line →
 * "rent history ▸"). Data is engine-served from GET /api/r/:slug/price-history
 * · /rent-history on first expand (series MODELLED, the deal figure OBSERVED);
 * every stat value and narrative figure is fixture-published — nothing is
 * derived from the series in the UI (§6.2).
 *
 * CHART DECISION: the starter's application/charts/ ships Untitled-brand
 * tooltip/legend helpers, not the DS LineAndBarChart grammar the frames draw
 * (misty bars = market series + a steel FLAT deal-line, "flat by definition"),
 * so this uses recharts directly with the board's own colors — bar #B6C2CF
 * (misty-50), line #427AA1 (steel), grid #F0EDE7, axis #DFE1E7.
 *
 * Layout per the frame annotations: the document column (≤800 px) follows the
 * tablet rule — chart full-width, stats 2-up below; mobile puts stats first
 * and scrolls the chart horizontally at a 560 px min-width.
 */

type HistoryPayload = PriceHistory | RentHistory;

interface ChartRow {
    year: string;
    median: number;
    deal: number;
}

/* Thousands separator for the y-axis (fi-FI grouping in both languages, C12) —
   tick formatting only, never arithmetic on the figures. */
function groupTick(value: number): string {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function HistoryChart({ rows }: { rows: ChartRow[] }) {
    return (
        /* Mobile scrolls the 560 px chart horizontally (R7-9 annotation) — the
           same pattern §6's year table already uses. */
        <div className="scrollbar-hide overflow-x-auto">
            <div className="min-w-[560px]">
                <ResponsiveContainer width="100%" height={230}>
                    <ComposedChart data={rows} margin={{ top: 10, right: 8, bottom: 0, left: 0 }} barCategoryGap="32%">
                        <CartesianGrid vertical={false} stroke="#F0EDE7" />
                        <XAxis dataKey="year" interval={0} tickLine={false} axisLine={{ stroke: "#DFE1E7" }} tick={{ fontSize: 10, fill: "#6D859F" }} />
                        <YAxis
                            domain={[0, "auto"]}
                            width={42}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 9.5, fill: "#A2A8AE" }}
                            tickFormatter={groupTick}
                        />
                        {/* Bars = the market series (MODELLED); the steel line is
                           this apartment's observed figure — flat by definition. */}
                        <Bar dataKey="median" fill="#B6C2CF" radius={[3, 3, 0, 0]} maxBarSize={28} />
                        <Line dataKey="deal" type="linear" stroke="#427AA1" strokeWidth={2} dot={false} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export function HistoryPanel({
    kind,
    slug,
    number,
    open,
    panelId,
}: {
    kind: "price" | "rent";
    slug: string;
    /** Report № for the eyebrow ("… appendix to № 2026-1187"). */
    number: string;
    open: boolean;
    panelId: string;
}) {
    const { lang, t } = useLang();
    const [data, setData] = useState<HistoryPayload | null>(null);

    // Engine-served on first expand (the board's data contract); cached after.
    useEffect(() => {
        if (!open || data) return;
        let cancelled = false;
        fetch(`/api/r/${slug}/${kind === "price" ? "price-history" : "rent-history"}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((payload: HistoryPayload | null) => {
                if (!cancelled && payload?.series) setData(payload);
            })
            .catch(() => {
                /* The mock engine cannot fail; the swap to the real engine owns
                   error surfacing (the panel stays on its loading line). */
            });
        return () => {
            cancelled = true;
        };
    }, [open, data, kind, slug]);

    if (!open) return null;

    const deal = data ? (kind === "price" ? (data as PriceHistory).dealSqm : (data as RentHistory).tenancyRent) : 0;
    const rows: ChartRow[] = (data?.series ?? []).map((point) => ({
        year: point.year,
        median: "medianSqm" in point ? point.medianSqm : point.medianRent,
        deal,
    }));

    return (
        <div id={panelId} className="mt-2.5 scroll-mt-36 rounded-rsm-card border border-rsm-hairline bg-rsm-editor-bg px-5 py-4.5 md:px-6 md:py-5">
            {/* Panel head — steel eyebrow + H2 + the series' MODELLED chip with
               its source note (chips adjacent to what they describe, §6.1). */}
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                <div className="min-w-0">
                    <p className="text-[10.5px] leading-[1.3] font-bold tracking-[0.08em] text-rsm-steel uppercase">
                        {tpl(kind === "price" ? t.history.priceEyebrow : t.history.rentEyebrow, { n: number })}
                    </p>
                    <h3 className="mt-1 font-display text-[19px] leading-[1.25] font-medium wrap-anywhere text-rsm-midnight">
                        {data ? data.title[lang] : "…"}
                    </h3>
                </div>
                {data ? (
                    <span className="ml-auto inline-flex flex-wrap items-center gap-2 text-[11.5px] leading-[1.4] text-rsm-misty">
                        <DocChip label={t.provenance.MODELLED} tone="mod" />
                        <span>{data.sourceNote[lang]}</span>
                    </span>
                ) : null}
            </div>

            {data ? (
                <div className="flex flex-col">
                    {/* Stats — mobile shows them first (R7-9 mobile rule). */}
                    <div className="order-1 mt-4 grid grid-cols-2 gap-2.5 md:order-2">
                        {data.stats.map((stat) => (
                            <div key={stat.label.en} className="rounded-rsm-input border border-rsm-hairline bg-white px-3.5 py-3">
                                <div className="text-[9.5px] leading-[1.3] font-bold tracking-[0.06em] wrap-anywhere text-rsm-misty uppercase">
                                    {stat.label[lang]}
                                </div>
                                <div className="tnum mt-1 font-display text-[21px] leading-none font-medium text-rsm-midnight">{stat.value[lang]}</div>
                                <div className="tnum mt-1 text-[10.5px] leading-[1.4] wrap-anywhere text-rsm-misty">{stat.note[lang]}</div>
                            </div>
                        ))}
                    </div>

                    <div className="order-2 mt-4 md:order-1">
                        <HistoryChart rows={rows} />
                        {/* Legend — the frame's own row (no recharts legend):
                           misty swatch = series, steel swatch = this apartment,
                           the deal figure carrying its OBSERVED chip. */}
                        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] leading-[1.5] text-rsm-misty">
                            <span className="inline-flex items-center gap-1.5">
                                <span aria-hidden className="size-2.5 rounded-[3px] bg-rsm-misty-50" />
                                {data.seriesLabel[lang]}
                            </span>
                            <span className="inline-flex flex-wrap items-center gap-1.5">
                                <span aria-hidden className="h-0 w-3.5 border-t-2 border-rsm-steel" />
                                <span>
                                    {data.dealLabel[lang]} — <span className="tnum text-rsm-charcoal">{data.dealDisplay[lang]}</span>
                                </span>
                                <DocChip label={t.provenance.OBSERVED} tone="obs" />
                            </span>
                        </div>
                    </div>

                    <p className="order-3 mt-4 text-[13px] leading-[1.65] wrap-anywhere text-rsm-charcoal">
                        <StrongText text={data.narrative[lang]} strongs={data.narrativeStrongs.map((s) => s[lang])} />
                    </p>
                    {/* The honesty line — nominal figures, said plainly. */}
                    <p className="order-4 mt-2 text-[11.5px] leading-[1.6] wrap-anywhere text-rsm-misty">{data.honesty[lang]}</p>
                </div>
            ) : (
                <p className="mt-4 text-xs leading-[1.5] text-rsm-misty">{t.history.loading}</p>
            )}
        </div>
    );
}
