"use client";

import type { Provenance } from "@/lib/types";
import { useLang } from "@/providers/lang";
import { cx } from "@/utils/cx";

/**
 * C1 — provenance chip. Every number carries one adjacent to it (rule §6.1).
 * Steel Blue = evidence (spec §2); the tooltip carries the definition.
 */
export function ProvenanceChip({ basis, className }: { basis: Provenance; className?: string }) {
    const { t } = useLang();
    const label = t.provenance[basis];
    const definition = t.provenance.def[basis];

    return (
        <span
            title={`${label} — ${definition}`}
            className={cx(
                "inline-flex h-5 shrink-0 items-center rounded-full border border-rsm-steel-50 bg-rsm-steel-25/40 px-1.5 align-middle",
                "text-[10px] font-bold tracking-[0.06em] text-rsm-steel uppercase",
                className,
            )}
        >
            {label}
        </span>
    );
}
