import { LandingView } from "@/components/report/landing-view";
import { type Lang, parseLang } from "@/lib/i18n";
import { recentPublic } from "@/mocks/fixtures";
import { LangProvider } from "@/providers/lang";

/** Product landing (R1-1/2/3, R15-1): paste bar → analyse → verdict. */
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const params = await searchParams;
    const lang: Lang = parseLang(params.lang);

    return (
        <LangProvider initialLang={lang}>
            <LandingView recent={recentPublic} />
        </LangProvider>
    );
}
