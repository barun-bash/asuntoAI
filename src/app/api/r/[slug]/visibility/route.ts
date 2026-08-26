import { NextResponse } from "next/server";
import { ACCOUNT_COOKIE, getAccount, getBySlug, isPublicReport, isUnlocked, setReportVisibility } from "@/lib/store";

/** POST /api/r/:slug/visibility {public:boolean} → {slug, public} (R8 contract;
   the real API is the same shape per the R7-2 footer toggle). Owner-only: the
   unlocking account's cookie gates writes — a visitor can never flip someone
   else's page. Public stays the default (R8 header); the toggle is the only
   write path. */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const analysis = getBySlug(slug);
    if (!analysis) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const account = getAccount(request.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${ACCOUNT_COOKIE}=([^;]+)`))?.[1]);
    if (!account || !isUnlocked(account.id, analysis.id)) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    let body: { public?: unknown };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    if (typeof body.public !== "boolean") {
        return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }

    setReportVisibility(analysis.id, body.public);
    return NextResponse.json({ slug, public: isPublicReport(analysis.id) });
}
