"use client";

import { useState } from "react";
import { useLang } from "@/providers/lang";
import { cx } from "@/utils/cx";

const presets = ["conservative", "balanced", "yield", "custom"] as const;
type Preset = (typeof presets)[number];

/**
 * Policy preset pills (R1-6 "Check it against your rules") — radiogroup (a11y §11).
 * Slice 1 ships selection state only; the live re-verdict over the 14 tests
 * (<100 ms client-side, preset → Custom + Reset) lands with the R5 slice.
 */
export function PolicyPills() {
    const { t } = useLang();
    const [preset, setPreset] = useState<Preset>("balanced");

    return (
        <section aria-labelledby="policy-title" className="flex flex-col gap-3">
            <h2 id="policy-title" className="font-display text-2xl font-medium text-rsm-midnight">
                {t.verdict.policyTitle}
            </h2>
            <p className="text-sm leading-relaxed text-rsm-misty">{t.verdict.policyNote}</p>
            <div role="radiogroup" aria-label={t.verdict.policyTitle} className="flex flex-wrap gap-2">
                {presets.map((key) => (
                    <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={preset === key}
                        onClick={() => setPreset(key)}
                        className={cx(
                            "flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition-colors duration-200 ease-rsm",
                            preset === key
                                ? "border-rsm-steel bg-rsm-steel-25/50 text-rsm-steel"
                                : "border-rsm-hairline bg-white text-rsm-charcoal hover:border-rsm-steel-50",
                        )}
                    >
                        {t.verdict.policy[key]}
                    </button>
                ))}
            </div>
        </section>
    );
}
