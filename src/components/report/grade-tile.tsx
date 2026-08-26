"use client";

import { cx } from "@/utils/cx";

/**
 * Grade tile (R1-6): big Space Grotesk letter + label + engine note.
 * Grades are neutral — verdict hues are reserved for pass/caution/fail.
 */
export function GradeTile({ grade, label, note }: { grade: string; label: string; note: string }) {
    return (
        <div className="flex items-start gap-3 rounded-rsm-tile border border-rsm-hairline bg-white p-4">
            <span
                aria-label={`${label}: ${grade}`}
                className={cx(
                    "flex size-12 shrink-0 items-center justify-center rounded-rsm-tile border border-rsm-hairline bg-rsm-paper",
                    "tnum font-display text-2xl font-medium text-rsm-midnight",
                )}
            >
                {grade}
            </span>
            <div className="min-w-0">
                <div className="text-sm font-bold wrap-anywhere text-rsm-midnight">{label}</div>
                <div className="mt-0.5 text-xs leading-relaxed wrap-anywhere text-rsm-misty">{note}</div>
            </div>
        </div>
    );
}
