import { NextResponse } from "next/server";
import { ACCOUNT_COOKIE, createCheckout, getAccount, intentPayload } from "@/lib/store";

/** Error → HTTP status. first_free_used / no_credits are conflicts (409);
   everything malformed is 422. Board-honest copy lives in the dict, keyed
   off these codes. */
const ERROR_STATUS: Record<string, number> = {
    first_free_used: 409,
    no_credits: 409,
    already_unlocked: 409,
};

const COOKIE_OPTS = { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 * 5 } as const;

/**
 * POST /api/checkout {packId | "first-free" | "use-credit", email, reportId,
 * cardNumber, sessionId} → creates a payment intent and completes it
 * synchronously (mock of Stripe confirm + webhook; handoff-notes "Purchase").
 * On paid, the account + credits + spend + unlock mint is one store
 * transaction (acceptance §12). Card ending 4098 declines insufficient_funds.
 */
export async function POST(request: Request) {
    let body: { packId?: string; email?: string; reportId?: string; cardNumber?: string; sessionId?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    if (!body.packId || typeof body.packId !== "string") {
        return NextResponse.json({ error: "unknown_pack" }, { status: 422 });
    }

    const cookieAccount = getAccount(request.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${ACCOUNT_COOKIE}=([^;]+)`))?.[1]);
    const result = createCheckout({
        packId: body.packId,
        email: body.email ?? "",
        reportId: typeof body.reportId === "string" ? body.reportId : undefined,
        cardNumber: typeof body.cardNumber === "string" ? body.cardNumber : undefined,
        sessionId: typeof body.sessionId === "string" ? body.sessionId.slice(0, 64) : undefined,
        cookieAccount,
    });

    if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: ERROR_STATUS[result.error] ?? 422 });
    }

    const response = NextResponse.json(intentPayload(result.intent));
    // The account cookie is set on the first checkout/claim; anonymous has none.
    if (result.account) {
        response.cookies.set(ACCOUNT_COOKIE, result.account.id, COOKIE_OPTS);
    }
    return response;
}
