import { NextResponse } from "next/server";
import { ACCOUNT_COOKIE, authenticatePartnerKey, getAccount, partnerRateCheck } from "@/lib/store";
import type { Account, PartnerKey, PartnerOrg } from "@/lib/types";

/** Cookie options for the account cookie (same shape as the checkout route). */
export const ACCOUNT_COOKIE_OPTS = { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 * 5 } as const;

/** Resolves the account from the asunto_account cookie on a route-handler
   request (same parsing as /api/checkout). Anonymous browsers have none. */
export function cookieAccount(request: Request): Account | undefined {
    return getAccount(request.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${ACCOUNT_COOKIE}=([^;]+)`))?.[1]);
}

/** v1 partner guard (R17): Bearer key auth → 401 {error:"unauthorized"}; then
   the per-key 60 req/min window → 429 {error:"rate_limited"} + Retry-After.
   Returns the error response to send, or the resolved {org, key}. */
export function partnerGuard(request: Request): NextResponse | { org: PartnerOrg; key: PartnerKey } {
    const auth = authenticatePartnerKey(request);
    if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const rate = partnerRateCheck(auth.key.id);
    if (!rate.ok) {
        return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
    }
    return auth;
}
