"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { FlagCard, LiabilityItemRow, LockedFlagRow } from "@/components/report/flag-card";
import { GradeTile } from "@/components/report/grade-tile";
import { OfferCalculator, type OfferCalculatorProps } from "@/components/report/offer-calculator";
import { OnboardingTips } from "@/components/report/onboarding-tips";
import { PaywallSeam, StickyUnlockBar } from "@/components/report/paywall-seam";
import { PolicyPanel } from "@/components/report/policy-panel";
import { ProvenanceChip } from "@/components/report/provenance-chip";
import { TopBar } from "@/components/report/top-bar";
import { YieldMetricRow } from "@/components/report/yield-metric-row";
import { formatDateTime, formatEUR } from "@/lib/format";
import type { Analysis, FlagFull, FlagRedacted } from "@/lib/types";
import { tpl, useLang } from "@/providers/lang";

const SEAM_ANCHOR = "paywall-seam";

/**
 * Free summary verdict sheet (R1-6/7/8/14/15/16) — white sheet on paper,
 * centered 720/840 column ≥1280, 704 content at 768–1279, stacked ≤767.
 * h1 receives focus on arrival (a11y §11). Server data arrives pre-redacted.
 *
 * R8 register: this sheet IS the public page. `visitor` (shared-link, not the
 * analyst/owner) adds the R8-1 banner, the live-listing badge, the visitor
 * seam CTA (→ /, never /unlock) and the canonical footer line. `ended` (R8-3)
 * publishes the same analysis past-tense: ended banner + "was:" meta + the
 * district-hunting CTA. Mock triggers: visitor = no runner cookie;
 * ended = ?state=ended (real state from tracking, slice 8).
 */
