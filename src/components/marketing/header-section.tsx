import { Fragment, type JSX } from "react";

/**
 * HeaderSection bracket convention (Landing board annotation): the Steel Blue
 * heading span is authored as [brackets] in the source string — brackets are
 * markup, never rendered. Long FI compounds stay whole: headings never
 * hyphenate (no wrap-anywhere here, spec §7).
 */
export function HeaderSection({ text, as: Tag = "h2", className }: { text: string; as?: keyof JSX.IntrinsicElements; className?: string }) {
    const parts = text.split(/(\[[^\]]+\])/g);
    return (
        <Tag className={className}>
            {parts.map((part, i) =>
                part.startsWith("[") && part.endsWith("]") ? (
                    <span key={i} className="text-rsm-steel">
                        {part.slice(1, -1)}
                    </span>
                ) : (
                    <Fragment key={i}>{part}</Fragment>
                ),
            )}
        </Tag>
    );
}
