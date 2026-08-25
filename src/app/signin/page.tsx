import type { Metadata } from "next";
import Link from "next/link";
import { PRIVATE_OG_IMAGE } from "@/lib/og";

/* R8-5d: sign-in is a private route — brand-only OG card, noindex. */
export const metadata: Metadata = {
    title: "Sign in",
    robots: { index: false, follow: false },
    openGraph: { images: [{ url: PRIVATE_OG_IMAGE, width: 1200, height: 630 }] },
};

/** TODO(R10 slice): magic-link sign-in (R10-2/6). Placeholder until that slice ships. */
export default function Page() {
    return (
        <main className="mx-auto flex min-h-screen w-full max-w-[704px] flex-col items-start justify-center gap-4 px-4">
            <p className="text-xs font-bold tracking-[0.08em] text-rsm-steel uppercase">Resimator Report</p>
            <h1 className="font-display text-3xl font-medium text-rsm-midnight">Sign in</h1>
            <p className="text-sm text-rsm-misty">Magic-link sign-in ships with the account slice (R10).</p>
            <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-rsm-lime px-6 text-base font-bold text-rsm-midnight transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75"
            >
                Back to start
            </Link>
        </main>
    );
}
