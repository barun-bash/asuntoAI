import { NextResponse } from "next/server";
import { cookieAccount } from "@/lib/api";
import { compareReports } from "@/lib/store";

/**
 * GET /api/reports/compare?ids=a,b,c (2–4) → each report's engine metrics
 * frozen at its own version + per-column staleness + best-in-row marks (facts
 * only, never the verdict row) — the R13 contract (handoff §5). Summary-only
 * columns carry the free-tier rows and lock markers on the §3/financing-
 * derived lines; locked values never leave the store boundary (§6.4).
 * Account-gated like the /reports drawer that produces the ids (403
 * otherwise); the compare page itself renders the anonymous prompt instead.
 */
export async function GET(request: Request) {
    const account = cookieAccount(request);
    if (!account) {
        return NextResponse.json({ error: "locked" }, { status: 403 });
    }

    const idsParam = new URL(request.url).searchParams.get("ids") ?? "";
    const ids = idsParam
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
    const result = compareReports(ids, account.id);
    if (!result) {
        return NextResponse.json({ error: "bad_selection" }, { status: 422 });
    }
    return NextResponse.json(result);
}
