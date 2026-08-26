"use client";

import { ProvenanceChip } from "@/components/report/provenance-chip";
import { formatPercent, formatPp } from "@/lib/format";
import type { YieldMetric } from "@/lib/types";
import { useLang } from "@/providers/lang";

/**
 * Yield metric row (R1-6): label + adjacent provenance chip (C1 grammar),
 * Space Grotesk tabular value, engine-authored note. No arithmetic here — §6.2.
 */
export function YieldMetricRow({ label, metric, delta }: { label: string; metric: YieldMetric; delta?: boolean }) {
    const { lang } = useLang();

    return (
        <div className="flex flex-col gap-1.5 rounded-rsm-tile border border-rsm-hairline bg-white p-4 md:p-5">
            {/* data-onboarding anchor: R15-2 tip 1 ("every number names its
               source") halos the first provenance chip on the sheet. */}
            <div data-onboarding="provenance" className="flex items-center gap-2 self-start rounded">
                <span className="text-sm font-medium text-rsm-misty">{label}</span>
                <ProvenanceChip basis={metric.basis} />
            </div>
            <div className="flex items-baseline gap-2">
                <span className="tnum font-display text-4xl font-medium text-rsm-midnight md:text-5xl">{formatPercent(metric.value, lang)}</span>
                {delta && metric.deltaPp !== undefined ? (
                    <span className="tnum font-display text-lg font-medium text-rsm-coral">{formatPp(metric.deltaPp, lang)}</span>
                ) : null}
            </div>
            <p className="text-sm leading-relaxed wrap-anywhere text-rsm-charcoal">{lang === "fi" ? metric.noteFi : metric.note}</p>
        </div>
    );
}
