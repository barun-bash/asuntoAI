import { NextResponse } from "next/server";
import { cookieAccount } from "@/lib/api";
import { getBySlug, getTrackingPayload, isUnlocked, setTrackingStopped } from "@/lib/store";

/**
 * GET /api/reports/:slug/tracking → {listingStatus, checkedAt, priceAtRead,
 * priceNow, domAtRead, domNow, versions[{v, at, fails, trigger}], events[],
 * checklistProgress, pinnedOffer} (the R12 contract, handoff §5). Tracking is
 * auto-on at unlock — the record is seeded by the checkout mint; the daily
 * check is the real backend's cron (the mock serves the seeded record).
 * Locked report content: the report must be unlocked on the cookie account
 * (403 otherwise).
 *
 * POST {action: "stop" | "resume"} — the per-object mute (R12 "Stop
 * tracking"; the R14 note: per-object mutes live on their objects). Stopping
 * keeps the record — the timeline stays readable, emails stop.
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const analysis = getBySlug(slug);
    if (!analysis || analysis.status !== "done") {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const account = cookieAccount(request);
    if (!account || !isUnlocked(account.id, analysis.id)) {
        return NextResponse.json({ error: "locked" }, { status: 403 });
    }

    const payload = getTrackingPayload(account.id, analysis.id);
    if (!payload) {
        return NextResponse.json({ error: "no_tracking" }, { status: 422 });
    }
    return NextResponse.json(payload);
}

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

    let body: { action?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    if (body.action !== "stop" && body.action !== "resume") {
        return NextResponse.json({ error: "bad_action" }, { status: 422 });
    }

    if (!setTrackingStopped(account.id, analysis.id, body.action === "stop")) {
        return NextResponse.json({ error: "no_tracking" }, { status: 422 });
    }
    return NextResponse.json(getTrackingPayload(account.id, analysis.id));
}
