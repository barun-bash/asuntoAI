import { NextResponse } from "next/server";
import { parseLang } from "@/lib/i18n";
import { ACCOUNT_COOKIE, askChat, chatTurnsLeft, getAccount, getBySlug, isUnlocked } from "@/lib/store";

/**
 * POST /api/r/:slug/chat {q, lang?} → {answer, citations[{section,anchor}],
 * turnsLeft} (handoff §5 "Chat API"). Answers are grounded and engine-authored
 * in the fixture — the mock keyword-matches; what-ifs re-run the engine, never
 * arithmetic in the LLM (the 900 € what-if figures are fixture data).
 * Requires the report unlocked on the cookie account (403 otherwise); the cap
 * is 15 turns per report per run, persisted in the store — at 0 the response
 * is {turnsLeft: 0} and the input disables.
 */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const analysis = getBySlug(slug);
    if (!analysis || analysis.status !== "done") {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const account = getAccount(request.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${ACCOUNT_COOKIE}=([^;]+)`))?.[1]);
    if (!account || !isUnlocked(account.id, analysis.id)) {
        return NextResponse.json({ error: "locked" }, { status: 403 });
    }

    let body: { q?: string; lang?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    const q = typeof body.q === "string" ? body.q.trim() : "";
    if (!q || q.length > 500) {
        return NextResponse.json({ error: "bad_question" }, { status: 422 });
    }
    const lang = parseLang(body.lang);

    // Already exhausted: state it without consuming anything (R7-4).
    if (chatTurnsLeft(account.id, analysis.id) <= 0) {
        return NextResponse.json({ turnsLeft: 0 });
    }

    const result = askChat(account.id, analysis, q, lang);
    if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 422 });
    }
    return NextResponse.json(result.response);
}
