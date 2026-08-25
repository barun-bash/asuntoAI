/**
 * OG card renderer (R8-2 + R8-5a…d) — the JSX ImageResponse renders, shared by
 * /r/:slug/opengraph-image and /og/private. Midnight fill is the sanctioned OG
 * surface (§2); badge tones reuse the verdict washes on Midnight
 * (amber/seafoam/grey) and lime stays reserved for the REAL yield figure
 * (R8-5 mapping). The refusal card is grey, never red — the honesty IS the
 * marketing. All styles are inline (Satori); layout values are the frames'
 * 600×315/460×242 px × 2 for the 1200×630 render.
 */
import type { ReactNode } from "react";
import { dict } from "@/i18n/dict";
import { formatEUR } from "@/lib/format";
import type { Lang } from "@/lib/i18n";
import { tpl } from "@/lib/tpl";
import type { Analysis, OgVariantData } from "@/lib/types";

/* Design tokens (verbatim, src/styles/tokens/colors.css). */
const MIDNIGHT = "#14222D";
const PAPER = "#F6F3EE";
const LIME = "#E7FE4D";
const ON_DARK_MUTED = "#91A3B7"; // misty-blue-75
const ON_DARK_FAINT = "#DAE1E7"; // misty-blue-25
const CORAL_WASH = "#FFDBD7";
const CORAL_DEEP = "#BE4437";
const AMBER_WASH = "#FFECBF";
const AMBER_DEEP = "#8A6A00";
const SEAFOAM_WASH = "#DAEDE7";
const SEAFOAM_DEEP = "#1E7F4F";
const GREY_LINE = "#46525E"; // slate-grey

/* The logomark glyph path (public/assets/logo/logomark-glyph-negative.svg is
   currentColor-based, so the path is inlined here — Satori <img> can't
   recolor it). Tone negative = paper on Midnight. */
const GLYPH_PATH =
    "M 100.741 101.72 L 85.935 85.643 C 80.009 91.637 71.798 95.347 62.712 95.347 L 33.735 95.347 C 15.133 95.347 0 80.215 0 61.612 C 0 43.01 15.133 27.878 33.735 27.878 L 39.884 27.878 C 48.764 27.878 57.301 31.622 63.313 38.166 L 79.802 56.064 L 79.802 32.653 C 79.802 23.223 72.125 15.545 62.695 15.545 L 3.693 15.545 L 3.693 0 L 62.729 0 C 80.73 0 95.382 14.652 95.382 32.653 L 95.382 62.712 C 95.382 65.786 94.952 68.775 94.145 71.609 L 112.18 91.208 L 100.741 101.737 L 100.741 101.72 Z M 33.752 43.422 C 23.721 43.422 15.562 51.581 15.562 61.612 C 15.562 71.644 23.721 79.802 33.752 79.802 L 62.729 79.802 C 67.744 79.802 72.262 77.638 75.388 74.186 L 51.908 48.678 C 48.833 45.329 44.453 43.405 39.918 43.405 L 33.769 43.405 L 33.752 43.422 Z";

/* Logo lockup negative: glyph + "Resimator" wordmark in Space Grotesk (the
   board's lockup; the wordmark ships as text, as in print). */
function Lockup({ size }: { size: number }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: size * 0.45 }}>
            <svg width={size * 1.1} height={size} viewBox="0 0 112.180 101.737">
                <path d={GLYPH_PATH} fill={PAPER} />
            </svg>
            <span style={{ fontFamily: "Space Grotesk", fontWeight: 500, fontSize: size * 0.95, color: PAPER, letterSpacing: -0.5 }}>Resimator</span>
        </div>
    );
}

