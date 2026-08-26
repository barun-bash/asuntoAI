"use client";

import { useCallback, useEffect, useState } from "react";
import { tpl, useLang } from "@/providers/lang";
import { cx } from "@/utils/cx";

/** Guests persist here; accounts persist server-side via /api/account/onboarding. */
const STORAGE_KEY = "asunto:onboarding-seen";
const STEP_KEYS = ["provenance", "citation", "policy"] as const;
type StepKey = (typeof STEP_KEYS)[number];

interface TipPosition {
    top: number;
    left: number;
    notchLeft: number;
}

/**
 * R15-2/3 — first-run onboarding: three anchored tips (provenance chip →
 * citation block → policy pills) on the first verdict this account/browser
 * OWNS. Never mounted on shared/visitor /r/ pages (the server gates the prop).
 *
 * Anatomy (R15-2 frame): not a modal — the page stays scrollable, non-target
 * sheet sections dim to 45 % (CSS on [data-onboarding-sheet]), the target gets
 * a 3 px steel halo, the tip card anchors below with a notch; ≥768 it tracks
 * its anchor exactly, ≤767 it docks as a bottom card with the halo unchanged
 * (R15-3 annotation). Esc or Skip ends all three; Next advances; scroll-past
 * never dismisses; the seen flag is set on skip OR finish.
 */
