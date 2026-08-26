"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { HeaderSection } from "@/components/marketing/header-section";
import { LoopStoryboard } from "@/components/marketing/loop-storyboard";
import { MissCostCalculator } from "@/components/marketing/miss-cost-calculator";
import { PasteBar } from "@/components/report/paste-bar";
import { formatEUR, formatPercent, formatPp } from "@/lib/format";
import { useLang } from "@/providers/lang";
import { cx } from "@/utils/cx";

/** The real public analysis the sample embed loads (R8-1 page, never a mock). */
const SAMPLE_HREF = "/r/tuomiokirkonkatu-23-b-14-tampere";

/** Severity dots on the pain chips are facts, not verdicts (board annotation). */
function PainChip({ label, tone }: { label: string; tone: "high" | "caution" }) {
    return (
        <span className="inline-flex items-center gap-[7px] rounded-full bg-white px-[13px] py-2 text-xs leading-none font-medium text-rsm-charcoal shadow-[inset_0_0_0_1px_var(--color-rsm-hairline)]">
            <span aria-hidden className={cx("size-1.5 rounded-full", tone === "high" ? "bg-rsm-coral" : "bg-rsm-amber")} />
            {label}
        </span>
    );
}

/** Steel-bordered quote block — the board's citation grammar on marketing cards. */
function MarketingQuote({ quote, source, compact = false }: { quote: string; source: string; compact?: boolean }) {
    return (
        <div className={cx("rounded-r-lg border-l-[3px] border-rsm-steel bg-rsm-steel-wash", compact ? "px-3 py-2" : "px-[13px] py-[9px]")}>
            <span
                className={cx(
                    "block font-medium wrap-anywhere text-rsm-midnight italic",
                    compact ? "text-[11px] leading-[1.5]" : "text-[12.5px] leading-[1.55]",
                )}
            >
                {quote}
            </span>
            <span className={cx("mt-[1px] block font-medium text-rsm-misty", compact ? "text-[9px] leading-[1.4]" : "text-[10.5px] leading-[1.5]")}>
                {source}
            </span>
        </div>
    );
}

/** Hero verdict card (Landing board hero right column) — a live component
   composed from the product's register (№, provenance grammar, citation),
   not a screenshot, so it stays in sync with the product (board annotation).
   ≥768 renders (below the copy in the 768 single-column layout); the 390
   frame drops it. */
function HeroVerdictCard() {
    const { lang, t } = useLang();
    const c = t.marketing.heroCard;

    return (
        <div className="relative hidden md:block">
            <div className="rounded-[18px] border border-rsm-hairline bg-white px-[30px] py-[26px] shadow-rsm-sm">
                <p className="flex items-baseline gap-2.5 text-[9.5px] leading-3 font-bold tracking-[0.08em] uppercase">
                    <span className="text-rsm-steel">{c.eyebrow}</span>
                    <span className="ml-auto text-rsm-slate-50">№ 2026-1187</span>
                </p>
                <p className="mt-2.5 font-display text-[19px] leading-[1.25] font-medium text-rsm-midnight">Tuomiokirkonkatu 23 B 14, Tampere</p>
                <p className="tnum mt-[3px] text-[11.5px] leading-[1.5] font-medium text-rsm-misty">{c.meta}</p>
                <div className="mt-4 flex items-end gap-2.5">
                    <div>
                        <p className="text-[9px] leading-[11px] font-bold tracking-[0.06em] text-rsm-misty">{c.gross}</p>
                        <p className="tnum mt-[3px] font-display text-[34px] leading-none font-medium text-rsm-midnight">{formatPercent(8.6, lang)}</p>
                    </div>
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                        className="size-[18px] pb-1.5 text-rsm-slate-50"
                    >
                        <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                    <div>
                        <p className="text-[9px] leading-[11px] font-bold tracking-[0.06em] text-rsm-misty">{c.real}</p>
                        <p className="tnum mt-[3px] font-display text-[34px] leading-none font-medium text-rsm-midnight">{formatPercent(5.8, lang)}</p>
                    </div>
                    <span className="tnum mb-1 ml-auto self-center rounded-full bg-rsm-amber-25 px-[9px] py-[2px] text-[10.5px] leading-[15px] font-bold text-rsm-amber-deep">
                        {formatPp(-2.8, lang)}
                    </span>
                </div>
                <div className="mt-4 rounded-[10px] border border-l-[3px] border-rsm-hairline border-l-rsm-coral px-3.5 py-[11px]">
                    <div className="flex items-center gap-2">
                        <span aria-hidden className="size-1.5 flex-none rounded-full bg-rsm-coral" />
                        <span className="min-w-0 flex-1 font-display text-[13px] leading-[1.3] font-medium wrap-anywhere text-rsm-midnight">{c.flagTitle}</span>
                        <span className="tnum flex-none rounded-full bg-rsm-coral-25 px-[7px] py-[2px] text-[9px] leading-3 font-bold text-rsm-coral-deep">
                            {formatEUR(58200, lang)}
                        </span>
                    </div>
                    <div className="mt-2">
                        <MarketingQuote quote={c.quote} source={c.quoteSource} compact />
                    </div>
                </div>
            </div>
            {/* Floating policy verdict badge (board: offset -18/-24 from the card). */}
            <div className="absolute -right-[18px] -bottom-6 flex items-center gap-2.5 rounded-xl border border-rsm-hairline bg-white px-4 py-3 shadow-rsm-stack">
                <span className="font-display text-base leading-[1.2] font-medium text-rsm-coral-deep">{c.doesNotPass}</span>
                <span className="tnum text-[11px] leading-[1.4] font-medium text-rsm-charcoal">{c.policyNote}</span>
            </div>
        </div>
    );
}

