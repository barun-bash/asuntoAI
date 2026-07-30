/**
 * Canonical engine fixture — the deal used on every design board
 * (Tuomiokirkonkatu 23 B 14, Tampere · Oikotie 21966412 · № 2026-1187).
 * Every figure is engine-authored here; the UI formats but never computes (§6.2).
 * Locked flags exist ONLY in redacted form — there is no hidden content to leak (§6.4).
 */
import type { Analysis } from "@/lib/types";

export const CANONICAL_SLUG = "tuomiokirkonkatu-23-b-14-tampere";
export const REFUSED_SLUG = "rautatienkatu-18-c-44-tampere";
export const WITHDRAWN_SLUG = "kalevanpuisto-4-a-9-tampere";

export const canonicalAnalysis: Analysis = {
    id: "ana_2026_1187",
    slug: CANONICAL_SLUG,
    status: "done",
    number: "2026-1187",
    readAt: "2026-07-28T13:41:00+03:00",
    steps: [
        {
            key: "fetch",
            label: "Listing fetched",
            labelFi: "Ilmoitus haettu",
            foundFact: "54 m² · 1962 · debt-free 118 000 €",
            foundFactFi: "54 m² · 1962 · velaton hinta 118 000 €",
            t: 6,
        },
        {
            key: "docs",
            label: "Documents requested",
            labelFi: "Dokumentteja pyydetty",
            foundFact: "isännöitsijäntodistus not provided",
            foundFactFi: "isännöitsijäntodistusta ei toimitettu",
            t: 14,
        },
        {
            key: "history",
            label: "Renovation history read",
            labelFi: "Remonttihistoria luettu",
            foundFact: "condition survey 2024, LVIS planning started",
            foundFactFi: "kuntotutkimus 2024, LVIS-suunnittelu käynnissä",
            flagged: true,
            t: 24,
        },
        {
            key: "market",
            label: "Market data mapped",
            labelFi: "Markkinadata yhdistetty",
            foundFact: "27 comparable contracts, Pirkanmaa",
            foundFactFi: "27 vertailukohdetta, Pirkanmaa",
            t: 36,
        },
        {
            key: "pricing",
            label: "Risk priced",
            labelFi: "Riski hinnoiteltu",
            foundFact: "58 200 € liability, window 4–7 years",
            foundFactFi: "58 200 € vastuu, ikkuna 4–7 vuotta",
            flagged: true,
            t: 46,
        },
        {
            key: "verdict",
            label: "Verdict composed",
            labelFi: "Päätelmä koostettu",
            foundFact: "3 flags · fails Balanced 3 / 14",
            foundFactFi: "3 lippua · ei läpäise Tasapainoista 3 / 14",
            t: 56,
        },
    ],
    listing: {
        addr: "Tuomiokirkonkatu 23 B 14",
        city: "Tampere",
        postalCode: "33100",
        type: "2h+kk",
        m2: 54,
        floor: "4/6",
        lift: true,
        built: 1962,
        company: "As Oy Tampereen Tuomiokolmio",
        askPrice: 104600,
        loanShare: 13400,
        debtFree: 118000,
        oikotieId: "21966412",
        fetchedAt: "2026-07-28T13:40:00+03:00",
    },
    verdict: {
        grossYield: {
            value: 8.6,
            basis: "MAPPED",
            note: "P50 rent 845 € × 12 ÷ debt-free 118 000 €. The number the listing wants you to see.",
            noteFi: "Vuokra P50 845 € × 12 ÷ velaton hinta 118 000 €.",
        },
        realYield: {
            value: 5.8,
            basis: "MODELLED",
            deltaPp: -2.8,
            note: "Same rent against 176 200 € — price plus the 58 200 € renovation liability below.",
            noteFi: "Sama vuokra hintaan 176 200 € — velaton hinta + korjausvastuu 58 200 €.",
        },
        liability: {
            total: 58200,
            window: "4–7 YEARS",
            windowFi: "4–7 V",
            items: [
                { label: "Piping 54 m² × 890 €/m²", labelFi: "Putkisto 54 m² × 890 €/m²", amount: 48100, basis: "MODELLED" },
                { label: "Roof share", labelFi: "Katto-osuus", amount: 4900, basis: "ESTIMATED" },
                { label: "Windows & balcony doors share", labelFi: "Ikkuna- ja parvekeoviosuus", amount: 5200, basis: "ESTIMATED" },
            ],
        },
        grades: {
            company: { grade: "C", note: "Pipes undone, plot leased, thin repair history", noteFi: "Putket tekemättä, vuokratontti" },
            municipality: { grade: "A", name: "Tampere", note: "Population +1.1 %/y · rental demand deep", noteFi: "Väestö +1,1 %/v" },
        },
        flagCount: { total: 3, high: 1, caution: 2 },
        flags: [
            {
                id: "flag-pipe-renovation",
                severity: "high",
                locked: false,
                title: "Pipe renovation surveyed but not carried out",
                titleFi: "Putkiremontti kartoitettu, mutta tekemättä",
                body: "The building has commissioned a condition survey and started LVIS project planning. No pipe renovation has been carried out since 1962. Sequence-wise, that is the step a housing company takes 4–7 years before the work — and the cost lands on the shares, not the seller.",
                bodyFi: "Kuntotutkimus on teetetty ja LVIS-hankesuunnittelu käynnistetty. Linjasaneerausta ei ole tehty vuoden 1962 jälkeen. Tämä on vaihe, jonka taloyhtiö tekee tyypillisesti 4–7 vuotta ennen urakkaa — kustannus jää osakkaalle, ei myyjälle.",
                costRange: "58 200 €",
                costRangeFi: "58 200 €",
                quotes: [
                    {
                        text: "”Taloyhtiössä on teetetty kuntotutkimus 2024 ja LVIS-hankesuunnittelu on käynnistetty.”",
                        source: "Listing text · Oikotie 21966412 · read 28.07.2026",
                        sourceFi: "Ilmoitusteksti · Oikotie 21966412 · luettu 28.7.2026",
                        translation: "“A condition survey was commissioned in 2024 and HVAC-E project planning has begun.”",
                    },
                    {
                        text: "”Viemäreiden kuvaus tehty 2023, korjaustarpeita todettu.”",
                        source: "Listing text · Oikotie 21966412",
                        sourceFi: "Ilmoitusteksti · Oikotie 21966412",
                        translation: "“Drains filmed in 2023, repair needs identified.”",
                    },
                ],
            },
            { id: "flag-locked-2", severity: "caution", locked: true, costRange: "5–9 K€", costRangeFi: "5–9 t€" },
            { id: "flag-locked-3", severity: "caution", locked: true, costRange: "5–9 K€", costRangeFi: "5–9 t€" },
        ],
    },
};

