import { NextResponse } from "next/server";
import { createRun, isSupportedListingUrl } from "@/lib/store";

/** POST /api/analyses {url} → {id, slug} · 422 {error:"unsupported_url"} (R1-3). */
export async function POST(request: Request) {
    let body: { url?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }

    const url = body.url ?? "";
    if (!isSupportedListingUrl(url)) {
        return NextResponse.json({ error: "unsupported_url" }, { status: 422 });
    }

    const run = createRun();
    return NextResponse.json({ id: run.id, slug: run.slug }, { status: 202 });
}
