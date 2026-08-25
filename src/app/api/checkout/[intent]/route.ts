import { NextResponse } from "next/server";
import { getIntent, intentPayload } from "@/lib/store";

/** GET /api/checkout/:intent — intent status + resulting balance; the UI polls
   this after the paying state (handoff: "UI polls /unlock/:intent"). */
export async function GET(_request: Request, { params }: { params: Promise<{ intent: string }> }) {
    const { intent: id } = await params;
    const intent = getIntent(id);
    if (!intent) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json(intentPayload(intent));
}
