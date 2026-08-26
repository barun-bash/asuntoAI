import type { Metadata } from "next";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { PartnerConsoleView } from "@/components/partner/console-view";
import { PRIVATE_OG_IMAGE } from "@/lib/og";
import { ACCOUNT_COOKIE, getAccount, getPartnerConsoleOrg, partnerConsoleData } from "@/lib/store";

/* Private route (like R8-5d): brand-only OG card, noindex. The console follows
   the R17 frames' language — EN (docs are EN-only per the R17-2 notes; the
   consumer surfaces stay FI/EN, untouched). */
export const metadata: Metadata = {
    title: "Partner console",
    robots: { index: false, follow: false },
    openGraph: { images: [{ url: PRIVATE_OG_IMAGE, width: 1200, height: 630 }] },
};

/**
 * /partner — the partner console (R17-1): keys, usage, webhook. Mock access:
   gated behind the account cookie — partner agreement provisioning is sales
   scope, so any signed-in account sees the one seeded org (R17-1's
   Kiinteistömaailma Tampere Keskusta); the real backend maps accounts → orgs.
 */
export default async function Page() {
    const jar = await cookies();
    const account = getAccount(jar.get(ACCOUNT_COOKIE)?.value);

    if (!account) {
        // Composed gate copy (EN, register) — the frames don't cover the
        // signed-out console; flagged in the PR.
        return (
            <main className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col justify-center px-4 pb-24">
                <h1 className="font-display text-3xl font-medium text-rsm-midnight">Partner console</h1>
                <p className="mt-3 text-[15px] leading-[1.55] wrap-anywhere text-rsm-charcoal">
                    The console is part of a partner agreement. Sign in with the email the agreement names — same email link, no password.
                </p>
                <Link
                    href="/signin"
                    className="mt-6 inline-flex min-h-12 w-fit items-center justify-center rounded-full bg-rsm-lime px-6 text-base font-bold text-rsm-midnight transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75"
                >
                    Sign in
                </Link>
            </main>
        );
    }

    const data = partnerConsoleData(getPartnerConsoleOrg());
    return (
        <main className="min-h-dvh pb-24">
            <header className="mx-auto flex w-full max-w-[1120px] items-center justify-between gap-3 px-4 py-4 md:px-8">
                <Link href="/" aria-label="Resimator Report" className="flex min-h-11 items-center">
                    <Image src="/assets/logo/logomark-glyph-positive.svg" alt="" width={28} height={28} priority />
                </Link>
                <Link
                    href="/partner/docs"
                    className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-rsm-steel underline underline-offset-2"
                >
                    API docs →
                </Link>
            </header>
            <PartnerConsoleView initial={data} />
        </main>
    );
}
