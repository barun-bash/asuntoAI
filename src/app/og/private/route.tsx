import { ImageResponse } from "next/og";
import { parseLang } from "@/lib/i18n";
import { OG_SIZE, OgCard, loadOgFonts } from "@/lib/og-card";

export const dynamic = "force-dynamic";

/** GET /og/private — the private-generic brand card (R8-5d): zero deal data,
   for private reports and the receipt/refund/sign-in routes (those pages also
   carry noindex). One shared card, referenced from those routes' metadata. */
export async function GET(request: Request) {
    const url = new URL(request.url);
    const lang = parseLang(url.searchParams.get("lang"));

    return new ImageResponse(<OgCard variant="private" lang={lang} />, { ...OG_SIZE, fonts: await loadOgFonts(url.origin) });
}