export const refusedAnalysis: Analysis = {
    id: "ana_2026_1191",
    slug: REFUSED_SLUG,
    status: "refused",
    number: "2026-1191",
    readAt: "2026-07-28T13:41:00+03:00",
    steps: [],
    listing: {
        addr: "Rautatienkatu 18 C 44",
        city: "Tampere",
        type: "3h",
        m2: 74,
        floor: "7/8",
        built: 1974,
        askPrice: 189000,
        loanShare: 0,
        debtFree: 189000,
        oikotieId: "21967001",
        fetchedAt: "2026-07-28T13:40:00+03:00",
    },
    refusal: {
        heading: "We couldn’t verify enough to underwrite this one",
        headingFi: "Emme voineet varmentaa tarpeeksi tehdäksemme päätelmän",
        body: "Rautatienkatu 18 C 44, Tampere. Two of the five extraction passes came back low-confidence: the listing gives two conflicting years for the roof (“vesikatto 2011” and “kattoremontti 2001”) and the renovation history is a scanned image we can’t read reliably. A verdict built on a guess would be worth less than no verdict — so we stopped.",
        bodyFi: "Rautatienkatu 18 C 44, Tampere. Kaksi viidestä poimintakierroksesta palautui heikolla luottamuksella: ilmoitus antaa kaksi ristiriitaista vuotta katolle (”vesikatto 2011” ja ”kattoremontti 2001”), ja remonttihistoria on skannattu kuva, jota emme lue luotettavasti. Arvaukseen perustuva päätelmä olisi vähemmän arvokas kuin päätelmän puuttuminen — joten pysähdyimme.",
        read: [
            { text: "3h, 74 m², 7/8 krs · asking 189 000 €", textFi: "3h, 74 m², 7/8 krs · myyntihinta 189 000 €", basis: "OBSERVED" },
            { text: "Hoitovastike 4,90 €/m²", textFi: "Hoitovastike 4,90 €/m²", basis: "OBSERVED" },
            { text: "Roof year: conflict — 2011 vs 2001", textFi: "Katon vuosi: ristiriita — 2011 vs 2001", basis: "LOW_CONFIDENCE" },
            { text: "Renovation history: unreadable scan", textFi: "Remonttihistoria: lukukelvoton skannaus", basis: "LOW_CONFIDENCE" },
        ],
        unlock: "Ask the agent for the isännöitsijäntodistus — it states the repair years unambiguously. Or the PTS (long-term plan), which prices what’s coming. Paste this link again once the listing text is fixed — the re-run is free.",
        unlockFi:
            "Pyydä välittäjältä isännöitsijäntodistus — siinä korjausvuodet käyvät yksiselitteisesti ilmi. Tai PTS (pitkän tähtäimen suunnitelma), joka hinnoittelee tulevan. Liitä sama linkki uudelleen, kun ilmoitusteksti on korjattu — uusi ajo on maksuton.",
    },
};

