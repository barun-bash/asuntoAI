import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { emailRegistry } from "@/emails/registry";

/** /dev/emails/:name — renders one R9 template on the board's email canvas
   (#EFECE6) with its subject/preview/List-Unsubscribe chrome above. Preview
   only (noindex via /dev layout); production sending is backend scope —
   MJML per the handoff notes, these components hold the canonical copy. */
export const metadata: Metadata = {
    title: "Email preview (dev)",
};

export function generateStaticParams() {
    return Object.keys(emailRegistry).map((name) => ({ name }));
}

export default async function Page({ params }: { params: Promise<{ name: string }> }) {
    const { name } = await params;
    const entry = emailRegistry[name];
    if (!entry) notFound();

    const Template = entry.component;
    return (
        <main className="flex min-h-screen flex-col">
            <header className="mx-auto flex w-full max-w-[700px] flex-col gap-1 px-4 pt-8 pb-5 text-sm">
                <p className="text-xs font-bold tracking-[0.08em] text-rsm-steel uppercase">
                    <Link href="/dev/emails" className="underline-offset-4 hover:underline">
                        ← Email previews
                    </Link>{" "}
                    · {entry.frame} · {entry.label}
                </p>
                <p className="text-rsm-charcoal">
                    <span className="font-bold">Subject:</span> {entry.subject}
                </p>
                <p className="text-xs text-rsm-misty">
                    <span className="font-bold">Preview text:</span> {entry.preheader}
                </p>
                <p className="text-xs text-rsm-slate-50">{entry.category}</p>
            </header>
            <div className="border-t border-rsm-hairline">
                <Template lang={entry.lang} />
            </div>
        </main>
    );
}
