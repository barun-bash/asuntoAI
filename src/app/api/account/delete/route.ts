import { NextResponse } from "next/server";
import { ACCOUNT_COOKIE_OPTS, cookieAccount } from "@/lib/api";
import { ACCOUNT_COOKIE, deleteAccount, requestAccountDeletion } from "@/lib/store";

/**
 * POST /api/account/delete — two modes (R16 contracts):
 *   {}        → request deletion: the single-use emailed token (15 min) is
 *               issued. Mock: the email is never sent; DEV_MOCK_TOKEN ("dev")
 *               stands in locally (documented in the store).
 *   {token}   → performs the deletion in spec order: refund unused credits at
 *               the per-credit price paid → purge → anonymise receipts
 *               (kirjanpitolaki 6 y) → unlist owned public analyses. The
 *               account cookie is cleared on success.
 * 409 export_pending while an export job is undelivered (R16 contracts).
 */
export async function POST(request: Request) {
    const account = cookieAccount(request);
    if (!account) return NextResponse.json({ error: "anonymous" }, { status: 401 });

    let body: { token?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }

    if (typeof body.token !== "string" || !body.token) {
        requestAccountDeletion(account.id);
        return NextResponse.json({ sent: true }, { status: 202 });
    }

    const result = deleteAccount(account.id, body.token);
    if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.error === "export_pending" ? 409 : 422 });
    }
    const response = NextResponse.json({ deleted: true, refundedCredits: result.refundedCredits, refundAmountEur: result.refundAmountEur });
    response.cookies.set(ACCOUNT_COOKIE, "", { ...ACCOUNT_COOKIE_OPTS, maxAge: 0 });
    return response;
}
