import { AnalysingView } from "@/components/report/analysing-view";
import { resolveLang } from "@/lib/i18n-server";
import { LangProvider } from "@/providers/lang";

/** SSE progress (R1-4/5). Refresh re-attaches to the stream. */
export default async function Page({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { id } = await params;
    const lang = await resolveLang((await searchParams).lang);

    return (
        <LangProvider initialLang={lang}>
            <AnalysingView runId={id} />
        </LangProvider>
    );
}