export const withdrawnAnalysis: Analysis = {
    id: "ana_2026_1190",
    slug: WITHDRAWN_SLUG,
    status: "withdrawn",
    number: "2026-1190",
    readAt: "2026-07-28T13:41:00+03:00",
    steps: [],
    listing: {
        addr: "Kalevanpuisto 4 A 9",
        city: "Tampere",
        type: "2h+k",
        m2: 58,
        floor: "3/5",
        built: 1971,
        company: "As Oy Kalevan Puistotalo",
        askPrice: 0,
        loanShare: 0,
        debtFree: 0,
        oikotieId: "21966950",
        fetchedAt: "2026-07-28T13:40:00+03:00",
    },
    refusal: {
        heading: "The listing was withdrawn while we read it",
        headingFi: "Ilmoitus poistettiin kesken lukemisen",
        body: "Kalevanpuisto 4 A 9, Tampere went offline between steps two and three. We kept what we’d already read — the facts below are real, but there’s no price to verdict against. No credit was spent.",
        bodyFi: "Kalevanpuisto 4 A 9, Tampere poistui verkosta vaiheiden kaksi ja kolme välissä. Säilytämme jo luetun — alla olevat faktat ovat todellisia, mutta hintaa ei ole, johon päätelmä kohdistuisi. Krediittiä ei käytetty.",
        read: [
            { text: "2h+k, 58 m², rak. 1971 · As Oy Kalevan Puistotalo", textFi: "2h+k, 58 m², rak. 1971 · As Oy Kalevan Puistotalo", basis: "OBSERVED" },
            { text: "“Linjasaneeraus tehty 2019” — pipes done", textFi: "“Linjasaneeraus tehty 2019” — putket kunnossa", basis: "OBSERVED" },
        ],
        unlock: "Not reached: housing-company grade, risk pricing, the fourteen tests.",
        unlockFi: "Ei ehditty: taloyhtiön arvosana, riskin hinnoittelu, neljätoista testiä.",
    },
};

export const fixtures: Record<string, Analysis> = {
    [CANONICAL_SLUG]: canonicalAnalysis,
    [REFUSED_SLUG]: refusedAnalysis,
    [WITHDRAWN_SLUG]: withdrawnAnalysis,
};

/** Recent public analyses for the landing example rows (R1-1 marketing strip). */
export const recentPublic = [
    {
        slug: CANONICAL_SLUG,
        addr: "Tuomiokirkonkatu 23 B 14, Tampere",
        meta: "2h+kk · 54 m² · 1962",
        nums: "Real yield 5.8 % · debt-free 118 000 €",
        numsFi: "Todellinen tuotto 5,8 % · velaton 118 000 €",
        flags: "3 flags — 1 high",
        flagsFi: "3 lippua — 1 vakava",
    },
    {
        slug: REFUSED_SLUG,
        addr: "Rautatienkatu 18 C 44, Tampere",
        meta: "3h · 74 m² · 1974",
        nums: "Analysis refused — low confidence",
        numsFi: "Analyysi hylätty — heikko luottamus",
        flags: "No charge",
        flagsFi: "Ei veloitusta",
    },
];

/** The example-listing chip (R15-1) fills this real listing. */
export const EXAMPLE_URL = "https://asunnot.oikotie.fi/myytavat-asunnot/tampere/21966412";
