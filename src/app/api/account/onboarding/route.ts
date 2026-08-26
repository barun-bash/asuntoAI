import { NextResponse } from "next/server";
import { cookieAccount } from "@/lib/api";
import { markOnboardingSeen } from "@/lib/store";

/**
 * POST /api/account/onboarding (R15-2/3 contract): persists {onboardingSeen:true}
 * on the account — fired when the user skips OR finishes the 3 first-run tips.
 * Guests (no account cookie) keep the flag in localStorage only, so 401 here is
 * an expected, silent path for them.
 */
export async function POST(request: Request) {
    const account = cookieAccount(request);
    if (!account) return NextResponse.json({ error: "anonymous" }, { status: 401 });
    markOnboardingSeen(account.id);
    return NextResponse.json({ onboardingSeen: true });
}
