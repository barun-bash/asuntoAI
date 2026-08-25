import type { Metadata } from "next";

/* Dev/preview surfaces (R8-4 share preview, R9 email previews) — never
   indexed. Actual sending is backend scope (MJML per the handoff notes). */
export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function DevLayout({ children }: { children: React.ReactNode }) {
    return children;
}
