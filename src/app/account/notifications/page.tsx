import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { NotificationsView } from "@/components/account/notifications-view";
import { dict } from "@/i18n/dict";
import { parseLang } from "@/lib/i18n";
import { PRIVATE_OG_IMAGE } from "@/lib/og";
import { ACCOUNT_COOKIE, balanceOf, getAccount, getNotifications, getWatch } from "@/lib/store";
import { LangProvider } from "@/providers/lang";

/* Private route (R8-5d): brand-only OG card, noindex. */
export const metadata: Metadata = {
    title: "Notifications",
    robots: { index: false, follow: false },
    openGraph: { images: [{ url: PRIVATE_OG_IMAGE, width: 1200, height: 630 }] },
};

/**
 * /account/notifications (R14). Prefs persist per account; tracked/watch
 * counts link to their objects ("per-object mutes live where the object
 * lives" — R14 header). Tracked count is 0 until the tracking slice (R12).
 */
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const sp = await searchParams;
    const lang = parseLang(sp.lang);
    const jar = await cookies();
    const account = getAccount(jar.get(ACCOUNT_COOKIE)?.value);
    const t = dict[lang];

    return (
        <LangProvider initialLang={lang}>
            {account ? (
                <NotificationsView
                    email={account.email}
                    balance={balanceOf(account.id)}
                    initial={getNotifications(account.id)}
                    trackedCount={0}
                    watchDistrict={getWatch(account.id)?.district}
                />
            ) : (
                <main className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col justify-center px-4 pb-24">
                    <h1 className="font-display text-3xl font-medium text-rsm-midnight">{t.notifications.title}</h1>
                    <p className="mt-3 text-[15px] leading-[1.55] wrap-anywhere text-rsm-charcoal">{t.reports.anonymousBody}</p>
                    <Link
                        href="/signin"
                        className="mt-6 inline-flex min-h-12 w-fit items-center justify-center rounded-full bg-rsm-lime px-6 text-base font-bold text-rsm-midnight transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75"
                    >
                        {t.reports.anonymousCta}
                    </Link>
                </main>
            )}
        </LangProvider>
    );
}
