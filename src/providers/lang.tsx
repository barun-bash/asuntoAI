"use client";

import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { type Dict, dict } from "@/i18n/dict";
import { DEFAULT_LANG, LANG_COOKIE, type Lang } from "@/lib/i18n";
import { tpl } from "@/lib/tpl";

export { tpl };

interface LangContextValue {
    lang: Lang;
    t: Dict;
    setLang: (lang: Lang) => void;
}

const LangContext = createContext<LangContextValue | null>(null);

function writeLangCookie(lang: Lang) {
    document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * Swap happens in place — no reload, scroll position kept (R1-14).
 * The choice persists three ways: ?lang= via history.replaceState (no server
 * round-trip), the asunto_lang cookie (server-readable, so the NEXT visit's
 * SSR renders the same language), and on the account when signed in.
 */
export function LangProvider({ initialLang, children }: { initialLang: Lang; children: ReactNode }) {
    const [lang, setLangState] = useState<Lang>(initialLang ?? DEFAULT_LANG);

    // Stamp the cookie whenever the effective language differs from it — covers
    // arrivals via a shared ?lang= link too, so the choice survives navigation.
    useEffect(() => {
        if (!document.cookie.includes(`${LANG_COOKIE}=${lang}`)) writeLangCookie(lang);
    }, [lang]);

    const setLang = useCallback((next: Lang) => {
        setLangState(next);
        writeLangCookie(next);
        // Signed-in accounts persist the choice server-side (R1-14); anonymous 401s are ignored.
        void fetch("/api/account/lang", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lang: next }),
        }).catch(() => {});
        const params = new URLSearchParams(window.location.search);
        if (next === DEFAULT_LANG) {
            params.delete("lang");
        } else {
            params.set("lang", next);
        }
        const qs = params.toString();
        window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`);
    }, []);

    const value = useMemo<LangContextValue>(() => ({ lang, t: dict[lang], setLang }), [lang, setLang]);

    return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
    const ctx = useContext(LangContext);
    if (!ctx) throw new Error("useLang must be used inside <LangProvider>");
    return ctx;
}
