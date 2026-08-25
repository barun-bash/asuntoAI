"use client";

import { cx } from "@/utils/cx";

/**
 * The document chip in the R7-9/10/11 frames' grammar (board script obs/mod/
 * est): a small bordered uppercase label — inset hairline + midnight for
 * OBSERVED-weight evidence, inset hairline + misty for MODELLED, dashed +
 * misty for a listing gap (C1 "dashed = gap"). The checklist's document chips
 * (SOURCE DOCUMENT, MEETING MINUTES, …) ride the "doc" tone (board #46525E
 * slate). Distinct from ProvenanceChip (steel, interactive tooltip) — these
 * panels draw the chips exactly as the frames do.
 */
export function DocChip({ label, tone = "obs", className }: { label: string; tone?: "obs" | "mod" | "doc" | "gap"; className?: string }) {
    return (
        <span
            className={cx(
                "inline-flex shrink-0 items-center rounded-[5px] px-1.5 py-[3px] text-[9px] leading-[12px] font-bold tracking-[0.05em] uppercase",
                tone === "obs" && "text-rsm-midnight shadow-[inset_0_0_0_1px_var(--color-rsm-hairline)]",
                tone === "mod" && "text-rsm-misty shadow-[inset_0_0_0_1px_var(--color-rsm-hairline)]",
                tone === "doc" && "text-rsm-slate shadow-[inset_0_0_0_1px_var(--color-rsm-hairline)]",
                tone === "gap" && "border border-dashed border-rsm-misty-50 text-rsm-misty",
                className,
            )}
        >
            {label}
        </span>
    );
}
