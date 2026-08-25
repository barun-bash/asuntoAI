/**
 * Canonical engine fixture — the deal used on every design board
 * (Tuomiokirkonkatu 23 B 14, Tampere · Oikotie 21966412 · № 2026-1187).
 * Every figure is engine-authored here; the UI formats but never computes (§6.2).
 * Locked flags exist ONLY in redacted form — there is no hidden content to leak (§6.4).
 */
import type { Analysis, Pack, PolicyActual, PolicyData, PolicyPresetKey, PolicyTestDef } from "@/lib/types";

export const CANONICAL_SLUG = "tuomiokirkonkatu-23-b-14-tampere";
export const REFUSED_SLUG = "rautatienkatu-18-c-44-tampere";
export const WITHDRAWN_SLUG = "kalevanpuisto-4-a-9-tampere";

/* ── Packs (R6-1) ────────────────────────────────────────────────────────────
   Engine-authored figures (VAT 25.5 % included; per-report prices published,
   never derived in the UI): single 79 € / 1 credit · 5-pack 199 € / 39.80 €
   per report · 20-pack 349 € / 17.45 € per report. The 5-pack is the featured
   lime-on-Midnight card. Credits never expire; one credit = one full report. */
export const packs: Pack[] = [
    { id: "single", credits: 1, priceEur: 79, perReportEur: 79 },
    { id: "five", credits: 5, priceEur: 199, perReportEur: 39.8, featured: true },
    { id: "twenty", credits: 20, priceEur: 349, perReportEur: 17.45 },
];

/* ── Policy test set (R5-1…R5-5) ─────────────────────────────────────────────
   Every figure below is engine-authored. The Balanced set is transcribed
   verbatim from the R2 board script (testsBalanced); Conservative and
   Yield-seeking follow the board notes (R5-4 "tightens five lines"; R5-2
   partial spec). Actuals describe the same canonical deal across presets.
   Grade ranks: E=0 D=1 C=2 B=3 A=4 (comparison only; display stays letters). */

