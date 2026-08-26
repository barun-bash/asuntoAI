import { NextResponse } from "next/server";
import { cookieAccount } from "@/lib/api";
import { getPartnerConsoleOrg, rotatePartnerWebhookSecret, setPartnerWebhookUrl } from "@/lib/store";

/** Console API for the R17-1 webhook card — cookie-gated.
   PATCH {url} → {webhook} — the delivery target (https only).
   POST {action:"rotate-secret"} → {secret, maskedSecret} — the new signing
   secret is shown once, then masked (same rule as keys, R17 notes). */
export async function PATCH(request: Request) {
    if (!cookieAccount(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    let body: { url?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    const webhook = setPartnerWebhookUrl(getPartnerConsoleOrg().id, body.url ?? "");
    if (!webhook) return NextResponse.json({ error: "bad_url" }, { status: 422 });
    return NextResponse.json({ webhook });
}

export async function POST(request: Request) {
    if (!cookieAccount(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    let body: { action?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    if (body.action !== "rotate-secret") return NextResponse.json({ error: "bad_action" }, { status: 422 });

    const rotated = rotatePartnerWebhookSecret(getPartnerConsoleOrg().id);
    if (!rotated) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(rotated);
}
