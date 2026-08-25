import type { Metadata } from "next";
import { cookies } from "next/headers";
import { NotFoundView, RefusalView } from "@/components/report/state-views";
import { VerdictView } from "@/components/report/verdict-view";
import { parseLang } from "@/lib/i18n";
import { ACCOUNT_COOKIE, getAccount, getBySlug, isUnlocked, redactAnalysis } from "@/lib/store";
import { LangProvider } from "@/providers/lang";

/**
 * /r/:slug — verdict → full report on one URL (unlock in place; public = free tier).
 * Free summary is server-rendered crawlable HTML; locked flags are redacted at
 * the store boundary before anything reaches the client (§6.4, acceptance §12).
 * An unlocked report (asunto_account cookie) keeps this free summary with an
 * "open" banner until the full-report slice ships — flagged in the PR.
 */
export default async function Page({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { slug } = await params;
    const lang = parseLang((await searchParams).lang);
    const analysis = getBySlug(slug);

    const jar = await cookies();
    const account = getAccount(jar.get(ACCOUNT_COOKIE)?.value);
    const unlocked = !!account && !!analysis && isUnlocked(account.id, analysis.id);

    return (
        <LangProvider initialLang={lang}>
            {!analysis ? (
                <NotFoundView url={`https://asunnot.oikotie.fi/…/${slug}`} />
            ) : analysis.status === "done" ? (
                <VerdictView analysis={redactAnalysis(analysis)} unlocked={unlocked} />
            ) : analysis.status === "refused" || analysis.status === "withdrawn" ? (
                <RefusalView analysis={redactAnalysis(analysis)} />
            ) : (
                <NotFoundView url={`https://asunnot.oikotie.fi/…/${slug}`} />
            )}
        </LangProvider>
    );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const analysis = getBySlug(slug);
    if (!analysis?.listing) return { title: "Analysis" };
    return {
        title: `${analysis.listing.addr}, ${analysis.listing.city} — risk analysis`,
        description:
            analysis.status === "refused"
                ? "Analysis stopped — no verdict issued. No credit was spent."
                : "Apartment risk analysis · free summary — every claim quoted from the source.",
    };
}
