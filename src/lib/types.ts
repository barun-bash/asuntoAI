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
    costRange: string;
    costRangeFi: string;
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

export interface Analysis {
    id: string;
    slug: string;
    status: AnalysisStatus;
    number: string; // report №, e.g. "2026-1187"
    readAt: string; // ISO
    steps: AnalysisStep[];
    listing?: Listing;
    verdict?: Verdict;
    policy?: PolicyData;
    /** Refusal / withdrawn particulars (engine-authored prose). */
    refusal?: {
        heading: string;
        headingFi: string;
        body: string;
        bodyFi: string;
        read: { text: string; textFi: string; basis: Provenance | "LOW_CONFIDENCE" }[];
        unlock: string;
        unlockFi: string;
    };
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
