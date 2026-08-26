import { NextResponse } from "next/server";
import { cookieAccount } from "@/lib/api";
import { getBySlug, isUnlocked, pinOffer } from "@/lib/store";

/**
 * POST /api/r/:slug/offer/pin {price} → {pinnedOffer: {offerPrice, pinnedAt}}.
 * Persists the pinned offer server-side per account+report (§4) — it renders
 * in §1 ("your target: 98 500 €"), the PDF and the agent checklist header.
 * Locked report content behaviour: the report must be unlocked on the cookie
 * account (403 otherwise). The price is validated against the offer model's
 * published bounds — a pin never carries a figure the calculator couldn't
 * have produced.
 */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const analysis = getBySlug(slug);
    if (!analysis || analysis.status !== "done") {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const account = cookieAccount(request);
    if (!account || !isUnlocked(account.id, analysis.id)) {
        return NextResponse.json({ error: "locked" }, { status: 403 });
    }

    let body: { price?: number };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    if (typeof body.price !== "number" || !Number.isFinite(body.price)) {
        return NextResponse.json({ error: "bad_price" }, { status: 422 });
    }

    const pinned = pinOffer(account.id, analysis, body.price);
    if (!pinned) {
        return NextResponse.json({ error: "price_out_of_bounds" }, { status: 422 });
    }
    return NextResponse.json({ pinnedOffer: pinned });
}
