import { NextResponse } from "next/server";
import { ACCOUNT_COOKIE, getAccount, getBySlug, isUnlocked, redactAnalysis } from "@/lib/store";

/** GET /api/r/:slug — free-tier analysis JSON; locked flags server-redacted (§6.4).
   `unlocked` reflects the asunto_account cookie — until the full-report slice
   ships, unlock keeps the free summary and only marks the report open. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const analysis = getBySlug(slug);
    if (!analysis) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const account = getAccount(request.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${ACCOUNT_COOKIE}=([^;]+)`))?.[1]);
    return NextResponse.json({ ...redactAnalysis(analysis), unlocked: account ? isUnlocked(account.id, analysis.id) : false });
}
