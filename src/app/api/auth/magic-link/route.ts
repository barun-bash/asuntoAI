import { NextResponse } from "next/server";
import { requestMagicLink } from "@/lib/store";

/**
 * POST /api/auth/magic-link {email} → {sent:true} · 422 {error:"bad_email"}.
 * Always "sent" for a valid address — the send layer is the backend's (mock),
 * and the response never reveals whether the account exists ("New here? The
 * same form creates the account.", R10-2).
 */
export async function POST(request: Request) {
    let body: { email?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    if (!requestMagicLink(body.email ?? "")) {
        return NextResponse.json({ error: "bad_email" }, { status: 422 });
    }
    return NextResponse.json({ sent: true });
}
