import type { Metadata } from "next";
import { SignInView } from "@/components/account/signin-view";
import { parseLang } from "@/lib/i18n";
import { PRIVATE_OG_IMAGE } from "@/lib/og";
import { LangProvider } from "@/providers/lang";

/* R8-5d: sign-in is a private route — brand-only OG card, noindex. */
export const metadata: Metadata = {
    title: "Sign in",
    robots: { index: false, follow: false },
    openGraph: { images: [{ url: PRIVATE_OG_IMAGE, width: 1200, height: 630 }] },
};

/** /signin — magic link, no password (R10-2 form → R10-6 "link sent").
   ?error=link surfaces a dead/expired callback link (see /api/auth/callback). */
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const sp = await searchParams;
    return (
        <LangProvider initialLang={parseLang(sp.lang)}>
            <SignInView linkError={sp.error === "link"} />
        </LangProvider>
    );
}
