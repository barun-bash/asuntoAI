"use client";

import { useState } from "react";
import { useLang } from "@/providers/lang";
import { cx } from "@/utils/cx";

/**
 * #faq — DS FAQ accordion pattern (Landing board annotation): one open at a
 * time, Plus ↔ Minus, height auto-expands over 200 ms standard ease. First
 * question starts open, as on the board. Six marketing strings; the page
 * (server) mirrors them as FAQPage JSON-LD.
 */
export function FaqAccordion() {
    const { t } = useLang();
    const f = t.marketing.faq;
    const items = [
        { q: f.q1, a: f.a1 },
        { q: f.q2, a: f.a2 },
        { q: f.q3, a: f.a3 },
        { q: f.q4, a: f.a4 },
        { q: f.q5, a: f.a5 },
        { q: f.q6, a: f.a6 },
    ];
    const [open, setOpen] = useState(0);

    return (
        <div className="flex flex-col">
            {items.map((item, i) => {
                const expanded = open === i;
                return (
                    <div key={item.q} className={cx("border-t border-rsm-hairline", i === items.length - 1 && "border-b")}>
                        <button
                            type="button"
                            aria-expanded={expanded}
                            aria-controls={`faq-panel-${i}`}
                            id={`faq-button-${i}`}
                            onClick={() => setOpen(expanded ? -1 : i)}
                            className="flex min-h-11 w-full items-center gap-3.5 py-5 text-left"
                        >
                            <span className="min-w-0 flex-1 font-display text-[17px] leading-[1.35] font-medium text-rsm-midnight">{item.q}</span>
                            <span aria-hidden className="flex flex-none text-rsm-misty">
                                {expanded ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-4">
                                        <path d="M5 12h14" />
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-4">
                                        <path d="M12 5v14M5 12h14" />
                                    </svg>
                                )}
                            </span>
                        </button>
                        <div
                            id={`faq-panel-${i}`}
                            role="region"
                            aria-labelledby={`faq-button-${i}`}
                            className={cx("grid transition-[grid-template-rows] duration-200 ease-rsm", expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
                        >
                            <div className="overflow-hidden">
                                <p className="-mt-2.5 max-w-[640px] pb-5 text-[13.5px] leading-[1.65] font-medium wrap-anywhere text-rsm-charcoal">{item.a}</p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