export function OnboardingTips({ enabled, seenOnAccount, hasAccount }: { enabled: boolean; seenOnAccount: boolean; hasAccount: boolean }) {
    const { t } = useLang();
    const [step, setStep] = useState<number | null>(null);
    const [pos, setPos] = useState<TipPosition | null>(null);

    const tips = [
        { key: "provenance" as StepKey, title: t.onboarding.tip1Title, body: t.onboarding.tip1Body },
        { key: "citation" as StepKey, title: t.onboarding.tip2Title, body: t.onboarding.tip2Body },
        { key: "policy" as StepKey, title: t.onboarding.tip3Title, body: t.onboarding.tip3Body },
    ];

    const finish = useCallback(() => {
        setStep(null);
        try {
            window.localStorage.setItem(STORAGE_KEY, "1");
        } catch {
            /* private mode — the account flag still persists server-side */
        }
        if (hasAccount) {
            // Guests get 401 by design — their flag lives in localStorage only.
            void fetch("/api/account/onboarding", { method: "POST" }).catch(() => undefined);
        }
    }, [hasAccount]);

    // Fire once ever: account flag (server) or the guest localStorage fallback.
    useEffect(() => {
        if (!enabled || seenOnAccount) return;
        let seen = false;
        try {
            seen = !!window.localStorage.getItem(STORAGE_KEY);
        } catch {
            seen = false;
        }
        if (!seen) setStep(0);
    }, [enabled, seenOnAccount]);

    // Anchor the current tip: halo the target, dim the rest, position the card.
    useEffect(() => {
        if (step === null) return;
        const key = STEP_KEYS[step];
        const sheet = document.querySelector<HTMLElement>("[data-onboarding-sheet]");
        const target = sheet?.querySelector<HTMLElement>(`[data-onboarding="${key}"]`) ?? null;
        /* Graceful fallback: if this tip's anchor isn't rendered (a layout that
           drops the policy panel, a zero-size element), skip ahead to the next
           anchor instead of stranding a tip with nothing to point at. */
        if (!sheet || !target || target.getBoundingClientRect().width === 0) {
            setStep(step + 1 < STEP_KEYS.length ? step + 1 : null);
            if (step + 1 >= STEP_KEYS.length) finish();
            return;
        }

        /* Later anchors sit below the fold — bring the target to center on each
           step change so the card never strands off-screen (instant under
           prefers-reduced-motion). The card's coordinates are document-based,
           so the glide doesn't invalidate them. */
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        target.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });

        sheet.setAttribute("data-onboarding-step", key);
        target.classList.add("onboarding-halo");

        const place = () => {
            const rect = target.getBoundingClientRect();
            const cardWidth = Math.min(330, window.innerWidth - 32);
            const docLeft = rect.left + window.scrollX;
            const left = Math.max(16, Math.min(docLeft + 44, document.documentElement.clientWidth - cardWidth - 16));
            const notchLeft = Math.max(16, Math.min(26 + (docLeft - left), cardWidth - 26));
            setPos({ top: rect.bottom + window.scrollY + 10, left, notchLeft });
        };
        place();
        window.addEventListener("resize", place);
        return () => {
            window.removeEventListener("resize", place);
            sheet.removeAttribute("data-onboarding-step");
            target.classList.remove("onboarding-halo");
        };
    }, [step, finish]);

    /* While a tip runs, mark the document: the mobile StickyUnlockBar (z-40,
       later in DOM) would paint over the bottom-docked tip card, so CSS hides
       it for the sequence (resimator.css). */
    useEffect(() => {
        const root = document.documentElement;
        if (step === null) {
            root.removeAttribute("data-onboarding-active");
            return;
        }
        root.setAttribute("data-onboarding-active", "true");
        return () => root.removeAttribute("data-onboarding-active");
    }, [step]);

    // Esc ends the whole sequence (R15-2 annotation).
    useEffect(() => {
        if (step === null) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") finish();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [step, finish]);

    if (step === null) return null;
    const tip = tips[step];

    const footer = (
        <div className="mt-[11px] flex items-center gap-2.5">
            <span aria-hidden className="flex gap-1">
                {STEP_KEYS.map((_, i) => (
                    <span key={i} className={cx("size-1.5 rounded-full", i === step ? "bg-rsm-midnight" : "bg-rsm-slate-25")} />
                ))}
            </span>
            <span className="tnum text-[11px] leading-[1.4] text-rsm-slate-50">{tpl(t.onboarding.stepOf, { n: step + 1 })}</span>
            <span className="ml-auto flex items-center gap-3">
                <button
                    type="button"
                    onClick={finish}
                    className="inline-flex min-h-11 items-center px-1 text-xs font-medium text-rsm-misty underline-offset-4 hover:text-rsm-midnight hover:underline md:min-h-8"
                >
                    {t.onboarding.skip}
                </button>
                <button
                    type="button"
                    onClick={() => (step + 1 < STEP_KEYS.length ? setStep(step + 1) : finish())}
                    className={cx(
                        "inline-flex min-h-11 min-w-20 items-center justify-center rounded-full px-4 text-xs font-bold text-rsm-midnight md:min-h-8",
                        "shadow-[inset_0_0_0_1.5px_var(--color-rsm-hairline)] transition-colors duration-200 ease-rsm hover:shadow-[inset_0_0_0_1.5px_var(--color-rsm-steel-50)]",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rsm-steel",
                    )}
                >
                    {t.onboarding.next}
                </button>
            </span>
        </div>
    );

    const cardBody = (
        <>
            <p className="font-display text-[14.5px] leading-[1.3] font-medium text-rsm-midnight">{tip.title}</p>
            <p className="mt-[5px] text-[12.5px] leading-[1.55] font-medium wrap-anywhere text-rsm-charcoal">{tip.body}</p>
            {footer}
        </>
    );

    return (
        <>
            {/* ≥768: the card anchors below its target with a notch (R15-2). */}
            <div
                role="group"
                aria-label={t.onboarding.ariaLabel}
                style={pos ? { top: pos.top, left: pos.left, width: 330, maxWidth: "calc(100vw - 32px)" } : undefined}
                className={cx(
                    "absolute z-40 hidden rounded-xl border-[1.5px] border-rsm-steel bg-white p-[14px_16px] shadow-[0_4px_14px_rgba(13,13,18,0.10)] md:block",
                    !pos && "invisible",
                )}
            >
                <span
                    aria-hidden
                    style={pos ? { left: pos.notchLeft } : undefined}
                    className="absolute -top-[5.5px] size-2.5 rotate-45 border-t-[1.5px] border-l-[1.5px] border-rsm-steel bg-white"
                />
                {cardBody}
            </div>
            {/* ≤767: the tip docks as a bottom card; the halo is unchanged (R15-2). */}
            <div
                role="group"
                aria-label={t.onboarding.ariaLabel}
                className="fixed inset-x-4 bottom-4 z-40 rounded-xl border-[1.5px] border-rsm-steel bg-white p-[14px_16px] shadow-[0_4px_14px_rgba(13,13,18,0.10)] md:hidden"
                style={{ paddingBottom: "max(14px, env(safe-area-inset-bottom))" }}
            >
                {cardBody}
            </div>
        </>
    );
}
