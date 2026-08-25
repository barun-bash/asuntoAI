"use client";

import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { cx } from "@/utils/cx";

/**
 * Screen-only toolbar for the print routes (P1–P4): back to the report, FI/EN
 * switch (full navigation — the artifact is server-rendered per ?lang=, so the
 * in-place LangToggle pattern doesn't apply here) and a "Save as PDF" hint that
 * calls window.print(). Hidden in print via Tailwind's print: variant — this is
 * the ONLY chrome on the print routes (no TopBar, no chat); the artifact itself
 * is pure document.
 */
export function PrintToolbar({
    basePath,
    backHref,
    lang,
    hint,
    labels,
}: {
    basePath: string;
    backHref: string;
    lang: Lang;
    hint: string;
    labels: { back: string; print: string };
}) {
    return (
        <div className="sticky top-0 z-30 border-b border-rsm-hairline bg-rsm-paper/95 backdrop-blur-[8px] print:hidden">
            <div className="mx-auto flex h-14 w-full max-w-[840px] items-center gap-3 px-4 md:px-8">
                <Link
                    href={backHref}
                    className="inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-sm font-medium whitespace-nowrap text-rsm-charcoal transition-colors duration-200 ease-rsm hover:text-rsm-steel"
                >
                    {labels.back}
                </Link>
                <span className="inline-flex items-center rounded-full border border-rsm-hairline bg-white p-0.5" aria-label="Kieli · Language">
                    {(["fi", "en"] as const).map((option) => (
                        <Link
                            key={option}
                            href={option === "fi" ? basePath : `${basePath}?lang=en`}
                            aria-current={lang === option ? "true" : undefined}
                            className={cx(
                                "flex min-h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-bold uppercase transition-colors duration-200 ease-rsm",
                                lang === option ? "bg-rsm-midnight text-rsm-paper" : "text-rsm-misty hover:text-rsm-midnight",
                            )}
                        >
                            {option}
                        </Link>
                    ))}
                </span>
                <span className="ml-auto hidden text-xs text-rsm-misty md:inline">{hint}</span>
                <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-rsm-lime px-5 text-sm font-bold text-rsm-midnight transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75"
                >
                    {labels.print}
                </button>
            </div>
        </div>
    );
}
