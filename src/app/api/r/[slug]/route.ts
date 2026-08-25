import { NextResponse } from "next/server";
import { ACCOUNT_COOKIE, getAccount, getBySlug, isUnlocked, redactAnalysis } from "@/lib/store";

/** GET /api/r/:slug — free-tier analysis JSON; locked flags server-redacted (§6.4).
   `unlocked` reflects the asunto_account cookie. DECISION: this endpoint never
   serves the full-report payload (`report`) — redactAnalysis drops it for every
   caller. The full document reaches unlocked accounts only via the /r/:slug
   page render, and chat content only turn-by-turn via /chat; no client needs
   the whole payload over JSON (§6.4, slice-4 review finding). */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const analysis = getBySlug(slug);
    if (!analysis) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const account = getAccount(request.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${ACCOUNT_COOKIE}=([^;]+)`))?.[1]);
    return NextResponse.json({ ...redactAnalysis(analysis), unlocked: account ? isUnlocked(account.id, analysis.id) : false });
}
