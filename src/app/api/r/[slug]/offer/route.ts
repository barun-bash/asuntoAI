import { NextResponse } from "next/server";
import { cookieAccount } from "@/lib/api";
import { computeOffer, getBySlug, isUnlocked } from "@/lib/store";

/**
 * POST /api/r/:slug/offer {price} → the full recomputed metric + test set at
 * that price (handoff §5, R5-6). The recompute is engine work — it runs in the
 * store, server-side; the client never computes (rule §6.2). Re-running at an
 * offer is full-report behaviour: the report must be unlocked on the cookie
 * account (403 otherwise — the unpaid calculator renders locked at asking
 * from the server-rendered initial payload and never POSTs).
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

    const result = computeOffer(analysis, body.price);
    if (!result) {
        return NextResponse.json({ error: "no_offer_model" }, { status: 422 });
    }
    return NextResponse.json(result);
}
