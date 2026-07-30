/**
 * Formatting only — never arithmetic (rule §6.2: engine computes, UI formats).
 * Rules (spec §7 / C12):
 *  - € always fi-FI in both UI languages: symbol after the amount, NBSP thousands ("118 000 €").
 *  - Decimals: "." in EN, "," in FI (8.6 % / 8,6 %).
 *  - Minus is U+2212 (−), never hyphen.
 *  - Dates FI-style in both languages: "28.07.2026 13:41" (EN) / "28.7.2026 13.41" (FI).
 */
import type { Lang } from "./i18n";

const MINUS = "\u2212";
const NBSP = " ";

function fiGroup(int: string): string {
    return int.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

function splitNumber(value: number, decimals: number): { sign: string; int: string; frac: string } {
    const sign = value < 0 ? MINUS : "";
    const abs = Math.abs(value);
    const fixed = abs.toFixed(decimals);
    const [int, frac = ""] = fixed.split(".");
    return { sign, int: fiGroup(int), frac };
}

/** 118000 → "118 000 €" (both languages). Decimals only when needed, per locale. */
export function formatEUR(value: number, lang: Lang, decimals = 0): string {
    const { sign, int, frac } = splitNumber(value, decimals);
    const sep = lang === "fi" ? "," : ".";
    const amount = frac ? `${int}${sep}${frac}` : int;
    return `${sign}${amount}${NBSP}€`;
}

/** 845 → "845 €/mo" · FI "845 €/kk". */
export function formatEURPerMonth(value: number, lang: Lang): string {
    return `${formatEUR(value, lang)}/${lang === "fi" ? "kk" : "mo"}`;
}

/** 8.6 → "8.6 %" (EN) · "8,6 %" (FI). NBSP before the unit. */
export function formatPercent(value: number, lang: Lang, decimals = 1): string {
    const { sign, int, frac } = splitNumber(value, decimals);
    const sep = lang === "fi" ? "," : ".";
    return `${sign}${int}${frac ? sep + frac : ""}${NBSP}%`;
}

/** −2.8 → "−2.8 pp" (EN) · "−2,8 %-yks." (FI). */
export function formatPp(value: number, lang: Lang, decimals = 1): string {
    const { sign, int, frac } = splitNumber(value, decimals);
    const sep = lang === "fi" ? "," : ".";
    const num = `${sign}${int}${frac ? sep + frac : ""}`;
    return lang === "fi" ? `${num}${NBSP}%-yks.` : `${num}${NBSP}pp`;
}

/** €/m² figure: 2185 → "2 185 €/m²" (both languages). */
export function formatEURPerSqm(value: number, lang: Lang): string {
    return `${formatEUR(value, lang)}/m²`;
}

/** ISO → EN "28.07.2026 13:41" · FI "28.7.2026 13.41". */
export function formatDateTime(iso: string, lang: Lang): string {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(lang === "fi" ? 1 : 2, "0");
    const mm = String(d.getMonth() + 1).padStart(lang === "fi" ? 1 : 2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return lang === "fi" ? `${dd}.${mm}.${yyyy} ${hh}.${min}` : `${dd}.${mm}.${yyyy} ${hh}:${min}`;
}

/** ISO → EN "28.07.2026" · FI "28.7.2026". */
export function formatDate(iso: string, lang: Lang): string {
    return formatDateTime(iso, lang).split(" ")[0];
}

export { MINUS, NBSP };
