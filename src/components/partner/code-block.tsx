/**
 * Docs code block (R17-2): the register's one sanctioned Midnight surface on
 * paper is a docs code block — ui-monospace, code literals only (§2/C12).
 */
export function CodeBlock({ code, label }: { code: string; label?: string }) {
    return (
        <figure className="mt-3 overflow-hidden rounded-rsm-tile bg-rsm-midnight">
            {label ? (
                <figcaption className="border-b border-white/10 px-4 py-2 font-mono text-[11px] tracking-[0.06em] text-rsm-paper/60 uppercase">
                    {label}
                </figcaption>
            ) : null}
            <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-[1.65] whitespace-pre text-rsm-paper">
                <code>{code}</code>
            </pre>
        </figure>
    );
}
