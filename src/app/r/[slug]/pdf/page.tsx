import Link from "next/link";

/** TODO(slice 5): the A4 print artifact (P1–P3 + appendices A/B/C, handoff §10).
   Placeholder until that slice ships — the report's Download PDF links here. */
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    return (
        <main className="mx-auto flex min-h-screen w-full max-w-[704px] flex-col items-start justify-center gap-4 px-4">
            <p className="text-xs font-bold tracking-[0.08em] text-rsm-steel uppercase">Resimator Report</p>
            <h1 className="font-display text-3xl font-medium text-rsm-midnight">Download PDF</h1>
            <p className="text-sm text-rsm-misty">The print-ready A4 report (P1–P3 + appendices) ships with the print slice.</p>
            <Link
                href={`/r/${slug}`}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-rsm-lime px-6 text-base font-bold text-rsm-midnight transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75"
            >
                Back to the report
            </Link>
        </main>
    );
}
