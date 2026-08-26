/**
 * Language handling (spec §7): FI primary, EN parity, swap in place via ?lang= —
 * no reload, scroll kept, Finnish source quotes never translate.
 */

export type Lang = "fi" | "en";

export const DEFAULT_LANG: Lang = "fi";

/** Persisted language choice (R1-14: "persists as ?lang= and in the account").
   Server-readable so SSR renders the right locale on the next visit — no flash. */
export const LANG_COOKIE = "asunto_lang";

export function parseLang(value: string | string[] | undefined | null): Lang {
    return value === "en" ? "en" : DEFAULT_LANG;
}

/** Builds the href for the language toggle, preserving other params. */
export function langHref(currentQuery: string, lang: Lang): string {
    const params = new URLSearchParams(currentQuery);
    if (lang === DEFAULT_LANG) {
        params.delete("lang");
    } else {
        params.set("lang", lang);
    }
    const qs = params.toString();
    return qs ? `?${qs}` : "?";
}
