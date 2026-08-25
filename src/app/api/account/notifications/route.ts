import { NextResponse } from "next/server";
import { cookieAccount } from "@/lib/api";
import { getNotifications, setNotifications } from "@/lib/store";
import type { NotificationPrefsPatch } from "@/lib/types";

/**
 * GET/PATCH /api/account/notifications (R14 contract):
 * {tracking:{on,digest}, watch:{on,digest}, analysisDone, productNews}.
 * Toggles autosave — PATCH persists per account and returns the saved state.
 * Transactional mail (receipts, refunds, sign-in links) has no toggle and is
 * not part of the payload — always sent, stated plainly on the page.
 */
export async function GET(request: Request) {
    const account = cookieAccount(request);
    if (!account) return NextResponse.json({ error: "anonymous" }, { status: 401 });
    return NextResponse.json(getNotifications(account.id));
}

export async function PATCH(request: Request) {
    const account = cookieAccount(request);
    if (!account) return NextResponse.json({ error: "anonymous" }, { status: 401 });

    let body: NotificationPrefsPatch;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
        return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    return NextResponse.json(setNotifications(account.id, body));
}
