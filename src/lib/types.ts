/**
 * Data contracts — mirror design/R-SERIES-HANDOFF.md §4 and the R1 handoff-notes card.
 * The engine owns every figure; the UI never computes (rule §6.2).
 */

export type AnalysisStatus = "queued" | "running" | "done" | "refused" | "withdrawn" | "failed";

export type Provenance = "OBSERVED" | "MAPPED" | "MODELLED" | "ESTIMATED";

export type Severity = "high" | "caution";

export interface AnalysisStep {
    key: string;
    label: string;
    labelFi: string;
    /** Found-fact string shown once the step completes (engine-authored). */
    foundFact?: string;
    foundFactFi?: string;
    flagged?: boolean;
    /** Seconds from start when the step completes (drives the mock SSE stream). */
    t: number;
}

export interface Listing {
    addr: string;
    city: string;
    postalCode?: string;
    type: string;
    typeFi?: string;
    m2: number;
    floor: string;
    lift?: boolean;
    built: number;
    company?: string;
    /** Plot tenure note (P1 cover meta: "vuokratontti (Tampereen kaupunki, päättyy 2031)"). */
    tenure?: LocalText;
    askPrice: number;
    loanShare: number;
    debtFree: number;
    maintFee?: number;
    financeFee?: number;
    oikotieId: string;
    fetchedAt: string; // ISO
}

export interface LiabilityItem {
    label: string;
    labelFi: string;
    amount: number;
    basis: Provenance;
}

export interface Liability {
    total: number;
    window: string;
    windowFi: string;
    items: LiabilityItem[];
}

export interface Grades {
    company: { grade: string; note: string; noteFi: string };
    municipality: { grade: string; name: string; note: string; noteFi: string };
}

/** A display string published in both languages (engine formats; the UI picks, never reformats). */
export interface LocalText {
    en: string;
    fi: string;
}

/** A flag as stored server-side. Locked flags are redacted before they ever reach the client. */
export interface FlagFull {
    id: string;
    severity: Severity;
    locked: boolean;
    title: string;
    titleFi: string;
    body: string;
    bodyFi: string;
    quotes: { text: string; source: string; sourceFi: string; translation?: string; readAt?: string }[];
    /** Free-tier teaser range shown on the locked row (R1-6: "5–9 K€"). */
    costRange: string;
    costRangeFi: string;
    /** Full-report cost meta (R7-1: "COST AT RESET" / "5 000–9 000 €") — shown once open. */
    costNote?: string;
    costNoteFi?: string;
    /** Engine-published substrings the UI bolds inside the body (board bolds figures). */
    strongs?: LocalText[];
    /** Optional provenance note under the quotes (R7-1 flag 2 reset-range line). */
    note?: { text: LocalText; basis: Provenance };
    /** Print variants (R7-P P1/P2) — engine-published, tighter than the screen copy:
       printTitle/printTitleFi = P2's compressed card title (flags 2–3; flag 1's
       screen title is already the board's); printLine = P1 cover flag summary
       line; printMeta = P2 pill tail after the severity label; printBody = P2's
       compressed claim paragraph. */
    printTitle?: string;
    printTitleFi?: string;
    printLine?: LocalText;
    printMeta?: LocalText;
    printBody?: LocalText;
}

/** The only shape a locked flag may take on the client (rule §6.4). */
export interface FlagRedacted {
    id: string;
    severity: Severity;
    locked: true;
    costRange: string;
    costRangeFi: string;
}

export type ClientFlag = FlagFull | FlagRedacted;

export interface YieldMetric {
    value: number;
    basis: Provenance;
    note: string;
    noteFi: string;
    /** Signed percentage-point delta vs gross, engine-computed (real yield only). */
    deltaPp?: number;
}

export interface Verdict {
    grossYield: YieldMetric;
    realYield: YieldMetric;
    liability: Liability;
    grades: Grades;
    flags: ClientFlag[];
    flagCount: { total: number; high: number; caution: number };
}

/** Public-page listing status (R8-1/R8-3) — the "still live" badge re-checks
   daily; ended listings stay published with past-tense strings (R8 handoff
   notes: "ended listings stay published with pastTense strings"). The display
   lines are engine-published; the UI picks a language, never composes. */