export const policyTests: PolicyTestDef[] = [
    {
        key: "grossYield",
        label: "Gross yield, minimum",
        labelFi: "Bruttotuotto, vähintään",
        term: "bruttotuotto",
        op: "gte",
        unit: "percent",
        editable: true,
        lineDecimals: 1,
        edit: { min: 0, max: 15, step: 0.5 },
    },
    {
        key: "netYield",
        label: "Net yield after hoitovastike, minimum",
        labelFi: "Nettotuotto hoitovastikkeen jälkeen, vähintään",
        term: "nettotuotto",
        op: "gte",
        unit: "percent",
        editable: true,
        lineDecimals: 1,
        edit: { min: 0, max: 12, step: 0.5 },
    },
    {
        key: "cashFlowBase",
        label: "Cash flow at base rate 3.45 %",
        labelFi: "Kassavirta 3,45 % korolla",
        term: "kassavirta peruskorolla",
        termNote: "fixable: price ≤ 101 700 € or rent ≥ 859 €",
        termNoteFi: "korjattavissa: hinta ≤ 101 700 € tai vuokra ≥ 859 €",
        op: "gte",
        unit: "eurMonth",
        editable: true,
        lineDecimals: 0,
        showPlus: true,
        edit: { min: -500, max: 500, step: 5 },
        explanation: { fixablePrice: 101700, fixablePricePct: { en: "−2.7 %", fi: "−2,7 %" }, fixableRent: 859 },
    },
    {
        key: "cashFlowStress",
        label: "Cash flow at stress rate 5.5 %",
        labelFi: "Kassavirta stressikorolla 5,5 %",
        term: "kassavirta stressikorolla",
        op: "gte",
        unit: "eurMonth",
        editable: true,
        lineDecimals: 0,
        edit: { min: -800, max: 200, step: 5 },
    },
    {
        key: "liabilityShare",
        label: "Renovation liability, share of debt-free price",
        labelFi: "Korjausvastuu / velaton hinta",
        term: "korjausvastuu / velaton hinta",
        termNote: "not fixable by price — the share is the building’s",
        termNoteFi: "ei korjattavissa hinnalla — osuus on taloyhtiön",
        op: "lte",
        unit: "percent",
        editable: true,
        lineDecimals: 0,
        edit: { min: 0, max: 80, step: 5 },
        explanation: {
            fixable: false,
            reason: "building",
            blurb: { en: "a 49 % liability share", fi: "49 %:n korjausvastuuosuutta" },
        },
    },
    {
        key: "companyGrade",
        label: "Housing company grade, minimum",
        labelFi: "Taloyhtiön arvosana, vähintään",
        term: "taloyhtiön arvosana",
        termNote: "not fixable by price",
        termNoteFi: "ei korjattavissa hinnalla",
        op: "gte",
        unit: "grade",
        editable: true,
        lineDecimals: 0,
        edit: { min: 0, max: 4, step: 1 },
        explanation: {
            fixable: false,
            reason: "building",
            blurb: { en: "a C-grade company", fi: "C-arvosanaa" },
        },
    },
    {
        key: "municipalityGrade",
        label: "Municipality grade, minimum",
        labelFi: "Sijaintikunnan arvosana, vähintään",
        term: "sijaintikunnan arvosana",
        op: "gte",
        unit: "grade",
        editable: true,
        lineDecimals: 0,
        edit: { min: 0, max: 4, step: 1 },
    },
    {
        key: "priceVsMedian",
        label: "Price vs district median €/m²",
        labelFi: "Hinta vs. alueen mediaani €/m²",
        term: "hinta vs. alueen mediaani",
        op: "lte",
        unit: "percent",
        editable: true,
        lineDecimals: 0,
        showPlus: true,
        edit: { min: -50, max: 50, step: 1 },
    },
    {
        key: "ltv",
        label: "Loan-to-value at purchase",
        labelFi: "Luototusaste",
        term: "luototusaste",
        op: "lte",
        unit: "percent",
        editable: true,
        lineDecimals: 0,
        edit: { min: 0, max: 100, step: 5 },
    },
    {
        key: "cashNeeded",
        label: "Cash needed, maximum",
        labelFi: "Oma pääoma + varainsiirtovero, enintään",
        term: "oma pääoma + varainsiirtovero",
        op: "lte",
        unit: "eur",
        editable: true,
        lineDecimals: 0,
        edit: { min: 0, max: 200000, step: 500 },
    },
    {
        key: "p10Covers",
        label: "P10 rent covers charges + interest",
        labelFi: "P10-vuokra kattaa vastikkeet ja korot",
        term: "P10-vuokra kattaa vastikkeet ja korot",
        op: "gte",
        unit: "eurMonth",
        editable: true,
        lineDecimals: 0,
        edit: { min: -300, max: 300, step: 5 },
    },
    {
        key: "hoitovastike",
        label: "Hoitovastike per m², maximum",
        labelFi: "Hoitovastike €/m², enintään",
        term: "hoitovastike €/m²",
        op: "lte",
        unit: "eurSqm",
        editable: true,
        lineDecimals: 2,
        edit: { min: 0, max: 12, step: 0.25 },
    },
    {
        key: "companyLoanShare",
        label: "Company loan share of debt-free price",
        labelFi: "Yhtiölainaosuus velattomasta hinnasta",
        term: "yhtiölainaosuus",
        op: "lte",
        unit: "percent",
        editable: true,
        lineDecimals: 0,
        edit: { min: 0, max: 60, step: 1 },
    },
    {
        key: "noUnfundedProject",
        label: "No decided, unfunded project inside 3 years",
        labelFi: "Ei päätettyä rahoittamatonta hanketta 3 vuoden sisällä",
        term: "ei päätettyä rahoittamatonta hanketta",
        termNote: "survey signals 4–7 y — flagged, not failed",
        termNoteFi: "kuntotutkimus signaaloi 4–7 v — liputettu, ei hylätty",
        op: "eq",
        unit: "flag",
        editable: true, // board contract marks all 14 editable; a boolean test has no slider, so the UI offers no editor for it
        lineDecimals: 0,
    },
];

