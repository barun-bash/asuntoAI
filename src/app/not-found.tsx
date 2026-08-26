import Link from "next/link";

/** Route-level 404 — same sheet chrome as the flow errors (R1-9 pattern). */
export default function NotFound() {
    return (
        <main className="mx-auto flex min-h-screen w-full max-w-[704px] flex-col items-start justify-center gap-4 px-4">
            <p className="text-xs font-bold tracking-[0.08em] text-rsm-steel uppercase">Resimator Report</p>
            <h1 className="font-display text-3xl font-medium wrap-anywhere text-rsm-midnight">We couldn’t fetch that listing</h1>
            <p className="text-sm leading-relaxed wrap-anywhere text-rsm-charcoal">Listings disappear when they’re sold or pulled. Nothing was charged.</p>
            <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-rsm-lime px-6 text-base font-bold text-rsm-midnight transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75"
            >
                Paste another link
            </Link>
        </main>
    );
}