export interface ListingStatus {
    state: "live" | "ended";
    /** R8-1 meta-line badge ("listing still live on Oikotie ✓ checked 1 h ago"). */
    liveNote: LocalText;
    /** R8-3 banner ("This listing ended on Oikotie around 24.07.2026. …"). */
    endedNote: LocalText;
}

export interface Analysis {
    id: string;
    slug: string;
    status: AnalysisStatus;
    number: string; // report №, e.g. "2026-1187"
    readAt: string; // ISO
    steps: AnalysisStep[];
    listing?: Listing;
    /** Public-page register marker (R8-1 live badge / R8-3 ended note). */
    listingStatus?: ListingStatus;
    verdict?: Verdict;
    policy?: PolicyData;
    /** Full-report document data (R7-*) — only meaningful for unlocked accounts;
       the free tier never receives it (the page drops it before render, §6.4). */
    report?: ReportDoc;
    /** Refusal / withdrawn particulars (engine-authored prose). */
    refusal?: {
        heading: string;
        headingFi: string;
        body: string;
        bodyFi: string;
        read: { text: string; textFi: string; basis: Provenance | "LOW_CONFIDENCE" }[];
        unlock: string;
        unlockFi: string;
        /** R8-5c OG card sub-line under the address (engine-authored, per analysis). */
        ogSub?: LocalText;
    };
}

/* ── Public page & OG (R8-*) — board contract, handoff-notes "Public page" ──
   OG cards render server-side at 1200×630 from report state at share time
   (R8-5 mapping). Variants: verdict (R8-2, the default), price-drop (R8-5a,
   listing-changed links from R9-3), passes-policy (R8-5b, watch-match links
   from R9-6), refused (R8-5c, grey never red), private-generic (R8-5d, zero
   deal data + noindex). */

export type OgVariant = "verdict" | "price-drop" | "passes-policy" | "refused" | "private";

/** Engine-published card figures for the states the base analysis does not
   carry (R8-5a re-run figures, R8-5b watch-match listing). The OG renderer
   lays these out verbatim — no arithmetic at render time (§6.2). */
export interface OgVariantData {
    /** Header badge pill ("PRICE ↓ 6 000 €" / "PASSES BALANCED · 14/14"). */
    badge: LocalText;
    badgeTone: "amber" | "seafoam";
    addr: string;
    /** Line under the address ("now 98 600 € · was 104 600 €"). */
    meta: LocalText;
    gross: LocalText;
    real: LocalText;
    /** Bottom-right slot: plain text ("re-run 29.07.2026") or a pill ("1 CAUTION FLAG"). */
    tail: LocalText;
    tailTone: "plain" | "amber";
}

/* ── Policy (R5-*) — board contract, handoff-notes "Policy data" ────────────
   Policy {preset, tests[14]{key,label,labelFi,op,threshold,unit,editable:true}}
   + engine-published actuals[14]. Verdict re-run is PURE CLIENT evaluation over
   these actuals (spec-sanctioned exception to §6.2); no network on preset tap. */

export type PolicyPresetKey = "conservative" | "balanced" | "yield";

/** Units decide line/margin formatting. grade = rank on the A–E scale. */
export type PolicyUnit = "percent" | "eurMonth" | "eur" | "eurSqm" | "grade" | "flag";

export type PolicyOp = "gte" | "lte" | "eq";

/** Engine-emitted explanation fields — banner copy is assembled from these, never free prose. */
export interface PolicyExplanation {
    /** Cash-flow style fix: price at/below which the test flips (engine-computed). */
    fixablePrice?: number;
    /** Engine-published display of the price delta vs asking, e.g. "−2.7 %". */
    fixablePricePct?: { en: string; fi: string };
    /** Rent at/above which the test flips (engine-computed). */
    fixableRent?: number;
    /** fixable:false → reason:"building" — no offer moves this test. */
    fixable?: false;
    reason?: "building";
    /** Short engine fragment naming the failing figure, e.g. "a 49 % liability share". */
    blurb?: { en: string; fi: string };
}