export const policyActuals: PolicyActual[] = [
    { key: "grossYield", value: 8.6, display: "8.6 %", displayFi: "8,6 %" },
    { key: "netYield", value: 5.6, display: "5.6 %", displayFi: "5,6 %" },
    { key: "cashFlowBase", value: -14, display: "−14 €/mo", displayFi: "−14 €/kk" },
    { key: "cashFlowStress", value: -103, display: "−103 €/mo", displayFi: "−103 €/kk" },
    { key: "liabilityShare", value: 49.3, display: "49.3 %", displayFi: "49,3 %" },
    { key: "companyGrade", value: 2, display: "C", displayFi: "C" },
    { key: "municipalityGrade", value: 4, display: "A", displayFi: "A" },
    { key: "priceVsMedian", value: -15.6, display: "−15.6 %", displayFi: "−15,6 %" },
    { key: "ltv", value: 73, display: "73 %", displayFi: "73 %" },
    { key: "cashNeeded", value: 31800, display: "31 800 €", displayFi: "31 800 €" },
    { key: "p10Covers", value: 81, display: "+81 €/mo", displayFi: "+81 €/kk" },
    { key: "hoitovastike", value: 5.5, display: "5.50 €", displayFi: "5,50 €" },
    { key: "companyLoanShare", value: 11.4, display: "11.4 %", displayFi: "11,4 %" },
    { key: "noUnfundedProject", value: 0, display: "none", displayFi: "ei ole" },
];

export const policyPresets: Record<PolicyPresetKey, Record<string, number>> = {
    // R5-1 / testsBalanced — verbatim from the board script.
    balanced: {
        grossYield: 6.0,
        netYield: 4.0,
        cashFlowBase: 0,
        cashFlowStress: -150,
        liabilityShare: 25,
        companyGrade: 3, // ≥ B
        municipalityGrade: 3, // ≥ B
        priceVsMedian: 10,
        ltv: 75,
        cashNeeded: 95000,
        p10Covers: 0,
        hoitovastike: 6.0,
        companyLoanShare: 30,
        noUnfundedProject: 0, // required
    },
    // R5-4: "Conservative tightens five lines" — the other nine stay Balanced.
    conservative: {
        grossYield: 6.0,
        netYield: 4.0,
        cashFlowBase: 50,
        cashFlowStress: 0,
        liabilityShare: 15,
        companyGrade: 3,
        municipalityGrade: 3,
        priceVsMedian: 10,
        ltv: 70,
        cashNeeded: 95000,
        p10Covers: 0,
        hoitovastike: 5.0,
        companyLoanShare: 30,
        noUnfundedProject: 0,
    },
    // Yield-seeking is only partially board-specified (R5-2 shows Anne's Custom
    // edits "dirty on 2 thresholds" from it: liability → 60 %, cash flow → −100 €).
    // Gross 8.0 % and grade ≥ C are back-solved so exactly those 2 edits reproduce
    // R5-2's 14/14 pass; the rest (stress −250 €, LTV 85 %, hoitovastike 7.00 €)
    // remains a defensible derivation, NOT verbatim — flagged in the PR.
    yield: {
        grossYield: 8.0,
        netYield: 4.0,
        cashFlowBase: -50,
        cashFlowStress: -250,
        liabilityShare: 50,
        companyGrade: 2, // ≥ C
        municipalityGrade: 3,
        priceVsMedian: 10,
        ltv: 85,
        cashNeeded: 95000,
        p10Covers: 0,
        hoitovastike: 7.0,
        companyLoanShare: 30,
        noUnfundedProject: 0,
    },
};

