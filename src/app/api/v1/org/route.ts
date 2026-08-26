import { NextResponse } from "next/server";
import { partnerGuard } from "@/lib/api";
import { partnerOrgPayload } from "@/lib/store";

/** GET /api/v1/org → the Bearer key's org state (R17-1 figures): agreement №,
   prepaid pool remaining, volume tier price, this month's counts, rate limit. */
export async function GET(request: Request) {
    const guard = partnerGuard(request);
    if (guard instanceof NextResponse) return guard;
    return NextResponse.json(partnerOrgPayload(guard.org));
}
