"use client";

/**
 * Bolds engine-published substrings inside engine prose (the board bolds
 * figures inside flag bodies, basis paragraphs, chat answers and the R7-9/10/11
 * panel copy). The strongs arrive from the fixture per language — no UI-side
 * number picking. Extracted from report-document.tsx so the history panels and
 * the agent checklist share the one implementation (print's twin is
 * StrongPrint in print/shared.tsx — server-side, kept local there).
 */
export function StrongText({ text, strongs }: { text: string; strongs?: string[] }) {
    if (!strongs?.length) return <>{text}</>;
    // Split on each strong (first occurrence), preserving order.
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
    return (
        <>
            {parts.map((part, i) =>
                typeof part === "string" ? (
                    <span key={i}>{part}</span>
                ) : (
                    <strong key={i} className="tnum font-bold">
                        {part.strong}
                    </strong>
                ),
            )}
        </>
    );
}
