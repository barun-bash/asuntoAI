import { NextResponse } from "next/server";
import { createInvoice } from "@/lib/store";

/**
 * POST /api/checkout/invoice {packId, email, name?, company?} → mock invoice
 * record (R6-7). Activates nothing — the credits (and the report) activate
 * "the moment it's paid"; the mock returns the success copy immediately.
 * Reachable only from the third decline — the route is never advertised before.
 */
export async function POST(request: Request) {
    let body: { packId?: string; email?: string; name?: string; company?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }

    const invoice = createInvoice({
        packId: body.packId ?? "",
        email: body.email ?? "",
        name: typeof body.name === "string" ? body.name : undefined,
        company: typeof body.company === "string" ? body.company : undefined,
    });
    if (!invoice) {
        return NextResponse.json({ error: "bad_request" }, { status: 422 });
    }
    return NextResponse.json({ invoiceId: invoice.id, status: invoice.status });
}
