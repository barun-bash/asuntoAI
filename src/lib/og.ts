/**
 * Share-metadata + OG variant logic (R8-2/R8-4/R8-5). Single source for the
 * og:title / og:description strings, so /r/:slug generateMetadata and the
 * /dev/share preview (R8-4) can never drift apart.
 *
 * Variant mapping (R8-5 annotation): verdict = the default card (R8-2) ·
 * price-drop = listing-changed links (R9-3) · passes-policy = watch-match
 * links (R9-6) · refused = refusal/withdrawn analyses (grey, never red) ·
 * private = private reports + receipt/refund/sign-in routes (brand only,
 * zero deal data, noindex). Cards render server-side at 1200×630 from report
 * state at share time; re-runs regenerate. FI cards use FI number formats.
 */
import { dict } from "@/i18n/dict";
import { formatPercent } from "@/lib/format";
import { DEFAULT_LANG, type Lang } from "@/lib/i18n";
import { isPublicReport } from "@/lib/store";
import { tpl } from "@/lib/tpl";
import type { Analysis, OgVariant } from "@/lib/types";

export interface OgShareText {
    title: string;
    description: string;
    /** alt text for the card image (metadata `images[].alt`). */
    alt: string;
}

/** og:title / og:description per report state (R8-4 + R8-5c/d copy).
   Done: "8.6 % gross, 5.8 % real — 3 flags found" (the hook is the gap).
   Refused: the honesty IS the marketing. Private: brand only. */
export function ogShareText(analysis: Analysis | undefined, lang: Lang = DEFAULT_LANG, isPublic = true): OgShareText {
    const t = dict[lang].share;

    if (!isPublic || !analysis) {
        return { title: t.ogTitlePrivate, description: t.ogDescriptionPrivate, alt: t.altPrivate };
    }

    if (analysis.status === "refused" || analysis.status === "withdrawn") {
        return {
            title: t.ogTitleRefused,
            description: t.ogDescriptionRefused,
            alt: tpl(t.altRefused, { addr: analysis.listing?.addr ?? analysis.slug }),
        };
    }

    const { listing, verdict } = analysis;
    if (!listing || !verdict) {
        return { title: t.ogTitlePrivate, description: t.ogDescriptionPrivate, alt: t.altPrivate };
    }
    const gross = formatPercent(verdict.grossYield.value, lang);
    const real = formatPercent(verdict.realYield.value, lang);
    const n = verdict.flagCount.total;
    return {
        title: tpl(n === 1 ? t.ogTitleOne : t.ogTitle, { gross, real, n }),
        description: t.ogDescription,
        alt: tpl(t.altVerdict, { addr: listing.addr, gross, real, n }),
    };
}

/** Which card /r/:slug/opengraph-image renders. An explicit ?variant= preview
   override wins (mock review affordance — price-drop and passes-policy are
   states the base fixtures don't transition through; their figures are
   engine-published in mocks/fixtures.ts). Withdrawn shares the refused card:
   both are "no verdict issued" states, grey never red (R8-5c). */
export function ogVariantFor(analysis: Analysis | undefined, opts: { isPublic?: boolean; override?: string } = {}): OgVariant {
    const allowed: OgVariant[] = ["verdict", "price-drop", "passes-policy", "refused", "private"];
    if (opts.override && allowed.includes(opts.override as OgVariant)) return opts.override as OgVariant;

    const isPublic = opts.isPublic ?? (analysis ? isPublicReport(analysis.id) : false);
    if (!isPublic || !analysis) return "private";
    if (analysis.status === "refused" || analysis.status === "withdrawn") return "refused";
    return "verdict";
}

/** The private-route OG image URL (R8-5d) — one brand card for receipt,
   refund, sign-in, /reports and private reports. */
export const PRIVATE_OG_IMAGE = "/og/private";

/** Public URL of a report's public page (print footers + canonical line). */
export const SITE_ORIGIN = "https://resimator.fi";
