"use client";

import { useLang } from "@/providers/lang";

interface CitationBlockProps {
    /** The Finnish source sentence — never translated away (rule §6.1). */
    quote: string;
    /** Source line, e.g. "Listing text · Oikotie 21966412 · read 28.07.2026". */
    source: string;
    /** Shown only when the UI language differs from the listing language (FI). */
    translation?: string;
}

/**
 * C2 — citation block: claim → quoted Finnish sentence → source line.
 * Translation appears under the source when UI ≠ FI.
 */
export function CitationBlock({ quote, source, translation }: CitationBlockProps) {
    const { lang, t } = useLang();

    return (
        <figure className="border-l-2 border-rsm-steel-50 pl-3">
            <blockquote className="text-[15px] leading-relaxed font-medium wrap-anywhere text-rsm-charcoal">{quote}</blockquote>
            <figcaption className="mt-1 text-xs text-rsm-misty">{source}</figcaption>
            {lang !== "fi" && translation ? (
                <p className="mt-1 text-xs text-rsm-misty italic">
                    {t.common.translation}: {translation}
                </p>
            ) : null}
        </figure>
    );
}
