"use client";

import Link from "next/link";
import { PasteBar } from "@/components/report/paste-bar";
import { TopBar } from "@/components/report/top-bar";
import { useLang } from "@/providers/lang";

interface RecentRow {
    slug: string;
    addr: string;
    meta: string;
    nums: string;
    numsFi: string;
    flags: string;
    flagsFi: string;
}

/**
 * Product landing (R1-1 desktop / R1-2 mobile): one Neon Lime action (Run analysis),
 * recent public analyses as the only marketing on the page.
 * Type per board: H1 Space Grotesk 500 54/1.1, body Satoshi 500 17/1.6.
 */
export function LandingView({ recent }: { recent: RecentRow[] }) {
    const { lang, t } = useLang();

    return (
        <div className="flex min-h-screen flex-col">
            <TopBar />
            <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col justify-center gap-8 px-4 py-12 md:py-20">
                <div className="flex flex-col gap-4">
                    <p className="text-xs font-bold tracking-[0.08em] text-rsm-steel uppercase">{t.landing.eyebrow}</p>
                    <h1 className="font-display text-[42px] leading-[1.1] font-medium tracking-[-0.01em] text-rsm-midnight md:text-[54px]">{t.landing.h1}</h1>
                    <p className="max-w-xl text-[17px] leading-[1.6] font-medium wrap-anywhere text-rsm-charcoal">
                        <span className="hidden md:inline">{t.landing.lead}</span>
                        <span className="md:hidden">{t.landing.leadShort}</span>
                    </p>
                </div>

                <PasteBar />

                <p className="text-sm wrap-anywhere text-rsm-misty">
                    <span className="hidden md:inline">{t.landing.subline}</span>
                    <span className="md:hidden">{t.landing.sublineShort}</span>
                </p>

                <section aria-labelledby="recent-title" className="mt-4 flex flex-col gap-3">
                    <h2 id="recent-title" className="text-sm font-bold tracking-[0.06em] text-rsm-midnight uppercase">
                        {t.landing.recent}
                    </h2>
                    <ul className="flex flex-col gap-2">
                        {recent.map((row) => (
                            <li key={row.slug}>
                                <Link
                                    href={`/r/${row.slug}`}
                                    className="flex min-h-11 flex-col gap-0.5 rounded-rsm-tile border border-rsm-hairline bg-white p-4 shadow-rsm-sm transition-colors duration-200 ease-rsm hover:border-rsm-steel-50 md:flex-row md:items-center md:justify-between"
                                >
                                    <span className="text-sm font-bold wrap-anywhere text-rsm-midnight">{row.addr}</span>
                                    <span className="tnum text-xs wrap-anywhere text-rsm-misty">
                                        {row.meta} · {lang === "fi" ? row.numsFi : row.nums} · {lang === "fi" ? row.flagsFi : row.flags}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            </main>

            <footer className="mx-auto flex w-full max-w-[720px] flex-col gap-1 px-4 pb-8 text-xs text-rsm-misty">
                <p>
                    {t.common.company} ·{" "}
                    <a href="mailto:hello@resimator.fi" className="text-rsm-steel underline-offset-4 hover:underline">
                        hello@resimator.fi
                    </a>{" "}
                    · {t.landing.privacy}
                </p>
                <p>{t.landing.footerLegal}</p>
            </footer>
        </div>
    );
}
