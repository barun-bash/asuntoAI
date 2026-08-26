import { NextResponse } from "next/server";
import { cookieAccount } from "@/lib/api";
import { parseLang } from "@/lib/i18n";
import { setAccountLang } from "@/lib/store";

/** POST /api/account/lang {lang} — persists the UI language on the account (R1-14).
   Anonymous browsers have no account: 401, and the asunto_lang cookie is their
   persistence instead (the client ignores this response either way). */
export async function POST(request: Request) {
    const account = cookieAccount(request);
    if (!account) {
        return NextResponse.json({ error: "anonymous" }, { status: 401 });
    }
    let body: { lang?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    setAccountLang(account.id, parseLang(body.lang));
    return new NextResponse(null, { status: 204 });
}
