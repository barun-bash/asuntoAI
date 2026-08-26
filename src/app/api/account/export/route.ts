import { NextResponse } from "next/server";
import { cookieAccount } from "@/lib/api";
import { createExportJob } from "@/lib/store";

/**
 * POST /api/account/export → job {id, status, expiresAt} (R16 contracts).
 * The zip holds /reports/*.pdf (all versions), /analyses/*.json, /chat/*.txt,
 * policy.json, ledger.csv, watches.json — the GDPR Article 20 export. Mock:
 * the build + email send are the backend's; the job records the emailed
 * 48 h link ("ready in minutes · link by email, valid 48 h", R16-1).
 */
export async function POST(request: Request) {
    const account = cookieAccount(request);
    if (!account) return NextResponse.json({ error: "anonymous" }, { status: 401 });
    const job = createExportJob(account.id);
    return NextResponse.json({ id: job.id, status: job.status, expiresAt: job.expiresAt }, { status: 202 });
}
