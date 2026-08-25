"use client";

import { useEffect, useState } from "react";
import { Check } from "@untitledui/icons";
import { OPEN_CHAT_EVENT } from "@/components/report/chat-panel";
import { DocChip } from "@/components/report/doc-chip";
import { StrongText } from "@/components/report/strong-text";
import { formatEUR } from "@/lib/format";
import type { AgentChecklistItemState } from "@/lib/store";
import type { AgentChecklist, PinnedOffer } from "@/lib/types";
import { tpl, useLang } from "@/providers/lang";
import { cx } from "@/utils/cx";

/**
 * R7-11 — "Take to the viewing · appendix C". Lives after §7 in the unlocked
 * document and prints as the report's last page. The items are engine-emitted
 * (one per flag + per missing-document gap; the LLM phrases, never invents)
 * and arrive from GET /api/r/:slug/agent-checklist with this account's checked
 * state merged in — ticks persist server-side per account+report via PATCH
 * (the R7-11 contract), with an optimistic flip and revert on failure.
 * "Copy all" writes plain text with the address on top — the board's
 * "ready for WhatsApp to the agent". "Ask these in chat instead →" opens the
 * chat (OPEN_CHAT_EVENT — the dock focuses ≥1280, the sheet/overlay opens below).
 */

export function AgentChecklistSection({
    slug,
    number,
    addr,
    checklist,
    pinned,
}: {
    slug: string;
    /** Report № for the eyebrow + the copy-all header. */
    number: string;
    /** Full address line for the copy-all header ("ready for WhatsApp"). */
    addr: string;
    /** Engine-published title/outro (items arrive from the GET, checked merged). */
    checklist: Pick<AgentChecklist, "title" | "outro" | "outroStrongs">;
    /** R5-6 pinned offer — renders in the checklist header (with §1 + the PDF). */
    pinned?: PinnedOffer | null;
}) {
    const { lang, t } = useLang();
    const [items, setItems] = useState<AgentChecklistItemState[] | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        let cancelled = false;
        fetch(`/api/r/${slug}/agent-checklist`)
            .then((res) => (res.ok ? res.json() : null))
            .then((payload: { items?: AgentChecklistItemState[] } | null) => {
                if (!cancelled && payload?.items) setItems(payload.items);
            })
            .catch(() => {
                /* Mock engine cannot fail; the real-engine swap owns error copy. */
            });
        return () => {
            cancelled = true;
        };
    }, [slug]);

    const toggle = async (id: string, checked: boolean) => {
        // Optimistic flip; a failed PATCH reverts (the server is the truth).
        setItems((cur) => cur?.map((item) => (item.id === id ? { ...item, checked } : item)) ?? cur);
        try {
            const res = await fetch(`/api/r/${slug}/agent-checklist`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, checked }),
            });
            if (!res.ok) throw new Error(String(res.status));
        } catch {
            setItems((cur) => cur?.map((item) => (item.id === id ? { ...item, checked: !checked } : item)) ?? cur);
        }
    };

    const copyAll = async () => {
        if (!items) return;
        const header = tpl(t.checklist.copyHeader, { addr, n: number });
        const body = items.map((item, i) => `${i + 1}. ${item.question[lang]}`).join("\n");
        try {
            await navigator.clipboard.writeText(`${header}\n\n${body}`);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard unavailable (permissions) — no fake confirmation.
        }
    };

    return (
        <section id="agent-checklist" aria-labelledby="agent-checklist-title" className="mt-8 scroll-mt-36">
            {/* Panel head — appendix chrome (steel eyebrow + H2), Copy all on
               the right with the print note (the frame's layout). */}
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                <div className="min-w-0">
                    <p className="text-[10.5px] leading-[1.3] font-bold tracking-[0.08em] text-rsm-steel uppercase">
                        {tpl(t.checklist.eyebrow, { n: number })}
                    </p>
                    <h2 id="agent-checklist-title" className="mt-1 font-display text-xl leading-[1.25] font-medium wrap-anywhere text-rsm-midnight">
                        {checklist.title[lang]}
                    </h2>
                    {/* R5-6 — the pinned offer rides the checklist header (with
                       §1 and the PDF cover). */}
                    {pinned ? (
                        <p className="tnum mt-1 text-[12px] leading-[1.5] font-medium text-rsm-steel">
                            {tpl(t.checklist.pinnedLine, { price: formatEUR(pinned.offerPrice, lang) })}
                        </p>
                    ) : null}
                </div>
                <span className="ml-auto inline-flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => void copyAll()}
                        disabled={!items}
                        className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-bold whitespace-nowrap text-rsm-midnight shadow-[inset_0_0_0_1px_var(--color-rsm-hairline)] transition-colors duration-200 ease-rsm hover:bg-rsm-soft-sky disabled:cursor-not-allowed disabled:text-rsm-slate-50"
                    >
                        {copied ? t.checklist.copied : t.checklist.copyAll}
                    </button>
                    <span className="text-[11.5px] leading-[1.4] text-rsm-misty">{t.checklist.printNote}</span>
                </span>
            </div>

            {/* Items — real checkboxes (≥44 px targets); the 18 px square and
               the row rhythm are the frame's. Checked = midnight fill + paper
               tick (grayscale-safe, and the print appendix C draws the same
               squares as real print targets). */}
            <div className="mt-3.5 flex flex-col">
                {items ? (
                    items.map((item, i) => (
                        <div
                            key={item.id}
                            className={cx("flex items-start gap-2 border-t border-rsm-row-line py-2 pr-0.5", i === items.length - 1 && "border-b")}
                        >
                            <button
                                type="button"
                                role="checkbox"
                                aria-checked={item.checked}
                                aria-label={item.question[lang]}
                                onClick={() => void toggle(item.id, !item.checked)}
                                className="flex size-11 shrink-0 items-center justify-center"
                            >
                                <span
                                    aria-hidden
                                    className={cx(
                                        "flex size-[18px] items-center justify-center rounded-[5px] border-[1.5px] transition-colors duration-200 ease-rsm",
                                        item.checked ? "border-rsm-midnight bg-rsm-midnight text-rsm-paper" : "border-[#C4C8CA] bg-white",
                                    )}
                                >
                                    {item.checked ? <Check className="size-3" strokeWidth={3} /> : null}
                                </span>
                            </button>
                            <span className="min-w-0 flex-1 pt-1.5">
                                <span className="block text-[14px] leading-[1.45] wrap-anywhere text-rsm-midnight">
                                    <StrongText text={item.question[lang]} strongs={item.questionStrongs.map((s) => s[lang])} />
                                </span>
                                <span className="mt-0.5 block text-[11.5px] leading-[1.5] wrap-anywhere text-rsm-misty">{item.why[lang]}</span>
                            </span>
                            <DocChip label={item.answersWith[lang]} tone={item.dashed ? "gap" : "doc"} className="mt-2.5" />
                        </div>
                    ))
                ) : (
                    <p className="border-t border-rsm-row-line py-3 text-xs leading-[1.5] text-rsm-misty">{t.checklist.loading}</p>
                )}
            </div>

            {/* Outro — every question names what earned it; the chat link opens
               the dock/sheet via OPEN_CHAT_EVENT. */}
            <div className="mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs leading-[1.55] wrap-anywhere text-rsm-misty">
                <span className="min-w-0">
                    <StrongText text={checklist.outro[lang]} strongs={checklist.outroStrongs.map((s) => s[lang])} />
                </span>
                <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent(OPEN_CHAT_EVENT))}
                    className="ml-auto inline-flex min-h-11 shrink-0 items-center text-xs font-medium whitespace-nowrap text-rsm-steel underline-offset-4 hover:underline"
                >
                    {t.checklist.askInChat}
                </button>
            </div>
        </section>
    );
}
