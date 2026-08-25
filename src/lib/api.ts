import { ACCOUNT_COOKIE, getAccount } from "@/lib/store";
import type { Account } from "@/lib/types";

/** Cookie options for the account cookie (same shape as the checkout route). */
export const ACCOUNT_COOKIE_OPTS = { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 * 5 } as const;

/** Resolves the account from the asunto_account cookie on a route-handler
   request (same parsing as /api/checkout). Anonymous browsers have none. */
export function cookieAccount(request: Request): Account | undefined {
    return getAccount(request.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${ACCOUNT_COOKIE}=([^;]+)`))?.[1]);
}