export interface PolicyTestDef {
    key: string;
    label: string;
    labelFi: string;
    /** Finnish domain term shown as the desktop subline (board R5-1 row anatomy). */
    term: string;
    /** Optional engine note appended to the subline (fixable / not-fixable context). */
    termNote?: string;
    termNoteFi?: string;
    op: PolicyOp;
    unit: PolicyUnit;
    editable: true;
    /** Decimals used when displaying the "your line" value. */
    lineDecimals: number;
    /** Show an explicit "+" on positive line values (board: "≤ +10 %", "≥ +50 €"). */
    showPlus?: boolean;
    /** Engine-published editing bounds. Absent → no meaningful editor (boolean test). */
    edit?: { min: number; max: number; step: number };
    explanation?: PolicyExplanation;
}

export interface PolicyActual {
    key: string;
    /** Numeric value for client evaluation (grade = A–E rank). Never re-derived in UI. */
    value: number;
    /** Engine-published display strings per language ("8.6 %" / "8,6 %"). */
    display: string;
    displayFi: string;
}

export interface PolicyData {
    tests: PolicyTestDef[];
    presets: Record<PolicyPresetKey, Record<string, number>>;
    actuals: PolicyActual[];
}

/* ── Purchase (R6-*) — board contract, handoff-notes "Purchase" ─────────────
   POST /checkout {packId, email, reportId} → intent; the mock completes it
   synchronously (real flow: Stripe confirm → webhook mints {account, credits,
   unlock} atomically). Every figure on a pack is engine-authored. */

export type PackId = "single" | "five" | "twenty";

/** Checkout kinds: a paid pack, the once-per-account first-free claim, or
   spending an already-held credit on a report (no charge). */
export type CheckoutKind = "pack" | "first-free" | "use-credit";

export interface Pack {
    id: PackId;
    credits: number;
    /** Total price, VAT 25.5 % included (engine-authored). */
    priceEur: number;
    /** Per-report price (engine-authored — the UI formats, never divides, §6.2). */
    perReportEur: number;
    /** The lime-on-Midnight featured card (the one sanctioned lime exception, §2). */
    featured?: boolean;
}

export type LedgerReason = "purchase" | "spend" | "refund" | "free";

/** Append-only credits ledger entry (§4). Credits never expire. */
export interface LedgerEntry {
    delta: number;
    reason: LedgerReason;
    reportId?: string;
    packId?: PackId;
    ts: number;
}

export interface Account {
    id: string;
    email: string;
    createdAt: number;
    /** First full unlock free per account — honored exactly once (§12). */
    freeClaimed: boolean;
}

export type DeclineCode = "insufficient_funds" | "generic";

export interface PaymentIntent {
    id: string;
    kind: CheckoutKind;
    packId?: PackId;
    email: string;
    reportId?: string;
    accountId?: string;
    status: "processing" | "paid" | "declined";
    declineCode?: DeclineCode;
    /** Credits minted by this intent (0 for first-free / use-credit / declined). */
    creditsAdded: number;
    /** Credits this intent spent on the report (0 or 1). */
    spent: number;
    /** Declines so far in the same checkout session (3rd reveals the invoice route). */
    declines: number;
    ts: number;
}

/** Mock invoice (R6-7): activates nothing — credits land "when paid". */
export interface InvoiceRecord {
    id: string;
    packId: PackId;
    email: string;
    name?: string;
    company?: string;
    status: "sent";
    ts: number;
}

/* ── Full report (R7-*) — engine-authored document data ─────────────────────
   Every figure below is published by the engine; the UI formats/picks a
   language but never computes (§6.2). Display strings ("48 100 €") arrive
   pre-formatted — € is fi-FI in both languages, so most carry no FI variant. */

/** §3 component row (R7-1) — board script liabilityRows, verbatim. */
export interface LiabilityRow {
    name: LocalText;
    note: LocalText;
    basis: LocalText;
    /** Engine-published display ("48 100 €"). */
    amount: string;
    chip: Provenance;
}

/** §6 year row (R7-2) — board script yearRows, verbatim. */
export interface YearRow {
    y: string;
    rent: string;
    charges: string;
    /** Constant 4 560 € on the board — still engine-published per row. */
    debtService: string;
    cf: string;
    cum: string;
    /** Cash-flow column hue: every fixture row is negative on the board (coral). */
    negative: boolean;
    /** Y5 row wash rgba(255,179,0,.07) — board-lifted. */
    highlight?: boolean;
}

