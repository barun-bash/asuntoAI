"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LockedFlagRow } from "@/components/report/flag-card";
import type { FlagRedacted } from "@/lib/types";
import { tpl, useLang } from "@/providers/lang";
import { cx } from "@/utils/cx";

/**
 * The honest seam (R1-6): locked flag rows under a paper-gradient veil (never
 * blur — rule §6.4), the count line, and the one Neon Lime action of the screen.
 * The CTA carries the report slug so /unlock opens with this report's context.
 * Once the account owns the report, the CTA area swaps to an "open" banner —
 * the full document ships with the report slice (R7), so the veil and the
 * severity/range rows stay (§6.4 still applies; flagged in the PR).
 */
export function PaywallSeam({
    lockedFlags,
    total,
    reportSlug,
    unlocked = false,
}: {
    lockedFlags: FlagRedacted[];
    total: number;
    reportSlug: string;
    unlocked?: boolean;
}) {
    const { t } = useLang();
    const unlockHref = `/unlock?report=${reportSlug}`;

    return (
        <section aria-label={tpl(t.verdict.moreFlags, { n: lockedFlags.length })} className="relative">
            <div className="relative flex flex-col gap-3 overflow-hidden rounded-rsm-tile">
                {lockedFlags.map((flag) => (
                    <LockedFlagRow key={flag.id} flag={flag} />
                ))}
                {/* Paper gradient veil — content fades into the paper, nothing is blurred. */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-rsm-paper/0 via-rsm-paper/70 to-rsm-paper"
                />
            </div>

            {unlocked ? (
                <div className="mt-4 flex items-start gap-3 rounded-rsm-card border border-rsm-hairline bg-white p-5 shadow-rsm-sm">
                    <span className="flex size-[38px] flex-none items-center justify-center rounded-full bg-rsm-midnight text-rsm-lime">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="size-[18px]"
                            aria-hidden
                        >
                            <path d="M20 6 9 17l-5-5" />
                        </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block font-display text-lg font-medium text-rsm-midnight">{t.unlock.unlockedTitle}</span>
                        <span className="mt-1 block text-sm leading-relaxed wrap-anywhere text-rsm-charcoal">{t.unlock.unlockedBody}</span>
                    </span>
                </div>
            ) : (
                <div className="mt-4 flex flex-col items-start gap-3 rounded-rsm-card border border-rsm-hairline bg-white p-5 shadow-rsm-sm md:items-center md:text-center">
                    <h2 className="font-display text-2xl font-medium text-rsm-midnight">{tpl(t.verdict.moreFlags, { n: lockedFlags.length })}</h2>
                    <p className="max-w-xl text-sm leading-relaxed wrap-anywhere text-rsm-charcoal">{t.verdict.seamNote}</p>
                    <Link href="/r/tuomiokirkonkatu-23-b-14-tampere" className="text-sm font-medium text-rsm-steel underline-offset-4 hover:underline">
                        {t.verdict.seeSample}
                    </Link>
                    <div className="mt-1 flex w-full flex-col items-stretch gap-2 md:items-center">
                        <Link
                            href={unlockHref}
                            className={cx(
                                "inline-flex min-h-12 items-center justify-center rounded-full bg-rsm-lime px-6 text-base font-bold text-rsm-midnight",
                                "shadow-rsm-chip transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75",
                                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rsm-steel",
                            )}
                        >
                            {t.verdict.unlock}
                        </Link>
                        <p className="text-xs text-rsm-misty">{t.verdict.unlockNote}</p>
                    </div>
                </div>
            )}
            <span className="sr-only">{total}</span>
        </section>
    );
}

/**
 * Sticky unlock bar (R1-7, ≤767 only): docks in the thumb zone once the seam
 * scrolls past. Rendered only on mobile via CSS; the observer toggles visibility.
 */
export function StickyUnlockBar({ anchorId, reportSlug }: { anchorId: string; reportSlug: string }) {
    const { t } = useLang();
    const [visible, setVisible] = useState(false);
    const observed = useRef(false);

    useEffect(() => {
        const anchor = document.getElementById(anchorId);
        if (!anchor || observed.current) return;
        observed.current = true;
        const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0), {
            threshold: 0,
        });
        observer.observe(anchor);
        return () => observer.disconnect();
    }, [anchorId]);

    return (
        <div
            aria-hidden={!visible}
            className={cx(
                "fixed inset-x-0 bottom-0 z-40 border-t border-rsm-hairline bg-rsm-paper p-3 transition-transform duration-250 ease-rsm md:hidden",
                visible ? "translate-y-0" : "translate-y-full",
            )}
        >
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <div className="tnum truncate text-sm font-bold text-rsm-midnight">{t.verdict.unlockBar}</div>
                    <div className="truncate text-xs text-rsm-misty">{t.verdict.unlockNoteShort}</div>
                </div>
                <Link
                    href={`/unlock?report=${reportSlug}`}
                    tabIndex={visible ? 0 : -1}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-rsm-lime px-5 text-sm font-bold text-rsm-midnight transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75"
                >
                    {t.verdict.unlockShort}
                </Link>
            </div>
        </div>
    );
}