/** #evidence lease card — live component per the board annotation. */
function EvidenceCard() {
    const { t } = useLang();
    const e = t.marketing.evidence;

    return (
        <div className="rounded-[18px] border border-rsm-hairline bg-white px-[30px] py-[26px] shadow-rsm-sm">
            <p className="font-display text-[15px] leading-[1.35] font-medium text-rsm-midnight">{e.cardTitle}</p>
            <p className="mt-2 text-[13px] leading-[1.6] font-medium wrap-anywhere text-rsm-charcoal">
                {e.cardBodyA}
                <strong className="tnum font-bold text-rsm-midnight">{e.cardBodyBold}</strong>
                {e.cardBodyB}
            </p>
            <div className="mt-3">
                <MarketingQuote quote={e.cardQuote} source={e.cardQuoteSource} />
            </div>
            <p className="mt-2.5 text-[11.5px] leading-[1.55] font-medium text-rsm-misty">
                {e.cardBasis}{" "}
                <span className="rounded px-[5px] py-[1px] text-[9px] leading-[11px] font-bold tracking-[0.05em] shadow-[inset_0_0_0_1px_var(--color-rsm-hairline)]">
                    {t.provenance.MODELLED}
                </span>
            </p>
        </div>
    );
}

/**
 * Marketing landing (Landing board) — /raportti (FI default) and /report (EN
 * mirror). Same content, locale pinned by route; the FI·EN toggle links across.
 * Colour discipline per the board: paper field (the #DCECFF field is NOT used
 * on this board), Midnight only on the featured pack + closing band + FI pill,
 * lime once (the hero CTA) plus the two sanctioned Midnight exceptions.
 */
