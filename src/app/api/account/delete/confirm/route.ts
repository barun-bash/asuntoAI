import { NextResponse } from "next/server";
import { ACCOUNT_COOKIE_OPTS, cookieAccount } from "@/lib/api";
import { ACCOUNT_COOKIE, deleteAccount, peekDeletionToken } from "@/lib/store";

/**
 * GET /api/account/delete/confirm?token=… — the emailed deletion link lands
 * here (single use, 15 min; R16 flow line). The link may open on another
 * device, so the account resolves from the token record, not the cookie (the
 * dev mock token falls back to the cookie account). Success → the goodbye
 * page (/account/data?deleted=1); failure → back to /account/data unchanged.
 */
export async function GET(request: Request) {
    const url = new URL(request.url);
    const token = url.searchParams.get("token") ?? "";
    const accountId = peekDeletionToken(token) ?? (token === "dev" ? cookieAccount(request)?.id : undefined);

    let deleted = false;
    if (accountId) {
        deleted = deleteAccount(accountId, token).ok;
    }
    const response = NextResponse.redirect(new URL(deleted ? "/account/data?deleted=1" : "/account/data", url.origin), 303);
    if (deleted) {
        response.cookies.set(ACCOUNT_COOKIE, "", { ...ACCOUNT_COOKIE_OPTS, maxAge: 0 });
    }
    return response;
}
