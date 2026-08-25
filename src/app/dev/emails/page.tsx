import type { Metadata } from "next";
import Link from "next/link";
import { emailRegistry } from "@/emails/registry";

/** /dev/emails — index of the six transactional templates (R9-1…R9-6) with
   subject, preview text and List-Unsubscribe category per mail. Dev/preview
   surface only (noindex via /dev layout); sending is backend scope. */
export const metadata: Metadata = {
    title: "Email previews (dev)",
};

export default function Page() {
    return (
        <main className="mx-auto flex min-h-screen w-full max-w-[840px] flex-col gap-6 px-4 py-10">
            <header className="flex flex-col gap-1">
                <p className="text-xs font-bold tracking-[0.08em] text-rsm-steel uppercase">R9 · Transactional email — 600 px, table-safe, one job each</p>
                <h1 className="font-display text-2xl font-medium text-rsm-midnight">Email previews (dev)</h1>
                <p className="text-sm text-rsm-misty">
                    Templates live in <code className="text-xs">src/emails/</code> — the backend renders the same components with the same merge data.
                    System-font body, Space Grotesk headings with fallback, lime CTA as a padded &lt;a&gt;, all data as HTML text.
                </p>
            </header>
            <ul className="flex flex-col gap-3">
                {Object.entries(emailRegistry).map(([key, entry]) => (
                    <li key={key} className="flex flex-col gap-1 rounded-rsm-card border border-rsm-hairline bg-white p-4 shadow-rsm-sm">
                        <div className="flex flex-wrap items-baseline gap-x-3">
                            <span className="rounded-md bg-rsm-midnight px-2 py-0.5 font-display text-[11px] font-medium text-rsm-lime">{entry.frame}</span>
                            <Link href={`/dev/emails/${key}`} className="font-medium text-rsm-midnight underline-offset-4 hover:text-rsm-steel hover:underline">
                                {entry.label}
                            </Link>
                        </div>
                        <p className="text-sm text-rsm-charcoal">
                            <span className="font-bold">Subject:</span> {entry.subject}
                        </p>
                        <p className="text-xs text-rsm-misty">
                            <span className="font-bold">Preview:</span> {entry.preheader}
                        </p>
                        <p className="text-xs text-rsm-slate-50">{entry.category}</p>
                    </li>
                ))}
            </ul>
        </main>
    );
}
