import { NextResponse } from "next/server";
import { cookieAccount } from "@/lib/api";
import { getBySlug, isUnlocked, priceHistoryOf } from "@/lib/store";

/**
 * GET /api/r/:slug/price-history → {series[{year, medianSqm, n}], dealSqm, …}
 * (handoff §5, R7-9 annotation). Engine-served: the series is MODELLED (annual
 * district medians, nominal €), the deal figure OBSERVED — every stat value is
 * engine-published in the fixture, never derived at serve time (§6.2).
 * Locked report content: requires the report unlocked on the cookie account
 * (403 otherwise, same gate as /chat).
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const analysis = getBySlug(slug);
    if (!analysis || analysis.status !== "done") {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const account = cookieAccount(request);
    if (!account || !isUnlocked(account.id, analysis.id)) {
        return NextResponse.json({ error: "locked" }, { status: 403 });
    }

    const history = priceHistoryOf(analysis);
    if (!history) {
        return NextResponse.json({ error: "no_report_data" }, { status: 422 });
    }
    return NextResponse.json(history);
}
