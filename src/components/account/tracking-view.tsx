"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AccountTopBar } from "@/components/account/account-top-bar";
import { formatDate, formatDateTime, formatEUR, formatPercent } from "@/lib/format";
import type { TrackingPayload } from "@/lib/types";
import { tpl, useLang } from "@/providers/lang";
import { cx } from "@/utils/cx";

/**
 * Tracking dashboard (R12-1/2): "what happened after you unlocked" — status
 * chip, the four tiles (asking, days on market, verdict, pinned offer), the
 * append-only events timeline (newest first, midnight discs per spec §2), the
 * frozen versions list with download links, and Stop tracking (the per-object
 * mute; R14 note). One listing, actual vs. read — explicitly NOT the
 * platform's portfolio: it never asks about ownership. Tiles stack on mobile,
 * 2×2 on tablet, 4-up on desktop (R12-2).
 */

/** "29.07 08:12" — the timeline's no-year stamp (FI "29.7. 8.12"). */
function stampOf(iso: string, lang: "fi" | "en"): string {
    const [date, time] = formatDateTime(iso, lang).split(" ");
    return `${date.replace(/\.\d{4}$/, lang === "fi" ? "." : "")} ${time}`;
}

export function TrackingView({
    slug,
    addr,
    number,
    seededAt,
    payload,
    balance,
    email,
}: {
    slug: string;
    addr: string;
    number: string;
    seededAt: number;
    payload: TrackingPayload;
    balance: number;
    email: string;
}) {
    const { lang, t } = useLang();
    const router = useRouter();
    const [confirming, setConfirming] = useState(false);
    const [busy, setBusy] = useState(false);

    const current = payload.versions[payload.versions.length - 1];
    const priceDelta = payload.priceNow - payload.priceAtRead;
    const pinned = payload.pinnedOffer;
    const gapClosing = (payload.pinnedGapPct ?? 0) >= 0;

    const setStopped = async (action: "stop" | "resume") => {
        setBusy(true);
        try {
            const res = await fetch(`/api/reports/${slug}/tracking`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });
            if (!res.ok) throw new Error(String(res.status));
            setConfirming(false);
            router.refresh();
        } catch {
            /* Mock engine cannot fail; the real-engine swap owns error copy. */
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="min-h-dvh">
            <AccountTopBar balance={balance} email={email} />
            <main className="mx-auto w-full max-w-[800px] px-4 pt-6 pb-20 md:max-w-[704px] md:px-0 xl:max-w-[800px]">
                <Link
                    href={`/r/${slug}`}
                    className="inline-flex min-h-11 items-center text-[13px] font-medium text-rsm-steel underline-offset-4 hover:underline"
                >
                    {t.tracking.backToReport}
                </Link>

                {/* Header — the tracked document + the live status chip. */}
                <header className="mt-2 flex flex-col gap-2">
                    <h1 className="font-display text-2xl font-medium wrap-anywhere text-rsm-midnight md:text-3xl">
                        {tpl(t.tracking.title, { date: formatDate(new Date(seededAt).toISOString(), lang) })}
                    </h1>
                    <p className="text-[15px] font-medium wrap-anywhere text-rsm-midnight">{addr}</p>
                    <p className="tnum text-[12px] leading-[1.5] wrap-anywhere text-rsm-misty">
                        {tpl(t.tracking.metaLine, {
                            n: number,
                            v: `v${current.v}`,
                            done: payload.checklistProgress.answered,
                            total: payload.checklistProgress.total,
                        })}
                    </p>
                    <p className="mt-1">
                        <span
                            className={cx(
                                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10.5px] font-bold tracking-[0.06em] uppercase",
                                payload.listingStatus === "live" ? "bg-rsm-seafoam-25 text-rsm-seafoam-deep" : "bg-rsm-hairline text-rsm-slate",
                            )}
                        >
                            <span
                                aria-hidden
                                className={cx("size-[6px] rounded-full", payload.listingStatus === "live" ? "bg-rsm-seafoam-deep" : "bg-rsm-slate-50")}
                            />
                            {payload.listingStatus === "live"
                                ? tpl(t.tracking.statusLive, { ago: payload.checkedNote[lang].toUpperCase() })
                                : `${t.tracking.statusEnded} · ${formatDate(payload.checkedAt, lang)}`}
                        </span>
                    </p>
                </header>

                {/* Tiles — 4-up desktop, 2×2 tablet, stacked mobile (R12-2). */}
                <div className="mt-5 grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-rsm-input border border-rsm-hairline bg-white px-4 py-3.5">
                        <div className="text-[9.5px] leading-[1.3] font-bold tracking-[0.06em] text-rsm-misty uppercase">{t.tracking.tileAsking}</div>
                        <div className="tnum mt-1 flex flex-wrap items-baseline gap-x-2.5">
                            <span className="font-display text-2xl leading-none font-medium text-rsm-midnight">{formatEUR(payload.priceNow, lang)}</span>
                            {priceDelta !== 0 ? (
                                <span className={cx("font-display text-[15px] font-medium", priceDelta < 0 ? "text-rsm-amber-deep" : "text-rsm-coral-deep")}>
                                    {formatEUR(priceDelta, lang)}
                                </span>
                            ) : null}
                        </div>
                        <div className="tnum mt-1 text-[11px] leading-[1.45] text-rsm-misty">
                            {tpl(t.tracking.tileAskingWas, { price: formatEUR(payload.priceAtRead, lang) })}
                        </div>
                    </div>
                    <div className="rounded-rsm-input border border-rsm-hairline bg-white px-4 py-3.5">
                        <div className="text-[9.5px] leading-[1.3] font-bold tracking-[0.06em] text-rsm-misty uppercase">{t.tracking.tileDom}</div>
                        <div className="tnum mt-1 font-display text-2xl leading-none font-medium text-rsm-midnight">{payload.domNow}</div>
                        <div className="tnum mt-1 text-[11px] leading-[1.45] wrap-anywhere text-rsm-misty">
                            {tpl(t.tracking.tileDomMeta, { at: payload.domAtRead, median: payload.domDistrictMedian })}
                        </div>
                    </div>
                    <div className="rounded-rsm-input border border-rsm-hairline bg-white px-4 py-3.5">
                        <div className="text-[9.5px] leading-[1.3] font-bold tracking-[0.06em] text-rsm-misty uppercase">{t.tracking.tileVerdict}</div>
                        <div className="tnum mt-1 font-display text-2xl leading-none font-medium text-rsm-coral-deep">
                            {tpl(t.tracking.tileVerdictFails, { n: current.fails })}
                        </div>
                        <div className="mt-1 text-[11px] leading-[1.45] wrap-anywhere text-rsm-misty">{payload.verdictNote[lang]}</div>
                    </div>
                    <div className="rounded-rsm-input border border-rsm-hairline bg-white px-4 py-3.5">
                        <div className="text-[9.5px] leading-[1.3] font-bold tracking-[0.06em] text-rsm-misty uppercase">{t.tracking.tilePinned}</div>
                        {pinned ? (
                            <>
                                <div className="tnum mt-1 font-display text-2xl leading-none font-medium text-rsm-midnight">
                                    {formatEUR(pinned.offerPrice, lang)}
                                </div>
                                <div className="tnum mt-1 text-[11px] leading-[1.45] wrap-anywhere text-rsm-misty">
                                    {tpl(gapClosing ? t.tracking.gapClosing : t.tracking.gapClosed, {
                                        pct: formatPercent(Math.abs(payload.pinnedGapPct ?? 0), lang),
                                    })}
                                </div>
                            </>
                        ) : (
                            <div className="mt-1.5 text-[11.5px] leading-[1.5] wrap-anywhere text-rsm-misty">{t.tracking.pinnedNone}</div>
                        )}
                    </div>
                </div>

                {/* Actions — open the current version, compare versions, stop. */}
                <div className="mt-5 flex flex-wrap items-center gap-2.5">
                    <Link
                        href={`/r/${slug}`}
                        className="inline-flex min-h-11 items-center justify-center rounded-full bg-rsm-lime px-6 text-sm font-bold text-rsm-midnight transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75"
                    >
                        {tpl(t.tracking.openReport, { v: `v${current.v}` })}
                    </Link>
                    {/* Version compare is engine work — the mock anchors the frozen
                       versions list below (comment per the slice brief). */}
                    <a
                        href="#versions"
                        className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-bold text-rsm-midnight shadow-[inset_0_0_0_1px_var(--color-rsm-hairline)] transition-colors duration-200 ease-rsm hover:shadow-[inset_0_0_0_1px_var(--color-rsm-steel)]"
                    >
                        {t.tracking.compareVersions}
                    </a>
                    {payload.stopped ? (
                        <span className="inline-flex min-h-11 items-center text-[12.5px] font-medium wrap-anywhere text-rsm-slate">
                            {t.tracking.stopped}
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => void setStopped("resume")}
                                className="ml-3 inline-flex min-h-11 items-center text-[12.5px] font-medium text-rsm-steel underline-offset-4 hover:underline"
                            >
                                {t.tracking.resume}
                            </button>
                        </span>
                    ) : confirming ? (
                        <span className="flex flex-wrap items-center gap-2">
                            <span className="text-[12.5px] wrap-anywhere text-rsm-slate">{t.tracking.stopConfirm}</span>
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => void setStopped("stop")}
                                className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-bold text-rsm-coral-deep shadow-[inset_0_0_0_1px_var(--color-rsm-coral)] transition-colors duration-200 ease-rsm hover:bg-rsm-coral-25"
                            >
                                {t.tracking.stopYes}
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirming(false)}
                                className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-rsm-steel underline-offset-4 hover:underline"
                            >
                                {t.tracking.stopCancel}
                            </button>
                        </span>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setConfirming(true)}
                            className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-rsm-slate underline-offset-4 transition-colors duration-200 ease-rsm hover:text-rsm-coral-deep hover:underline"
                        >
                            {t.tracking.stopTracking}
                        </button>
                    )}
                </div>
                <p className="mt-2.5 text-[11.5px] leading-[1.55] wrap-anywhere text-rsm-misty">{t.tracking.footerNote}</p>

                {/* Events — append-only, newest first, midnight discs (§2). */}
                <ol className="mt-6 flex flex-col">
                    {payload.events.map((event, i) => (
                        <li key={`${event.at}-${i}`} className="flex gap-3 border-b border-rsm-row-line py-3 first:border-t">
                            <span aria-hidden className="mt-1.5 size-[9px] shrink-0 rounded-full bg-rsm-midnight" />
                            <div className="min-w-0 flex-1">
                                <p className="tnum text-[10.5px] font-bold tracking-[0.06em] text-rsm-misty uppercase">{stampOf(event.at, lang)}</p>
                                <p className="tnum mt-0.5 text-[14px] leading-[1.45] font-medium wrap-anywhere text-rsm-midnight">{event.title[lang]}</p>
                                {event.detail ? (
                                    <p className="tnum mt-0.5 text-[12px] leading-[1.55] wrap-anywhere text-rsm-slate">{event.detail[lang]}</p>
                                ) : null}
                            </div>
                        </li>
                    ))}
                </ol>

                {/* Versions — frozen, never overwritten; v1 stays downloadable
                   (the /pdf route; the engine freezes per-version artifacts, the
                   mock serves the one route for every version — comment). */}
                <section id="versions" aria-labelledby="versions-title" className="mt-8 scroll-mt-24">
                    <h2 id="versions-title" className="font-display text-lg font-medium wrap-anywhere text-rsm-midnight">
                        {t.tracking.versionsTitle}
                    </h2>
                    <div className="mt-2.5 flex flex-col">
                        {payload.versions.map((version) => (
                            <div key={version.v} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-rsm-row-line py-2.5 first:border-t">
                                <span className="tnum font-display text-[15px] font-medium text-rsm-midnight">v{version.v}</span>
                                {version.v === current.v ? (
                                    <span className="rounded-full bg-rsm-midnight px-2 py-[2px] text-[9.5px] font-bold tracking-[0.05em] text-rsm-paper uppercase">
                                        {t.tracking.versionCurrent}
                                    </span>
                                ) : null}
                                <span className="tnum text-[12px] text-rsm-slate">{formatDate(version.at, lang)}</span>
                                <span className="tnum text-[12px] text-rsm-slate">{tpl(t.tracking.versionFails, { n: version.fails })}</span>
                                <span className="text-[12px] wrap-anywhere text-rsm-misty">{version.trigger[lang]}</span>
                                <a
                                    href={`/r/${slug}/pdf`}
                                    className="ml-auto inline-flex min-h-11 items-center text-[12.5px] font-medium whitespace-nowrap text-rsm-steel underline-offset-4 hover:underline"
                                >
                                    {tpl(t.tracking.versionDownload, { v: version.v })}
                                </a>
                            </div>
                        ))}
                    </div>
                </section>

                {/* The scope guard — said plainly on the dashboard. */}
                <p className="mt-6 text-[11.5px] leading-[1.6] wrap-anywhere text-rsm-misty">{t.tracking.scopeNote}</p>
            </main>
        </div>
    );
}
