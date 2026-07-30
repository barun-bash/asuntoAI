"use client";

import { Lock01 } from "@untitledui/icons";
import { CitationBlock } from "@/components/report/citation-block";
import { ProvenanceChip } from "@/components/report/provenance-chip";
import { SeverityMeta } from "@/components/report/severity-meta";
import { formatEUR } from "@/lib/format";
import type { FlagRedacted, Severity } from "@/lib/types";
import type { FlagFull } from "@/lib/types";
import { tpl, useLang } from "@/providers/lang";

/**
 * The one flag shown free (R1-6): title, severity + cost + window meta, body,
 * Finnish source quotes (C2), and the liability items with their own chips.
 */
export function FlagCard({ flag, window: windowLabel }: { flag: FlagFull; window: string }) {
    const { lang, t } = useLang();

    return (
        <article className="flex flex-col gap-4 rounded-rsm-card border border-rsm-hairline bg-white p-5 shadow-rsm-sm md:p-6">
            <h3 className="font-display text-xl font-medium wrap-anywhere text-rsm-midnight">{lang === "fi" ? flag.titleFi : flag.title}</h3>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold tracking-[0.04em] uppercase">
                <SeverityMeta severity={flag.severity} />
                <span aria-hidden className="text-rsm-misty-50">
                    ·
                </span>
                <span className="tnum text-rsm-charcoal">{lang === "fi" ? flag.costRangeFi : flag.costRange}</span>
                <span aria-hidden className="text-rsm-misty-50">
                    ·
                </span>
                <span className="text-rsm-misty">{windowLabel}</span>
            </div>
            <p className="text-[15px] leading-relaxed wrap-anywhere text-rsm-charcoal">{lang === "fi" ? flag.bodyFi : flag.body}</p>
            <div className="flex flex-col gap-3">
                {flag.quotes.map((quote) => (
                    <CitationBlock key={quote.text} quote={quote.text} source={lang === "fi" ? quote.sourceFi : quote.source} translation={quote.translation} />
                ))}
            </div>
            {/* The FI board (R1-8) carries this recovery line; the EN frame does not. */}
            {lang === "fi" ? (
                <p className="text-sm leading-relaxed wrap-anywhere text-rsm-charcoal">
                    {t.verdict.askAgentPrefix} <strong>isännöitsijäntodistus</strong> {t.verdict.askAgentMiddle} <strong>pitkän tähtäimen suunnitelma</strong>{" "}
                    {t.verdict.askAgentSuffix}
                </p>
            ) : null}
        </article>
    );
}

/**
 * A locked flag row (rule §6.4): severity + cost range stay visible, everything
 * else is redacted server-side. Static misty-25 bars, never a shimmer.
 */
export function LockedFlagRow({ flag }: { flag: FlagRedacted }) {
    const { lang, t } = useLang();
    const severityLabel = flag.severity === "high" ? t.common.high : t.common.caution;
    const range = lang === "fi" ? flag.costRangeFi : flag.costRange;

    return (
        <div
            role="row"
            aria-label={`Locked flag, ${severityLabel.toLowerCase()} severity, cost range ${range}`}
            className="flex items-center gap-3 rounded-rsm-tile border border-rsm-hairline bg-white p-4"
        >
            <Lock01 aria-hidden className="size-4 shrink-0 text-rsm-misty" />
            <div className="min-w-0 flex-1">
                <div aria-hidden className="h-3 w-2/5 rounded bg-rsm-misty-25" />
                <div className="mt-2 flex items-center gap-2 text-xs font-bold tracking-[0.04em] uppercase">
                    <SeverityMeta severity={flag.severity as Severity} />
                    <span aria-hidden className="text-rsm-misty-50">
                        ·
                    </span>
                    <span className="tnum text-rsm-charcoal">{range}</span>
                </div>
            </div>
        </div>
    );
}

/** Liability line item inside the free flag (amount + its own provenance chip). */
export function LiabilityItemRow({ label, amount, basis }: { label: string; amount: number; basis: "OBSERVED" | "MAPPED" | "MODELLED" | "ESTIMATED" }) {
    const { lang } = useLang();
    return (
        <div className="flex items-center justify-between gap-3 text-sm">
            <span className="wrap-anywhere text-rsm-charcoal">{label}</span>
            <span className="flex items-center gap-2">
                <span className="tnum font-display font-medium text-rsm-midnight">{formatEUR(amount, lang)}</span>
                <ProvenanceChip basis={basis} />
            </span>
        </div>
    );
}
