"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AccountTopBar } from "@/components/account/account-top-bar";
import { Toggle } from "@/components/base/toggle/toggle";
import { maskEmail } from "@/lib/format";
import type { DigestMode, NotificationPrefs, NotificationPrefsPatch } from "@/lib/types";
import { tpl, useLang } from "@/providers/lang";
import { cx } from "@/utils/cx";

/**
 * Notification settings (R14-1 / R14-2 tablet): four category toggles, the
 * shared digest rule for tracking & watch, and the transactional row that
 * honestly can't be turned off. Toggles autosave (PATCH), "saved ✓" pulses
 * 1.2 s with aria-live polite (R14 annotation). List-Unsubscribe in any email
 * flips exactly its category here (backend wires the header link; the per-
 * object mutes — Stop tracking on R12, Stop watching on R10-5 — live on their
 * objects; this page only links their counts).
 */
export function NotificationsView({
    email,
    balance,
    initial,
    trackedCount,
    watchDistrict,
}: {
    email: string;
    balance: number;
    initial: NotificationPrefs;
    trackedCount: number;
    watchDistrict: string | undefined;
}) {
    const { t } = useLang();
    const [prefs, setPrefs] = useState(initial);
    const [savedPulse, setSavedPulse] = useState(false);
    const [saveError, setSaveError] = useState(false);
    const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    async function save(patch: NotificationPrefsPatch) {
        setSaveError(false);
        try {
            const res = await fetch("/api/account/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patch),
            });
            if (!res.ok) throw new Error(String(res.status));
            setPrefs((await res.json()) as NotificationPrefs);
            // "saved ✓" pulses 1.2 s (R14 annotation), announced politely.
            if (pulseTimer.current) clearTimeout(pulseTimer.current);
            setSavedPulse(true);
            pulseTimer.current = setTimeout(() => setSavedPulse(false), 1200);
        } catch {
            setSaveError(true);
        }
    }

    function toggleCategory(key: "tracking" | "watch" | "analysisDone" | "productNews", on: boolean) {
        if (key === "tracking" || key === "watch") {
            const next = { ...prefs, [key]: { ...prefs[key], on } };
            setPrefs(next);
            void save({ [key]: { on, digest: prefs[key].digest } });
        } else {
            setPrefs({ ...prefs, [key]: on });
            void save({ [key]: on });
        }
    }

    function setDigest(digest: DigestMode) {
        setPrefs({ ...prefs, tracking: { ...prefs.tracking, digest }, watch: { ...prefs.watch, digest } });
        void save({ tracking: { digest }, watch: { digest } });
    }

    const rows: { key: "tracking" | "watch" | "analysisDone" | "productNews"; title: string; desc: string; on: boolean; tail?: React.ReactNode }[] = [
        {
            key: "tracking",
            title: t.notifications.tracking,
            desc: t.notifications.trackingDesc,
            on: prefs.tracking.on,
            tail: (
                <Link href="/reports" className="text-[12.5px] font-medium text-rsm-steel underline underline-offset-2">
                    {tpl(t.notifications.trackingCount, { n: trackedCount })}
                </Link>
            ),
        },
        {
            key: "watch",
            title: t.notifications.watch,
            desc: t.notifications.watchDesc,
            on: prefs.watch.on,
            tail: (
                <Link href="/reports" className="text-[12.5px] font-medium text-rsm-steel underline underline-offset-2">
                    {watchDistrict ? tpl(t.notifications.watchEdit, { district: watchDistrict }) : t.notifications.watchNone}
                </Link>
            ),
        },
        { key: "analysisDone", title: t.notifications.analysisDone, desc: t.notifications.analysisDoneDesc, on: prefs.analysisDone },
        {
            key: "productNews",
            title: t.notifications.productNews,
            desc: t.notifications.productNewsDesc,
            on: prefs.productNews,
            tail: !prefs.productNews ? (
                <span className="text-[12.5px] leading-[1.5] wrap-anywhere text-rsm-slate">{t.notifications.productNewsOff}</span>
            ) : undefined,
        },
    ];

    return (
        <div className="rsm-toggle min-h-dvh">
            <AccountTopBar balance={balance} email={email} />
            <main className="mx-auto w-full max-w-[704px] px-4 pt-4 pb-20">
                <h1 className="font-display text-3xl font-medium text-rsm-midnight">{t.notifications.title}</h1>
                <p className="mt-1.5 text-[13.5px] text-rsm-slate">
                    {maskEmail(email)}
                    <span
                        aria-live="polite"
                        className={cx("tnum transition-opacity duration-200", savedPulse ? "text-rsm-seafoam-deep opacity-100" : "opacity-0")}
                    >
                        {" · "}
                        {t.notifications.saved}
                    </span>
                    {saveError ? (
                        <span role="alert" className="text-rsm-coral-deep">
                            {" · "}
                            {t.notifications.saveError}
                        </span>
                    ) : null}
                </p>

                <div className="mt-6 flex flex-col divide-y divide-rsm-row-line border-y border-rsm-row-line">
                    {rows.map((row) => (
                        <div key={row.key} className="flex items-start justify-between gap-4 py-4">
                            <div className="min-w-0">
                                <h2 className="text-[15px] font-bold text-rsm-midnight">{row.title}</h2>
                                <p className="mt-1 text-[13px] leading-[1.55] wrap-anywhere text-rsm-charcoal">{row.desc}</p>
                                {row.tail ? <div className="mt-1.5">{row.tail}</div> : null}
                            </div>
                            <span className="pt-0.5">
                                <Toggle size="md" isSelected={row.on} onChange={(on) => toggleCategory(row.key, on)} aria-label={row.title} />
                            </span>
                        </div>
                    ))}
                </div>

                <fieldset className="mt-6">
                    <legend className="text-[15px] font-bold text-rsm-midnight">{t.notifications.deliveryTitle}</legend>
                    {/* Radio cards stay 2-up ≥480, stack only below (R14-2). */}
                    <div className="mt-3 grid grid-cols-2 gap-2 max-[480px]:grid-cols-1" role="radiogroup" aria-label={t.notifications.deliveryTitle}>
                        {(
                            [
                                { key: "daily", title: t.notifications.digestDaily, desc: t.notifications.digestDailyDesc },
                                { key: "instant", title: t.notifications.digestInstant, desc: t.notifications.digestInstantDesc },
                            ] as const
                        ).map((opt) => (
                            <label
                                key={opt.key}
                                className={cx(
                                    "flex min-h-11 cursor-pointer items-start gap-3 rounded-rsm-input border p-3.5 transition-colors duration-200 ease-rsm",
                                    prefs.tracking.digest === opt.key ? "border-rsm-steel bg-white" : "border-rsm-hairline bg-white hover:border-rsm-steel-50",
                                )}
                            >
                                <input
                                    type="radio"
                                    name="digest"
                                    value={opt.key}
                                    checked={prefs.tracking.digest === opt.key}
                                    onChange={() => setDigest(opt.key)}
                                    className="mt-1 size-4 shrink-0 accent-rsm-steel"
                                />
                                <span>
                                    <span className="block text-[14px] font-bold text-rsm-midnight">{opt.title}</span>
                                    <span className="mt-0.5 block text-[12.5px] leading-[1.5] wrap-anywhere text-rsm-slate">{opt.desc}</span>
                                </span>
                            </label>
                        ))}
                    </div>
                </fieldset>

                {/* Transactional mail — no toggle, said plainly (R14-1). */}
                <div className="mt-6 rounded-rsm-card border border-rsm-hairline bg-white p-4">
                    <h2 className="text-[15px] font-bold text-rsm-midnight">{t.notifications.transactional}</h2>
                    <p className="mt-1 text-[13px] leading-[1.55] wrap-anywhere text-rsm-charcoal">{t.notifications.transactionalDesc}</p>
                </div>

                <p className="mt-4 text-[12.5px] leading-[1.5] wrap-anywhere text-rsm-slate">{t.notifications.muteNote}</p>
            </main>
        </div>
    );
}