function Pill({ bg, color, children, fontSize = 20 }: { bg?: string; color: string; children: ReactNode; fontSize?: number }) {
    return (
        <span
            style={{
                display: "flex",
                fontFamily: "Satoshi",
                fontWeight: 700,
                fontSize,
                letterSpacing: 1.4,
                padding: `${fontSize * 0.3}px ${fontSize}px`,
                borderRadius: 1000,
                backgroundColor: bg ?? "transparent",
                color,
                border: bg ? "none" : `2px solid ${GREY_LINE}`,
            }}
        >
            {children}
        </span>
    );
}

/* The sanctioned top-right light (R8-2: radial-gradient(120% 90% at 100% 0%,
   rgba(66,122,161,.22), transparent 55%)). Satori drops radial-gradient, so
   the glow is layered translucent discs — same steel tint, same corner. */
function Glow() {
    /* right/bottom anchoring is unreliable in Satori — discs are anchored by
       computed left/top against the 1200×630 canvas (same corner as the
       frame's "100% 0%" light). */
    const discs = [
        { size: 700, left: 760, top: -330, alpha: 0.05 },
        { size: 520, left: 870, top: -240, alpha: 0.07 },
        { size: 360, left: 970, top: -160, alpha: 0.09 },
    ];
    return (
        <div style={{ position: "absolute", inset: 0, display: "flex" }}>
            {discs.map((d, i) => (
                <div
                    key={i}
                    style={{
                        position: "absolute",
                        left: d.left,
                        top: d.top,
                        width: d.size,
                        height: d.size,
                        borderRadius: 9999,
                        backgroundColor: `rgba(66,122,161,${d.alpha})`,
                    }}
                />
            ))}
        </div>
    );
}

function Frame({ children }: { children: ReactNode }) {
    return (
        <div
            style={{
                width: 1200,
                height: 630,
                backgroundColor: MIDNIGHT,
                display: "flex",
                flexDirection: "column",
                padding: "56px 64px",
                position: "relative",
                fontFamily: "Satoshi",
            }}
        >
            <Glow />
            {children}
        </div>
    );
}

function YieldBlock({ label, value, lime = false, size = 68 }: { label: string; value: string; lime?: boolean; size?: number }) {
    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: "Satoshi", fontWeight: 700, fontSize: size * 0.28, letterSpacing: 1.4, color: lime ? LIME : ON_DARK_MUTED }}>
                {label}
            </span>
            <span style={{ marginTop: 6, fontFamily: "Space Grotesk", fontWeight: 500, fontSize: size, lineHeight: 1, color: lime ? LIME : PAPER }}>
                {value}
            </span>
        </div>
    );
}

/* R8-2 — the default verdict card. Numbers are the hook; the lime is the
   reveal. Tabular-nums is a no-op in Satori (Space Grotesk's figures are
   near-tabular); noted rather than faked. */
function VerdictCard({ analysis, lang }: { analysis: Analysis; lang: Lang }) {
    const t = dict[lang].share;
    const { listing, verdict } = analysis;
    if (!listing || !verdict) return null;
    const gross = lang === "fi" ? `${String(verdict.grossYield.value).replace(".", ",")} %` : `${verdict.grossYield.value} %`;
    const real = lang === "fi" ? `${String(verdict.realYield.value).replace(".", ",")} %` : `${verdict.realYield.value} %`;
    return (
        <Frame>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Lockup size={40} />
                <span style={{ marginLeft: "auto", fontFamily: "Satoshi", fontWeight: 700, fontSize: 19, letterSpacing: 1.33, color: ON_DARK_MUTED }}>
                    {tpl(t.cardEyebrow, { city: listing.city.toUpperCase() })}
                </span>
            </div>
            <div style={{ position: "relative", marginTop: 44, fontFamily: "Space Grotesk", fontWeight: 500, fontSize: 46, lineHeight: 1.2, color: PAPER }}>
                {listing.addr}
            </div>
            <div style={{ position: "relative", marginTop: 8, fontFamily: "Satoshi", fontWeight: 500, fontSize: 25, lineHeight: 1.5, color: ON_DARK_MUTED }}>
                {`${listing.type} · ${listing.m2} m² · ${listing.built} · ${lang === "fi" ? "velaton" : "debt-free"} ${formatEUR(listing.debtFree, "fi")}`}
            </div>
            <div style={{ position: "relative", marginTop: "auto", display: "flex", alignItems: "flex-end", gap: 52 }}>
                <YieldBlock label={t.cardGross} value={gross} />
                <svg width={40} height={40} viewBox="0 0 24 24" style={{ marginBottom: 14 }}>
                    <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="#6D859F" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <YieldBlock label={t.cardReal} value={real} lime />
                <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
                    {verdict.flagCount.high > 0 ? (
                        <Pill bg={CORAL_WASH} color={CORAL_DEEP}>
                            {tpl(t.cardHighFlag, { n: verdict.flagCount.high })}
                        </Pill>
                    ) : null}
                    <Pill bg={AMBER_WASH} color={AMBER_DEEP}>
                        {tpl(t.cardLiability, { amount: formatEUR(verdict.liability.total, "fi") })}
                    </Pill>
                </div>
            </div>
        </Frame>
    );
}

