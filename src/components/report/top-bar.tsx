"use client";

import Image from "next/image";
import Link from "next/link";
import { LangToggle } from "@/components/report/lang-toggle";
import { useLang } from "@/providers/lang";
import { cx } from "@/utils/cx";

/**
 * Document-register top bar: logomark left, utilities right.
 * `analyseAnother` swaps the example-report link for "Analyse another" (R1-6).
 */
export function TopBar({ analyseAnother = false }: { analyseAnother?: boolean }) {
    const { t } = useLang();

    return (
        <header className="mx-auto flex w-full max-w-[840px] items-center justify-between gap-4 px-4 py-4 md:px-8">
            <Link href="/" aria-label="Resimator Report" className="flex min-h-11 items-center">
                <Image src="/assets/logo/logomark-glyph-positive.svg" alt="" width={28} height={28} priority />
            </Link>
            <nav className="flex items-center gap-2 md:gap-3">
                <Link
                    href={analyseAnother ? "/" : "/r/tuomiokirkonkatu-23-b-14-tampere"}
                    className={cx(
                        "hidden min-h-11 items-center rounded-full px-3 text-sm font-medium text-rsm-charcoal transition-colors duration-200 ease-rsm hover:text-rsm-steel md:inline-flex",
                    )}
                >
                    {analyseAnother ? t.nav.analyseAnother : t.nav.exampleReport}
                </Link>
                <LangToggle />
                <Link
                    href="/signin"
                    className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-rsm-charcoal transition-colors duration-200 ease-rsm hover:text-rsm-steel"
                >
                    {t.nav.signIn}
                </Link>
            </nav>
        </header>
    );
}
