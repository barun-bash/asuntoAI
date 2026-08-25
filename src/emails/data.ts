/**
 * Email merge data (R9-1…R9-6) — stands in for what the send layer merges:
 * receipt figures from the credits ledger, the R9-3 "what changes" teaser
 * ENGINE-COMPUTED BEFORE SEND (the email never promises an unknown, R9-3
 * annotation), and the R9-6 watch-match listing snapshot. € strings carry
 * fi-FI NBSP grouping in both languages (§7). Strings live in src/i18n/dict.ts
 * (t.emails); only figures + engine prose live here.
 */
import { SITE_ORIGIN } from "@/lib/og";
import { CANONICAL_SLUG } from "@/mocks/fixtures";

const NBSP = " ";

export const REPORT_URL = `${SITE_ORIGIN}/r/${CANONICAL_SLUG}`;
/** The receipt CTA is a magic sign-in link ("the link signs you in
   automatically · valid 30 days"). */
export const MAGIC_REPORT_URL = `${REPORT_URL}?m=signin-preview`;

export const emailData = {
    user: { name: "Mikko" },

    /* R9-1/R9-4 — receipt + access (5-report pack purchase, 1 credit spent). */
    receipt: {
        no: "2026-8802",
        packName: { fi: `5 raportin paketti`, en: "5-report pack" },
        price: { fi: `199,00${NBSP}€`, en: `199.00${NBSP}€` },
        vat: { fi: `40,42${NBSP}€`, en: `40.42${NBSP}€` },
        usedOn: "Tuomiokirkonkatu 23 B 14",
        remaining: 4,
        ctaHref: MAGIC_REPORT_URL,
        privacyHref: `${SITE_ORIGIN}/privacy`,
    },

    /* R9-2 — report ready (the free summary of the canonical analysis). */
    ready: {
        addr: "Tuomiokirkonkatu 23 B 14",
        gross: { fi: `8,6${NBSP}%`, en: `8.6${NBSP}%` },
        real: { fi: `5,8${NBSP}%`, en: `5.8${NBSP}%` },
        flags: "3",
        preset: { fi: "Tasapainoinen", en: "Balanced" },
        fails: 3,
        total: 14,
        ctaHref: REPORT_URL,
    },

    /* R9-3 — listing changed (owner alert). The teaser is engine-computed
       before send: what changes at the new price, nothing unknown. */
    changed: {
        delta: `6${NBSP}000${NBSP}€`,
        addr: "Tuomiokirkonkatu 23 B 14",
        now: `98${NBSP}600${NBSP}€`,
        was: `104${NBSP}600${NBSP}€`,
        teaser: {
            /* FI translated from the EN frame (engine prose) — flagged in the PR. */
            fi: [
                { text: `Hinnalla 98${NBSP}600${NBSP}€ peruskoron kassavirta kääntyy ` },
                { strong: "positiiviseksi" },
                { text: " ja Tasapainoinen politiikkasi hylkää " },
                { strong: "2 / 14" },
                { text: " kolmen sijaan. Taloyhtiön liput eivät liiku." },
            ],
            en: [
                { text: `At 98${NBSP}600${NBSP}€, base-rate cash flow turns ` },
                { strong: "positive" },
                { text: " and your Balanced policy fails " },
                { strong: "2 of 14" },
                { text: " instead of 3. The building’s flags don’t move." },
            ],
        } as Record<"fi" | "en", ({ text: string } | { strong: string })[]>,
        ctaHref: REPORT_URL,
        stopHref: `${SITE_ORIGIN}/account/notifications`,
    },

    /* R9-5 — refund (credit returned; report № attached automatically). */
    refund: {
        no: "2026-8802",
        reportNo: "2026-1187",
        addr: "Tuomiokirkonkatu 23 B 14",
        balance: 5,
    },

    /* R9-6 — watch match (sent only when the policy-filter toggle passes). */
    watch: {
        district: { fi: "Tampereen keskusta", en: "Tampere keskusta" },
        addr: "Aleksanterinkatu 31 B 7",
        type: "2h",
        max: `130${NBSP}000${NBSP}€`,
        gross: { fi: `7,8${NBSP}%`, en: `7.8${NBSP}%` },
        real: { fi: `7,5${NBSP}%`, en: `7.5${NBSP}%` },
        flags: "1",
        passN: 14,
        passTotal: 14,
        metaLine: {
            fi: `2h+k · 47 m² · 3/5 krs · 1978 · velaton 126${NBSP}500${NBSP}€ · putket tehty 2016 · pyynti 4 % alueen mediaanin alle`,
            en: `2h+k · 47 m² · 3/5 krs · 1978 · debt-free 126${NBSP}500${NBSP}€ · pipes done 2016 · asking 4 % under district median`,
        },
        ctaHref: `${SITE_ORIGIN}/r/aleksanterinkatu-31-b-7-tampere`,
        editHref: `${SITE_ORIGIN}/account/notifications`,
        stopHref: `${SITE_ORIGIN}/account/notifications`,
    },
} as const;
