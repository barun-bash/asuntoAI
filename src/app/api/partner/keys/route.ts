import { NextResponse } from "next/server";
import { cookieAccount } from "@/lib/api";
import { createPartnerKey, getPartnerConsoleOrg } from "@/lib/store";

/** POST /api/partner/keys {kind: "live"|"sandbox"} → 201 {row, secret}.
   Console API (R17-1 "New API key") — cookie-gated like the console itself
   (partner agreement provisioning is sales scope). The full secret is returned
   exactly once; every later read renders prefix…suffix (R17 notes). */
export async function POST(request: Request) {
    if (!cookieAccount(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    let body: { kind?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    if (body.kind !== "live" && body.kind !== "sandbox") {
        return NextResponse.json({ error: "bad_kind" }, { status: 422 });
    }

    const created = createPartnerKey(getPartnerConsoleOrg().id, body.kind);
    if (!created) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(created, { status: 201 });
}
