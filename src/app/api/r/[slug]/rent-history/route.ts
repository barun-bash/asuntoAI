import { NextResponse } from "next/server";
import { cookieAccount } from "@/lib/api";
import { getBySlug, isUnlocked, rentHistoryOf } from "@/lib/store";

/**
 * GET /api/r/:slug/rent-history → {series[{year, medianRent, n}], tenancyRent, …}
 * (handoff §5, R7-10 annotation). Engine-served: the series is MODELLED
 * (advertised lettings, 24-month rolling, nominal €), the sitting tenancy
 * OBSERVED. Requires the report unlocked on the cookie account (403 otherwise,
 * same gate as /chat).
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

    const history = rentHistoryOf(analysis);
    if (!history) {
        return NextResponse.json({ error: "no_report_data" }, { status: 422 });
    }
    return NextResponse.json(history);
}
