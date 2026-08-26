import { NextResponse } from "next/server";
import { cookieAccount } from "@/lib/api";
import { getAgentChecklist, getBySlug, isUnlocked, setAgentChecklistItem } from "@/lib/store";

/**
 * GET /api/r/:slug/agent-checklist → {items[{question, questionFi, basis:
 * {flagId|gap}, answersWith, checked}]} (the R7-11 contract, handoff §5).
 * PATCH {id, checked} flips one item — the checked state persists server-side
 * per account+report and is merged into every GET. Both are locked report
 * content: the report must be unlocked on the cookie account (403 otherwise).
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const analysis = getBySlug(slug);
    if (!analysis || analysis.status !== "done") {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const account = cookieAccount(request);
    if (!account || !isUnlocked(account.id, analysis.id)) {
        return NextResponse.json({ error: "locked" }, { status: 403 });
    }

    const checklist = getAgentChecklist(account.id, analysis);
    if (!checklist) {
        return NextResponse.json({ error: "no_report_data" }, { status: 422 });
    }
    return NextResponse.json(checklist);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const analysis = getBySlug(slug);
    if (!analysis || analysis.status !== "done") {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const account = cookieAccount(request);
    if (!account || !isUnlocked(account.id, analysis.id)) {
        return NextResponse.json({ error: "locked" }, { status: 403 });
    }

    let body: { id?: string; checked?: boolean };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    if (typeof body.id !== "string" || typeof body.checked !== "boolean") {
        return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }

    const item = setAgentChecklistItem(account.id, analysis, body.id, body.checked);
    if (!item) {
        // The engine emitted the item set — unknown ids are rejected, not created.
        return NextResponse.json({ error: "unknown_item" }, { status: 422 });
    }
    return NextResponse.json(item);
}
