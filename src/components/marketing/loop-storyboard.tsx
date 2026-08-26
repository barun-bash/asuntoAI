"use client";

import { formatEUR, formatPercent } from "@/lib/format";
import { useLang } from "@/providers/lang";

/** Midnight disc with the lime check — the loop's step-completion grammar. */
function CheckDisc() {
    return (
        <span aria-hidden className="flex size-[18px] flex-none items-center justify-center rounded-full bg-rsm-midnight text-rsm-lime">
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-2.5">
                <path d="M2 6.5 4.8 9 10 3.5" />
            </svg>
        </span>
    );
}

/**
 * How-it-works loop (Landing board #how): the board's CSS storyboard — 12 s,
 * three beats (1 paste → 2 reads+prices live → 3 verdict), steel loop line,
 * keyframes verbatim in resimator.css. prefers-reduced-motion renders the
 * static verdict-beat poster (same media query as the board).
 *
 * PRODUCTION SWAP (board annotation): replace the storyboard with a captioned
 * screen-recording <video muted loop playsinline> (mp4/webm), poster = beat 3,
 * same three beats and timing. Keep this component's reduced-motion poster.
 *
 * The stage is aria-hidden: beats are an animated re-telling of the 01–03
 * steps listed beside it, which stay the accessible version.
 */
