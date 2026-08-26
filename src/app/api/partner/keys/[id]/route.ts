import { NextResponse } from "next/server";
import { cookieAccount } from "@/lib/api";
import { getPartnerConsoleOrg, revokePartnerKey, rotatePartnerKey } from "@/lib/store";

/** POST /api/partner/keys/:id {action:"rotate"} → {row, secret, retiringRow}.
   Rotate = 24 h overlap: the old key keeps working for 24 h (retiring), the
   new secret is shown once (R17 notes). Console API — cookie-gated. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!cookieAccount(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    let body: { action?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    if (body.action !== "rotate") return NextResponse.json({ error: "bad_action" }, { status: 422 });

    const { id } = await params;
    const rotated = rotatePartnerKey(getPartnerConsoleOrg().id, id);
    if (!rotated) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(rotated);
}

/** DELETE /api/partner/keys/:id → {row}. Revoke is immediate — no overlap. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!cookieAccount(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { id } = await params;
    const row = revokePartnerKey(getPartnerConsoleOrg().id, id);
    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ row });
}
