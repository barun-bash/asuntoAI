import { NextResponse } from "next/server";
import { ACCOUNT_COOKIE_OPTS } from "@/lib/api";
import { ACCOUNT_COOKIE, consumeMagicLink } from "@/lib/store";

/**
 * GET /api/auth/callback?token=…&email=… — the emailed magic link lands here
 * (15 min, single use; R10-2/6). On success the account cookie is set and the
 * user lands on /reports; on failure, back to /signin with an error flag.
 *
 * DEV-ONLY TOKEN: the mock never sends email, so ?token=dev&email=<address>
 * creates/attaches the account by that email — the documented local backdoor
 * (see DEV_MOCK_TOKEN in the store). The real token resolves its email from
 * the pending link record, never from the query.
 */
export async function GET(request: Request) {
    const url = new URL(request.url);
    const token = url.searchParams.get("token") ?? "";
    const email = url.searchParams.get("email") ?? undefined;
    const account = consumeMagicLink(token, email);

    const target = account ? "/reports" : "/signin?error=link";
    const response = NextResponse.redirect(new URL(target, url.origin), 303);
    if (account) {
        response.cookies.set(ACCOUNT_COOKIE, account.id, ACCOUNT_COOKIE_OPTS);
    }
    return response;
}
