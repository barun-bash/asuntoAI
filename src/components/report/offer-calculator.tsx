"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Slider } from "@/components/base/slider/slider";
import { ProvenanceChip } from "@/components/report/provenance-chip";
import { formatEUR, formatEURSigned, formatPercent } from "@/lib/format";
import type { LocalText, OfferFlip, OfferResult, PinnedOffer } from "@/lib/types";
import { tpl, useLang } from "@/providers/lang";
import { cx } from "@/utils/cx";

/**
 * Offer-price calculator (R5-6): live re-run at your offer, honest about what
 * a price can't fix. The recompute is ENGINE work — every figure arrives from
 * POST /api/r/:slug/offer (or the server-rendered initial payload); this file
 * formats and lays out only (rule §6.2). The slider steps 500 € and re-runs on
 * release; the big number is click-to-edit for an exact figure. Flip markers:
 * seafoam FAIL→PASS, coral STAYS FAIL with the reason inline — building tests
 * are price-independent and the tool never hides it.
 *
 * Entry points: the policy fail banner's fix line (R5-1) and §7's offer link
 * (both land on #offer). Unpaid summary: the panel is visible but locked at
 * asking with the unlock seam copy; it never POSTs. Mobile: the panel opens
 * as a bottom sheet, slider full-width, flips stacked. "Pin this offer to the
 * report" persists {offerPrice, pinnedAt} server-side — §1, the PDF and the
 * checklist header render it (a router.refresh() re-reads the store).
 */

export interface OfferCalculatorProps {
    slug: string;
    /** Server-computed payload at the pinned offer (or asking) — the client
       never derives a figure before the first POST. */
    initial: OfferResult;
    askPrice: number;
    sliderMin: number;
    sliderStep: number;
    marketNote: LocalText;
    honesty: LocalText;
    initialPinned: PinnedOffer | null;
    /** false = unpaid summary: locked at asking + seam copy, no POSTs. */
    unlocked: boolean;
    /** Where the locked seam CTA points (the paywall seam anchor). */
    seamHref?: string;
}

function eurPerMonth(value: number, lang: "fi" | "en", signed = true): string {
    const base = signed ? formatEURSigned(value, lang) : formatEUR(value, lang);
    return `${base}/${lang === "fi" ? "kk" : "mo"}`;
}

/* ── Shared state — one instance for both renders (desktop panel + mobile
   sheet), so a re-run in the sheet is still there when it closes. ── */