export function VerdictView({
    analysis,
    unlocked = false,
    visitor = false,
    ended = false,
    offer,
    onboardingSeen = true,
    hasAccount = false,
}: {
    analysis: Analysis;
    unlocked?: boolean;
    visitor?: boolean;
    ended?: boolean;
    /** R5-6 calculator payload (server-computed at asking) — the unpaid panel
       is locked at asking with the seam copy; absent when the engine publishes
       no offer model for the analysis. */
    offer?: OfferCalculatorProps;
    /** R15-2/3: the account's persisted onboarding flag. Defaults to "seen" so
       every existing caller keeps tips off unless the page opts in. */
    onboardingSeen?: boolean;
    hasAccount?: boolean;
}) {
    const { lang, t } = useLang();
    const h1Ref = useRef<HTMLHeadingElement>(null);

    useEffect(() => {
        h1Ref.current?.focus();
    }, []);

    const { listing, verdict } = analysis;
    if (!listing || !verdict) return null;

    const openFlag = verdict.flags.find((f): f is FlagFull => !f.locked);
    const lockedFlags = verdict.flags.filter((f): f is FlagRedacted => f.locked);
    const meta = t.verdict.meta;
    const provenanceKeys = ["OBSERVED", "MAPPED", "MODELLED", "ESTIMATED"] as const;

    return (
        <div className="relative min-h-screen pb-24 md:pb-16">
            <TopBar analyseAnother />
            {/* R15-2/3 onboarding: fires only on a verdict this account/browser
               owns (the visitor/seam paths are excluded server-side). */}
            <OnboardingTips enabled={!visitor} seenOnAccount={onboardingSeen} hasAccount={hasAccount} />
            <main className="mx-auto w-full max-w-[840px] px-4 md:max-w-[704px] md:px-0 xl:max-w-[840px]">
                {/* R8-1 visitor banner / R8-3 ended banner — the public-page
                   register the owner view doesn't carry. */}
                {ended && analysis.listingStatus ? (
                    <p className="mb-5 flex items-center gap-2.5 rounded-[10px] border border-rsm-hairline bg-white px-3.5 py-2.5 text-xs leading-[1.45] text-rsm-slate">
                        <span aria-hidden className="size-[7px] flex-none rounded-full bg-rsm-slate-50" />
                        {analysis.listingStatus.endedNote[lang]}
                    </p>
                ) : visitor ? (
                    <div className="mb-5 flex flex-col gap-2 rounded-xl border border-rsm-hairline bg-white px-[18px] py-3 sm:flex-row sm:items-center sm:gap-3">
                        <span className="flex items-center gap-3 text-[13px] leading-[1.5] text-rsm-slate sm:min-w-0 sm:flex-1">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="size-4 flex-none text-rsm-steel"
                                aria-hidden
                            >
                                <path d="M7 17 17 7M8 7h9v9" />
                            </svg>
                            {t.publicPage.bannerShared}
                        </span>
                        <Link
                            href="/"
                            className="inline-flex min-h-11 shrink-0 items-center text-[13px] font-medium whitespace-nowrap text-rsm-midnight underline-offset-4 hover:text-rsm-steel hover:underline"
                        >
                            {t.publicPage.bannerCta}
                        </Link>
                    </div>
                ) : null}
                {/* R15-2 dim target: OnboardingTips sets data-onboarding-step on
                   this sheet; non-target slots dim to 45 % (CSS in resimator.css). */}
                <div data-onboarding-sheet className="flex flex-col gap-8 rounded-rsm-card border border-rsm-hairline bg-rsm-paper p-5 shadow-rsm-sm md:p-8">
                    {/* Header — every surface is a numbered, dated, sourced document. */}
                    <header data-slot="header" className="flex flex-col gap-2">
                        <p className="text-xs font-bold tracking-[0.08em] text-rsm-steel uppercase">{t.verdict.eyebrow}</p>
                        <p className="tnum text-xs text-rsm-misty">
                            № {analysis.number} · {formatDateTime(analysis.readAt, lang)}
                        </p>
                        <h1 ref={h1Ref} tabIndex={-1} className="font-display text-3xl font-medium wrap-anywhere text-rsm-midnight outline-none md:text-4xl">
                            {listing.addr}, {listing.postalCode ? `${listing.postalCode} ` : ""}
                            {listing.city}
                        </h1>
                        <p className="text-sm leading-relaxed wrap-anywhere text-rsm-charcoal">
                            {listing.type} · {listing.m2} m² · {listing.floor} {meta.floorSuffix}
                            {listing.lift ? `, ${meta.lift}` : ""} · {meta.built} {listing.built}
                            {listing.company ? ` · ${listing.company}` : ""} · {meta.asking} {formatEUR(listing.askPrice, lang)} + {meta.loanShare}{" "}
                            {formatEUR(listing.loanShare, lang)} ={" "}
                            <strong className="tnum font-display font-medium text-rsm-midnight">
                                {/* R8-3 past tense: "was: debt-free 118 000 €". */}
                                {ended ? `${t.publicPage.metaWas} ` : ""}
                                {meta.debtFree} {formatEUR(listing.debtFree, lang)}
                            </strong>
                            {/* R8-1: the "still live" badge (re-checks daily) joins
                               the meta line on the public page. */}
                            {visitor && !ended && analysis.listingStatus ? (
                                <span className="text-rsm-misty"> · {analysis.listingStatus.liveNote[lang]}</span>
                            ) : null}
                        </p>
                        <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-bold tracking-[0.06em] text-rsm-misty uppercase">
                            <span>
                                {t.verdict.sourcesListing} · OIKOTIE {listing.oikotieId}
                            </span>
                            <span>{t.verdict.sourcesCert}</span>
                            <span>{t.verdict.sourcesMarket}</span>
                        </p>
                    </header>

                    {/* Yields — 2-up at every width (R1-7 mobile, R1-16 tablet). */}
                    <div data-slot="yields" className="grid grid-cols-2 gap-3 rounded-rsm-tile">
                        <YieldMetricRow label={t.verdict.grossYield} metric={verdict.grossYield} />
                        <YieldMetricRow label={t.verdict.realYield} metric={verdict.realYield} delta />
                    </div>

                    {/* Grades — 2-up; compact tiles survive 390 px (R1-7). */}
                    <div data-slot="grades" className="grid grid-cols-2 gap-3">
                        <GradeTile
                            grade={verdict.grades.company.grade}
                            label={t.verdict.housingCompany}
                            note={lang === "fi" ? verdict.grades.company.noteFi : verdict.grades.company.note}
                        />
                        <GradeTile
                            grade={verdict.grades.municipality.grade}
                            label={`${t.verdict.municipality} · ${verdict.grades.municipality.name}`}
                            note={lang === "fi" ? verdict.grades.municipality.noteFi : verdict.grades.municipality.note}
                        />
                    </div>

                    {/* Flags */}
                    <section data-slot="flags" className="flex flex-col gap-3 rounded-rsm-tile" aria-labelledby="flags-title">
                        <h2 id="flags-title" className="font-display text-2xl font-medium text-rsm-midnight">
                            {tpl(t.verdict.flagsFound, { n: verdict.flagCount.total })}
                        </h2>
                        <p className="text-sm text-rsm-misty">
                            {tpl(t.verdict.flagsBreakdown, { high: verdict.flagCount.high, caution: verdict.flagCount.caution })} {t.verdict.flagsTail}
                        </p>
                        {openFlag ? (
                            <>
                                <p className="text-xs font-bold tracking-[0.06em] text-rsm-steel uppercase">
                                    {tpl(t.verdict.freeFlagKicker, { n: verdict.flagCount.total })}
                                </p>
                                <FlagCard flag={openFlag} window={lang === "fi" ? verdict.liability.windowFi : verdict.liability.window} />
                                <div className="flex flex-col gap-2 rounded-rsm-tile border border-rsm-hairline bg-white p-4">
                                    {verdict.liability.items.map((item) => (
                                        <LiabilityItemRow
                                            key={item.label}
                                            label={lang === "fi" ? item.labelFi : item.label}
                                            amount={item.amount}
                                            basis={item.basis}
                                        />
                                    ))}
                                    <p className="mt-1 text-sm font-medium text-rsm-steel">{t.verdict.fullBreakdown}</p>
                                </div>
                            </>
                        ) : null}
                    </section>

                    {/* The honest seam */}
                    <div data-slot="seam" id={SEAM_ANCHOR}>
                        <PaywallSeam
                            lockedFlags={lockedFlags}
                            total={verdict.flagCount.total}
                            reportSlug={analysis.slug}
                            unlocked={unlocked}
                            visitor={visitor}
                            ended={ended}
                        />
                    </div>

                    {/* Policy panel (R5-1…R5-5) — full panel visible on the free verdict. */}
                    {analysis.policy ? (
                        <div data-slot="policy" className="rounded-rsm-card">
                            <PolicyPanel policy={analysis.policy} addr={listing.addr} flagCount={verdict.flagCount.total} seamAnchorId={SEAM_ANCHOR} />
                        </div>
                    ) : null}

                    {/* Offer calculator (R5-6) — visible on the free verdict but
                       locked at asking with the unlock seam copy; it never
                       POSTs until the report is unlocked. */}
                    {offer ? (
                        <div data-slot="offer" className="rounded-rsm-card">
                            <OfferCalculator {...offer} seamHref={`#${SEAM_ANCHOR}`} />
                        </div>
                    ) : null}

                    {/* Provenance legend (C1 definitions) + engine note */}
                    <footer data-slot="footer" className="flex flex-col gap-2 border-t border-rsm-hairline pt-5">
                        <dl className="grid gap-2 text-xs text-rsm-misty md:grid-cols-2">
                            {provenanceKeys.map((key) => (
                                <div key={key} className="flex items-center gap-2">
                                    <dt>
                                        <ProvenanceChip basis={key} />
                                    </dt>
                                    <dd>{t.provenance.def[key]}</dd>
                                </div>
                            ))}
                        </dl>
                        <p className="mt-2 text-xs text-rsm-misty">{t.verdict.engineNote}</p>
                    </footer>
                </div>
                {/* R8-1 register footer — the canonical, indexed URL (public page
                   only; the owner's full report carries its own footer). */}
                {visitor ? (
                    <p className="mt-3.5 text-center text-xs leading-[1.5] text-rsm-slate-50">{tpl(t.publicPage.canonicalNote, { slug: analysis.slug })}</p>
                ) : null}
            </main>
            {/* The sticky unlock bar is analyst chrome (R1-7); the visitor's CTA
               lives in the seam card, routing to / (R8-1/R8-3). */}
            {unlocked || visitor ? null : <StickyUnlockBar anchorId={SEAM_ANCHOR} reportSlug={analysis.slug} />}
        </div>
    );
}
