import { cookies } from "next/headers";
import { LANG_COOKIE, type Lang, parseLang } from "./i18n";

/**
 * Language resolution for server pages (R1-14): an explicit ?lang= always wins,
 * then the persisted asunto_lang cookie, then the FI default.
 * Client modules keep using parseLang from "@/lib/i18n" — this file is server-only
 * (it imports next/headers).
 */
export async function resolveLang(paramLang: string | string[] | undefined | null): Promise<Lang> {
    if (paramLang) return parseLang(paramLang);
    const store = await cookies();
    return parseLang(store.get(LANG_COOKIE)?.value);
}
