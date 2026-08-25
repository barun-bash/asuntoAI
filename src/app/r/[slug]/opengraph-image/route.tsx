import { ImageResponse } from "next/og";
import { parseLang } from "@/lib/i18n";
import { ogVariantFor } from "@/lib/og";
import { OG_SIZE, OgCard, loadOgFonts } from "@/lib/og-card";
import { getBySlug } from "@/lib/store";
import { ogPassesPolicy, ogPriceDrop } from "@/mocks/fixtures";

// Report state + the visibility store drive the card — never prerender.
export const dynamic = "force-dynamic";

/** GET /r/:slug/opengraph-image — OG card per report state (R8-2/R8-5),
   rendered server-side at 1200×630 from report state at share time. Variant
   derivation (R8-5 mapping): done → verdict · refused/withdrawn → refused
   (grey, never red) · private → brand-only. ?variant=price-drop|passes-policy|
   refused|private is a mock review override for the states the fixtures don't
   transition through; ?lang= picks FI/EN formats like the page. A route
   handler (not the opengraph-image file convention) so the variant/lang query
   and the request origin are always available. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const url = new URL(request.url);
    const lang = parseLang(url.searchParams.get("lang"));
    const analysis = getBySlug(slug);
    const variant = ogVariantFor(analysis, { override: url.searchParams.get("variant") ?? undefined });

    const origin = url.origin;

    return new ImageResponse(<OgCard variant={variant} lang={lang} analysis={analysis} priceDrop={ogPriceDrop} passesPolicy={ogPassesPolicy} />, {
        ...OG_SIZE,
        fonts: await loadOgFonts(origin),
    });
}
