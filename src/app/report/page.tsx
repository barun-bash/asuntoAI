import type { Metadata } from "next";
import { MarketingLanding } from "@/components/marketing/marketing-landing";
import { dict } from "@/i18n/dict";
import { LangProvider } from "@/providers/lang";

/**
 * /report — EN mirror of /raportti (Landing board). Same content, locale
 * pinned by route; the FI·EN toggle links back to /raportti. FAQPage JSON-LD
 * is emitted server-side from the EN strings.
 */
export default function Page() {
    const f = dict.en.marketing.faq;
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
        <LangProvider initialLang="en">
            {/* The root layout pins <html lang="fi"> and a route-group layout
               can't re-render <html>, so this tiny inline script sets en during
               the initial HTML parse — pre-hydration, before any paint or AT
               announcement. MarketingLanding's effect repeats it for
               client-side FI⇄EN navigation (where this script doesn't re-run). */}
            <script dangerouslySetInnerHTML={{ __html: 'document.documentElement.lang="en"' }} />
            <MarketingLanding />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        </LangProvider>
    );
}

export const metadata: Metadata = {
    title: "The listing won’t mention the 58 000 € pipe renovation",
    description: dict.en.marketing.hero.sub,
    alternates: {
        canonical: "/report",
        languages: { fi: "/raportti", en: "/report" },
    },
    openGraph: {
        title: "Resimator Report — the listing won’t mention the 58 000 € pipe renovation",
        description: dict.en.marketing.hero.sub,
        type: "website",
    },
};
