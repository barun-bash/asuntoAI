"use client";

import { useLang } from "@/providers/lang";
import { cx } from "@/utils/cx";

/**
 * FI ⇄ EN toggle (R1-14) — top-bar segmented control. Swap happens in place:
 * no reload, numbers and dates reformat, quoted Finnish never translates.
 * Targets ≥44 px (a11y §11).
 */
export function LangToggle({ className }: { className?: string }) {
    const { lang, setLang } = useLang();

    return (
        <div
            role="group"
            aria-label="Kieli · Language"
            className={cx("inline-flex items-center rounded-full border border-rsm-hairline bg-white p-0.5", className)}
        >
            {(["fi", "en"] as const).map((option) => (
                <button
                    key={option}
                    type="button"
                    aria-pressed={lang === option}
                    onClick={() => setLang(option)}
                    className={cx(
                        "flex min-h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-bold uppercase transition-colors duration-200 ease-rsm",
                        lang === option ? "bg-rsm-midnight text-rsm-paper" : "text-rsm-misty hover:text-rsm-midnight",
                    )}
                >
                    {option}
                </button>
            ))}
        </div>
    );
}
