"use client";

import type { Severity } from "@/lib/types";
import { useLang } from "@/providers/lang";
import { cx } from "@/utils/cx";

/**
 * Verdict colours are wash + border + label — never colour alone, so grayscale
 * print survives (rule §6.6). Dots are always paired with text (a11y §11).
 */
const severityStyles: Record<Severity, { dot: string; label: string }> = {
    high: { dot: "bg-rsm-coral ring-1 ring-rsm-coral/40", label: "text-rsm-coral" },
    caution: { dot: "bg-rsm-amber ring-1 ring-rsm-amber/40", label: "text-rsm-charcoal" },
};

export function SeverityMeta({ severity, className }: { severity: Severity; className?: string }) {
    const { t } = useLang();
    const styles = severityStyles[severity];
    const label = severity === "high" ? t.common.high : t.common.caution;

    return (
        <span className={cx("inline-flex items-center gap-1.5", className)}>
            <span aria-hidden className={cx("size-2 rounded-full", styles.dot)} />
            <span className={cx("text-xs font-bold tracking-[0.06em] uppercase", styles.label)}>{label}</span>
        </span>
    );
}