/** §4 rent data (R7-2) — P10/P50/P90 tiles + comparables source + tenancy. */
export interface ReportRent {
    p10: string;
    p10Note: LocalText;
    p50: string;
    p50Note: LocalText;
    p90: string;
    p90Note: LocalText;
    /** Comparables source line ("27 lettings, … weighted") — MODELLED. */
    source: LocalText;
    /** "current tenancy 845 €/mo, open-ended" — OBSERVED. */
    tenancy: LocalText;
    tenancyQuote: { text: string; source: string; sourceFi: string; translation?: string };
}

/** §5 financing (R7-2) — MAPPED from the user's policy. */
export interface ReportFinancing {
    equity: string;
    loan: string;
    rate: LocalText; // "3.45 %" / "3,45 %"
    term: LocalText; // "25 y" / "25 v"
    payment: LocalText; // "380 €/mo" / "380 €/kk"
    transferTaxRate: LocalText;
    transferTax: string;
    cashNeeded: string;
}

/** Chat citation chip: section label + document anchor id to scroll to. */
export interface ChatCitation {
    section: LocalText;
    anchor: string;
}

/** A grounded canned answer (mock engine): keyword-matched, engine-authored. */
export interface ChatAnswer {
    /** Lowercase substrings that ground this answer (mock matching). */
    match: string[];
    answer: LocalText;
    /** Engine-published substrings the UI bolds (the board bolds figures). */
    strongs?: LocalText[];
    citations: ChatCitation[];
    /** What-if answers may publish the user's figure for §4's dashed card —
       shown, never used (rule §6.5); the client persists it locally. */
    yourFigure?: { display: string; note: LocalText };
}

/** R7-5 listing-changed banner figures (tracking diff — mock fixture). */
export interface ListingChange {
    now: string;
    was: string;
    /** ISO — formatted per language by the UI. */
    seenAt: string;
}

/* ── P4 bank summary (R7-P) — engine-published bank-version figures ──────────
   The one-pager always uses the CURRENT version's figures (P4 annotation: v2,
   post price-drop, post documents); the loan need is re-derived by the engine
   (112 000 + 1 680 − 30 000 = 83 680 €) and published here — the UI never
   recomputes it (§6.2). */

export interface BankSummaryRow {
    label: LocalText;
    /** Engine-published display ("112 000 €" / "pankin arvion mukaan"). */
    value: LocalText;
    bold?: boolean;
}

export interface BankSummary {
    /** Version tag rendered with the № ("v2"). */
    versionTag: string;
    /** ISO — the version's read date (P4 header "29.7.2026"). */
    readAt: string;
    /** The full meta line under the address (board P4 verbatim per language). */
    meta: LocalText;
    /** §1 purchase → loan need, in the frame's two-column split. */
    purchaseLeft: BankSummaryRow[];
    purchaseRight: BankSummaryRow[];
    service: {
        baseHeader: LocalText;
        stressHeader: LocalText;
        rows: { label: LocalText; chip?: Provenance; base: string; stress: string }[];
        totalLabel: LocalText;
        baseTotal: string;
        stressTotal: string;
    };
    /** The "deliberately conservative" note under the serviceability table. */
    note: LocalText;
    /** §3 disclosed-liabilities paragraph (coral-ruled card) with its bolds. */
    liabilities: LocalText;
    liabilitiesStrongs: LocalText[];
    /** Provenance chip after the post-renovation uplift figure. */
    liabilitiesChip: Provenance;
    /** Sources + the fixed "not a loan offer" disclaimer; footerStrong is the
       bolded disclaimer substring inside footer. */
    footer: LocalText;
    footerStrong: LocalText;
}

/** The full report document payload (R7-1…R7-8). */
export interface ReportDoc {
    /** §1 engine prose (R7-1 EN / R7-6 FI verbatim) — originates no figure. */
    prose: LocalText;
    proseNote: LocalText;
    liabilityRows: LiabilityRow[];
    /** §3 basis paragraph (P80 case) with its bolded figure. */
    liabilityBasis: LocalText;
    liabilityBasisStrongs: LocalText[];
    rent: ReportRent;
    financing: ReportFinancing;
    yearRows: YearRow[];
    /** §6 assumption chips (Y5 renovation, Y6 uplift) — MODELLED. */
    yearAssumptions: { text: LocalText; basis: Provenance }[];
    yearGrowth: LocalText;
    listingChange: ListingChange;
    /** P1 cover verdict explanation (R7-P FI verbatim / EN parity) — engine prose. */
    coverVerdictBody: LocalText;
    /** §3 basis line in the print document (P2) — tighter than the screen's. */
    liabilityBasisPrint: LocalText;
    /** P4 bank summary — engine-published current-version figures. */
    bankSummary: BankSummary;
    chat: {
        answers: ChatAnswer[];
        /** Out-of-scope refusal ("that's not in this report's data"). */
        refusal: LocalText;
    };
}

