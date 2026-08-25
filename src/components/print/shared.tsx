import type { ReactNode } from "react";
import Image from "next/image";
import type { Dict } from "@/i18n/dict";
import type { Provenance } from "@/lib/types";

/**
 * Shared primitives for the A4 print artifacts (P1–P4, handoff §10).
 * Server components — the print routes render without a client bundle (the
 * screen-only toolbar is the single client island). Styling lives in
 * src/styles/print.css; layout/typography values are the boards' 96-dpi px.
 */

/* Logo lockup (positive) as the boards draw it in print headers; only glyph
   SVGs ship in public/assets, so the wordmark is Space Grotesk text. */
export function PrintLockup() {
    return (
        <span className="p-lockup">
            <Image src="/assets/logo/logomark-glyph-positive.svg" alt="" width={24} height={24} />
            Resimator
        </span>
    );
}

/* Running header from page 2 (§10): report № + address left, section tag right. */
export function RunningHeader({ left, right }: { left: string; right: string }) {
    return (
        <div className="p-running p-num">
            <span>{left}</span>
            <span>{right}</span>
        </div>
    );
}

/* Bottom-pinned block: wraps whatever sits at a sheet's foot (legal line and/or
   the page footer) so margin-top:auto pushes the whole block to the bottom. */
export function SheetBottom({ children }: { children: ReactNode }) {
    return <div className="p-bottom">{children}</div>;
}

/* Page footer on every sheet (§10): public URL left, "page x / y" right.
   Page numbers are per-sheet constants — see the technique note in print.css. */
export function SheetFooter({ left, right }: { left: string; right: string }) {
    return (
        <div className="p-footer p-num">
            <span>{left}</span>
            <span>{right}</span>
        </div>
    );
}

/* § heading row: Space Grotesk marker + title (P4 uses numbered, smaller marks). */
export function SectionRow({ mark, title, small = false, marginTop }: { mark: string; title: string; small?: boolean; marginTop?: number }) {
    return (
        <div className="p-h2-row" style={marginTop ? { marginTop } : undefined}>
            <span className="p-sec-mark">{mark}</span>
            <h2 className={small ? "p-h2 p-h2-sm" : "p-h2"}>{title}</h2>
        </div>
    );
}

/* Document-rhythm quote block (§10): steel 3 px rule, soft-sky fill, italic
   Finnish. The P2 frame joins a flag's quotes inside one block with " · ". */
export function PrintQuote({ quotes, source }: { quotes: string[]; source: string }) {
    return (
        <figure className="p-quote">
            <blockquote className="p-quote-text">{quotes.join(" · ")}</blockquote>
            <figcaption className="p-quote-src">{source}</figcaption>
        </figure>
    );
}

/* Print provenance chip — bordered text label (board script obs/mod/est),
   grayscale-safe by construction. */
export function PrintChip({ basis, t }: { basis: Provenance; t: Dict }) {
    const cls = basis === "OBSERVED" ? "p-chip-obs" : basis === "MAPPED" ? "p-chip-map" : basis === "ESTIMATED" ? "p-chip-est" : "p-chip-mod";
    return <span className={`p-chip ${cls}`}>{t.provenance[basis]}</span>;
}

/* Grade letter → verdict-scale wash class. Same severity logic as the screen's
   gradeWash (A/B seafoam, C amber, D/E coral) — the letter itself is the label. */
export function gradeWashClass(grade: string): string {
    const g = grade.trim().toUpperCase();
    if (g === "A" || g === "B") return "p-wash-seafoam";
    if (g === "C") return "p-wash-amber";
    return "p-wash-coral";
}

/* Server-side twin of report-document's StrongText: bolds engine-published
   substrings inside engine prose (strongs arrive from the fixture per language —
   no UI-side number picking). Kept local so the print route ships no client JS. */
export function StrongPrint({ text, strongs }: { text: string; strongs?: string[] }) {
    if (!strongs?.length) return <>{text}</>;
    const parts: (string | { strong: string })[] = [text];
    for (const s of strongs) {
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (typeof part !== "string") continue;
            const at = part.indexOf(s);
            if (at === -1) continue;
            parts.splice(i, 1, part.slice(0, at), { strong: s }, part.slice(at + s.length));
            break;
        }
    }
    return <>{parts.map((part, i) => (typeof part === "string" ? <span key={i}>{part}</span> : <strong key={i}>{part.strong}</strong>))}</>;
}