export function LoopStoryboard() {
    const { lang, t } = useLang();
    const m = t.marketing.how;

    return (
        <div className="overflow-hidden rounded-rsm-card border border-rsm-hairline bg-white shadow-rsm-sm">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 border-b border-rsm-row-line px-[18px] py-3">
                <span aria-hidden className="flex gap-[5px]">
                    <span className="size-[9px] rounded-full bg-[#E8E4DC]" />
                    <span className="size-[9px] rounded-full bg-[#E8E4DC]" />
                    <span className="size-[9px] rounded-full bg-[#E8E4DC]" />
                </span>
                <span className="ml-2 max-w-[300px] flex-1 rounded-full bg-rsm-paper px-3.5 py-[5px] text-center text-[11px] leading-[1.4] font-medium text-rsm-misty">
                    resimator.fi
                </span>
            </div>

            <div aria-hidden className="relative h-[300px] bg-rsm-paper md:h-[340px]">
                {/* Beat 1 — paste */}
                <div className="lp-s1 absolute inset-0 flex flex-col items-center justify-center px-6 md:px-11">
                    <p className="mb-3 text-[10px] leading-[13px] font-bold tracking-[0.09em] text-rsm-steel uppercase">{m.beat1}</p>
                    <div className="flex w-full items-center gap-2.5 rounded-rsm-tile border border-rsm-hairline bg-white py-2 pr-2 pl-4 shadow-rsm-sm">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="size-4 flex-none text-rsm-misty"
                        >
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                        <span className="tnum flex-1 truncate text-left text-[13.5px] leading-[1.4] font-medium text-rsm-midnight">
                            https://asunnot.oikotie.fi/…/21966412
                        </span>
                        {/* The loop re-stages the product surface, so its lime
                           Run-analysis button is the product's own one action —
                           not a second marketing lime (Landing board). */}
                        <span className="flex-none rounded-full bg-rsm-lime px-5 py-3 text-[13px] leading-none font-bold whitespace-nowrap text-rsm-midnight">
                            {t.landing.submit}
                        </span>
                    </div>
                    <p className="mt-3 text-[11.5px] leading-[1.5] font-medium text-rsm-misty">{m.beat1Caption}</p>
                </div>

                {/* Beat 2 — reads and prices, live */}
                <div className="lp-s2 absolute inset-0 flex flex-col justify-center px-6 opacity-0 md:px-11">
                    <p className="mb-2.5 text-[10px] leading-[13px] font-bold tracking-[0.09em] text-rsm-steel uppercase">{m.beat2}</p>
                    <div className="rounded-rsm-tile border border-rsm-hairline bg-white px-5 py-4">
                        <p className="font-display text-[15px] leading-[1.3] font-medium text-rsm-midnight">Tuomiokirkonkatu 23 B 14, Tampere</p>
                        <div className="my-3 h-1 overflow-hidden rounded-full bg-rsm-soft-sky">
                            <div className="lp-bar h-full w-[6%] rounded-full bg-rsm-steel" />
                        </div>
                        <div className="lp-t1 flex items-center gap-[9px] border-t border-rsm-row-line py-[7px] text-[12.5px] leading-[1.45] font-medium text-rsm-midnight">
                            <CheckDisc />
                            <span className="hidden sm:inline">{m.beat2Row1}</span>
                            <span className="sm:hidden">{m.beat2Row1Short}</span>
                        </div>
                        <div className="lp-t2 flex items-center gap-[9px] border-t border-rsm-row-line py-[7px] text-[12.5px] leading-[1.45] font-medium text-rsm-midnight">
                            <CheckDisc />
                            <span className="hidden sm:inline">{m.beat2Row2}</span>
                            <span className="sm:hidden">{m.beat2Row2Short}</span>
                            <span className="rounded-full bg-rsm-amber-25 px-1.5 py-[2px] text-[8.5px] leading-[11px] font-bold tracking-[0.05em] text-rsm-amber-deep">
                                {t.analysing.flagged}
                            </span>
                        </div>
                        <div className="lp-t3 flex items-center gap-[9px] border-t border-rsm-row-line py-[7px] text-[12.5px] leading-[1.45] font-medium text-rsm-midnight">
                            <CheckDisc />
                            {m.beat2Row3}
                        </div>
                    </div>
                </div>

                {/* Beat 3 — the verdict, sourced (also the reduced-motion poster) */}
                <div className="lp-s3 absolute inset-0 flex flex-col justify-center px-6 opacity-0 md:px-11">
                    <p className="mb-2.5 text-[10px] leading-[13px] font-bold tracking-[0.09em] text-rsm-steel uppercase">{m.beat3}</p>
                    <div className="rounded-rsm-tile border border-rsm-hairline bg-white px-[22px] py-[18px]">
                        <div className="flex items-end gap-4">
                            <span>
                                <span className="block text-[8.5px] leading-[11px] font-bold tracking-[0.06em] text-rsm-misty">{m.beat3ListingSays}</span>
                                <span className="tnum mt-[3px] block font-display text-3xl leading-none font-medium text-rsm-midnight">
                                    {formatPercent(8.6, lang)}
                                </span>
                            </span>
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="size-[17px] pb-[5px] text-rsm-slate-50"
                            >
                                <path d="M5 12h14M13 6l6 6-6 6" />
                            </svg>
                            <span>
                                <span className="block text-[8.5px] leading-[11px] font-bold tracking-[0.06em] text-rsm-steel">{m.beat3YoudOwn}</span>
                                <span className="tnum mt-[3px] block font-display text-3xl leading-none font-medium text-rsm-midnight">
                                    {formatPercent(5.8, lang)}
                                </span>
                            </span>
                            <span className="lp-pop ml-auto rounded-full bg-rsm-coral-25 px-2.5 py-[3px] text-[10.5px] leading-[15px] font-bold whitespace-nowrap text-rsm-coral-deep">
                                {t.common.high} · {formatEUR(58200, lang)}
                            </span>
                        </div>
                        <div className="lp-pop mt-3 rounded-r-lg border-l-[3px] border-rsm-steel bg-rsm-soft-sky px-3 py-2">
                            <span className="block text-[11.5px] leading-[1.5] font-medium text-rsm-midnight italic">
                                ”Taloyhtiössä on teetetty kuntotutkimus 2024…”
                            </span>
                            <span className="mt-[1px] block text-[9.5px] leading-[1.4] font-medium text-rsm-misty">{m.beat3QuoteSource}</span>
                        </div>
                    </div>
                </div>

                {/* Loop line — 12 s progress, restarts with the beats. */}
                <div className="absolute bottom-0 left-0 h-[2px] w-full bg-rsm-soft-sky">
                    <div className="lp-loop h-full w-0 bg-rsm-steel" />
                </div>
            </div>

            <div className="flex items-center gap-2.5 border-t border-rsm-row-line px-[18px] py-[11px] text-[11.5px] leading-[1.4] font-medium text-rsm-misty">
                <span aria-hidden className="size-[7px] flex-none rounded-full bg-rsm-coral" />
                <span className="hidden md:inline">{m.loopCaption}</span>
                <span className="md:hidden">{m.loopCaptionShort}</span>
            </div>
        </div>
    );
}