/* R8-5a/b — the delta/pass variants (figures engine-published in fixtures). */
function VariantCard({ data, lang }: { data: OgVariantData; lang: Lang }) {
    const t = dict[lang].share;
    const badgeTone = data.badgeTone === "amber" ? { bg: AMBER_WASH, color: AMBER_DEEP } : { bg: SEAFOAM_WASH, color: SEAFOAM_DEEP };
    return (
        <Frame>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Lockup size={32} />
                <span style={{ marginLeft: "auto", display: "flex" }}>
                    <Pill bg={badgeTone.bg} color={badgeTone.color} fontSize={17}>
                        {data.badge[lang]}
                    </Pill>
                </span>
            </div>
            <div style={{ position: "relative", marginTop: 32, fontFamily: "Space Grotesk", fontWeight: 500, fontSize: 36, lineHeight: 1.25, color: PAPER }}>
                {data.addr}
            </div>
            <div style={{ position: "relative", marginTop: 6, fontFamily: "Satoshi", fontWeight: 500, fontSize: 22, lineHeight: 1.5, color: ON_DARK_MUTED }}>
                {data.meta[lang]}
            </div>
            <div style={{ position: "relative", marginTop: "auto", display: "flex", alignItems: "flex-end", gap: 36 }}>
                <YieldBlock label={t.cardGross} value={data.gross[lang]} size={50} />
                <YieldBlock label={t.cardReal} value={data.real[lang]} lime size={50} />
                <span style={{ marginLeft: "auto", display: "flex" }}>
                    {data.tailTone === "amber" ? (
                        <Pill bg={AMBER_WASH} color={AMBER_DEEP} fontSize={17}>
                            {data.tail[lang]}
                        </Pill>
                    ) : (
                        <span style={{ fontFamily: "Satoshi", fontWeight: 500, fontSize: 20, lineHeight: 1.4, color: ON_DARK_MUTED }}>{data.tail[lang]}</span>
                    )}
                </span>
            </div>
        </Frame>
    );
}

/* R8-5c — refusal: grey hairline badge, never red. */
function RefusedCard({ analysis, lang }: { analysis: Analysis; lang: Lang }) {
    const t = dict[lang].share;
    const addr = analysis.listing?.addr ?? analysis.slug;
    return (
        <Frame>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Lockup size={32} />
                <span style={{ marginLeft: "auto", display: "flex" }}>
                    <Pill color={ON_DARK_MUTED} fontSize={17}>
                        {t.cardNoVerdict}
                    </Pill>
                </span>
            </div>
            <div style={{ position: "relative", marginTop: 32, fontFamily: "Space Grotesk", fontWeight: 500, fontSize: 36, lineHeight: 1.25, color: PAPER }}>
                {addr}
            </div>
            <div style={{ position: "relative", marginTop: 6, fontFamily: "Satoshi", fontWeight: 500, fontSize: 22, lineHeight: 1.5, color: ON_DARK_MUTED }}>
                {analysis.refusal?.ogSub?.[lang] ?? t.ogTitleRefused}
            </div>
            <div
                style={{
                    position: "relative",
                    marginTop: "auto",
                    fontFamily: "Satoshi",
                    fontWeight: 500,
                    fontSize: 24,
                    lineHeight: 1.55,
                    color: ON_DARK_FAINT,
                    maxWidth: 680,
                }}
            >
                {t.ogDescriptionRefused}
            </div>
        </Frame>
    );
}