export const policyData: PolicyData = { tests: policyTests, presets: policyPresets, actuals: policyActuals };

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
            /* Flags 2–3 carry their full engine content here (R7-1 verbatim).
               The free tier never sees it: the store redacts locked flags to
               {severity, costRange, locked:true} at the boundary (§6.4); an
               unlocked account receives them whole (R7 slice). */
            {
                id: "flag-leased-plot",
                severity: "caution",
                locked: true,
                title: "The plot is leased from the city — the lease ends 31.12.2031",
                // FI composed from board vocabulary (P1 "vuokratontti (Tampereen kaupunki, päättyy 2031)") — flagged in the PR.
                titleFi: "Tontti on vuokrattu Tampereen kaupungilta — maanvuokra päättyy 31.12.2031",
                body: "Ground rent resets when the lease is renegotiated. Tampere’s 2024–25 resets in this district raised charges by 0.60–1.10 €/m²/mo. For 54 m², that is 32–59 €/mo onto the hoitovastike from 2032 — on top of the renovation financing that will already be running.",
                // FI translated from the EN board copy — flagged in the PR.
                bodyFi: "Maanvuokra tarkistetaan sopimusta uusittaessa. Tampereen 2024–25 tarkistukset tällä alueella nostivat maksuja 0,60–1,10 €/m²/kk. 54 m²:lle se on 32–59 €/kk hoitovastikkeen päälle vuodesta 2032 — sen lisäksi, kun remontin rahoitusvastike on jo käynnissä.",
                costRange: "5–9 K€",
                costRangeFi: "5–9 t€",
                costNote: "COST AT RESET",
                // FI translated ("cost at reset") — flagged in the PR.
                costNoteFi: "KUSTANNUS TARKISTUKSESSA",
                strongs: [{ en: "32–59 €/mo", fi: "32–59 €/kk" }],
                quotes: [
                    {
                        text: "”Tontti on vuokrattu Tampereen kaupungilta, maanvuokrasopimus voimassa 31.12.2031 saakka.”",
                        source: "Listing text · Oikotie 21966412",
                        sourceFi: "Ilmoitusteksti · Oikotie 21966412",
                        translation: "“The plot is leased from the City of Tampere; the ground lease runs to 31 Dec 2031.”",
                    },
                ],
                note: {
                    text: {
                        en: "Reset range from 11 Tampere ground-lease renewals 2023–2026",
                        // FI translated from the EN board line — flagged in the PR.
                        fi: "Tarkistushaarukka 11 Tampereen maanvuokrasopimuksen uusinnasta 2023–2026",
                    },
                    basis: "MODELLED",
                },
            },
            {
                id: "flag-original-windows",
                severity: "caution",
                locked: true,
                title: "Windows and balcony doors are original, 1962",
                // FI composed from board vocabulary (P1 "Ikkunat alkuperäiset 1962") — flagged in the PR.
                titleFi: "Ikkunat ja parvekeovet ovat alkuperäiset, 1962",
                body: "Inside the LVIS scope they cost this apartment a 5 200 € share (§3). Done standalone they run 5 000–9 000 €. Until then, 1962 glazing suppresses winter comfort and sits visibly in the P10 rent — two of the 27 comparables with original windows let 6–9 % under the median.",
                // FI translated from the EN board copy — flagged in the PR.
                bodyFi: "LVIS-kokonaisuuden sisällä niiden osuus tästä asunnosta on 5 200 € (§3). Erillisenä urakkana ne maksaisivat 5 000–9 000 €. Siihen asti vuoden 1962 lasitus heikentää talvimukavuutta ja näkyy P10-vuokrassa — kaksi 27 verrokista alkuperäisikkunoineen vuokrattiin 6–9 % mediaanin alle.",
                costRange: "5–9 K€",
                costRangeFi: "5–9 t€",
                costNote: "5 000–9 000 €",
                costNoteFi: "5 000–9 000 €",
                quotes: [
                    {
                        text: "”Ikkunat ja parvekeovet ovat alkuperäiset.”",
                        source: "Listing text · Oikotie 21966412",
                        sourceFi: "Ilmoitusteksti · Oikotie 21966412",
                        translation: "“Windows and balcony doors are original.”",
                    },
                ],
            },
        ],
    },
    policy: policyData,
    /* ── Full report (R7-1…R7-8) — engine-authored document data ─────────────
       §3/§6 rows verbatim from the R3 board script (liabilityRows / yearRows);
       §1 prose verbatim from R7-1 (EN) and R7-6 (FI); §4/§5 from R7-2; chat
       answers from R7-2/R7-4/R7-8 (FI where the board gives it). FI strings
       without a board row are translated from EN board copy using the boards'
       own FI vocabulary (P4/P1) — each marked inline, collected in the PR. */
    report: {
        prose: {
            en: "The listing’s 8.6 % is real arithmetic on a real rent — and it is not the yield you would own. Priced 15.6 % under the district median, this apartment carries the district’s largest un-executed renovation programme. Two of the three failing tests are properties of the building; no offer price repairs them.",
            fi: "Ilmoituksen 8,6 % on oikeaa laskentaa oikealla vuokralla — mutta se ei ole tuotto, jonka omistaisit. Asunto on hinnoiteltu 15,6 % alle alueen mediaanin, ja se kantaa alueen suurimman toteuttamattoman korjausohjelman. Kaksi kolmesta hylkäävästä testistä on rakennuksen ominaisuuksia; mikään tarjoushinta ei korjaa niitä.",
        },
        proseNote: {
            en: "Prose is the model reading the engine’s numbers — it can phrase, it cannot originate a figure. §§3–7 show every input.",
            // R7-6 verbatim — the FI frame carries no "§§3–7" tail.
            fi: "Proosa on kielimallin luentaa moottorin luvuista — se voi muotoilla, ei koskaan keksiä lukua.",
        },
        liabilityRows: [
            {
                name: { en: "Piping renovation (linjasaneeraus)", fi: "Linjasaneeraus (putkiremontti)" },
                note: { en: "water + drains + electrics risers, bathrooms to code", fi: "vesi + viemärit + sähkösten nousut, märkätilat määräysten mukaan" },
                basis: { en: "54 m² × 890 €/m² median", fi: "54 m² × 890 €/m² mediaani" },
                amount: "48 100 €",
                chip: "MODELLED",
            },
            {
                name: { en: "Roof, apartment’s share", fi: "Katto, asunnon osuus" },
                note: { en: "felt roof renewed 1998 — at end of cycle within the window", fi: "huopakatto uusittu 1998 — käyttöikänsä päässä ikkunan sisällä" },
                basis: { en: "company est. ÷ share ratio", fi: "yhtiön arvio ÷ osuussuhde" },
                amount: "4 900 €",
                chip: "ESTIMATED",
            },
            {
                name: { en: "Windows & balcony doors, share", fi: "Ikkunat & parvekeovet, osuus" },
                note: { en: "original 1962 — inside the LVIS scope (flag 3)", fi: "alkuperäiset 1962 — LVIS-kokonaisuudessa (lippu 3)" },
                basis: { en: "company est. ÷ share ratio", fi: "yhtiön arvio ÷ osuussuhde" },
                amount: "5 200 €",
                chip: "ESTIMATED",
            },
        ],
        liabilityBasis: {
            en: "Basis: 27 completed linjasaneeraus contracts, Pirkanmaa 2019–2026 — median 890 €/m², P80 1 040 €/m². At P80 the piping line alone is 56 200 € and the total 66 300 €. Timing from the observed sequence: survey 2024 → project planning → decision (typ. +1–2 y) → execution (+2–4 y).",
            fi: "Peruste: 27 valmistunutta linjasaneerausurakkaa, Pirkanmaa 2019–2026 — mediaani 890 €/m², P80 1 040 €/m². P80:lla pelkkä putkilinja on 56 200 € ja kokonaisuus 66 300 €. Ajoitus havaitusta ketjusta: kuntotutkimus 2024 → hankesuunnittelu → päätös (tyyp. +1–2 v) → toteutus (+2–4 v).",
        },
        liabilityBasisStrongs: [{ en: "66 300 €", fi: "66 300 €" }],
        rent: {
            p10: "780 €",
            p10Note: { en: "every cash-flow figure uses this", fi: "jokainen kassavirtaluku käyttää tätä" },
            p50: "845 €",
            p50Note: { en: "the listing’s implied rent", fi: "ilmoituksen implisiittinen vuokra" },
            p90: "910 €",
            p90Note: { en: "renovated-kitchen ceiling", fi: "remontoidun keittiön katto" },
            source: {
                en: "27 lettings, Tampere keskusta 45–60 m², 24 months, unrenovated kitchens weighted",
                fi: "27 vuokrailmoitusta, Tampere keskusta 45–60 m², 24 kk, remontoimattomat keittiöt painotettu",
            },
            tenancy: { en: "current tenancy 845 €/mo, open-ended", fi: "voimassa oleva vuokrasuhde 845 €/kk, toistaiseksi" },
            tenancyQuote: {
                text: "”Hyvä vuokralainen, vuokrasopimus toistaiseksi voimassa, vuokra 845,00 €/kk.”",
                source: "Listing text · Oikotie 21966412",
                sourceFi: "Ilmoitusteksti · Oikotie 21966412",
                translation: "“Good tenant, open-ended tenancy, rent 845.00 €/month.”",
            },
        },
        financing: {
            equity: "30 000 €",
            loan: "76 400 €",
            rate: { en: "3.45 %", fi: "3,45 %" },
            term: { en: "25 y", fi: "25 v" },
            payment: { en: "380 €/mo", fi: "380 €/kk" },
            transferTaxRate: { en: "1.5 %", fi: "1,5 %" },
            transferTax: "1 770 €",
            cashNeeded: "31 800 €",
        },
        yearRows: [
            { y: "Y1", rent: "9 360 €", charges: "5 750 €", debtService: "4 560 €", cf: "−950 €", cum: "−950 €", negative: true },
            { y: "Y2", rent: "9 500 €", charges: "5 920 €", debtService: "4 560 €", cf: "−980 €", cum: "−1 930 €", negative: true },
            { y: "Y3", rent: "9 640 €", charges: "6 100 €", debtService: "4 560 €", cf: "−1 020 €", cum: "−2 950 €", negative: true },
            { y: "Y4", rent: "9 790 €", charges: "6 280 €", debtService: "4 560 €", cf: "−1 050 €", cum: "−4 000 €", negative: true },
            { y: "Y5", rent: "9 930 €", charges: "10 190 €", debtService: "4 560 €", cf: "−4 820 €", cum: "−8 820 €", negative: true, highlight: true },
            { y: "Y10", rent: "11 550 €", charges: "11 220 €", debtService: "4 560 €", cf: "−4 230 €", cum: "−30 500 €", negative: true },
        ],
        yearAssumptions: [
            {
                text: { en: "Y5: renovation financing enters at +310 €/mo", fi: "Y5: remontin rahoitusvastike +310 €/kk" },
                basis: "MODELLED",
            },
            {
                text: { en: "Y6→ rent uplift +8 % post-renovation", fi: "Y6→ vuokrankorotus +8 % remontin jälkeen" },
                basis: "MODELLED",
            },
        ],
        yearGrowth: { en: "rent growth 1.5 %/y, charge growth 3.0 %/y.", fi: "vuokrankasvu 1,5 %/v, vastikkeen kasvu 3,0 %/v." },
        /* R7-5 mock diff (real diffs come from tracking, slice 8). */
        listingChange: { now: "98 600 €", was: "104 600 €", seenAt: "2026-07-29T08:12:00+03:00" },
        chat: {
            answers: [
                {
                    // R7-2 — "How did you get 58 200 €?"
                    match: ["58 200", "58200", "how did you get", "miten saitte", "mistä luku"],
                    answer: {
                        en: "Three parts. Piping: 54 m² × 890 €/m² = 48 100 € — the median of 27 Pirkanmaa contracts. Roof share 4 900 € and windows share 5 200 € from the same survey scope. It’s a modelled median, not a quote: the P80 case is 66 300 €.",
                        fi: "Kolme osaa. Putkisto: 54 m² × 890 €/m² = 48 100 € — 27 pirkanmaalaisen urakan mediaani. Katto-osuus 4 900 € ja ikkunaosuus 5 200 € samasta kuntotutkimuksesta. Kyseessä on mallinnettu mediaani, ei tarjous: P80-tapaus on 66 300 €.",
                    },
                    strongs: [
                        { en: "48 100 €", fi: "48 100 €" },
                        { en: "4 900 €", fi: "4 900 €" },
                        { en: "5 200 €", fi: "5 200 €" },
                        { en: "66 300 €", fi: "66 300 €" },
                    ],
                    citations: [
                        { section: { en: "§3 Liability", fi: "§3 Korjausvastuu" }, anchor: "s3" },
                        { section: { en: "quote: kuntotutkimus 2024", fi: "lainaus: kuntotutkimus 2024" }, anchor: "s2-flag-1" },
                    ],
                },
                {
                    // R7-2 — "What if the rent is 900 €?" The 9.2 % / +41 € figures are
                    // engine-published here; a what-if re-runs the engine, never the LLM (§6.2).
                    match: ["900"],
                    answer: {
                        en: "At 900 € gross yield is 9.2 % and base cash flow turns +41 €/mo. But 900 € sits above P75 of the comparables, so underwriting stays at P10 = 780 €. Your verdict doesn’t change — the liability share (49.3 %) and company grade (C) fail at any rent.",
                        fi: "900 €:lla bruttotuotto on 9,2 % ja kassavirta peruskorolla kääntyy lukemaan +41 €/kk. Mutta 900 € on verrokkien P75:n yläpuolella, joten laskenta pysyy P10:ssa = 780 €. Päätelmäsi ei muutu — korjausvastuuosuus (49,3 %) ja taloyhtiön arvosana (C) hylkäävät millä vuokralla tahansa.",
                    },
                    strongs: [
                        { en: "9.2 %", fi: "9,2 %" },
                        { en: "+41 €/mo", fi: "+41 €/kk" },
                    ],
                    citations: [
                        { section: { en: "§4 Rent", fi: "§4 Vuokra" }, anchor: "s4" },
                        { section: { en: "§7 Tests", fi: "§7 Testit" }, anchor: "s7" },
                    ],
                    yourFigure: {
                        display: "900 €",
                        note: { en: "above P75 of 27 comparables", fi: "27 verrokin P75:n yläpuolella" },
                    },
                },
                {
                    // R7-8 — "Is 845 € a safe rent to assume?" (FI verbatim from R7-8 FI frame).
                    match: ["845", "safe rent", "turvallinen vuokra"],
                    answer: {
                        en: "845 € is the sitting tenancy — real and observed. For underwriting we still use P10 = 780 €: if the tenant leaves, that’s the re-let floor among 27 comparables with this kitchen condition.",
                        fi: "845 € on istuva vuokrasuhde — todellinen ja havaittu. Laskenta käyttää silti P10:tä = 780 €: jos vuokralainen lähtee, se on uudelleenvuokrauksen lattia 27 verrokin joukossa.",
                    },
                    strongs: [{ en: "780 €", fi: "780 €" }],
                    citations: [{ section: { en: "§4 Rent", fi: "§4 Vuokra" }, anchor: "s4" }],
                },
                {
                    // R7-4 — "And if the lease reset lands at the top of the range?"
                    match: ["lease reset", "top of the range", "maanvuokra", "yläpää", "tarkistus"],
                    answer: {
                        en: "At +1.10 €/m²/mo the charge rises 59 €/mo from 2032 — real yield drifts to 5.5 %. Your verdict doesn’t move; the failing tests fail either way.",
                        fi: "+1,10 €/m²/kk tarkistuksessa vastike nousee 59 €/kk vuodesta 2032 — todellinen tuotto liukuu lukemaan 5,5 %. Päätelmäsi ei liiku; hylkäävät testit hylkäävät joka tapauksessa.",
                    },
                    strongs: [{ en: "5.5 %", fi: "5,5 %" }],
                    citations: [{ section: { en: "§2 Flag 2", fi: "§2 Lippu 2" }, anchor: "s2-flag-2" }],
                },
                {
                    // "Why did it fail my policy?" — composed from engine explanation fields
                    // (not a board frame; same content as the R5-1 banner) — flagged in the PR.
                    match: ["fail my policy", "why did it fail", "miksei läpäise", "miksi ei läpäise", "politiikka"],
                    answer: {
                        en: "Three tests fail: cash flow at the base rate (−14 €/mo against your 0 € line), the liability share (49.3 % against 25 %), and the company grade (C against B). The last two are the building’s — no offer price repairs them.",
                        fi: "Kolme testiä hylkää: kassavirta peruskorolla (−14 €/kk, rajasi 0 €), korjausvastuuosuus (49,3 %, raja 25 %) ja taloyhtiön arvosana (C, raja B). Kaksi viimeistä ovat taloyhtiön ominaisuuksia — mikään tarjoushinta ei korjaa niitä.",
                    },
                    citations: [{ section: { en: "§7 Tests", fi: "§7 Testit" }, anchor: "s7" }],
                },
                {
                    // "What should I ask the agent?" — DECISION: the checklist ships with a
                    // later slice (R7-11), so the chip gets a short honest canned answer that
                    // points at §2's flags (each names its source sentence) — commented in the PR.
                    match: ["ask the agent", "välittäjä"],
                    answer: {
                        en: "A ready-made agent checklist ships with a later slice. Until then, ask about the three flags in §2 — each one names the listing sentence it came from.",
                        fi: "Valmis välittäjän kysymyslista julkaistaan myöhemmässä vaiheessa. Siihen asti kysy §2:n kolmesta lipusta — jokainen nimee ilmoituksen lähdelauseensa.",
                    },
                    citations: [{ section: { en: "§2 Flags", fi: "§2 Riskiliput" }, anchor: "s2" }],
                },
            ],
            refusal: {
                en: "That’s not in this report’s data — I only answer from this deal’s figures, quotes and your policy.",
                fi: "Se ei ole tämän raportin datassa — vastaan vain tämän kohteen luvuista, lainauksista ja politiikastasi.",
            },
        },
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
