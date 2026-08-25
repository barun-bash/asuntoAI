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

/** Always-signed pp margin (R5): +2.6 → "+2.6 pp" · FI "+2,6 %-yks."; whole numbers drop the decimal ("+2 pp"). */
export function formatPpSigned(value: number, lang: Lang, decimals = 1): string {
    const rounded = Number(value.toFixed(decimals));
    const dec = Number.isInteger(rounded) ? 0 : decimals;
    const out = formatPp(Math.abs(rounded), lang, dec);
    return value < 0 ? `${MINUS}${out.replace(MINUS, "")}` : `+${out}`;
}

/** Always-signed € margin (R5): +47 → "+47 €" · −14 → "−14 €" (fi-FI grouping both languages). */
export function formatEURSigned(value: number, lang: Lang, decimals = 0): string {
    return value < 0 ? formatEUR(value, lang, decimals) : `+${formatEUR(value, lang, decimals)}`;
}

/** Grade-step margin (R5): −1 → "−1 grade" (EN) · "−1 arvosana" (FI). */
export function formatGradeMargin(value: number, lang: Lang): string {
    const n = Math.trunc(value);
    const unit = lang === "fi" ? "arvosana" : Math.abs(n) === 1 ? "grade" : "grades";
    return `${n < 0 ? MINUS : "+"}${Math.abs(n)}${NBSP}${unit}`;
}

/** €/m² figure: 2185 → "2 185 €/m²" (both languages). */
export function formatEURPerSqm(value: number, lang: Lang): string {
    return `${formatEUR(value, lang)}/m²`;
}

/** Per-report pack math (R6-1): 39.8 → "39.80 €/report" · FI "39,80 €/raportti". */
export function formatEURPerReport(value: number, lang: Lang, decimals = 2): string {
    return `${formatEUR(value, lang, decimals)}/${lang === "fi" ? "raportti" : "report"}`;
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

/** Clock time for the policy "re-ran" meta (R5-1): EN "13:44:07" · FI "13.44.07". */
export function formatTime(date: Date, lang: Lang): string {
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");
    return lang === "fi" ? `${hh}.${mm}.${ss}` : `${hh}:${mm}:${ss}`;
}

/* Number words for the policy banner (the board spells small counts:
   "Two of the three failures", "clears six failures", FI "Kuutta hylkäystä").
   FI carries nominative (subject counts) and partitive ("{n} hylkäystä") forms. */
const EN_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen"];
const FI_WORDS_NOM = [
    "nolla",
    "yksi",
    "kaksi",
    "kolme",
    "neljä",
    "viisi",
    "kuusi",
    "seitsemän",
    "kahdeksan",
    "yhdeksän",
    "kymmenen",
    "yksitoista",
    "kaksitoista",
    "kolmetoista",
    "neljätoista",
];
const FI_WORDS_PART = [
    "nollaa",
    "yhtä",
    "kahta",
    "kolmea",
    "neljää",
    "viittä",
    "kuutta",
    "seitsemää",
    "kahdeksaa",
    "yhdeksää",
    "kymmentä",
    "yhtätoista",
    "kahtatoista",
    "kolmeatoista",
    "neljätoista",
];

/** 2 → "two" (EN) · "kaksi" (FI nom) · "kahta" (FI part). Lowercase; falls back to the numeral outside 0–14. */
export function numberWord(n: number, lang: Lang, fiCase: "nom" | "part" = "nom"): string {
    if (n < 0 || n > 14) return String(n);
    if (lang === "fi") return fiCase === "part" ? FI_WORDS_PART[n] : FI_WORDS_NOM[n];
    return EN_WORDS[n];
}

/** Capitalizes the first letter — for sentence-initial number words. */
export function capFirst(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

export { MINUS, NBSP };