/* R8-5d — private routes: brand card only, zero deal data. */
function PrivateCard({ lang }: { lang: Lang }) {
    const t = dict[lang].share;
    return (
        <Frame>
            <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1 }}>
                <Lockup size={44} />
                <div style={{ marginTop: 24, fontFamily: "Space Grotesk", fontWeight: 500, fontSize: 30, lineHeight: 1.35, color: PAPER }}>
                    {t.ogTitlePrivate}
                </div>
                <div style={{ marginTop: 8, fontFamily: "Satoshi", fontWeight: 500, fontSize: 22, lineHeight: 1.5, color: ON_DARK_MUTED }}>
                    {t.ogDescriptionPrivate}
                </div>
            </div>
        </Frame>
    );
}

export interface OgCardInput {
    variant: "verdict" | "price-drop" | "passes-policy" | "refused" | "private";
    lang: Lang;
    analysis?: Analysis;
    priceDrop?: OgVariantData;
    passesPolicy?: OgVariantData;
}

export function OgCard({ variant, lang, analysis, priceDrop, passesPolicy }: OgCardInput) {
    if (variant === "verdict" && analysis) return <VerdictCard analysis={analysis} lang={lang} />;
    if (variant === "price-drop" && priceDrop) return <VariantCard data={priceDrop} lang={lang} />;
    if (variant === "passes-policy" && passesPolicy) return <VariantCard data={passesPolicy} lang={lang} />;
    if (variant === "refused" && analysis) return <RefusedCard analysis={analysis} lang={lang} />;
    return <PrivateCard lang={lang} />;
}

/* Fonts for ImageResponse: Satori parses TTF/OTF only (WOFF/WOFF2 rejected —
   "Unsupported OpenType signature wOF2"), so the OG faces ship as TTF at
   public/fonts/og/, decompressed with fontTools from the DS Satoshi woff2s
   and the Google Fonts Space Grotesk 500 woff2 (OFL, latin subset — covers
   FI glyphs; Space Grotesk otherwise ships only via next/font/google, which
   ImageResponse can't consume). Fetched from the deployment's own origin and
   memoised per origin. */
const fontCache = new Map<string, Promise<{ name: string; data: ArrayBuffer; weight: 500 | 700; style: "normal" }[]>>();

export function loadOgFonts(origin: string) {
    let cached = fontCache.get(origin);
    if (!cached) {
        cached = Promise.all(
            [
                { name: "Space Grotesk", path: "/fonts/og/SpaceGrotesk-Medium.ttf", weight: 500 as const },
                { name: "Satoshi", path: "/fonts/og/Satoshi-Medium.ttf", weight: 500 as const },
                { name: "Satoshi", path: "/fonts/og/Satoshi-Bold.ttf", weight: 700 as const },
            ].map(async ({ name, path, weight }) => {
                const res = await fetch(`${origin}${path}`);
                if (!res.ok) throw new Error(`OG font fetch failed: ${path} (${res.status})`);
                return { name, data: await res.arrayBuffer(), weight, style: "normal" as const };
            }),
        );
        fontCache.set(origin, cached);
        // A failed font fetch must not poison the cache forever — evict on
        // rejection so the next request retries (the origin may have been
        // mid-boot).
        cached.catch(() => fontCache.delete(origin));
    }
    return cached;
}

export const OG_SIZE = { width: 1200, height: 630 };
