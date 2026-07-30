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
