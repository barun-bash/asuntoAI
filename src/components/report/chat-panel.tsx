"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, MessageSmileCircle, XClose } from "@untitledui/icons";
import { StrongText } from "@/components/report/report-document";
import type { ChatResponse } from "@/lib/types";
import { CHAT_TURN_CAP } from "@/lib/types";
import { tpl, useLang } from "@/providers/lang";
import { cx } from "@/utils/cx";

/**
 * "Ask this report" (R7-1…R7-8) — one chat, three presentations:
 * ≥1280 a docked 380 px panel beside the document (R7-1); 768–1279 a bottom
 * rail with an inline input that opens a right overlay panel (R7-7/8: 380 px,
 * Deep Midnight 28 % scrim, 240 ms slide, Esc closes and returns focus to the
 * rail input, the document keeps its scroll); ≤767 a bottom bar opening an
 * 85 % sheet (R7-3). Answers come from POST /api/r/:slug/chat — grounded,
 * cited, capped at 15 turns per report per run with the count always visible;
 * at 0 the input disables ("Question limit reached") and the exhausted card
 * shows (R7-4). Suggestion chips disappear at 0.
 */

const YOUR_FIGURE_KEY = "resimator:your-figure:v1";

export interface YourFigure {
    display: string;
    note: string;
}

