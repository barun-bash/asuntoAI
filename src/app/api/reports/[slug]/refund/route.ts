import { NextResponse } from "next/server";
import { cookieAccount } from "@/lib/api";
import { getBySlug, refundReport } from "@/lib/store";

/** Error → HTTP status. Second refund / duplicate ticket are conflicts (409);
   malformed input is 422; a refund needs the unlocking account (401). */
const ERROR_STATUS: Record<string, number> = {
    not_unlocked: 409,
    already_refunded: 409,
    ticket_pending: 409,
    bad_reason: 422,
    note_required: 422,
};

/**
 * POST /api/reports/:slug/refund {reason: misread|wrong_listing|other, note?,
 * target: credit|card} (R11 contract, handoff-notes "Contract").
 * Credit target resolves synchronously: the response carries the new balance
 * and the 30-day re-lock date; the report STAYS unlocked. Card target opens a
 * human-review ticket (≤ 1 business day SLA) — mock status stays pending.
 */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
    const account = cookieAccount(request);
    if (!account) return NextResponse.json({ error: "anonymous" }, { status: 401 });

    const { slug } = await params;
    const analysis = getBySlug(slug);
    if (!analysis) return NextResponse.json({ error: "unknown_report" }, { status: 404 });

    let body: { reason?: string; note?: string; target?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }

    const result = refundReport(account.id, analysis.id, {
        reason: typeof body.reason === "string" ? body.reason : "",
        note: typeof body.note === "string" ? body.note : undefined,
        target: typeof body.target === "string" ? body.target : "",
    });

    if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: ERROR_STATUS[result.error] ?? 422 });
    }
    return NextResponse.json(
        result.target === "credit"
            ? { status: "refunded", target: "credit", balance: result.balance, reLockUntil: result.reLockUntil }
            : { status: "pending", target: "card" },
    );
}
