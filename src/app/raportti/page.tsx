import type { Metadata } from "next";
import { MarketingLanding } from "@/components/marketing/marketing-landing";
import { dict } from "@/i18n/dict";
import { LangProvider } from "@/providers/lang";

/**
 * /raportti — marketing landing, FI default (Landing board). /report is the
 * EN mirror; the FI·EN toggle in the nav links across. Every CTA lands on /
 * or /unlock, never a signup form (board handoff note). The FAQ is mirrored
 * as FAQPage JSON-LD server-side (board annotation).
 */
export default function Page() {
    const f = dict.fi.marketing.faq;
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
            { q: f.q1, a: f.a1 },
            { q: f.q2, a: f.a2 },
            { q: f.q3, a: f.a3 },
            { q: f.q4, a: f.a4 },
            { q: f.q5, a: f.a5 },
            { q: f.q6, a: f.a6 },
        ].map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
    };

    return (
        <LangProvider initialLang="fi">
            <MarketingLanding />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        </LangProvider>
    );
}

export const metadata: Metadata = {
    title: "Ilmoitus ei kerro 58 000 euron putkiremontista",
    description: dict.fi.marketing.hero.sub,
    alternates: {
        canonical: "/raportti",
        languages: { fi: "/raportti", en: "/report" },
    },
    openGraph: {
        title: "Resimator Report — ilmoitus ei kerro 58 000 euron putkiremontista",
        description: dict.fi.marketing.hero.sub,
        type: "website",
    },
};
