import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { ReportsView } from "@/components/account/reports-view";
import { dict } from "@/i18n/dict";
import { resolveLang } from "@/lib/i18n-server";
import { PRIVATE_OG_IMAGE } from "@/lib/og";
import { ACCOUNT_COOKIE, balanceOf, getAccount, getWatch, listAccountReports } from "@/lib/store";
import { LangProvider } from "@/providers/lang";

/* R8-5d: /reports is a private route — brand-only OG card, noindex. */
export const metadata: Metadata = {
    title: "My reports",
    robots: { index: false, follow: false },
    openGraph: { images: [{ url: PRIVATE_OG_IMAGE, width: 1200, height: 630 }] },
};

/**
 * /reports — the account drawer (R10-*). The cookie account's rows derive
 * from the store (unlocked + created analyses); anonymous browsers get the
 * sign-in prompt, a signed-in account with nothing yet gets R10-3.
 */
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const sp = await searchParams;
    const lang = await resolveLang(sp.lang);
    const jar = await cookies();
    const account = getAccount(jar.get(ACCOUNT_COOKIE)?.value);

    return (
        <LangProvider initialLang={lang}>
            {account ? (
                <ReportsView rows={listAccountReports(account.id)} balance={balanceOf(account.id)} email={account.email} watch={getWatch(account.id)} />
            ) : (
                <AnonymousPrompt lang={lang} />
            )}
        </LangProvider>
    );
}

/** Anonymous state — the drawer is account-gated; the prompt routes to the
   magic-link form (copy composed in register, flagged in the PR). */
function AnonymousPrompt({ lang }: { lang: "fi" | "en" }) {
    const t = dict[lang];
    return (
        <main className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col justify-center px-4 pb-24">
            <h1 className="font-display text-3xl font-medium text-rsm-midnight">{t.reports.title}</h1>
            <p className="mt-3 text-[15px] leading-[1.55] wrap-anywhere text-rsm-charcoal">{t.reports.anonymousBody}</p>
            <div className="mt-6 flex flex-col items-start gap-2">
                <Link
                    href="/signin"
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-rsm-lime px-6 text-base font-bold text-rsm-midnight transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75"
                >
                    {t.reports.anonymousCta}
                </Link>
                <Link href="/" className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-rsm-steel underline underline-offset-2">
                    {t.reports.emptyCta}
                </Link>
            </div>
        </main>
    );
}