/** POST /r/:slug/chat response (handoff §5): cited answer + visible cap. */
export interface ChatResponse {
    answer?: string;
    strongs?: string[];
    citations?: { section: string; anchor: string }[];
    turnsLeft: number;
    yourFigure?: { display: string; note: string };
}

/** Hard chat cap per report per run (R7-4) — the count resets on re-run.
   Lives with the contracts so client and store share one source. */
export const CHAT_TURN_CAP = 15;

/* ── Account drawer, refunds, notifications, data (R10/R11/R14/R16) ──────────
   Board contracts: R10 handoff-notes "Account" (magic-link only, 15 min,
   single use · watch = saved query), R11 handoff-notes "Contract/Guards",
   R14 annotation (GET/PATCH shape), R16 "Contracts" card. */

/** Watch — a saved query (§4). Matches auto-run the free tier only. */
export type WatchType = "yksio" | "2h" | "3h+";

export interface Watch {
    district: string;
    type: WatchType;
    /** Debt-free maximum price (€) — optional in the R10-5 frame; null = no cap. */
    maxPrice: number | null;
    /** "Only email me matches that could pass my policy on the free summary" (R10-5). */
    policyFilter: boolean;
    updatedAt: number;
}

/** Refund reasons (R11 contract: misread|wrong_listing|other). */
export type RefundReason = "misread" | "wrong_listing" | "other";

export type RefundTarget = "credit" | "card";

/** One refund record per report per account (R11 guards). The credit path
   resolves synchronously; the card path is a human-reviewed ticket. */
export interface RefundRecord {
    reason: RefundReason;
    note?: string;
    /** Set when the credit was returned (one credit refund per report). */
    creditAt?: number;
    /** Same listing re-lockable by this account from this ts (30 days, R11 guards). */
    reLockUntil?: number;
    /** Money-back path: human review ≤ 1 business day (mock: stays pending). */
    cardTicket?: { status: "pending" | "refunded" | "kept"; at: number };
}

/** Notification preferences (R14 contract). Transactional mail (receipts,
   refunds, sign-in links) has no prefs — always sent, stated plainly. */
export type DigestMode = "daily" | "instant";

export interface NotificationPrefs {
    tracking: { on: boolean; digest: DigestMode };
    watch: { on: boolean; digest: DigestMode };
    analysisDone: boolean;
    /** Off by default — "we don't market at people mid-purchase" (R14-1). */
    productNews: boolean;
}

/** PATCH body: every key optional at every level — absent keeps the stored value. */
export interface NotificationPrefsPatch {
    tracking?: { on?: boolean; digest?: DigestMode };
    watch?: { on?: boolean; digest?: DigestMode };
    analysisDone?: boolean;
    productNews?: boolean;
}

/** GDPR Article 20 export job (R16 contracts): the zip link arrives by email,
   valid 48 h. A pending job blocks deletion until delivered or cancelled. */
export interface ExportJob {
    id: string;
    status: "pending" | "delivered";
    createdAt: number;
    expiresAt: number;
}

/** A row of the My-reports drawer (R10-1), serialized for the client. */
export interface AccountReportRow {
    reportId: string;
    slug: string;
    number: string;
    addr: string;
    city: string;
    type: string;
    typeFi?: string;
    m2: number;
    /** ISO — the analysis read date ("analysed 28.07.2026"). */
    analysedAt: string;
    gross: number;
    real: number;
    liabilityTotal?: number;
    /** Flag severities in order — the row's dots. */
    dots: Severity[];
    /** Policy pill against the account's current policy (mock: default Balanced
       preset — see store.listAccountReports). */
    policyPassing: boolean;
    policyFails: number;
    policyTotal: number;
    /** Row status vocabulary (R10-1): unlocked · summary only · listing ended.
       "Price dropped ↓" is a tracking state (R12, later slice). */
    status: "unlocked" | "summary" | "ended";
    unlockTs?: number;
}
