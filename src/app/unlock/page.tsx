import Link from "next/link";

/**
 * TODO(R6 slice): packs + payment states (R6-1…R6-10). Placeholder keeps the
 * verdict seam's CTA navigable until the checkout ships — no fake payment UI.
 */
export default function Page() {
    return (
        <main className="mx-auto flex min-h-screen w-full max-w-[704px] flex-col items-start justify-center gap-4 px-4">
            <p className="text-xs font-bold tracking-[0.08em] text-rsm-steel uppercase">Resimator Report</p>
            <h1 className="font-display text-3xl font-medium text-rsm-midnight">Unlock full report · 79 €</h1>
            <p className="text-sm text-rsm-misty">Checkout ships with the purchase slice (R6). Nothing is charged before a verdict exists.</p>
            <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-rsm-lime px-6 text-base font-bold text-rsm-midnight transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75"
            >
                Back to start
            </Link>
        </main>
    );
}
