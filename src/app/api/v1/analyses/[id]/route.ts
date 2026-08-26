import { NextResponse } from "next/server";
import { partnerGuard } from "@/lib/api";
import { getPartnerJob, partnerAnalysisPayload } from "@/lib/store";

/** GET /api/v1/analyses/:id → the full analysis JSON (R17-2 shape): per-figure
   provenance, per-flag Finnish quote, refusal as a first-class status with the
   failing extractions named — "the payload carries the honesty" (R17 header).
   Ids are org-scoped: another org's id is a 404, not a 403. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const guard = partnerGuard(request);
    if (guard instanceof NextResponse) return guard;
    const { org } = guard;

    const { id } = await params;
    const job = getPartnerJob(org.id, id);
    const payload = job ? partnerAnalysisPayload(job) : undefined;
    if (!payload) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(payload);
}