export function MarketingLanding() {
    const { lang, t } = useLang();
    const m = t.marketing;

    // The root layout pins <html lang="fi">; the EN mirror corrects it on mount.
    useEffect(() => {
        document.documentElement.lang = lang;
    }, [lang]);

    const otherLocale = lang === "fi" ? { href: "/report", label: "EN" } : { href: "/raportti", label: "FI" };
    const unlockHref = lang === "en" ? "/unlock?lang=en" : "/unlock";
    const homeHref = lang === "en" ? "/?lang=en" : "/";
    const sampleSrc = lang === "en" ? `${SAMPLE_HREF}?lang=en` : SAMPLE_HREF;
    const railParts = m.faq.rail.split("hello@resimator.fi");

    const stats = [
        { value: m.hero.stat1Value, label: m.hero.stat1Label },
        { value: m.hero.stat2Value, label: m.hero.stat2Label },
        { value: m.hero.stat3Value, label: m.hero.stat3Label },
    ];
    const steps = [
        { n: "01", title: m.how.step1Title, sub: m.how.step1Sub, short: m.how.step1Short },
        { n: "02", title: m.how.step2Title, sub: m.how.step2Sub, short: m.how.step2Short },
        { n: "03", title: m.how.step3Title, sub: m.how.step3Sub, short: m.how.step3Short },
    ];
    const diyRows = [
        { label: m.diy.row1Label, self: m.diy.row1Self, ours: m.diy.row1Ours },
        { label: m.diy.row2Label, self: m.diy.row2Self, ours: m.diy.row2Ours },
        { label: m.diy.row3Label, self: m.diy.row3Self, ours: m.diy.row3Ours },
        { label: m.diy.row4Label, self: m.diy.row4Self, ours: m.diy.row4Ours },
        { label: m.diy.row5Label, self: m.diy.row5Self, ours: m.diy.row5Ours },
        { label: m.diy.row6Label, self: m.diy.row6Self, ours: m.diy.row6Ours, tnum: true },
    ];
    const diyRowsShort = [
        { self: m.diy.row1SelfShort, ours: m.diy.row1OursShort },
        { self: m.diy.row2SelfShort, ours: m.diy.row2OursShort },
        { self: m.diy.row3SelfShort, ours: m.diy.row3OursShort },
    ];

    return (
        <div className="min-h-screen bg-rsm-paper">
            {/* Nav — 68 px bar, translucent paper over scrolled content (board). */}
            <header className="sticky top-0 z-40 border-b border-[rgba(20,34,45,0.08)] bg-[rgba(246,243,238,0.92)] backdrop-blur-sm">
                <div className="mx-auto flex h-[68px] w-full max-w-[1440px] items-center gap-6 px-4 md:px-10 lg:px-20">
                    <Link href={homeHref} aria-label="Resimator Report" className="flex min-h-11 items-center">
                        <Image src="/assets/logo/logomark-glyph-positive.svg" alt="" width={26} height={26} priority />
                    </Link>
                    <nav className="hidden items-center gap-[22px] text-sm leading-[1.4] font-medium text-rsm-midnight lg:flex">
                        <a href="#how" className="inline-flex min-h-11 items-center hover:text-rsm-steel hover:underline">
                            {m.nav.how}
                        </a>
                        <a href="#evidence" className="inline-flex min-h-11 items-center hover:text-rsm-steel hover:underline">
                            {m.nav.why}
                        </a>
                        <a href="#pricing" className="inline-flex min-h-11 items-center hover:text-rsm-steel hover:underline">
                            {m.nav.pricing}
                        </a>
                        <Link href={SAMPLE_HREF} className="inline-flex min-h-11 items-center hover:text-rsm-steel hover:underline">
                            {m.nav.sample}
                        </Link>
                    </nav>
                    <div className="ml-auto flex items-center gap-3 md:gap-4">
                        {/* FI·EN — locale is pinned by route, so the toggle links
                           across to the mirror (Landing board header). */}
                        <div
                            role="group"
                            aria-label="Kieli · Language"
                            className="inline-flex items-center rounded-full border border-rsm-hairline bg-white p-0.5"
                        >
                            <span className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-rsm-midnight px-3 text-sm font-bold text-rsm-paper uppercase">
                                {lang}
                            </span>
                            <Link
                                href={otherLocale.href}
                                hrefLang={lang === "fi" ? "en" : "fi"}
                                className="flex min-h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-bold text-rsm-charcoal uppercase transition-colors duration-200 ease-rsm hover:text-rsm-midnight"
                            >
                                {otherLocale.label}
                            </Link>
                        </div>
                        <Link
                            href="/signin"
                            className="inline-flex min-h-11 items-center rounded-full px-2 text-sm font-bold text-rsm-midnight transition-colors duration-200 ease-rsm hover:text-rsm-steel"
                        >
                            {t.nav.signIn}
                        </Link>
                    </div>
                </div>
            </header>

            <main>
                {/* Hero — pain-led; the 58 000 € figure is deliberately rounded
                   marketing copy (product surfaces keep exact figures). */}
                <section className="mx-auto grid w-full max-w-[1440px] items-center gap-10 px-4 py-14 md:px-10 md:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:px-20 lg:pt-[88px] lg:pb-[72px]">
                    <div>
                        <p className="mb-[18px] text-[11px] leading-[14px] font-bold tracking-[0.1em] text-rsm-steel uppercase">{m.hero.eyebrow}</p>
                        <h1 className="mb-4 font-display text-[40px] leading-[1.08] font-medium tracking-[-0.01em] text-balance text-rsm-midnight md:text-[54px]">
                            {m.hero.h1a} <span className="tnum whitespace-nowrap">{m.hero.h1Figure}</span> {m.hero.h1b}
                        </h1>
                        <p className="mb-5 max-w-[540px] text-[17px] leading-[1.65] font-medium text-pretty wrap-anywhere text-rsm-charcoal">
                            <span className="hidden md:inline">{m.hero.sub}</span>
                            <span className="md:hidden">{m.hero.subShort}</span>
                        </p>
                        <div className="mb-7 flex flex-wrap gap-2">
                            <PainChip label={m.hero.chip1} tone="high" />
                            <PainChip label={m.hero.chip2} tone="caution" />
                            <PainChip label={m.hero.chip3} tone="caution" />
                        </div>
                        {/* Landing board hero placeholder ("https://asunnot.oikotie.fi/…"),
                           shorter than the product landing's. */}
                        <PasteBar submitLabel={m.hero.submit} placeholder="https://asunnot.oikotie.fi/…" exampleChip={false} />
                        <p className="mt-[13px] text-[13px] leading-[1.5] font-medium text-rsm-misty">
                            <span className="hidden md:inline">{m.hero.trust}</span>
                            <span className="md:hidden">{m.hero.trustShort}</span>
                        </p>
                        {/* Stats strip — engine telemetry (median read, refusal
                           rate), not marketing numbers (board annotation). */}
                        <div className="tnum mt-10 hidden gap-[26px] md:flex">
                            {stats.map((stat, i) => (
                                <div key={stat.label} className="flex items-stretch gap-[26px]">
                                    {i > 0 ? <span aria-hidden className="w-px bg-rsm-hairline" /> : null}
                                    <span>
                                        <span className="tnum block font-display text-[26px] leading-[1.1] font-medium text-rsm-midnight">{stat.value}</span>
                                        <span className="mt-[2px] block max-w-[180px] text-xs leading-[1.4] font-medium text-rsm-misty">{stat.label}</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <HeroVerdictCard />
                </section>

                {/* #how — 12 s loop + the three steps (the accessible telling). */}
                <section id="how" className="scroll-mt-20 border-t border-[rgba(20,34,45,0.08)]">
                    <div className="mx-auto w-full max-w-[1440px] px-4 py-14 md:px-10 md:py-[72px] lg:px-20">
                        <div className="max-w-[560px]">
                            <HeaderSection text={m.how.title} className="font-display text-[28px] leading-[1.2] font-medium text-rsm-midnight md:text-4xl" />
                        </div>
                        <div className="mt-8 grid items-center gap-10 lg:grid-cols-[640px_minmax(0,1fr)] lg:gap-12">
                            <LoopStoryboard />
                            <div className="flex flex-col gap-6">
                                {steps.map((step) => (
                                    <div key={step.n} className="flex gap-4">
                                        <span className="tnum flex-none font-display text-[15px] leading-[1.4] font-medium text-rsm-slate-50">{step.n}</span>
                                        <div>
                                            <p className="font-display text-xl leading-[1.3] font-medium text-rsm-midnight">{step.title}</p>
                                            <p className="mt-[5px] hidden text-[13.5px] leading-[1.6] font-medium wrap-anywhere text-rsm-charcoal md:block">
                                                {step.sub}
                                            </p>
                                            <p className="mt-[5px] text-[13.5px] leading-[1.6] font-medium wrap-anywhere text-rsm-charcoal md:hidden">
                                                {step.short}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <p className="text-[13px] leading-[1.5] font-medium">
                                    <Link href={SAMPLE_HREF} className="inline-flex min-h-11 items-center text-rsm-steel underline-offset-4 hover:underline">
                                        {m.how.sampleLink}
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* #evidence — steel-wash field. At ≤767 this folds into the
                   loop's beat 3 and is not duplicated (390 annotation). */}
                <section id="evidence" className="hidden scroll-mt-20 border-t border-[rgba(20,34,45,0.08)] bg-rsm-steel-wash md:block">
                    <div className="mx-auto grid w-full max-w-[1440px] items-center gap-10 px-4 py-[72px] md:px-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14 lg:px-20">
                        <div>
                            <HeaderSection
                                text={m.evidence.title}
                                className="mb-4 font-display text-[28px] leading-[1.2] font-medium text-rsm-midnight md:text-4xl"
                            />
                            <p className="mb-[22px] text-[15px] leading-[1.65] font-medium text-pretty wrap-anywhere text-rsm-charcoal">{m.evidence.body}</p>
                            <div className="flex flex-wrap gap-2">
                                {(["OBSERVED", "MAPPED", "MODELLED", "ESTIMATED"] as const).map((basis) => (
                                    <span
                                        key={basis}
                                        className={cx(
                                            "rounded-[5px] bg-white px-2 py-[3px] text-[9.5px] leading-3 font-bold tracking-[0.06em]",
                                            basis === "ESTIMATED"
                                                ? "border border-dashed border-rsm-misty-50 text-rsm-misty"
                                                : "shadow-[inset_0_0_0_1px_var(--color-rsm-hairline)]",
                                            basis === "OBSERVED" ? "text-rsm-midnight" : basis === "MAPPED" ? "text-rsm-charcoal" : "text-rsm-misty",
                                        )}
                                    >
                                        {t.provenance[basis]}
                                    </span>
                                ))}
                            </div>
                            <p className="mt-[22px] text-[13px] leading-[1.6] font-medium wrap-anywhere text-rsm-charcoal">{m.evidence.engineNote}</p>
                        </div>
                        <EvidenceCard />
                    </div>
                </section>

                {/* #cost — miss-cost calculator (the one sanctioned client math)
                   + the canonical 736× deal ratio, restated. */}
                <section id="cost" className="scroll-mt-20 border-t border-[rgba(20,34,45,0.08)]">
                    <div className="mx-auto w-full max-w-[1440px] px-4 py-14 md:px-10 md:py-[72px] lg:px-20">
                        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                            <HeaderSection text={m.cost.title} className="font-display text-[28px] leading-[1.2] font-medium text-rsm-midnight md:text-4xl" />
                            <p className="text-sm leading-[1.5] font-medium text-rsm-misty">{m.cost.sub}</p>
                        </div>
                        <div className="mt-9 grid items-stretch gap-6 md:grid-cols-[1fr_1.05fr]">
                            {/* The 390 frame drops the slider card; its stats
                               restate below the ratio (board mobile layout). */}
                            <div className="hidden md:block">
                                <MissCostCalculator />
                            </div>
                            <div className="flex flex-col rounded-rsm-card border border-rsm-hairline bg-white p-6 md:p-8">
                                <p className="text-[10.5px] leading-[14px] font-bold tracking-[0.08em] text-rsm-steel uppercase">{m.cost.missEyebrow}</p>
                                <p className="mt-3 text-sm leading-[1.65] font-medium text-pretty wrap-anywhere text-rsm-charcoal">
                                    {m.cost.missBodyA}
                                    <strong className="tnum font-bold text-rsm-midnight">{m.cost.missBodyBold1}</strong>
                                    {m.cost.missBodyB}
                                    <strong className="tnum font-bold text-rsm-midnight">{m.cost.missBodyBold2}</strong>
                                    {m.cost.missBodyC}
                                </p>
                                <div className="tnum mt-5 rounded-rsm-tile border border-rsm-hairline bg-rsm-editor-bg px-6 py-5 text-center">
                                    <p className="text-[15px] leading-[1.4] font-medium text-rsm-charcoal">
                                        <span className="tnum whitespace-nowrap">{formatEUR(58200, lang)}</span> {m.cost.ratioMissed} &nbsp;÷&nbsp;{" "}
                                        <span className="tnum whitespace-nowrap">{formatEUR(79, lang)}</span> {m.cost.ratioKnown}
                                    </p>
                                    <p className="tnum mt-2 font-display text-[44px] leading-none font-medium text-rsm-midnight">{m.cost.ratioResult}</p>
                                    <p className="mt-2 text-xs leading-[1.5] font-medium text-rsm-misty">{m.cost.ratioNote}</p>
                                </div>
                                <div className="mt-auto flex items-center gap-3 pt-4 text-xs leading-[1.6] font-medium text-rsm-misty">
                                    <span className="min-w-0 flex-1">{m.cost.refuseNote}</span>
                                    <a
                                        href="#pricing"
                                        className="inline-flex min-h-11 flex-none items-center rounded-full px-4 text-[12.5px] font-bold text-rsm-midnight shadow-[inset_0_0_0_1px_var(--color-rsm-hairline)] transition-colors duration-200 ease-rsm hover:shadow-[inset_0_0_0_1px_var(--color-rsm-steel-50)]"
                                    >
                                        {m.cost.seePricing}
                                    </a>
                                </div>
                            </div>
                        </div>
                        <p className="tnum mt-4 text-xs leading-[1.6] font-medium text-rsm-misty md:hidden">
                            {m.cost.mobileStats}
                            <br />
                            {m.cost.honesty}
                        </p>
                    </div>
                </section>

                {/* #diy — the ledger; no lime, the closer concedes the viewing. */}
                <section id="diy" className="scroll-mt-20 border-t border-[rgba(20,34,45,0.08)]">
                    <div className="mx-auto w-full max-w-[1440px] px-4 py-14 md:px-10 md:py-[72px] lg:px-20">
                        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                            <HeaderSection text={m.diy.title} className="font-display text-[28px] leading-[1.2] font-medium text-rsm-midnight md:text-4xl" />
                            <p className="text-sm leading-[1.5] font-medium text-rsm-misty">{m.diy.sub}</p>
                        </div>
                        {/* Desktop ledger (768+) */}
                        <div className="mt-9 hidden rounded-rsm-card border border-rsm-hairline bg-white px-8 pt-2 pb-[26px] md:block">
                            <div className="grid grid-cols-[220px_1fr_1fr] gap-x-7 border-b-2 border-rsm-midnight pt-[18px] pb-3">
                                <span />
                                <span className="text-[11px] leading-[14px] font-bold tracking-[0.07em] text-rsm-misty uppercase">{m.diy.colSelf}</span>
                                <span className="text-[11px] leading-[14px] font-bold tracking-[0.07em] text-rsm-steel uppercase">{m.diy.colOurs}</span>
                            </div>
                            {diyRows.map((row) => (
                                <div
                                    key={row.label}
                                    className={cx(
                                        "grid grid-cols-[220px_1fr_1fr] gap-x-7 border-b border-rsm-row-line py-3.5 text-[13.5px] leading-[1.55] font-medium",
                                        row.tnum && "tnum",
                                    )}
                                >
                                    <span className="text-rsm-misty">{row.label}</span>
                                    <span className="wrap-anywhere text-rsm-charcoal">{row.self}</span>
                                    <span className="wrap-anywhere text-rsm-midnight">{row.ours}</span>
                                </div>
                            ))}
                            <p className="pt-4 pb-1 text-[13px] leading-[1.6] font-medium wrap-anywhere text-rsm-charcoal">
                                <strong className="font-bold text-rsm-midnight">{m.diy.closerBold}</strong>
                                {m.diy.closerRest}
                            </p>
                        </div>
                        {/* Mobile condensed ledger (390 frame) */}
                        <div className="mt-8 rounded-rsm-card border border-rsm-hairline bg-white p-5 md:hidden">
                            <div className="grid grid-cols-2 gap-x-4 border-b-2 border-rsm-midnight pb-2.5 text-[10.5px] leading-[14px] font-bold tracking-[0.07em] uppercase">
                                <span className="text-rsm-misty">{m.diy.colSelfShort}</span>
                                <span className="text-rsm-steel">{m.diy.colOursShort}</span>
                            </div>
                            {diyRowsShort.map((row, i) => (
                                <div key={i} className="grid grid-cols-2 gap-x-4 border-b border-rsm-row-line py-3 text-[12.5px] leading-[1.5] font-medium">
                                    <span className="wrap-anywhere text-rsm-charcoal">{row.self}</span>
                                    <span className="wrap-anywhere text-rsm-midnight">{row.ours}</span>
                                </div>
                            ))}
                            <p className="pt-3.5 text-xs leading-[1.6] font-medium wrap-anywhere text-rsm-charcoal">
                                <strong className="font-bold text-rsm-midnight">{m.diy.closerShortBold}</strong>
                                {m.diy.closerShortRest}
                            </p>
                        </div>
                    </div>
                </section>

                {/* #sample — the real public page in a lazy iframe; never a
                   screenshot that can drift (board annotation). */}
                <section id="sample" className="scroll-mt-20 border-t border-[rgba(20,34,45,0.08)]">
                    <div className="mx-auto grid w-full max-w-[1440px] items-center gap-10 px-4 py-14 md:px-10 md:py-[72px] lg:grid-cols-[minmax(0,1fr)_600px] lg:gap-14 lg:px-20">
                        <div>
                            <HeaderSection
                                text={m.sample.title}
                                className="mb-4 font-display text-[28px] leading-[1.2] font-medium text-rsm-midnight md:text-4xl"
                            />
                            <p className="mb-[18px] hidden text-[15px] leading-[1.65] font-medium text-pretty wrap-anywhere text-rsm-charcoal md:block">
                                {m.sample.body}
                            </p>
                            <div className="hidden flex-col gap-2 text-[13px] leading-[1.55] font-medium text-rsm-charcoal md:flex">
                                <span className="flex gap-[9px]">
                                    <span aria-hidden className="flex-none text-rsm-steel">
                                        —
                                    </span>
                                    <span className="wrap-anywhere">{m.sample.bullet1}</span>
                                </span>
                                <span className="flex gap-[9px]">
                                    <span aria-hidden className="flex-none text-rsm-steel">
                                        —
                                    </span>
                                    <span className="wrap-anywhere">{m.sample.bullet2}</span>
                                </span>
                            </div>
                            {/* Keyboard-reachable Open-full link (board a11y note). */}
                            <p className="mt-5 hidden text-[13.5px] leading-[1.4] font-medium md:block">
                                <Link href={SAMPLE_HREF} className="inline-flex min-h-11 items-center text-rsm-steel underline-offset-4 hover:underline">
                                    {m.sample.openFull}
                                </Link>
                            </p>
                            {/* 390: condensed card instead of the embed. */}
                            <Link
                                href={SAMPLE_HREF}
                                className="flex min-h-11 items-center gap-3 rounded-rsm-tile border border-rsm-hairline bg-white p-4 shadow-rsm-sm md:hidden"
                            >
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-bold text-rsm-midnight">{m.sample.mobileTitle}</span>
                                    <span className="mt-0.5 block text-xs wrap-anywhere text-rsm-misty">{m.sample.mobileSub}</span>
                                </span>
                                <span className="flex-none text-sm font-bold text-rsm-steel">{m.sample.mobileOpen}</span>
                            </Link>
                        </div>
                        <div className="hidden overflow-hidden rounded-rsm-card border border-rsm-hairline bg-white shadow-rsm-sm md:block">
                            <div className="flex items-center gap-2 border-b border-rsm-row-line px-4 py-[11px]">
                                <span aria-hidden className="flex gap-[5px]">
                                    <span className="size-[9px] rounded-full bg-[#E8E4DC]" />
                                    <span className="size-[9px] rounded-full bg-[#E8E4DC]" />
                                    <span className="size-[9px] rounded-full bg-[#E8E4DC]" />
                                </span>
                                <span className="ml-2 max-w-[340px] flex-1 truncate rounded-full bg-rsm-paper px-3.5 py-[5px] text-center text-[10.5px] leading-[1.4] font-medium text-rsm-misty">
                                    resimator.fi/r/tuomiokirkonkatu-23-b-14-tampere
                                </span>
                            </div>
                            <iframe src={sampleSrc} title={m.sample.iframeTitle} loading="lazy" className="h-[440px] w-full border-0" />
                        </div>
                    </div>
                </section>

                {/* #pricing — price the search, not the report. The featured
                   5-pack is the sanctioned lime-on-Midnight exception (§2). */}
                <section id="pricing" className="scroll-mt-20 border-t border-[rgba(20,34,45,0.08)]">
                    <div className="mx-auto w-full max-w-[1440px] px-4 py-14 md:px-10 md:py-[72px] lg:px-20">
                        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                            <HeaderSection
                                text={m.pricing.title}
                                className="font-display text-[28px] leading-[1.2] font-medium text-rsm-midnight md:text-4xl"
                            />
                            <p className="text-sm leading-[1.5] font-medium text-rsm-misty">{m.pricing.sub}</p>
                        </div>
                        <div className="mt-9 grid items-stretch gap-6 md:grid-cols-3">
                            {/* Single */}
                            <div className="order-2 flex flex-col rounded-rsm-card border border-rsm-hairline bg-white px-[30px] py-7 md:order-1">
                                <p className="text-[11px] leading-[14px] font-bold tracking-[0.07em] text-rsm-misty uppercase">{m.pricing.singleName}</p>
                                <p className="mt-2.5 flex flex-wrap items-baseline gap-x-2">
                                    <span className="tnum font-display text-[40px] leading-none font-medium text-rsm-midnight">{formatEUR(79, lang)}</span>
                                    <span className="text-[13px] leading-[1.4] font-medium text-rsm-misty">{m.pricing.singlePer}</span>
                                </p>
                                <p className="mt-3 text-[13.5px] leading-[1.6] font-medium wrap-anywhere text-rsm-charcoal">{m.pricing.singleDesc}</p>
                                <div className="mt-auto pt-5">
                                    <Link
                                        href={unlockHref}
                                        className="flex min-h-11 w-full items-center justify-center rounded-full text-sm font-bold text-rsm-midnight shadow-[inset_0_0_0_1.5px_var(--color-rsm-hairline)] transition-colors duration-200 ease-rsm hover:shadow-[inset_0_0_0_1.5px_var(--color-rsm-steel-50)]"
                                    >
                                        {m.pricing.singleCta}
                                    </Link>
                                </div>
                            </div>
                            {/* 5-pack — featured, leads the stack on mobile. */}
                            <div className="relative order-1 flex flex-col rounded-rsm-card border-2 border-rsm-midnight bg-rsm-midnight px-[30px] py-7 md:order-2">
                                <span className="absolute -top-3 left-7 rounded-full bg-rsm-lime px-[11px] py-1.5 text-[10px] leading-none font-bold tracking-[0.06em] text-rsm-midnight uppercase">
                                    {m.pricing.featuredBadge}
                                </span>
                                <p className="text-[11px] leading-[14px] font-bold tracking-[0.07em] text-[#91A3B7] uppercase">{m.pricing.fiveName}</p>
                                <p className="mt-2.5 flex flex-wrap items-baseline gap-x-2">
                                    <span className="tnum font-display text-[40px] leading-none font-medium text-rsm-paper">{formatEUR(199, lang)}</span>
                                    <span className="tnum text-[13px] leading-[1.4] font-medium text-[#91A3B7]">{m.pricing.fivePer}</span>
                                </p>
                                <p className="mt-3 text-[13.5px] leading-[1.6] font-medium wrap-anywhere text-[#DAE1E7]">{m.pricing.fiveDesc}</p>
                                <div className="mt-auto pt-5">
                                    <Link
                                        href={unlockHref}
                                        className="flex min-h-11 w-full items-center justify-center rounded-full bg-rsm-lime text-sm font-bold text-rsm-midnight shadow-rsm-chip transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75"
                                    >
                                        {m.pricing.fiveCta}
                                    </Link>
                                </div>
                            </div>
                            {/* 20-pack */}
                            <div className="order-3 flex flex-col rounded-rsm-card border border-rsm-hairline bg-white px-[30px] py-7 md:order-3">
                                <p className="text-[11px] leading-[14px] font-bold tracking-[0.07em] text-rsm-misty uppercase">{m.pricing.twentyName}</p>
                                <p className="mt-2.5 flex flex-wrap items-baseline gap-x-2">
                                    <span className="tnum font-display text-[40px] leading-none font-medium text-rsm-midnight">{formatEUR(349, lang)}</span>
                                    <span className="tnum text-[13px] leading-[1.4] font-medium text-rsm-misty">{m.pricing.twentyPer}</span>
                                </p>
                                <p className="mt-3 text-[13.5px] leading-[1.6] font-medium wrap-anywhere text-rsm-charcoal">{m.pricing.twentyDesc}</p>
                                <div className="mt-auto pt-5">
                                    <Link
                                        href={unlockHref}
                                        className="flex min-h-11 w-full items-center justify-center rounded-full text-sm font-bold text-rsm-midnight shadow-[inset_0_0_0_1.5px_var(--color-rsm-hairline)] transition-colors duration-200 ease-rsm hover:shadow-[inset_0_0_0_1.5px_var(--color-rsm-steel-50)]"
                                    >
                                        {m.pricing.twentyCta}
                                    </Link>
                                </div>
                            </div>
                        </div>
                        <p className="mt-4 text-center text-[13px] leading-[1.5] font-medium wrap-anywhere text-rsm-misty">{m.pricing.footnote}</p>
                    </div>
                </section>

                {/* #faq — one open at a time; JSON-LD is emitted server-side. */}
                <section id="faq" className="scroll-mt-20 border-t border-[rgba(20,34,45,0.08)]">
                    <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-4 py-14 md:px-10 md:py-[72px] lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-14 lg:px-20">
                        <div>
                            <HeaderSection
                                text={m.faq.title}
                                className="mb-3 font-display text-[28px] leading-[1.2] font-medium text-rsm-midnight md:text-4xl"
                            />
                            <p className="text-sm leading-[1.65] font-medium text-pretty wrap-anywhere text-rsm-charcoal">
                                {railParts[0]}
                                <a href="mailto:hello@resimator.fi" className="text-rsm-steel underline-offset-4 hover:underline">
                                    hello@resimator.fi
                                </a>
                                {railParts[1]}
                            </p>
                        </div>
                        <FaqAccordion />
                    </div>
                </section>

                {/* Band — the house closer: Midnight + the lime CTA (board). */}
                <section className="mx-auto w-full max-w-[1440px] px-4 pb-14 md:px-10 md:pb-20 lg:px-20">
                    <div className="relative overflow-hidden rounded-3xl bg-rsm-midnight px-6 py-12 md:px-[72px] md:py-16">
                        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(110%_130%_at_100%_0%,rgba(66,122,161,0.28),transparent_55%)]" />
                        <div className="relative flex flex-wrap items-center gap-8 md:gap-10">
                            <div className="min-w-0 flex-1 basis-[420px]">
                                <h2 className="mb-3 font-display text-[28px] leading-[1.15] font-medium text-balance text-rsm-paper md:text-[40px]">
                                    {m.band.title}
                                </h2>
                                <p className="max-w-[560px] text-[15px] leading-[1.65] font-medium wrap-anywhere text-[#DAE1E7]">{m.band.body}</p>
                            </div>
                            <Link
                                href={homeHref}
                                className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-rsm-lime px-8 text-[15px] font-bold text-rsm-midnight shadow-rsm-chip transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75 md:w-auto"
                            >
                                {m.band.cta}
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-[rgba(20,34,45,0.08)]">
                <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-2 px-4 py-6 text-center text-[12.5px] leading-[1.5] font-medium text-rsm-misty md:flex-row md:gap-[18px] md:px-10 md:text-left lg:px-20">
                    <Image src="/assets/logo/logomark-glyph-positive.svg" alt="" width={18} height={18} />
                    <span>{t.common.company}</span>
                    <a
                        href="mailto:hello@resimator.fi"
                        className="inline-flex min-h-11 items-center text-rsm-steel underline-offset-4 hover:underline md:min-h-0"
                    >
                        hello@resimator.fi
                    </a>
                    <span>{m.footer.privacy}</span>
                    <span className="md:ml-auto">{m.footer.legal}</span>
                </div>
            </footer>
        </div>
    );
}
