import { NextResponse } from "next/server";
import { cookieAccount } from "@/lib/api";
import { clearWatch, saveWatch } from "@/lib/store";

/**
 * POST /api/account/watch {district, type, maxPrice, policyFilter} → the saved
 * watch (R10-5 "Save watch"). DELETE stops watching ("Stop watching").
 * The match runner itself is the tracking slice (R12) — matches auto-run the
 * free tier only; this stores the saved query (§4).
 */
export async function POST(request: Request) {
    const account = cookieAccount(request);
    if (!account) return NextResponse.json({ error: "anonymous" }, { status: 401 });

    let body: { district?: string; type?: string; maxPrice?: number; policyFilter?: boolean };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }

    const watch = saveWatch(account.id, {
        district: typeof body.district === "string" ? body.district : "",
        type: typeof body.type === "string" ? body.type : "",
        maxPrice: Number(body.maxPrice),
        policyFilter: body.policyFilter === true,
    });
    if (!watch) return NextResponse.json({ error: "bad_watch" }, { status: 422 });
    return NextResponse.json(watch);
}

export async function DELETE(request: Request) {
    const account = cookieAccount(request);
    if (!account) return NextResponse.json({ error: "anonymous" }, { status: 401 });
    clearWatch(account.id);
    return NextResponse.json({ ok: true });
}
