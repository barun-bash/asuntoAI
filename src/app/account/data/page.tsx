import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { AccountDataView } from "@/components/account/account-data-view";
import { dict } from "@/i18n/dict";
import { resolveLang } from "@/lib/i18n-server";
import { PRIVATE_OG_IMAGE } from "@/lib/og";
import { ACCOUNT_COOKIE, balanceOf, deletionPreview, getAccount, listAccountReports } from "@/lib/store";
import { LangProvider } from "@/providers/lang";

/* Private route (R8-5d): brand-only OG card, noindex. */
export const metadata: Metadata = {
    title: "Your data",
    robots: { index: false, follow: false },
    openGraph: { images: [{ url: PRIVATE_OG_IMAGE, width: 1200, height: 630 }] },
};

/**
 * /account/data (R16) — GDPR export + account deletion. ?deleted=1 is the
 * plain goodbye page after the emailed link completes the deletion (the
 * export offer and the refund receipt go by email — the final message we're
 * allowed to send, R16-2 annotation). The refund preview (unused credits ×
 * per-credit price paid) is computed server-side by the store — never in the
 * client (§6.2).
 */
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const sp = await searchParams;
    const lang = await resolveLang(sp.lang);
    const jar = await cookies();
    const account = getAccount(jar.get(ACCOUNT_COOKIE)?.value);
    const t = dict[lang];

    if (sp.deleted === "1") {
        return (
            <LangProvider initialLang={lang}>
                <main className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col justify-center px-4 pb-24">
                    <h1 className="font-display text-3xl font-medium text-rsm-midnight">{t.accountData.goodbyeTitle}</h1>
                    <p className="mt-3 text-[15px] leading-[1.55] wrap-anywhere text-rsm-charcoal">{t.accountData.goodbyeBody}</p>
                    <Link
                        href="/"
                        className="mt-6 inline-flex min-h-12 w-fit items-center justify-center rounded-full bg-rsm-lime px-6 text-base font-bold text-rsm-midnight transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75"
                    >
                        {t.accountData.goodbyeCta}
                    </Link>
                </main>
            </LangProvider>
        );
    }

    if (!account) {
        return (
            <LangProvider initialLang={lang}>
                <main className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col justify-center px-4 pb-24">
                    <h1 className="font-display text-3xl font-medium text-rsm-midnight">{t.accountData.title}</h1>
                    <p className="mt-3 text-[15px] leading-[1.55] wrap-anywhere text-rsm-charcoal">{t.accountData.anonymousBody}</p>
                    <Link
                        href="/signin"
                        className="mt-6 inline-flex min-h-12 w-fit items-center justify-center rounded-full bg-rsm-lime px-6 text-base font-bold text-rsm-midnight transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75"
                    >
                        {t.accountData.anonymousCta}
                    </Link>
                </main>
            </LangProvider>
        );
    }

    const created = new Date(account.createdAt);
    const since = `${String(created.getMonth() + 1).padStart(2, "0")}/${created.getFullYear()}`;
    const preview = deletionPreview(account.id);

    return (
        <LangProvider initialLang={lang}>
            <AccountDataView
                email={account.email}
                balance={balanceOf(account.id)}
                since={since}
                reportCount={listAccountReports(account.id).length}
                unusedCredits={preview.unusedCredits}
                refundAmountEur={preview.refundAmountEur}
                linkError={sp.error === "link"}
            />
        </LangProvider>
    );
}