/** Reads a previously supplied user figure (chat what-if) for §4's dashed card. */
export function readYourFigure(): YourFigure | null {
    try {
        const raw = window.localStorage.getItem(YOUR_FIGURE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<YourFigure>;
        return typeof parsed.display === "string" && typeof parsed.note === "string" ? { display: parsed.display, note: parsed.note } : null;
    } catch {
        return null;
    }
}

interface ChatMessage {
    role: "user" | "answer";
    text: string;
    strongs?: string[];
    citations?: { section: string; anchor: string }[];
}

interface ChatState {
    messages: ChatMessage[];
    turnsLeft: number;
    pending: boolean;
    send: (q: string) => Promise<void>;
}

function useChat(slug: string, initialTurnsLeft: number, onYourFigure: (figure: YourFigure) => void): ChatState {
    const { lang, t } = useLang();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [turnsLeft, setTurnsLeft] = useState(initialTurnsLeft);
    const [pending, setPending] = useState(false);

    const send = async (q: string) => {
        const question = q.trim();
        if (!question || pending || turnsLeft <= 0) return;
        setMessages((m) => [...m, { role: "user", text: question }]);
        setPending(true);
        try {
            const res = await fetch(`/api/r/${slug}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ q: question, lang }),
            });
            if (res.ok) {
                const data = (await res.json()) as ChatResponse;
                setTurnsLeft(data.turnsLeft);
                if (data.answer) {
                    setMessages((m) => [...m, { role: "answer", text: data.answer!, strongs: data.strongs, citations: data.citations }]);
                }
                // The what-if published the user's figure — §4's dashed card
                // (shown, never used) appears and persists locally.
                if (data.yourFigure) {
                    onYourFigure(data.yourFigure);
                    try {
                        window.localStorage.setItem(YOUR_FIGURE_KEY, JSON.stringify(data.yourFigure));
                    } catch {
                        // Storage unavailable — the card just won't persist.
                    }
                }
            } else {
                // Network/permission failure — honest, and the turn is not counted.
                setMessages((m) => [...m, { role: "answer", text: t.chat.error }]);
            }
        } catch {
            setMessages((m) => [...m, { role: "answer", text: t.chat.error }]);
        }
        setPending(false);
    };

    return { messages, turnsLeft, pending, send };
}

/* ── Citation chip → scrolls the document to the section; the panel stays
   open (R7-8 annotation). Slightly taller than the frame on touch (≥44 px). ── */
function CitationChip({ section, anchor }: { section: string; anchor: string }) {
    return (
        <button
            type="button"
            onClick={() => document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="inline-flex min-h-8 items-center rounded-full bg-rsm-soft-sky px-2.5 text-[10px] leading-none font-bold text-rsm-steel transition-colors duration-200 ease-rsm hover:bg-rsm-steel-25 md:min-h-6"
        >
            {section}
        </button>
    );
}

/* ── The shared panel surface: header (title + live count), scrollable body
   (intro + suggestion chips | conversation | exhausted card), input footer. ── */
function ChatSurface({ chat, onClose, autoFocus }: { chat: ChatState; onClose?: () => void; autoFocus?: boolean }) {
    const { t } = useLang();
    const [draft, setDraft] = useState("");
    const bodyRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const { messages, turnsLeft, pending, send } = chat;
    const exhausted = turnsLeft <= 0;

    useEffect(() => {
        const el = bodyRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages]);

    useEffect(() => {
        if (autoFocus) inputRef.current?.focus();
    }, [autoFocus]);

    const submit = () => {
        const q = draft.trim();
        if (!q) return;
        setDraft("");
        void send(q);
    };

    const email = "hello@resimator.fi";
    const exhaustedParts = tpl(t.chat.exhausted, { email }).split(email);

    return (
        <div className="flex h-full flex-col bg-white">
            {/* Header — the count is always visible; coral at 0 (R7-4). */}
            <div className="flex items-center gap-2.5 border-b border-rsm-row-line px-5 py-3.5">
                <span aria-hidden className="flex size-[30px] shrink-0 items-center justify-center rounded-[9px] bg-rsm-midnight text-rsm-lime">
                    <MessageSmileCircle className="size-[15px]" />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block font-display text-[15px] leading-[1.25] font-medium text-rsm-midnight">{t.chat.title}</span>
                    <span className={cx("tnum block text-[11px] leading-[1.4]", exhausted ? "text-rsm-coral-deep" : "text-rsm-misty")}>
                        {turnsLeft >= CHAT_TURN_CAP
                            ? tpl(t.chat.countFresh, { n: turnsLeft, total: CHAT_TURN_CAP })
                            : tpl(t.chat.count, { n: turnsLeft, total: CHAT_TURN_CAP })}
                    </span>
                </span>
                {onClose ? (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t.chat.close}
                        className="flex size-11 shrink-0 items-center justify-center rounded-rsm-input text-rsm-misty transition-colors duration-200 ease-rsm hover:text-rsm-midnight"
                    >
                        <XClose aria-hidden className="size-5" />
                    </button>
                ) : null}
            </div>

            {/* Body */}
            <div ref={bodyRef} className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-5 py-4">
                {messages.length === 0 && !exhausted ? (
                    <>
                        <p className="text-xs leading-[1.5] wrap-anywhere text-rsm-misty">{t.chat.intro}</p>
                        {(Object.keys(t.chat.suggestions) as (keyof typeof t.chat.suggestions)[]).map((key) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => void send(t.chat.suggestions[key])}
                                className="inline-flex min-h-11 items-center self-start rounded-full px-3.5 text-[12.5px] leading-[1.4] font-medium wrap-anywhere text-rsm-midnight shadow-[inset_0_0_0_1px_var(--color-rsm-hairline)] transition-colors duration-200 ease-rsm hover:bg-rsm-soft-sky"
                            >
                                {t.chat.suggestions[key]}
                            </button>
                        ))}
                    </>
                ) : (
                    messages.map((msg, i) =>
                        msg.role === "user" ? (
                            <div
                                key={i}
                                className="max-w-[85%] self-end rounded-[14px_14px_4px_14px] bg-rsm-midnight px-3.5 py-2.5 text-[13px] leading-[1.5] wrap-anywhere text-rsm-paper"
                            >
                                {msg.text}
                            </div>
                        ) : (
                            <div key={i} className="max-w-[94%] self-start rounded-[14px_14px_14px_4px] border border-rsm-hairline px-[15px] py-3">
                                <p className="text-[13px] leading-[1.6] wrap-anywhere text-rsm-charcoal">
                                    <StrongText text={msg.text} strongs={msg.strongs} />
                                </p>
                                {msg.citations && msg.citations.length > 0 ? (
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {msg.citations.map((c) => (
                                            <CitationChip key={`${c.anchor}-${c.section}`} section={c.section} anchor={c.anchor} />
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        ),
                    )
                )}
                {pending ? <p className="text-[11px] leading-[1.4] text-rsm-slate-50">…</p> : null}
                {messages.length > 0 && !exhausted ? <p className="text-[11px] leading-[1.4] wrap-anywhere text-rsm-slate-50">{t.chat.hint}</p> : null}
                {exhausted ? (
                    <div className="rounded-[10px] border border-rsm-hairline bg-rsm-editor-bg px-3.5 py-3 text-xs leading-[1.6] wrap-anywhere text-rsm-slate">
                        {exhaustedParts[0]}
                        <a href={`mailto:${email}`} className="font-medium text-rsm-steel underline-offset-4 hover:underline">
                            {email}
                        </a>
                        {exhaustedParts[1]}
                    </div>
                ) : null}
            </div>

            {/* Footer — disables rather than hides at the cap (R7-4). */}
            <div className={cx("flex items-center gap-2 border-t border-rsm-row-line px-4 py-3", exhausted && "opacity-50")}>
                <input
                    ref={inputRef}
                    type="text"
                    value={draft}
                    disabled={exhausted || pending}
                    aria-label={t.chat.inputLabel}
                    placeholder={exhausted ? t.chat.limitReached : t.chat.placeholder}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") submit();
                    }}
                    className="tnum min-h-11 min-w-0 flex-1 rounded-rsm-input border border-rsm-hairline bg-white px-3.5 text-[13px] leading-[1.4] text-rsm-midnight outline-none placeholder:text-rsm-slate-50 focus:border-rsm-steel disabled:cursor-not-allowed"
                />
                <button
                    type="button"
                    onClick={submit}
                    disabled={exhausted || pending || !draft.trim()}
                    aria-label={t.chat.send}
                    className="flex size-11 shrink-0 items-center justify-center rounded-[10px] text-rsm-midnight shadow-[inset_0_0_0_1px_var(--color-rsm-hairline)] transition-colors duration-200 ease-rsm hover:bg-rsm-soft-sky disabled:cursor-not-allowed disabled:text-rsm-slate-50"
                >
                    <ArrowUp aria-hidden className="size-[18px]" />
                </button>
            </div>
        </div>
    );
}

export function ChatPanel({ slug, initialTurnsLeft, onYourFigure }: { slug: string; initialTurnsLeft: number; onYourFigure: (figure: YourFigure) => void }) {
    const { t } = useLang();
    const chat = useChat(slug, initialTurnsLeft, onYourFigure);
    const [open, setOpen] = useState(false);
    const [visible, setVisible] = useState(false);
    const railInputRef = useRef<HTMLInputElement>(null);
    const barButtonRef = useRef<HTMLButtonElement>(null);
    const [railDraft, setRailDraft] = useState("");
    const exhausted = chat.turnsLeft <= 0;

    // 240 ms slide-in (R7-8): mount first, then flip the transform.
    useEffect(() => {
        if (open) {
            const raf = requestAnimationFrame(() => setVisible(true));
            return () => cancelAnimationFrame(raf);
        }
        setVisible(false);
    }, [open]);

    // Esc closes; focus returns to the invoking control (rail input / bar).
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") close();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const close = () => {
        setOpen(false);
        // Return focus to the rail input (tablet) or the bar button (mobile).
        if (window.matchMedia("(min-width: 768px)").matches) railInputRef.current?.focus();
        else barButtonRef.current?.focus();
    };

    const railSend = () => {
        const q = railDraft.trim();
        if (!q) return;
        setRailDraft("");
        setOpen(true);
        void chat.send(q);
    };

    return (
        <>
            {/* ≥1280 — docked 380 px panel beside the document (R7-1). */}
            <div className="sticky top-[88px] max-h-[calc(100vh-112px)] w-[380px] shrink-0 overflow-hidden rounded-[16px] border border-rsm-hairline bg-white shadow-rsm-sm max-xl:hidden">
                <ChatSurface chat={chat} />
            </div>

            {/* 768–1279 — bottom rail with inline input (R7-7); sending opens
               the right overlay panel. */}
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-rsm-hairline bg-rsm-paper/95 backdrop-blur-[8px] max-md:hidden xl:hidden">
                <div className="mx-auto flex w-full max-w-[704px] items-center gap-2.5 px-4 py-3">
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        aria-label={t.chat.open}
                        className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 text-left"
                    >
                        <span aria-hidden className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-rsm-midnight text-rsm-lime">
                            <MessageSmileCircle className="size-4" />
                        </span>
                        <span className="min-w-0">
                            <span className="block text-[13px] leading-[1.3] font-bold text-rsm-midnight">{t.chat.title}</span>
                            <span className={cx("tnum block truncate text-[10.5px] leading-[1.4]", exhausted ? "text-rsm-coral-deep" : "text-rsm-misty")}>
                                {tpl(t.chat.countTablet, { n: chat.turnsLeft, total: CHAT_TURN_CAP })}
                            </span>
                        </span>
                    </button>
                    <input
                        ref={railInputRef}
                        type="text"
                        value={railDraft}
                        disabled={exhausted || chat.pending}
                        aria-label={t.chat.inputLabel}
                        placeholder={exhausted ? t.chat.limitReached : t.chat.placeholder}
                        onChange={(e) => setRailDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") railSend();
                        }}
                        className="tnum min-h-11 w-[280px] shrink-0 rounded-[10px] border border-rsm-hairline bg-white px-3.5 text-[12.5px] leading-[1.4] text-rsm-midnight outline-none placeholder:text-rsm-slate-50 focus:border-rsm-steel disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <button
                        type="button"
                        onClick={railSend}
                        disabled={exhausted || chat.pending || !railDraft.trim()}
                        aria-label={t.chat.send}
                        className="flex size-11 shrink-0 items-center justify-center rounded-[10px] text-rsm-midnight shadow-[inset_0_0_0_1px_var(--color-rsm-hairline)] transition-colors duration-200 ease-rsm hover:bg-rsm-soft-sky disabled:cursor-not-allowed disabled:text-rsm-slate-50"
                    >
                        <ArrowUp aria-hidden className="size-[18px]" />
                    </button>
                </div>
            </div>

            {/* ≤767 — bottom bar; tap opens the 85 % sheet (R7-3). */}
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-rsm-hairline bg-rsm-paper/95 backdrop-blur-[8px] md:hidden">
                <button
                    ref={barButtonRef}
                    type="button"
                    onClick={() => setOpen(true)}
                    className="flex min-h-[58px] w-full items-center gap-2.5 px-4 py-3 text-left"
                    aria-label={t.chat.open}
                >
                    <span aria-hidden className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-rsm-midnight text-rsm-lime">
                        <MessageSmileCircle className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-[13px] leading-[1.3] font-bold text-rsm-midnight">{t.chat.title}</span>
                        <span className={cx("tnum block text-[10.5px] leading-[1.4]", exhausted ? "text-rsm-coral-deep" : "text-rsm-misty")}>
                            {tpl(t.chat.count, { n: chat.turnsLeft, total: CHAT_TURN_CAP })}
                        </span>
                    </span>
                    <ArrowUp aria-hidden className="size-4 text-rsm-misty" />
                </button>
            </div>

            {/* Overlay (tablet) / sheet (mobile) — same surface as the dock.
               Scrim Deep Midnight 28 % (board value), tap or Esc closes; the
               document behind keeps its scroll position (no body lock). */}
            {open ? (
                <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label={t.chat.title}>
                    <button
                        type="button"
                        aria-label={t.chat.close}
                        onClick={close}
                        className={cx(
                            "absolute inset-0 bg-rsm-midnight/28 transition-opacity duration-[240ms] ease-rsm",
                            visible ? "opacity-100" : "opacity-0",
                        )}
                    />
                    {/* 768–1279 — right overlay panel, 380 px, 240 ms slide (R7-8). */}
                    <div
                        className={cx(
                            "absolute inset-y-0 right-0 w-[380px] border-l border-rsm-hairline shadow-[-8px_0_24px_rgba(13,13,18,.10)] transition-transform duration-[240ms] ease-rsm max-md:hidden",
                            visible ? "translate-x-0" : "translate-x-full",
                        )}
                    >
                        <ChatSurface chat={chat} onClose={close} autoFocus />
                    </div>
                    {/* ≤767 — 85 % sheet sliding up (R7-3). */}
                    <div
                        className={cx(
                            "absolute inset-x-0 bottom-0 h-[85vh] overflow-hidden rounded-t-rsm-card border-t border-rsm-hairline shadow-rsm-stack transition-transform duration-[240ms] ease-rsm md:hidden",
                            visible ? "translate-y-0" : "translate-y-full",
                        )}
                    >
                        <ChatSurface chat={chat} onClose={close} autoFocus />
                    </div>
                </div>
            ) : null}
        </>
    );
}