function useOfferState({ slug, initial, askPrice, sliderMin, initialPinned, unlocked }: OfferCalculatorProps) {
    const router = useRouter();
    const [result, setResult] = useState(initial);
    const [draft, setDraft] = useState<number | null>(null);
    const [busy, setBusy] = useState(false);
    const [failed, setFailed] = useState(false);
    const [pinned, setPinned] = useState<PinnedOffer | null>(initialPinned);
    const [pinning, setPinning] = useState(false);
    const requestSeq = useRef(0);

    const rerun = async (price: number) => {
        if (!unlocked) return;
        const seq = ++requestSeq.current;
        setBusy(true);
        setFailed(false);
        try {
            const res = await fetch(`/api/r/${slug}/offer`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ price }),
            });
            if (!res.ok) throw new Error(String(res.status));
            const next = (await res.json()) as OfferResult;
            if (seq === requestSeq.current) setResult(next);
        } catch {
            if (seq === requestSeq.current) setFailed(true);
        } finally {
            if (seq === requestSeq.current) setBusy(false);
        }
    };

    const commitTyped = (raw: string) => {
        const digits = Number(raw.replace(/[^\d]/g, ""));
        if (!Number.isFinite(digits) || digits <= 0) return;
        const clamped = Math.min(askPrice, Math.max(sliderMin, digits)); // input bounds, not arithmetic on figures
        void rerun(clamped);
    };

    const pin = async () => {
        setPinning(true);
        try {
            const res = await fetch(`/api/r/${slug}/offer/pin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ price: result.price }),
            });
            if (!res.ok) throw new Error(String(res.status));
            const payload = (await res.json()) as { pinnedOffer: PinnedOffer };
            setPinned(payload.pinnedOffer);
            router.refresh(); // §1, the PDF and the checklist header read the pin server-side
        } catch {
            setFailed(true);
        } finally {
            setPinning(false);
        }
    };

    return {
        result,
        draft,
        setDraft,
        busy,
        failed,
        pinned,
        pinning,
        rerun,
        commitTyped,
        pin,
        isPinnedHere: pinned?.offerPrice === result.price,
    };
}

type OfferState = ReturnType<typeof useOfferState>;

/* ── One flip-list row: chip + label + reason/fix inline ── */
function FlipRow({ flip }: { flip: OfferFlip }) {
    const { lang, t } = useLang();
    const flipChip = flip.kind === "flip";
    const label = flip.key === "cashFlowBase" ? t.offer.flipLabelCashflow : flip.key === "liabilityShare" ? t.offer.flipLabelLiability : t.offer.flipLabelGrade;
    const detail =
        flip.key === "cashFlowBase"
            ? flip.fixablePrice
                ? tpl(t.offer.flipFixLine, { price: formatEUR(flip.fixablePrice, lang) })
                : ""
            : flip.key === "liabilityShare"
              ? tpl(t.offer.staysLiability, { transition: `${formatPercent(flip.from ?? 0, lang)} → ${formatPercent(flip.to ?? 0, lang)}` })
              : t.offer.staysGrade;

    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-rsm-row-line px-1 py-2.5 last:border-b-0">
            <span
                className={cx(
                    "inline-flex shrink-0 items-center rounded-full px-2.5 py-[3px] text-[9.5px] leading-[1.3] font-bold tracking-[0.05em] uppercase",
                    flipChip ? "bg-rsm-seafoam-25 text-rsm-seafoam-deep" : "bg-rsm-coral-25 text-rsm-coral-deep",
                )}
            >
                {flipChip ? t.offer.flipChip : t.offer.staysChip}
            </span>
            <span className="min-w-40 flex-1 text-[13px] leading-[1.45] font-medium wrap-anywhere text-rsm-midnight">{label}</span>
            <span className="tnum text-[12px] leading-[1.5] wrap-anywhere text-rsm-slate">{detail}</span>
        </div>
    );
}

/* ── The panel body — shared by the desktop inline panel and the mobile sheet ── */
function OfferPanel({ props, state, idSuffix }: { props: OfferCalculatorProps; state: OfferState; idSuffix: string }) {
    const { lang, t } = useLang();
    const { askPrice, sliderMin, sliderStep, marketNote, honesty, unlocked, seamHref } = props;
    const { result, draft, setDraft, busy, failed, pinning, rerun, commitTyped, pin, isPinnedHere } = state;
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState("");
    const editRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editing) editRef.current?.select();
    }, [editing]);

    const shown = draft ?? result.price;
    const shownDisplay = draft != null ? formatEUR(draft, lang) : result.priceDisplay;
    const stats = [
        { label: t.offer.statDebtFree, value: formatEUR(result.debtFree, lang), note: null as string | null },
        {
            label: t.offer.statSqm,
            value: `${formatEUR(result.sqm, lang)}/m²`,
            note: tpl(t.offer.sqmVsMedian, { pct: formatPercent(Math.abs(result.pctVsMedian), lang) }),
        },
        {
            label: t.offer.statGross,
            value: result.atAsking
                ? formatPercent(result.gross.to, lang)
                : `${formatPercent(result.gross.from, lang)} → ${formatPercent(result.gross.to, lang)}`,
            note: null,
        },
        {
            label: t.offer.statReal,
            value: result.atAsking ? formatPercent(result.real.to, lang) : `${formatPercent(result.real.from, lang)} → ${formatPercent(result.real.to, lang)}`,
            note: null,
        },
        {
            label: t.offer.statCashFlow,
            value: result.atAsking
                ? eurPerMonth(result.cashFlow.to, lang)
                : `${eurPerMonth(result.cashFlow.from, lang)} → ${eurPerMonth(result.cashFlow.to, lang)}`,
            note: null,
        },
        { label: t.offer.statCashNeeded, value: formatEUR(result.cashNeeded, lang), note: null },
    ];

    return (
        <div className="flex flex-col gap-5 rounded-rsm-card border border-rsm-hairline bg-white p-4 shadow-rsm-sm md:p-6 xl:p-8">
            {/* Header: kicker + the offer-priced heading + the MODELLED market note. */}
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                <div className="min-w-0">
                    <p className="text-[10.5px] font-bold tracking-[0.09em] text-rsm-steel uppercase">{t.offer.kicker}</p>
                    <h2 id={`offer-title${idSuffix}`} className="mt-1 font-display text-xl font-medium wrap-anywhere text-rsm-midnight md:text-2xl">
                        {tpl(t.offer.heading, { price: shownDisplay })}
                    </h2>
                </div>
                <p className="ml-auto flex items-center gap-1.5 text-[11.5px] leading-[1.5] wrap-anywhere text-rsm-misty">
                    <span>{marketNote[lang]}</span>
                    <ProvenanceChip basis="MODELLED" />
                </p>
            </div>

            {/* Big number (click-to-edit) + vs-asking line. */}
            <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
                {editing && unlocked ? (
                    <input
                        ref={editRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => {
                            setEditing(false);
                            commitTyped(editValue);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                setEditing(false);
                                commitTyped(editValue);
                            }
                            if (e.key === "Escape") setEditing(false);
                        }}
                        inputMode="numeric"
                        aria-label={t.offer.editPrice}
                        className="tnum w-56 rounded-rsm-input border border-rsm-steel bg-white px-3 py-1.5 font-display text-4xl leading-none font-medium text-rsm-midnight outline-none"
                    />
                ) : (
                    <button
                        type="button"
                        disabled={!unlocked}
                        aria-label={unlocked ? t.offer.editPrice : undefined}
                        onClick={() => {
                            setEditValue(String(result.price));
                            setEditing(true);
                        }}
                        className={cx(
                            "tnum inline-flex min-h-11 items-center font-display text-[42px] leading-none font-medium text-rsm-midnight",
                            unlocked &&
                                "underline decoration-rsm-hairline decoration-2 underline-offset-8 transition-colors duration-200 ease-rsm hover:decoration-rsm-steel",
                        )}
                    >
                        {shownDisplay}
                    </button>
                )}
                <span className="tnum pb-1 text-[12.5px] font-medium text-rsm-slate">
                    {tpl(t.offer.vsAsking, { pct: formatPercent(result.vsAskingPct, lang) })}
                </span>
            </div>

            {/* Slider — 500 € steps, re-run on release; locked at asking unpaid. */}
            <div className={cx("offer-slider", !unlocked && "pointer-events-none opacity-60")}>
                <Slider
                    aria-label={t.offer.sliderLabel}
                    minValue={sliderMin}
                    maxValue={askPrice}
                    step={sliderStep}
                    isDisabled={!unlocked}
                    value={shown}
                    onChange={(v) => setDraft(v as number)}
                    onChangeEnd={(v) => {
                        setDraft(null);
                        void rerun(v as number);
                    }}
                    formatOptions={{ style: "decimal", maximumFractionDigits: 0 }}
                    labelFormatter={(v) => formatEUR(v, lang)}
                />
                <div className="tnum mt-1 flex justify-between text-[11px] font-medium text-rsm-misty">
                    <span>{formatEUR(sliderMin, lang)}</span>
                    <span>{tpl(t.offer.sliderAsking, { price: formatEUR(askPrice, lang) })}</span>
                </div>
            </div>

            {/* Derived stats — engine-computed at the offer, transitions from asking. */}
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6" aria-busy={busy}>
                {stats.map((stat) => (
                    <div key={stat.label} className="rounded-rsm-input border border-rsm-hairline bg-white px-3.5 py-3">
                        <div className="text-[9.5px] leading-[1.3] font-bold tracking-[0.05em] wrap-anywhere text-rsm-misty uppercase">{stat.label}</div>
                        <div className="tnum mt-1 font-display text-[15px] leading-[1.3] font-medium wrap-anywhere text-rsm-midnight">{stat.value}</div>
                        {stat.note ? <div className="tnum mt-0.5 text-[10.5px] leading-[1.4] text-rsm-misty">{stat.note}</div> : null}
                    </div>
                ))}
            </div>

            {/* Verdict at this offer — the re-run answers the user's action:
               aria-live assertive, the policy banner's precedent (a11y §11). */}
            <p aria-live="assertive" aria-atomic="true" className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                <span
                    className={cx(
                        "font-display text-[17px] leading-[1.3] font-medium",
                        result.verdict.passing ? "text-rsm-seafoam-deep" : "text-rsm-coral-deep",
                    )}
                >
                    {result.verdict.passing ? t.offer.passingAtOffer : t.offer.stillNotPassing}
                </span>
                <span className="tnum text-[12.5px] font-medium text-rsm-slate">
                    {result.verdict.passing
                        ? tpl(t.offer.passMeta, { total: result.verdict.total, was: result.verdict.wasFailCount })
                        : tpl(t.offer.failMeta, { n: result.verdict.failCount, total: result.verdict.total, was: result.verdict.wasFailCount })}
                </span>
            </p>

            {/* Flip list — what this offer moves, and what it never will. */}
            <div className="flex flex-col border-t border-rsm-hairline">
                {result.flips.map((flip) => (
                    <FlipRow key={flip.key} flip={flip} />
                ))}
            </div>

            {/* Pin / seam. */}
            {unlocked ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    <button
                        type="button"
                        onClick={() => void pin()}
                        disabled={pinning || isPinnedHere}
                        className={cx(
                            "inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-bold transition-colors duration-200 ease-rsm",
                            isPinnedHere
                                ? "bg-rsm-midnight text-rsm-lime"
                                : "text-rsm-midnight shadow-[inset_0_0_0_1px_var(--color-rsm-hairline)] hover:shadow-[inset_0_0_0_1px_var(--color-rsm-steel)] disabled:opacity-60",
                        )}
                    >
                        {isPinnedHere ? t.offer.pinned : pinning ? t.offer.pinning : t.offer.pin}
                    </button>
                    <span className="text-[11.5px] leading-[1.5] wrap-anywhere text-rsm-misty">{t.offer.pinNote}</span>
                </div>
            ) : (
                <div className="flex flex-wrap items-center gap-4 rounded-rsm-tile border border-l-4 border-rsm-hairline border-l-rsm-steel bg-rsm-editor-bg px-5 py-4">
                    <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] leading-[1.45] font-bold wrap-anywhere text-rsm-midnight">{t.offer.lockedTitle}</p>
                        <p className="mt-0.5 text-[12.5px] leading-[1.55] wrap-anywhere text-rsm-slate">{t.offer.lockedBody}</p>
                    </div>
                    <a
                        href={seamHref ?? "#paywall-seam"}
                        className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-rsm-lime px-5 text-sm font-bold text-rsm-midnight transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75"
                    >
                        {t.offer.lockedCta}
                    </a>
                </div>
            )}

            {failed ? <p className="text-[12px] font-medium text-rsm-coral-deep">{t.offer.error}</p> : null}

            {/* The honesty paragraph — engine prose from the fixture. */}
            <p className="text-[11.5px] leading-[1.6] wrap-anywhere text-rsm-misty">{honesty[lang]}</p>
        </div>
    );
}

export function OfferCalculator(props: OfferCalculatorProps) {
    const { t } = useLang();
    const [sheetOpen, setSheetOpen] = useState(false);
    const state = useOfferState(props);

    return (
        <section id="offer" aria-labelledby="offer-title" className="scroll-mt-36">
            {/* ≥768 — the inline panel. */}
            <div className="max-md:hidden">
                <OfferPanel props={props} state={state} idSuffix="" />
            </div>

            {/* ≤767 — collapsed card opening the bottom sheet (R5-6 mobile:
               bottom-sheet, slider full-width, flips stack). */}
            <div className="md:hidden">
                {sheetOpen ? (
                    <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true" aria-label={t.offer.title}>
                        <button type="button" aria-label={t.common.close} onClick={() => setSheetOpen(false)} className="absolute inset-0 bg-rsm-midnight/40" />
                        <div
                            autoFocus
                            tabIndex={-1}
                            className="relative flex max-h-[92dvh] w-full flex-col overflow-y-auto rounded-t-rsm-card bg-rsm-paper p-3 pb-8 outline-none"
                            onKeyDown={(e) => {
                                if (e.key === "Escape") setSheetOpen(false);
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => setSheetOpen(false)}
                                className="mb-2 inline-flex min-h-11 items-center self-end rounded-full px-3 text-[13px] font-medium text-rsm-steel underline-offset-4 hover:underline"
                            >
                                {t.common.close}
                            </button>
                            <OfferPanel props={props} state={state} idSuffix="-sheet" />
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 rounded-rsm-card border border-rsm-hairline bg-white p-4 shadow-rsm-sm">
                        <div className="min-w-0 flex-1">
                            <p className="text-[10.5px] font-bold tracking-[0.09em] text-rsm-steel uppercase">{t.offer.title}</p>
                            <p className="mt-1 text-[13px] leading-[1.45] font-medium wrap-anywhere text-rsm-midnight">
                                {tpl(t.offer.heading, { price: props.initial.priceDisplay })}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSheetOpen(true)}
                            aria-haspopup="dialog"
                            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full px-4 text-sm font-bold whitespace-nowrap text-rsm-midnight shadow-[inset_0_0_0_1px_var(--color-rsm-hairline)] transition-colors duration-200 ease-rsm hover:shadow-[inset_0_0_0_1px_var(--color-rsm-steel)]"
                        >
                            {t.offer.openCta}
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
