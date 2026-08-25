import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { CompareView } from "@/components/account/compare-view";
import { dict } from "@/i18n/dict";
import { parseLang } from "@/lib/i18n";
import { PRIVATE_OG_IMAGE } from "@/lib/og";
import { ACCOUNT_COOKIE, balanceOf, compareReports, getAccount } from "@/lib/store";
import { LangProvider } from "@/providers/lang";

/* R8-5d: compare is a private route — brand-only OG card, noindex. */
export const metadata: Metadata = {
    title: "Compare",
    robots: { index: false, follow: false },
    openGraph: { images: [{ url: PRIVATE_OG_IMAGE, width: 1200, height: 630 }] },
};

/**
 * /reports/compare?ids=a,b,c — the R13 table (2–4 columns, selection order =
 * column order from the /reports compare mode). Each column is the report's
 * engine metrics frozen at its own version; staleness rides the header with
 * an inline free re-run. "best in row" marks facts only — never the verdict
 * row. Anonymous browsers get the sign-in prompt; an invalid selection gets
 * the pick prompt back to /reports.
 */
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const sp = await searchParams;
    const lang = parseLang(sp.lang);
    const jar = await cookies();
    const account = getAccount(jar.get(ACCOUNT_COOKIE)?.value);

    if (!account) {
        return (
            <LangProvider initialLang={lang}>
                <AnonymousPrompt lang={lang} />
            </LangProvider>
        );
    }

    const ids = (typeof sp.ids === "string" ? sp.ids : "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
    const result = compareReports(ids, account.id);

    return (
        <LangProvider initialLang={lang}>
            {result ? <CompareView data={result} balance={balanceOf(account.id)} email={account.email} /> : <PickPrompt lang={lang} />}
        </LangProvider>
    );
}

/** Anonymous state — compare is account-gated like the drawer (copy composed
   in register, flagged in the PR). */
function AnonymousPrompt({ lang }: { lang: "fi" | "en" }) {
    const t = dict[lang];
    return (
        <main className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col justify-center px-4 pb-24">
            <h1 className="font-display text-3xl font-medium text-rsm-midnight">{t.compare.title}</h1>
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

/** Bad selection (not 2–4 known reports) — route back to the drawer. */
function PickPrompt({ lang }: { lang: "fi" | "en" }) {
    const t = dict[lang];
    return (
        <main className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col justify-center px-4 pb-24">
            <h1 className="font-display text-3xl font-medium text-rsm-midnight">{t.compare.title}</h1>
            <p className="mt-3 text-[15px] leading-[1.55] wrap-anywhere text-rsm-charcoal">{t.compare.pickPrompt}</p>
            <Link
                href="/reports"
                className="mt-6 inline-flex min-h-12 items-center justify-center self-start rounded-full bg-rsm-lime px-6 text-base font-bold text-rsm-midnight transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75"
            >
                {t.compare.pickCta}
            </Link>
        </main>
    );
}
