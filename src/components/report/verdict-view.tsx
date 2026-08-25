"use client";

import { useEffect, useRef } from "react";
import { FlagCard, LiabilityItemRow, LockedFlagRow } from "@/components/report/flag-card";
import { GradeTile } from "@/components/report/grade-tile";
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
 */
export function VerdictView({ analysis, unlocked = false }: { analysis: Analysis; unlocked?: boolean }) {
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
        <div className="min-h-screen pb-24 md:pb-16">
            <TopBar analyseAnother />
            <main className="mx-auto w-full max-w-[840px] px-4 md:max-w-[704px] md:px-0 xl:max-w-[840px]">
                <div className="flex flex-col gap-8 rounded-rsm-card border border-rsm-hairline bg-rsm-paper p-5 shadow-rsm-sm md:p-8">
                    {/* Header — every surface is a numbered, dated, sourced document. */}
                    <header className="flex flex-col gap-2">
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
                                {meta.debtFree} {formatEUR(listing.debtFree, lang)}
                            </strong>
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
                    <div className="grid grid-cols-2 gap-3">
                        <YieldMetricRow label={t.verdict.grossYield} metric={verdict.grossYield} />
                        <YieldMetricRow label={t.verdict.realYield} metric={verdict.realYield} delta />
                    </div>

                    {/* Grades — 2-up; compact tiles survive 390 px (R1-7). */}
                    <div className="grid grid-cols-2 gap-3">
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
                    <section className="flex flex-col gap-3" aria-labelledby="flags-title">
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
                    <div id={SEAM_ANCHOR}>
                        <PaywallSeam lockedFlags={lockedFlags} total={verdict.flagCount.total} reportSlug={analysis.slug} unlocked={unlocked} />
                    </div>

                    {/* Policy panel (R5-1…R5-5) — full panel visible on the free verdict. */}
                    {analysis.policy ? (
                        <PolicyPanel policy={analysis.policy} addr={listing.addr} flagCount={verdict.flagCount.total} seamAnchorId={SEAM_ANCHOR} />
                    ) : null}

                    {/* Provenance legend (C1 definitions) + engine note */}
                    <footer className="flex flex-col gap-2 border-t border-rsm-hairline pt-5">
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
            </main>
            {unlocked ? null : <StickyUnlockBar anchorId={SEAM_ANCHOR} reportSlug={analysis.slug} />}
        </div>
    );
}
