import { NextResponse } from "next/server";
import { partnerGuard } from "@/lib/api";
import { createPartnerAnalysis, isSupportedListingUrl } from "@/lib/store";

/** POST /api/v1/analyses {url, webhook?} → 202 {id, status:"queued"} (R17
   contract). Bearer auth · 60 req/min per key (429 + Retry-After) · the same
   Oikotie/Etuovi allowlist as the consumer paste bar · 422 {error} otherwise.
   The mock engine completes synchronously — the "queued" here is the contract's
   ack; the poll returns the finished payload (see the store's partner section). */
export async function POST(request: Request) {
    const guard = partnerGuard(request);
    if (guard instanceof NextResponse) return guard;
    const { org, key } = guard;

    let body: { url?: string; webhook?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }

    const url = body.url ?? "";
    if (!isSupportedListingUrl(url)) {
        return NextResponse.json({ error: "unsupported_url" }, { status: 422 });
    }
    // Optional per-request webhook override (§5 {url, webhook?}) — https only.
    if (body.webhook !== undefined) {
        try {
            if (new URL(body.webhook).protocol !== "https:") throw new Error();
        } catch {
            return NextResponse.json({ error: "bad_webhook" }, { status: 422 });
        }
    }

    const job = createPartnerAnalysis(org, key, { url, webhook: body.webhook });
    return NextResponse.json({ id: job.id, status: "queued" }, { status: 202 });
}
