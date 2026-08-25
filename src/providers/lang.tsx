"use client";

import { type ReactNode, createContext, useCallback, useContext, useMemo, useState } from "react";
import { type Dict, dict } from "@/i18n/dict";
import { DEFAULT_LANG, type Lang } from "@/lib/i18n";
import { tpl } from "@/lib/tpl";

export { tpl };

interface LangContextValue {
    lang: Lang;
    t: Dict;
    setLang: (lang: Lang) => void;
}

const LangContext = createContext<LangContextValue | null>(null);

/**
 * Swap happens in place — no reload, scroll position kept (R1-14).
 * The choice persists as ?lang= via history.replaceState (no server round-trip).
 */
export function LangProvider({ initialLang, children }: { initialLang: Lang; children: ReactNode }) {
    const [lang, setLangState] = useState<Lang>(initialLang ?? DEFAULT_LANG);

    const setLang = useCallback((next: Lang) => {
        setLangState(next);
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
