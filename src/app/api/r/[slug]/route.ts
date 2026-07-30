import { NextResponse } from "next/server";
import { getBySlug, redactAnalysis } from "@/lib/store";

/** GET /api/r/:slug — free-tier analysis JSON; locked flags server-redacted (§6.4). */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const analysis = getBySlug(slug);
    if (!analysis) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json(redactAnalysis(analysis));
}
