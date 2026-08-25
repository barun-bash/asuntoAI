import { NextResponse } from "next/server";
import { RUNNER_COOKIE, createRun, isSupportedListingUrl } from "@/lib/store";

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
    // Stamp the analyst's browser with the run's slug so /r/:slug can tell the
    // analyst (R1-6 chrome) from a shared-link visitor (R8-1 banner + visitor
    // CTA) before any account exists — see RUNNER_COOKIE in the store.
    const response = NextResponse.json({ id: run.id, slug: run.slug }, { status: 202 });
    response.cookies.set(RUNNER_COOKIE, run.slug, { path: "/", sameSite: "lax" });
    return response;
}
