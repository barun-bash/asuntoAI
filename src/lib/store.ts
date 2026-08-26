/**
 * Mock engine store — stands in for the real backend until it exists.
 * Swap rule: screens and route handlers read/write ONLY through this module,
 * so replacing the mock with engine HTTP calls is a one-file change.
 *
 * Locked flags are redacted here, at the boundary, before anything is serialized
 * to a client (rule §6.4: locked payload = {severity, costRange, locked:true}).
 *
 * Purchase layer (R6): accounts, append-only credits ledger, payment intents
 * and invoices. The whole payment flow is mocked here — swapping in real
 * Stripe later touches only this file and the /api/checkout handlers, never
 * the screens. The mock completes every intent synchronously (the real flow
 * is Stripe confirm → webhook; handoff-notes "Purchase").
 */
import { formatEUR, formatPercent } from "@/lib/format";
import type { Lang } from "@/lib/i18n";
import { isSupportedListingUrl } from "@/lib/listing-url";
import { evaluatePolicy } from "@/lib/policy";
import type {
    Account,
    AccountReportRow,
    AgentChecklistItem,
    Analysis,
    ChatResponse,
    ClientFlag,
    CompareColumn,
    CompareResponse,
    CompareRowKey,
    DeclineCode,
    ExportJob,
    FlagFull,
    InvoiceRecord,
    LedgerEntry,
    NotificationPrefs,
    NotificationPrefsPatch,
    OfferFlip,
    OfferResult,
    Pack,
    PackId,
    PaymentIntent,
    PinnedOffer,
    PolicyActual,
    PriceHistory,
    RefundReason,
    RefundRecord,
    RefundTarget,
    RentHistory,
    TrackingPayload,
    TrackingRecord,
    Watch,
} from "@/lib/types";
import { CHAT_TURN_CAP, COMPARE_LOCKED_ROWS } from "@/lib/types";
import { canonicalAnalysis, canonicalTrackingTemplate, fixtures, packs } from "@/mocks/fixtures";

export { isSupportedListingUrl };

/** Engine-authored pack figures (single 79 € · 5-pack 199 € · 20-pack 349 €,
   VAT 25.5 % included) — screens read them here, at the boundary. */
export { packs };

interface RunRecord {
    id: string;
    slug: string;
    status: Analysis["status"];
    startedAt: number;
    /** Account that created the run (cookie at POST /api/analyses, R10 drawer). */
    accountId?: string;
}

interface CheckoutSession {
    declines: number;
}

interface StoreShape {
    runs: Map<string, RunRecord>;
    accounts: Map<string, Account>;
    accountByEmail: Map<string, string>;
    ledger: Map<string, LedgerEntry[]>;
    unlocks: Map<string, Set<string>>;
    intents: Map<string, PaymentIntent>;
    invoices: Map<string, InvoiceRecord>;
    sessions: Map<string, CheckoutSession>;
    /** Chat turns used per account per report (R7) — the 15-turn cap is per
       report per run and persists across devices (R7-4 annotation). */
    chatTurns: Map<string, Map<string, number>>;
    /** Owner-controlled public-page visibility (R8): reportId → public.
       Absent = public — "public = free summary, always" (R8 header); the
       owner's toggle controls recents listing and the OG/noindex register. */
    visibility: Map<string, boolean>;
    /** Pending magic links (R10-2/6): token → {email, expiresAt}. The send
       layer is the backend's — the mock never emails; see DEV_MOCK_TOKEN. */
    magicLinks: Map<string, { email: string; expiresAt: number }>;
    /** Saved watch queries per account (R10-5). */
    watches: Map<string, Watch>;
    /** Refund records: accountId → reportId → record (one per report, R11 guards). */
    refunds: Map<string, Map<string, RefundRecord>>;
    /** Notification prefs per account (R14). Absent = DEFAULT_NOTIFICATIONS. */
    notifications: Map<string, NotificationPrefs>;
    /** GDPR export jobs per account (R16). */
    exports: Map<string, ExportJob[]>;
    /** Pending single-use deletion tokens (R16): token → {accountId, expiresAt}. */
    deletionTokens: Map<string, { accountId: string; expiresAt: number }>;
    /** Agent checklist checked state (R7-11): accountId → reportId → itemId →
       checked. Persists server-side per account+report (the R7-11 contract);
       GET merges it into the engine-published items. */
    checklist: Map<string, Map<string, Record<string, boolean>>>;
    /** Pinned offers (R5-6): accountId → reportId → {offerPrice, pinnedAt}.
       Renders in §1, the PDF and the checklist header (§4). */
    pinnedOffers: Map<string, Map<string, PinnedOffer>>;
    /** Tracking records (R12): accountId → reportId → record. Seeded at unlock
       (auto-on, §4); the daily check is the real backend's cron — the mock
       serves the seeded record. */
    tracking: Map<string, Map<string, TrackingRecord>>;
}

const globalStore = globalThis as unknown as { __asuntoStore?: StoreShape };
if (!globalStore.__asuntoStore) {
    globalStore.__asuntoStore = {
        runs: new Map(),
        accounts: new Map(),
        accountByEmail: new Map(),
        ledger: new Map(),
        unlocks: new Map(),
        intents: new Map(),
        invoices: new Map(),
        sessions: new Map(),
        chatTurns: new Map(),
        visibility: new Map(),
        magicLinks: new Map(),
        watches: new Map(),
        refunds: new Map(),
        notifications: new Map(),
        exports: new Map(),
        deletionTokens: new Map(),
        checklist: new Map(),
        pinnedOffers: new Map(),
        tracking: new Map(),
    };
}
const store = globalStore.__asuntoStore;

/** Dev-only stand-in for the emailed single-use tokens (magic link, account
   deletion). The real flows email a random token; the mock never sends mail,
   so token "dev" (with the email/cookie as identity) is the documented
   backdoor for local development and smoke tests. Never meaningful in
   production, where the send layer exists. */
export const DEV_MOCK_TOKEN = "dev";

export function createRun(accountId?: string): RunRecord {
    // Every supported URL replays the canonical analysis (the sandbox fixture pattern, R17).
    const id = `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const run: RunRecord = { id, slug: canonicalAnalysis.slug, status: "running", startedAt: Date.now(), accountId };
    store.runs.set(id, run);
    return run;
}

export function getRun(id: string): RunRecord | undefined {
    return store.runs.get(id);
}

export function completeRun(id: string): void {
    const run = store.runs.get(id);
    if (run) run.status = "done";
}

export function getBySlug(slug: string): Analysis | undefined {
    return fixtures[slug];
}

/** Redacts locked flags. Idempotent — locked mock flags carry no content at all. */
export function redactFlag(flag: ClientFlag): ClientFlag {
    if (!flag.locked) return flag;
    return {
        id: flag.id,
        severity: flag.severity,
        locked: true,
        costRange: flag.costRange,
        costRangeFi: flag.costRangeFi,
    };
}

/** The full analysis as the client is allowed to see it (free tier).
   §6.4: the full-report payload (liability rows, year rows, chat answers,
   the listing-change diff) is locked content — it must never reach an unpaid
   client, so `report` is dropped here at the boundary alongside the flag
   redaction; it opens only via unlockAnalysis() behind the unlock. */
export function redactAnalysis(analysis: Analysis): Analysis {
    return {
        ...analysis,
        report: undefined,
        /* The R13 compare block is also locked content: it freezes the v2
           full-report figures (56 400 € liability, +21 €/mo cash flow, 29 900 €
           cash needed, the price-dropped state) — locked data never reaches
           the free-tier client (§6.4). The compare route re-reads it from the
           store with its own per-column gating. */
        compare: undefined,
        verdict: analysis.verdict ? { ...analysis.verdict, flags: analysis.verdict.flags.map((f) => redactFlag(f as FlagFull)) } : undefined,
    };
}

/* ── Purchase (R6) ───────────────────────────────────────────────────────────
   Accounts are identified by the httpOnly `asunto_account` cookie, set on the
   first checkout/claim; anonymous browsers have no cookie. The ledger is
   append-only — the balance is always derived, never stored. */

export const ACCOUNT_COOKIE = "asunto_account";

/** Mock processor rule: a card ending 4098 declines insufficient_funds (R6-3/R6-9). */
export const MOCK_DECLINE_TAIL = "4098";

export function getPack(packId: string): Pack | undefined {
    return packs.find((p) => p.id === packId);
}

export function getAccount(id: string | undefined | null): Account | undefined {
    return id ? store.accounts.get(id) : undefined;
}

/** R15-2/3 — first-run onboarding fires once per account; called on skip OR
   finish (R15-2 annotation). Guests never reach this — they persist to
   localStorage instead. */
export function markOnboardingSeen(accountId: string): void {
    const account = getAccount(accountId);
    if (account) account.onboardingSeen = true;
}

/** Balance = sum of ledger deltas (append-only; never negative by construction). */
export function balanceOf(accountId: string): number {
    return (store.ledger.get(accountId) ?? []).reduce((sum, entry) => sum + entry.delta, 0);
}

/** Credits ever spent (the "7 USED" of R6-4). */
export function usedOf(accountId: string): number {
    return (store.ledger.get(accountId) ?? []).reduce((sum, entry) => (entry.delta < 0 ? sum + Math.abs(entry.delta) : sum), 0);
}

export function isUnlocked(accountId: string, reportId: string): boolean {
    return store.unlocks.get(accountId)?.has(reportId) ?? false;
}

/** R6-1 annotation: the first-free banner renders only when the account has no prior full report. */
export function hasAnyUnlock(accountId: string): boolean {
    return (store.unlocks.get(accountId)?.size ?? 0) > 0;
}

export function getAnalysisById(reportId: string): Analysis | undefined {
    return Object.values(fixtures).find((a) => a.id === reportId);
}

/** A charge may only ever attach to an existing verdict (rule §6.3). */
function hasVerdict(reportId: string | undefined): boolean {
    if (!reportId) return false;
    const analysis = getAnalysisById(reportId);
    return !!analysis && analysis.status === "done" && !!analysis.verdict;
}

function getOrCreateAccount(email: string, cookieAccount?: Account): Account {
    if (cookieAccount) return cookieAccount;
    const byEmail = store.accountByEmail.get(email);
    if (byEmail) return store.accounts.get(byEmail)!;
    const account: Account = {
        id: `acc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        email,
        createdAt: Date.now(),
        freeClaimed: false,
    };
    store.accounts.set(account.id, account);
    store.accountByEmail.set(email, account.id);
    store.ledger.set(account.id, []);
    store.unlocks.set(account.id, new Set());
    return account;
}

function appendLedger(accountId: string, entry: LedgerEntry): void {
    store.ledger.get(accountId)!.push(entry);
}

function countDecline(sessionId: string | undefined): number {
    if (!sessionId) return 1;
    const session = store.sessions.get(sessionId) ?? { declines: 0 };
    session.declines += 1;
    store.sessions.set(sessionId, session);
    return session.declines;
}

export type CheckoutResult =
    /** Account is present whenever one was minted or used; a declined intent moves nothing. */
    | { ok: true; intent: PaymentIntent; account?: Account }
    | {
          ok: false;
          error:
              | "unknown_pack"
              | "bad_email"
              | "card_required"
              | "bad_card"
              | "unknown_report"
              | "report_required"
              | "first_free_used"
              | "no_credits"
              | "already_unlocked"
              | "relock_guard";
      };

export interface CheckoutInput {
    /** PackId, "first-free" or "use-credit". */
    packId: string;
    email: string;
    reportId?: string;
    cardNumber?: string;
    sessionId?: string;
    /** Account resolved from the asunto_account cookie, if any. */
    cookieAccount?: Account;
}

/**
 * Creates a payment intent and completes it synchronously (mock of Stripe
 * confirm + webhook). On success the mint is one store transaction: account +
 * purchase ledger entry + spend ledger entry + unlock, all or nothing
 * (acceptance §12 "atomic mint"). A decline records the intent and the
 * session decline count — nothing else moves ("nothing was charged").
 */
export function createCheckout(input: CheckoutInput): CheckoutResult {
    // Spending a held credit needs no email — the cookie account is the identity.
    const email = input.packId === "use-credit" && input.cookieAccount ? input.cookieAccount.email : input.email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "bad_email" };

    const isFirstFree = input.packId === "first-free";
    const isUseCredit = input.packId === "use-credit";
    const pack = !isFirstFree && !isUseCredit ? getPack(input.packId) : undefined;
    if (!isFirstFree && !isUseCredit && !pack) return { ok: false, error: "unknown_pack" };

    // Nothing is charged before a verdict exists (§6.3): any report reference
    // must resolve to a completed analysis; first-free and use-credit require one.
    if (input.reportId && !hasVerdict(input.reportId)) return { ok: false, error: "unknown_report" };
    if ((isFirstFree || isUseCredit) && !input.reportId) return { ok: false, error: "report_required" };

    // R11 guards: a refunded report stays open, but the same listing can't be
    // re-unlocked by the same account for 30 days (re_lock_until) — enforced
    // here, before any charge. Mock note: the guard is dormant while a refund
    // leaves the report unlocked (the already_unlocked/no-spend paths catch a
    // repeat first); it binds the day re-runs mint fresh report ids.
    const prospective = input.cookieAccount ?? getAccount(store.accountByEmail.get(email));
    if (prospective && input.reportId && isReLockBlocked(prospective.id, input.reportId)) return { ok: false, error: "relock_guard" };

    const base: Omit<PaymentIntent, "id" | "status"> = {
        kind: isFirstFree ? "first-free" : isUseCredit ? "use-credit" : "pack",
        packId: pack?.id,
        email,
        reportId: input.reportId,
        creditsAdded: 0,
        spent: 0,
        declines: 0,
        ts: Date.now(),
    };
    const intentId = `pi_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    if (isFirstFree) {
        const account = getOrCreateAccount(email, input.cookieAccount);
        const everUnlocked = (store.unlocks.get(account.id)?.size ?? 0) > 0;
        // Honored exactly once per account (§12) — and only while the account
        // has no prior full report at all (R6-1 annotation).
        if (account.freeClaimed || everUnlocked) return { ok: false, error: "first_free_used" };
        /* atomic: flag + free ledger entry + unlock */
        account.freeClaimed = true;
        appendLedger(account.id, { delta: 0, reason: "free", reportId: input.reportId, ts: Date.now() });
        store.unlocks.get(account.id)!.add(input.reportId!);
        seedTracking(account.id, input.reportId!); // R12: tracking auto-on at unlock
        const intent: PaymentIntent = { ...base, id: intentId, status: "paid", accountId: account.id };
        store.intents.set(intent.id, intent);
        return { ok: true, intent, account };
    }

    if (isUseCredit) {
        const account = getOrCreateAccount(email, input.cookieAccount);
        if (isUnlocked(account.id, input.reportId!)) return { ok: false, error: "already_unlocked" };
        if (balanceOf(account.id) < 1) return { ok: false, error: "no_credits" };
        /* atomic: spend ledger entry + unlock — no charge, no mint */
        appendLedger(account.id, { delta: -1, reason: "spend", reportId: input.reportId, ts: Date.now() });
        store.unlocks.get(account.id)!.add(input.reportId!);
        seedTracking(account.id, input.reportId!); // R12: tracking auto-on at unlock
        const intent: PaymentIntent = { ...base, id: intentId, status: "paid", accountId: account.id, spent: 1 };
        store.intents.set(intent.id, intent);
        return { ok: true, intent, account };
    }

    const digits = (input.cardNumber ?? "").replace(/[\s-]/g, "");
    if (!input.cardNumber) return { ok: false, error: "card_required" };
    if (!/^\d{12,19}$/.test(digits)) return { ok: false, error: "bad_card" };

    if (digits.endsWith(MOCK_DECLINE_TAIL)) {
        const declines = countDecline(input.sessionId);
        const intent: PaymentIntent = { ...base, id: intentId, status: "declined", declineCode: "insufficient_funds", declines };
        store.intents.set(intent.id, intent);
        return { ok: true, intent, account: input.cookieAccount };
    }

    /* atomic mint: account + credits + spend on this report + unlock (§5). */
    const account = getOrCreateAccount(email, input.cookieAccount);
    appendLedger(account.id, { delta: pack!.credits, reason: "purchase", packId: pack!.id, ts: Date.now() });
    let spent = 0;
    if (input.reportId && !isUnlocked(account.id, input.reportId)) {
        appendLedger(account.id, { delta: -1, reason: "spend", reportId: input.reportId, ts: Date.now() });
        store.unlocks.get(account.id)!.add(input.reportId);
        seedTracking(account.id, input.reportId); // R12: tracking auto-on at unlock
        spent = 1;
    }
    const intent: PaymentIntent = { ...base, id: intentId, status: "paid", accountId: account.id, creditsAdded: pack!.credits, spent };
    store.intents.set(intent.id, intent);
    return { ok: true, intent, account };
}

export function getIntent(id: string): PaymentIntent | undefined {
    return store.intents.get(id);
}

/** Intent as the client polls it: status + resulting balance (handoff: "UI polls /unlock/:intent"). */
export function intentPayload(intent: PaymentIntent) {
    return {
        id: intent.id,
        kind: intent.kind,
        packId: intent.packId,
        status: intent.status,
        declineCode: intent.declineCode,
        creditsAdded: intent.creditsAdded,
        spent: intent.spent,
        declines: intent.declines,
        /** The invoice route exists only from the third decline — never advertised before (R6-7). */
        invoiceAvailable: intent.declines >= 3,
        reportId: intent.reportId,
        reportSlug: intent.reportId ? getAnalysisById(intent.reportId)?.slug : undefined,
        balance: intent.accountId ? balanceOf(intent.accountId) : null,
    };
}

export function createInvoice(input: { packId: string; email: string; name?: string; company?: string }): InvoiceRecord | undefined {
    const pack = getPack(input.packId);
    const email = input.email.trim().toLowerCase();
    if (!pack || !/^\S+@\S+\.\S+$/.test(email)) return undefined;
    const invoice: InvoiceRecord = {
        id: `inv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        packId: pack.id as PackId,
        email,
        name: input.name?.trim() || undefined,
        company: input.company?.trim() || undefined,
        status: "sent",
        ts: Date.now(),
    };
    store.invoices.set(invoice.id, invoice);
    return invoice;
}

/* ── Full report (R7) ────────────────────────────────────────────────────────
   The unlocked account receives the whole analysis: locked flags open in
   place (R7-1 "the seam unlocks in place"). The free tier continues to get
   redactAnalysis() — full flag content exists only behind the unlock. */

/** The analysis as an unlocked account sees it: all flags full and open. */
export function unlockAnalysis(analysis: Analysis): Analysis {
    return {
        ...analysis,
        verdict: analysis.verdict ? { ...analysis.verdict, flags: analysis.verdict.flags.map((f) => ({ ...(f as FlagFull), locked: false })) } : undefined,
    };
}

/** When and how this report was unlocked (the "Unlocked 28.07.2026 · 5-pack"
   strip, R7-1): ts = the spend/free ledger entry for this report; packId =
   the purchase that funded it, if any (first-free has none). */
export function getUnlockInfo(accountId: string, reportId: string): { ts: number; packId?: PackId } | undefined {
    const entries = store.ledger.get(accountId) ?? [];
    const unlockEntry = entries.find((e) => e.reportId === reportId && (e.reason === "spend" || e.reason === "free"));
    if (!unlockEntry) return undefined;
    const purchase = [...entries].reverse().find((e) => e.reason === "purchase" && e.ts <= unlockEntry.ts);
    return { ts: unlockEntry.ts, packId: purchase?.packId };
}

/* ── Chat (R7) ───────────────────────────────────────────────────────────────
   POST /r/:slug/chat {q} → {answer, citations[{section,anchor}], turnsLeft}.
   Grounded canned answers, engine-authored in the fixture and keyword-matched
   here — the mock stands in for the engine's grounding layer. What-if figures
   (9.2 %, +41 €/mo) are engine-published in the fixture; nothing is computed
   at answer time (§6.2). Hard cap 15 turns per report per run; at 0 the API
   returns {turnsLeft:0} and the input disables ("Re-run the analysis to
   reset."). DECISION: refusals also consume a turn — a turn is a question +
   answer exchange, and the exhausted card counts questions ("That was the
   fifteenth question") — flagged in the PR. */

export function chatTurnsLeft(accountId: string, reportId: string): number {
    const used = store.chatTurns.get(accountId)?.get(reportId) ?? 0;
    return Math.max(0, CHAT_TURN_CAP - used);
}

export type ChatAskResult = { ok: true; response: ChatResponse } | { ok: false; error: "no_report_data" };

export function askChat(accountId: string, analysis: Analysis, q: string, lang: Lang): ChatAskResult {
    const report = analysis.report;
    if (!report) return { ok: false, error: "no_report_data" };

    const turnsLeft = chatTurnsLeft(accountId, analysis.id);
    if (turnsLeft <= 0) return { ok: true, response: { turnsLeft: 0 } };

    const needle = q.trim().toLowerCase();
    const hit = report.chat.answers.find((a) => a.match.some((m) => needle.includes(m)));

    // Count the turn (answer or refusal alike) — persisted per account per report.
    let byReport = store.chatTurns.get(accountId);
    if (!byReport) {
        byReport = new Map();
        store.chatTurns.set(accountId, byReport);
    }
    byReport.set(analysis.id, (byReport.get(analysis.id) ?? 0) + 1);

    if (!hit) {
        return { ok: true, response: { answer: report.chat.refusal[lang], citations: [], turnsLeft: turnsLeft - 1 } };
    }
    return {
        ok: true,
        response: {
            answer: hit.answer[lang],
            strongs: hit.strongs?.map((s) => s[lang]),
            citations: hit.citations.map((c) => ({ section: c.section[lang], anchor: c.anchor })),
            yourFigure: hit.yourFigure ? { display: hit.yourFigure.display, note: hit.yourFigure.note[lang] } : undefined,
            turnsLeft: turnsLeft - 1,
        },
    };
}

/* ── History panels + agent checklist (R7-9/10/11) ───────────────────────────
   GET /r/:id/price-history · /rent-history serve the engine-published panel
   payloads (series MODELLED, the deal figure OBSERVED — contract §5). The
   checklist's checked state persists here per account per report (the R7-11
   contract) — GET merges it into the engine's items; PATCH flips one item. */

export function priceHistoryOf(analysis: Analysis): PriceHistory | undefined {
    return analysis.report?.priceHistory;
}

export function rentHistoryOf(analysis: Analysis): RentHistory | undefined {
    return analysis.report?.rentHistory;
}

/** Checklist item as served: engine content + this account's checked state. */
export type AgentChecklistItemState = AgentChecklistItem & { checked: boolean };

export function getAgentChecklist(accountId: string, analysis: Analysis): { items: AgentChecklistItemState[] } | undefined {
    const checklist = analysis.report?.agentChecklist;
    if (!checklist) return undefined;
    const state = store.checklist.get(accountId)?.get(analysis.id) ?? {};
    return { items: checklist.items.map((item) => ({ ...item, checked: state[item.id] === true })) };
}

/** PATCH semantics: unknown item ids are rejected (the engine emitted the set). */
export function setAgentChecklistItem(accountId: string, analysis: Analysis, id: string, checked: boolean): AgentChecklistItemState | undefined {
    const item = analysis.report?.agentChecklist.items.find((i) => i.id === id);
    if (!item) return undefined;
    let byReport = store.checklist.get(accountId);
    if (!byReport) {
        byReport = new Map();
        store.checklist.set(accountId, byReport);
    }
    const state = byReport.get(analysis.id) ?? {};
    state[id] = checked;
    byReport.set(analysis.id, state);
    return { ...item, checked };
}

/* ── Offer calculator (R5-6) — mock engine ───────────────────────────────────
   POST /r/:slug/offer {price} → the full metric + test set at that price
   (handoff §5). The real engine owns this recompute — the mock publishes its
   model here, derived from the canonical fixture's own inputs (each constant
   is traceable to a fixture figure). BOTH published checkpoints reproduce
   exactly: asking 104 600 € (the v1 fixture actuals: payment 380 €/mo, cash
   flow −14 €/mo, stress −103 €/mo, cash needed 31 800 €, LTV 73 %) and the
   R5-6 frame's 98 500 € (debt-free 111 900 € · €/m² 2 072 · 20.0 % under
   median · gross 9.1 % · real 6.1 % · cash flow +21 €/mo · cash needed
   29 900 € · fails 2 of 14). The CLIENT never computes — this runs only
   server-side (rule §6.2). */

/** Engine inputs for the canonical deal — derived from the fixture:
   loanShare/m2/rents/hoitovastike from listing+report.rent, the reserve from
   the P4 service table, equity/tax/term from report.financing, the median
   €/m² from report.priceHistory.medianNowDisplay, the liability from verdict. */
const OFFER_MODEL = {
    loanShare: 13400,
    m2: 54,
    medianSqm: 2590,
    rentP50: 845,
    rentP10: 780,
    hoitovastikeMonth: 297, // 5.50 €/m² × 54 m²
    reserveMonth: 117, // vacancy 1 mo/y + upkeep reserve (P4 "deliberately conservative")
    equityAtAsk: 30000,
    taxRate: 0.015,
    baseRate: 0.0345,
    stressRate: 0.055,
    termMonths: 300,
    liability: 58200,
    /* Real yield = gross less the liability drag at the engine's long-run
       renovation-financing rate 5.75 %. The naive rent ÷ (debt-free +
       liability) matches asking (5.8 %) but contradicts the R5-6 frame at the
       offer (6.1 %, not 6.0 %) — the drag form reproduces both published
       points. Engine-owned; flagged in the PR. */
    liabilityDragRate: 0.0575,
    /* Offer cash-flow sensitivity: each euro off the price returns the 20-year
       annuity service on it (3.45 %, 240 months ≈ 0.005774 €/mo per €). The
       frame's two published points pin it (ask −14 €/mo · 98 500 € → +21
       €/mo); a full funding-model recompute of the monthly figure does not
       reproduce the frame's +21 (the board hand-set it), so the engine
       publishes this sensitivity instead. The flip boundary 101 700 € stays
       the engine's own published figure (policy explanation fixablePrice),
       never derived from this line. */
} as const;

/** Monthly annuity service per euro borrowed at annualRate over months. */
function annuityFactor(annualRate: number, months: number): number {
    const i = annualRate / 12;
    return i / (1 - Math.pow(1 + i, -months));
}

const round1 = (v: number): number => Math.round(v * 10) / 10;
const round100 = (v: number): number => Math.round(v / 100) * 100;

/** One recomputed metric set at an offer price (numeric — the API serializes
   the numbers; formatting is the shared format.ts layer's, both sides of the
   boundary). The asking price comes from the passed analysis; the rest of the
   model is the engine-published constants above. */
function offerMetrics(analysis: Analysis, price: number) {
    const ask = analysis.listing!.askPrice;
    const m = OFFER_MODEL;
    const debtFree = price + m.loanShare;
    /* The buyer's 30 k€ equity scales with the price (mock engine rule — this
       is what makes the fixture's cash-needed reproduce at both endpoints:
       30 000 + 1 770 → 31 800 at asking; 28 241 + 1 679 → 29 900 at 98 500). */
    const equity = (m.equityAtAsk * price) / ask;
    const tax = m.taxRate * debtFree;
    const cashNeeded = round100(equity + tax);
    const loan = price + tax - equity;
    const loanAtAsk = ask + m.taxRate * (ask + m.loanShare) - m.equityAtAsk;

    const paymentAtAsk = loanAtAsk * annuityFactor(m.baseRate, m.termMonths);
    const stressPayment = loan * annuityFactor(m.stressRate, m.termMonths);

    /* Cash flow at the base rate: the model's asking figure (−14.2, displayed
       −14) plus the engine's published offer sensitivity (see OFFER_MODEL). */
    const cfModelAsk = m.rentP10 - m.hoitovastikeMonth - m.reserveMonth - paymentAtAsk;
    const cashFlowBase = Math.round(cfModelAsk + (ask - price) * annuityFactor(m.baseRate, 240));
    const cashFlowStress = Math.round(m.rentP10 - m.hoitovastikeMonth - m.reserveMonth - stressPayment);

    const gross = (m.rentP50 * 12 * 100) / debtFree;
    const real = gross - (m.liability / debtFree) * 100 * m.liabilityDragRate;
    const net = ((m.rentP50 - m.hoitovastikeMonth) * 12 * 100) / debtFree;
    const sqmRaw = debtFree / m.m2;
    /* P10-covers: the published actual (+81) plus the interest saved by the
       smaller loan (engine adjustment rule — price moves this test only
       through the interest line). */
    const p10Covers = Math.round(81 + ((loanAtAsk - loan) * m.baseRate) / 12);

    return {
        debtFree,
        sqm: Math.round(sqmRaw),
        pctVsMedian: round1((sqmRaw / m.medianSqm - 1) * 100),
        gross: round1(gross),
        real: round1(real),
        net: round1(net),
        cashFlowBase,
        cashFlowStress,
        liabilityShare: round1((m.liability / debtFree) * 100),
        priceVsMedian: round1((sqmRaw / m.medianSqm - 1) * 100),
        ltv: Math.round((loan / price) * 100), // against the sale price — matches the published 73 %
        cashNeeded,
        p10Covers,
        companyLoanShare: round1((m.loanShare / debtFree) * 100),
    };
}

/** The 14 actuals at an offer price: price-dependent keys recomputed above,
   price-independent keys verbatim from the passed analysis (grades,
   hoitovastike, the unfunded-project flag). Display strings formatted at the
   boundary. */
function offerActuals(analysis: Analysis, price: number): PolicyActual[] {
    const m = offerMetrics(analysis, price);
    const policy = analysis.policy!;
    const override: Record<string, number> = {
        grossYield: m.gross,
        netYield: m.net,
        cashFlowBase: m.cashFlowBase,
        cashFlowStress: m.cashFlowStress,
        liabilityShare: m.liabilityShare,
        priceVsMedian: m.priceVsMedian,
        ltv: m.ltv,
        cashNeeded: m.cashNeeded,
        p10Covers: m.p10Covers,
        companyLoanShare: m.companyLoanShare,
    };
    return policy.actuals.map((actual) => {
        const value = override[actual.key];
        if (value === undefined) return actual;
        /* Keep the fixture's display grammar per key: % with FI comma, €/mo or
           € with fi-FI grouping, U+2212 minus — formatPercent/formatEUR cover
           both; the flag/grade keys never land here. */
        const unit = policy.tests.find((t) => t.key === actual.key)?.unit;
        const display = unit === "percent" ? formatPercent(value, "en") : unit === "eurMonth" ? `${formatEUR(value, "en")}/mo` : formatEUR(value, "en");
        const displayFi = unit === "percent" ? formatPercent(value, "fi") : unit === "eurMonth" ? `${formatEUR(value, "fi")}/kk` : formatEUR(value, "fi");
        return { key: actual.key, value, display, displayFi };
    });
}

/** POST /r/:slug/offer {price} — the full recomputed metric + test set. The
   price is clamped into the slider's published bounds (typed exact figures
   inside them are allowed — the 500 € grid is a slider concern, not a rule). */
export function computeOffer(analysis: Analysis, price: number): OfferResult | undefined {
    const offer = analysis.offer;
    const listing = analysis.listing;
    const policy = analysis.policy;
    if (!offer || !listing || !policy || analysis.status !== "done") return undefined;

    const ask = listing.askPrice;
    const clamped = Math.min(ask, Math.max(offer.slider.min, Math.round(price)));
    if (!Number.isFinite(clamped)) return undefined;

    const metrics = offerMetrics(analysis, clamped);
    const data = { ...policy, actuals: offerActuals(analysis, clamped) };
    const runAtOffer = evaluatePolicy(data, policy.presets.balanced);
    const runAtAsk = evaluatePolicy(policy, policy.presets.balanced);
    const askMetrics = offerMetrics(analysis, ask);

    /* Flip list: the tests that failed at asking, in test order — FAIL→PASS
       seafoam when the offer flips one, STAYS FAIL coral with the reason
       (building tests are price-independent; the tool never hides that). */
    const flips: OfferFlip[] = [];
    for (const atAsk of runAtAsk.results) {
        if (atAsk.pass) continue;
        const atOffer = runAtOffer.results.find((r) => r.test.key === atAsk.test.key);
        const flip: OfferFlip = { key: atAsk.test.key, kind: atOffer?.pass ? "flip" : "stays" };
        if (atAsk.test.key === "cashFlowBase") flip.fixablePrice = atAsk.test.explanation?.fixablePrice;
        if (atAsk.test.key === "liabilityShare") {
            flip.from = askMetrics.liabilityShare;
            flip.to = metrics.liabilityShare;
        }
        flips.push(flip);
    }

    return {
        price: clamped,
        priceDisplay: formatEUR(clamped, "en"),
        atAsking: clamped === ask,
        vsAskingPct: round1((clamped / ask - 1) * 100),
        debtFree: metrics.debtFree,
        sqm: metrics.sqm,
        pctVsMedian: metrics.pctVsMedian,
        gross: { from: askMetrics.gross, to: metrics.gross },
        real: { from: askMetrics.real, to: metrics.real },
        cashFlow: { from: askMetrics.cashFlowBase, to: metrics.cashFlowBase },
        cashNeeded: metrics.cashNeeded,
        verdict: {
            passing: runAtOffer.passing,
            failCount: runAtOffer.failCount,
            total: runAtOffer.total,
            wasFailCount: runAtAsk.failCount,
        },
        flips,
    };
}

/* ── Pinned offer (R5-6 §4) ──────────────────────────────────────────────────
   {offerPrice, pinnedAt} persists server-side per account+report; renders in
   §1, the PDF and the checklist header. Re-pinning overwrites (one pin per
   report — the frame's single "Pin this offer" action). */

export function getPinnedOffer(accountId: string, reportId: string): PinnedOffer | undefined {
    return store.pinnedOffers.get(accountId)?.get(reportId);
}

/** Validates against the offer model's bounds — a pin never carries a price
   the calculator couldn't have produced. */
export function pinOffer(accountId: string, analysis: Analysis, price: number): PinnedOffer | undefined {
    const offer = analysis.offer;
    const listing = analysis.listing;
    if (!offer || !listing || !Number.isFinite(price)) return undefined;
    const offerPrice = Math.round(price);
    if (offerPrice < offer.slider.min || offerPrice > listing.askPrice) return undefined;
    const pinned: PinnedOffer = { offerPrice, pinnedAt: Date.now() };
    let byReport = store.pinnedOffers.get(accountId);
    if (!byReport) {
        byReport = new Map();
        store.pinnedOffers.set(accountId, byReport);
    }
    byReport.set(analysis.id, pinned);
    return pinned;
}

/* ── Tracking (R12) ──────────────────────────────────────────────────────────
   Auto-on at unlock (§4): seedTracking is called by every unlock path in
   createCheckout. The canonical report seeds the published R12-1 record
   (price drop → v2 re-run → checklist tightening); any other analysis seeds a
   live v1 record. The daily check itself is the real backend's cron — the
   mock serves the seeded record and never advances it (comment per the slice
   brief). One listing, actual vs. read — NOT the platform's portfolio (the
   R12 scope guard: it never asks about ownership). */

function seedTracking(accountId: string, reportId: string): void {
    const analysis = getAnalysisById(reportId);
    if (!analysis?.listing) return;
    let byReport = store.tracking.get(accountId);
    if (!byReport) {
        byReport = new Map();
        store.tracking.set(accountId, byReport);
    }
    if (byReport.has(reportId)) return; // seeded once — at the unlock

    if (reportId === canonicalAnalysis.id) {
        byReport.set(reportId, { ...canonicalTrackingTemplate, seededAt: Date.now() });
        return;
    }
    /* Generic live v1 record for any other unlocked analysis (never surfaces
       in the single-fixture mock — only the canonical deal is unlockable). */
    const fails = analysis.policy ? evaluatePolicy(analysis.policy, analysis.policy.presets.balanced).failCount : 0;
    byReport.set(reportId, {
        listingStatus: analysis.listingStatus?.state ?? "live",
        checkedAt: new Date().toISOString(),
        checkedNote: { en: "1 h ago", fi: "1 h sitten" },
        priceAtRead: analysis.listing.askPrice,
        priceNow: analysis.listing.askPrice,
        domAtRead: 0,
        domNow: 0,
        domDistrictMedian: 0,
        versions: [{ v: 1, at: analysis.readAt, fails, trigger: { en: "Analysed and unlocked", fi: "Analysoitu ja avattu" } }],
        events: [
            {
                at: analysis.readAt,
                title: { en: `Analysed and unlocked · v1 · fails ${fails} of 14`, fi: `Analysoitu ja avattu · v1 · hylkää ${fails} / 14` },
            },
        ],
        checklistProgress: { answered: 0, total: analysis.report?.agentChecklist.items.length ?? 0 },
        verdictNote: { en: "v1 · just read", fi: "v1 · juuri luettu" },
        seededAt: Date.now(),
    });
}

/** The tracking GET payload (§5 contract) — the record + the pinned offer. */
export function getTrackingPayload(accountId: string, reportId: string): TrackingPayload | undefined {
    const record = store.tracking.get(accountId)?.get(reportId);
    if (!record) return undefined;
    const { seededAt: _seededAt, stoppedAt, ...rest } = record;
    void _seededAt;
    const pinnedOffer = getPinnedOffer(accountId, reportId) ?? null;
    /* The price delta and the offer-vs-asking gap are engine work (§6.2):
       −6 000 € since the read; 0.1 = the offer sits 0.1 % under the current
       asking — the R12-1 "the drop closed your gap". */
    const priceDelta = record.priceNow - record.priceAtRead;
    const pinnedGapPct = pinnedOffer ? Math.round(((record.priceNow - pinnedOffer.offerPrice) / record.priceNow) * 1000) / 10 : null;
    return { ...rest, priceDelta, pinnedOffer, pinnedGapPct, stopped: stoppedAt !== undefined };
}

/** The seededAt ts the dashboard's "since unlock" line needs. */
export function getTrackingSeededAt(accountId: string, reportId: string): number | undefined {
    return store.tracking.get(accountId)?.get(reportId)?.seededAt;
}

/** Per-object mute (R12 "Stop tracking" — the R14 note: per-object mutes live
   on their objects). Stopping keeps the record; the timeline stays readable. */
export function setTrackingStopped(accountId: string, reportId: string, stopped: boolean): boolean {
    const record = store.tracking.get(accountId)?.get(reportId);
    if (!record) return false;
    if (stopped) record.stoppedAt = Date.now();
    else delete record.stoppedAt;
    return true;
}

/** Drives the R7-5 listing-changed banner (slice 4's ?state=changed stays as
   the manual mock trigger): the banner shows when the tracking record saw the
   listing change since the read. */
export function hasTrackingChange(accountId: string, reportId: string): boolean {
    const record = store.tracking.get(accountId)?.get(reportId);
    return !!record && record.stoppedAt === undefined && (record.priceNow !== record.priceAtRead || record.listingStatus === "ended");
}

/* ── Compare (R13) ───────────────────────────────────────────────────────────
   GET /reports/compare?ids= (2–4, selection order). Each column is the
   report's engine metrics frozen at its own version; staleness rides the
   column header with an inline free re-run. "best in row" marks facts only —
   never the verdict row; ties are unmarked (a fact, not a recommendation).
   Summary-only columns carry the free-tier rows + lock markers on the
   §3/financing-derived lines: locked values never leave this boundary (§6.4). */

export function compareReports(ids: string[], accountId: string | undefined): CompareResponse | undefined {
    if (ids.length < 2 || ids.length > 4) return undefined;
    /* Ids arrive as report ids from the /reports selection; slugs are accepted
       too (direct links, the smoke test). */
    const analyses = ids.map((id) => getAnalysisById(id) ?? fixtures[id]);
    if (analyses.some((a) => !a?.compare || !a.listing)) return undefined;
    const typed = analyses as Analysis[];

    const columns: CompareColumn[] = typed.map((analysis) => {
        const cf = analysis.compare!;
        /* The canonical report's column is gated by the account's real unlock;
           the compare fixtures declare Anne's drawer state themselves (the
           real engine derives this per account — see fixtures.ts). */
        const unlocked = analysis.id === canonicalAnalysis.id ? !!accountId && isUnlocked(accountId, analysis.id) : cf.access === "unlocked";
        const lockedRows: CompareRowKey[] = unlocked ? [] : [...COMPARE_LOCKED_ROWS];
        const cells: CompareColumn["cells"] = {
            debtFree: cf.cells.debtFree,
            sqm: cf.cells.sqm,
            yield: cf.cells.yield,
            yieldSub: cf.cells.yieldSub,
            companyGrade: cf.cells.companyGrade,
            municipalityGrade: cf.cells.municipalityGrade,
            flags: cf.cells.flags,
        };
        if (unlocked) {
            cells.liability = cf.cells.liability;
            cells.cashFlow = cf.cells.cashFlow;
            cells.cashNeeded = cf.cells.cashNeeded;
        }
        return {
            id: analysis.id,
            slug: analysis.slug,
            addr: `${analysis.listing!.addr}, ${analysis.listing!.city}`,
            meta: cf.meta,
            versionTag: cf.versionTag,
            readAt: cf.readAt,
            state: cf.state,
            unlocked,
            cells,
            lockedRows,
            verdictKind: cf.verdictKind,
            verdictN: cf.verdictN,
        };
    });

    /* Best-in-row over the columns where the row is visible (a summary column
       can't win a race its value never entered). Unique best only. */
    const best: CompareResponse["best"] = {};
    const consider = (row: CompareRowKey, key: (s: NonNullable<Analysis["compare"]>["sort"]) => number, dir: "min" | "max") => {
        const eligible = typed.filter((a) => {
            const col = columns.find((c) => c.id === a.id);
            return col && !col.lockedRows.includes(row);
        });
        if (eligible.length < 2) return;
        let bestValue = dir === "min" ? Infinity : -Infinity;
        let winners: string[] = [];
        for (const a of eligible) {
            const value = key(a.compare!.sort);
            if (dir === "min" ? value < bestValue : value > bestValue) {
                bestValue = value;
                winners = [a.id];
            } else if (value === bestValue) {
                winners.push(a.id);
            }
        }
        if (winners.length === 1) best[row] = winners[0];
    };
    consider("debtFree", (s) => s.debtFree, "min");
    consider("sqm", (s) => s.sqmVsMedian, "min"); // deepest under the median
    consider("yield", (s) => s.realYield, "max");
    consider("liability", (s) => s.liability, "min");
    consider("grades", (s) => s.companyRank * 10 + s.municipalityRank, "max");
    consider("flags", (s) => s.highFlags * 100 + s.totalFlags, "min");
    consider("cashFlow", (s) => s.cashFlow, "max");
    consider("cashNeeded", (s) => s.cashNeeded, "min");

    return { columns, best, policyTotal: canonicalAnalysis.policy?.tests.length ?? 14 };
}

/* ── Public page & visibility (R8) ───────────────────────────────────────────
   /r/:slug is public by default — the free summary IS the public page
   (R8 header: "public = free summary, always"). The owner flip (R7-2 footer
   "Make page public") controls recents listing and, when private, the page
   drops to noindex + the private-generic OG card (R8-5d). Owner-only writes:
   the toggle route requires the unlocking account's cookie. */

export function isPublicReport(reportId: string): boolean {
    return store.visibility.get(reportId) ?? true;
}

export function setReportVisibility(reportId: string, isPublic: boolean): void {
    store.visibility.set(reportId, isPublic);
}

/* The analyst vs. shared-visitor distinction (R1-6 vs R8-1): both see the free
   tier, but the visitor gets the "someone shared this" banner and a CTA that
   routes to / — never to /unlock ("a visitor can't buy someone else's
   report"). The mock has no account before checkout, so POST /api/analyses
   stamps this cookie with the run's slug; the page treats a matching cookie as
   the analyst (no visitor chrome). Cleared naturally by being per-session. */
export const RUNNER_COOKIE = "asunto_runner";

/* ── Sign-in (R10-2/R10-6) ───────────────────────────────────────────────────
   Magic-link only — 15 min, single use, no password (R10 handoff-notes
   "Account"). The mock never sends mail: POST /api/auth/magic-link records
   the pending link, and GET /api/auth/callback?token=dev&email=… stands in
   for the emailed link in development (DEV_MOCK_TOKEN, documented above). */

export const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;

const EMAIL_RE = /^\S+@\S+\.\S+$/;

/** Records a pending magic link. Always "sent" when the address is valid —
   the send layer is the backend's (mock; no enumeration, same as the boards'
   "the same form creates the account"). */
export function requestMagicLink(email: string): boolean {
    const normalized = email.trim().toLowerCase();
    if (!EMAIL_RE.test(normalized)) return false;
    const token = `ml_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    store.magicLinks.set(token, { email: normalized, expiresAt: Date.now() + MAGIC_LINK_TTL_MS });
    return true;
}

/** Consumes a magic-link token (single use) and returns the account it
   resolves to — created on first use ("New here? The same form creates the
   account.", R10-2). The dev token attaches the account by its email param. */
export function consumeMagicLink(token: string, devEmail?: string): Account | undefined {
    if (token === DEV_MOCK_TOKEN) {
        const email = (devEmail ?? "").trim().toLowerCase();
        return EMAIL_RE.test(email) ? getOrCreateAccount(email) : undefined;
    }
    const record = store.magicLinks.get(token);
    if (!record || record.expiresAt < Date.now()) return undefined;
    store.magicLinks.delete(token); // single use
    return getOrCreateAccount(record.email);
}

/* ── My reports (R10-*) ──────────────────────────────────────────────────────
   The drawer is a plain route at this stack — the boards' "drawer of
   documents" is the register metaphor, and R8-5d maps /reports as a private
   ROUTE (brand OG card, noindex); an overlay drawer over arbitrary pages
   would need global chrome the boards don't specify. Rows derive from the
   store: reports the cookie account unlocked plus runs it created. */

export function listAccountReports(accountId: string): AccountReportRow[] {
    const rows: AccountReportRow[] = [];
    const seen = new Set<string>();

    const push = (reportId: string, unlocked: boolean) => {
        if (seen.has(reportId)) return;
        const analysis = getAnalysisById(reportId);
        if (!analysis?.listing || !analysis.verdict) return; // refused/withdrawn carry no drawer row
        seen.add(reportId);
        /* The pill "re-evaluates live against the current policy" (R10-1). Mock:
           the account's edited policy persists client-side in the report
           session (R5 slice); the drawer evaluates the default Balanced preset
           until per-account policy persistence lands with the tracking slice. */
        const run = analysis.policy ? evaluatePolicy(analysis.policy, analysis.policy.presets.balanced) : undefined;
        const unlock = unlocked ? getUnlockInfo(accountId, reportId) : undefined;
        /* R12: an unlocked row's status reflects its tracking record — a price
           drop since the read flips it to "Price dropped ↓" (the R10 script's
           amber state); the status links to the tracking dashboard (the R12
           scope guard's "My-reports row status link"). */
        const track = unlocked ? store.tracking.get(accountId)?.get(reportId) : undefined;
        rows.push({
            reportId,
            slug: analysis.slug,
            number: analysis.number,
            addr: `${analysis.listing.addr}, ${analysis.listing.city}`,
            city: analysis.listing.city,
            type: analysis.listing.type,
            typeFi: analysis.listing.typeFi,
            m2: analysis.listing.m2,
            analysedAt: analysis.readAt,
            gross: analysis.verdict.grossYield.value,
            real: analysis.verdict.realYield.value,
            liabilityTotal: analysis.verdict.liability.total,
            dots: analysis.verdict.flags.map((f) => f.severity),
            policyPassing: run?.passing ?? false,
            policyFails: run?.failCount ?? 0,
            policyTotal: run?.total ?? 0,
            status:
                analysis.listingStatus?.state === "ended"
                    ? "ended"
                    : unlocked && track && track.stoppedAt === undefined && track.priceNow < track.priceAtRead
                      ? "dropped"
                      : unlocked
                        ? "unlocked"
                        : "summary",
            unlockTs: unlock?.ts,
        });
    };

    for (const reportId of store.unlocks.get(accountId) ?? []) push(reportId, true);
    for (const run of store.runs.values()) {
        if (run.accountId === accountId && run.status === "done") {
            const analysis = getBySlug(run.slug);
            if (analysis) push(analysis.id, isUnlocked(accountId, analysis.id));
        }
    }

    // Newest activity first (unlocked by unlock date, then by analysis date).
    return rows.sort((a, b) => (b.unlockTs ?? Date.parse(b.analysedAt)) - (a.unlockTs ?? Date.parse(a.analysedAt)));
}

/* ── Watch (R10-5) ───────────────────────────────────────────────────────────
   Watch = saved query {district, type, maxPrice, policyFilter}; matches
   auto-run the free tier only — 0 credits until an unlock (§4). The match
   runner itself is the tracking slice (R12); this is the stored query. */

export function getWatch(accountId: string): Watch | undefined {
    return store.watches.get(accountId);
}

export function saveWatch(accountId: string, input: { district: string; type: string; maxPrice: number | null; policyFilter: boolean }): Watch | undefined {
    const district = input.district.trim().slice(0, 80);
    if (!district) return undefined;
    if (input.type !== "yksio" && input.type !== "2h" && input.type !== "3h+") return undefined;
    // Max price is optional in the R10-5 frame — null means no cap; when
    // present it must be a non-negative integer euro amount.
    let maxPrice: number | null = null;
    if (input.maxPrice !== null) {
        maxPrice = Math.round(Number(input.maxPrice));
        if (!Number.isFinite(maxPrice) || maxPrice < 0) return undefined;
    }
    const watch: Watch = { district, type: input.type, maxPrice, policyFilter: input.policyFilter === true, updatedAt: Date.now() };
    store.watches.set(accountId, watch);
    return watch;
}

export function clearWatch(accountId: string): void {
    store.watches.delete(accountId);
}

/* ── Refunds (R11-*) ─────────────────────────────────────────────────────────
   POST /reports/:id/refund {reason, note?, target} (handoff-notes "Contract").
   Credit target resolves synchronously: append-only ledger {delta:+1,
   reason:"refund", reportId}, the report STAYS unlocked (we never claw back
   reading), one credit refund per report (409 on the second). Card target
   opens a human-review ticket (≤ 1 business day SLA; mock stays pending).
   The card path also remains open AFTER a credit refund (R11-3/R9-5 "Rather
   have the 79 € back?") — the one-per-report guard binds the credit. */

export const RELOCK_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/** 30-day re-lock guard (R11 guards) — see createCheckout. */
export function isReLockBlocked(accountId: string, reportId: string): boolean {
    const until = store.refunds.get(accountId)?.get(reportId)?.reLockUntil;
    return !!until && until > Date.now();
}

export type RefundResult =
    | { ok: true; target: "credit"; balance: number; reLockUntil: number; restored?: "free" }
    | { ok: true; target: "card"; status: "pending" }
    | { ok: false; error: "not_unlocked" | "bad_reason" | "note_required" | "already_refunded" | "ticket_pending" };

const REFUND_REASONS: RefundReason[] = ["misread", "wrong_listing", "other"];

export function refundReport(accountId: string, reportId: string, input: { reason: string; note?: string; target: string }): RefundResult {
    if (!isUnlocked(accountId, reportId)) return { ok: false, error: "not_unlocked" };
    const reason = input.reason as RefundReason;
    if (!REFUND_REASONS.includes(reason)) return { ok: false, error: "bad_reason" };
    const note = input.note?.trim().slice(0, 500) || undefined;
    // Note required only for "misread" — it routes to the extraction team (R11-2).
    if (reason === "misread" && !note) return { ok: false, error: "note_required" };
    const target = input.target as RefundTarget;
    if (target !== "credit" && target !== "card") return { ok: false, error: "bad_reason" };

    let byReport = store.refunds.get(accountId);
    if (!byReport) {
        byReport = new Map();
        store.refunds.set(accountId, byReport);
    }
    const record: RefundRecord = byReport.get(reportId) ?? { reason, note };
    record.reason = reason;
    if (note) record.note = note;

    if (target === "credit") {
        if (record.creditAt) return { ok: false, error: "already_refunded" };
        record.creditAt = Date.now();
        record.reLockUntil = Date.now() + RELOCK_WINDOW_MS;
        byReport.set(reportId, record);

        /* REGRESSION GUARD (credit-mint exploit): the +1 restore is legitimate
           ONLY against an actual spend. A first-free unlock costs nothing
           (ledger reason "free", delta 0), so refunding it used to mint a real
           credit from thin air — and the cycle refund → spend → refund → …
           across DIFFERENT listings (the 30-day re-lock guard binds only the
           same listing) turned one free claim into unlimited unlocked reports.
           Rule: no spend entry, no credit. A free unlock instead restores the
           account's claim (freeClaimed) — the report still stays open, and
           createCheckout's own "no prior full report" rule keeps the chain
           closed. Unlocks in this store only ever come from spend/free
           entries, so the absence of both is unreachable — still no mint. */
        const entries = store.ledger.get(accountId) ?? [];
        if (entries.some((e) => e.reportId === reportId && e.reason === "spend")) {
            // Synchronous restore; the unlock set is untouched — the report stays open.
            appendLedger(accountId, { delta: +1, reason: "refund", reportId, ts: Date.now() });
            return { ok: true, target: "credit", balance: balanceOf(accountId), reLockUntil: record.reLockUntil };
        }
        const account = getAccount(accountId);
        if (account && entries.some((e) => e.reportId === reportId && e.reason === "free")) account.freeClaimed = false;
        return { ok: true, target: "credit", restored: "free", balance: balanceOf(accountId), reLockUntil: record.reLockUntil };
    }

    if (record.cardTicket?.status === "pending") return { ok: false, error: "ticket_pending" };
    record.cardTicket = { status: "pending", at: Date.now() };
    byReport.set(reportId, record);
    // Mock: the review ticket never resolves here; the real flow is Stripe
    // refund on approve (handoff-notes "Contract").
    return { ok: true, target: "card", status: "pending" };
}

/* ── Notifications (R14) ─────────────────────────────────────────────────────
   GET/PATCH /account/notifications {tracking:{on,digest}, watch:{on,digest},
   analysisDone, productNews}. Transactional mail (receipts, refunds, sign-in
   links) is always sent — no toggle, stated plainly. Digest default daily
   08.00 local ("one email a day"); Instant still caps at 3/day. Per-object
   mutes (Stop tracking / Stop watching) live on their objects (R12/R10-5) —
   this page only links their counts (R14 header annotation). */

export const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
    tracking: { on: true, digest: "daily" },
    watch: { on: true, digest: "daily" },
    analysisDone: true,
    productNews: false, // off by default — "we don't market at people mid-purchase"
};

export function getNotifications(accountId: string): NotificationPrefs {
    const prefs = store.notifications.get(accountId);
    return prefs
        ? { ...prefs, tracking: { ...prefs.tracking }, watch: { ...prefs.watch } }
        : { ...DEFAULT_NOTIFICATIONS, tracking: { ...DEFAULT_NOTIFICATIONS.tracking }, watch: { ...DEFAULT_NOTIFICATIONS.watch } };
}

/** PATCH semantics: absent keys keep their stored value; returns the saved state. */
export function setNotifications(accountId: string, patch: NotificationPrefsPatch): NotificationPrefs {
    const current = getNotifications(accountId);
    const digest = (v: unknown, fallback: "daily" | "instant") => (v === "instant" ? "instant" : v === "daily" ? "daily" : fallback);
    const next: NotificationPrefs = {
        tracking: {
            on: typeof patch.tracking?.on === "boolean" ? patch.tracking.on : current.tracking.on,
            digest: digest(patch.tracking?.digest, current.tracking.digest),
        },
        watch: {
            on: typeof patch.watch?.on === "boolean" ? patch.watch.on : current.watch.on,
            digest: digest(patch.watch?.digest, current.watch.digest),
        },
        analysisDone: typeof patch.analysisDone === "boolean" ? patch.analysisDone : current.analysisDone,
        productNews: typeof patch.productNews === "boolean" ? patch.productNews : current.productNews,
    };
    store.notifications.set(accountId, next);
    return getNotifications(accountId);
}

/* ── Export & deletion (R16) ─────────────────────────────────────────────────
   POST /account/export → job {status, url?, expiresAt} — the zip holds
   /reports/*.pdf (all versions), /analyses/*.json, /chat/*.txt, policy.json,
   ledger.csv, watches.json (R16 contracts). DELETE /account via a single-use
   emailed token (15 min): refund unused credits at the per-credit price paid
   → purge account+content → anonymise receipts (kirjanpitolaki 6 y) → unlist
   owned public analyses → drop from all mail lists. A pending export blocks
   deletion until delivered or cancelled. */

export const EXPORT_LINK_TTL_MS = 48 * 60 * 60 * 1000;
export const DELETION_TOKEN_TTL_MS = 15 * 60 * 1000;

/** Mock: the zip build + email send are the backend's; the job is recorded
   "delivered" because the emailed 48 h link IS the delivery. A real
   "pending" job would block deletion (see deleteAccount). */
export function createExportJob(accountId: string): ExportJob {
    const job: ExportJob = {
        id: `exp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        status: "delivered",
        createdAt: Date.now(),
        expiresAt: Date.now() + EXPORT_LINK_TTL_MS,
    };
    const jobs = store.exports.get(accountId) ?? [];
    jobs.push(job);
    store.exports.set(accountId, jobs);
    return job;
}

export function hasPendingExport(accountId: string): boolean {
    return (store.exports.get(accountId) ?? []).some((j) => j.status === "pending");
}

/** What deletion refunds: unused credits at the per-credit price the account
   actually paid (the latest pack purchase's published perReportEur — engine
   figure, never derived client-side). Nothing paid → 0 €. */
export function deletionPreview(accountId: string): { unusedCredits: number; perCreditEur: number; refundAmountEur: number } {
    const unusedCredits = balanceOf(accountId);
    const purchase = [...(store.ledger.get(accountId) ?? [])].reverse().find((e) => e.reason === "purchase");
    const perCreditEur = purchase?.packId ? (getPack(purchase.packId)?.perReportEur ?? 0) : 0;
    return { unusedCredits, perCreditEur, refundAmountEur: Math.round(unusedCredits * perCreditEur * 100) / 100 };
}

/** Issues the single-use deletion token. Mock: the emailed link (15 min) is
   never sent — DEV_MOCK_TOKEN stands in locally, documented above. */
export function requestAccountDeletion(accountId: string): void {
    const token = `del_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    store.deletionTokens.set(token, { accountId, expiresAt: Date.now() + DELETION_TOKEN_TTL_MS });
}

/** The emailed-link landing (GET confirm) resolves its account from the token
   alone — the link may open on another device, so no cookie is required. */
export function peekDeletionToken(token: string): string | undefined {
    const record = store.deletionTokens.get(token);
    return record && record.expiresAt >= Date.now() ? record.accountId : undefined;
}

export type DeleteAccountResult =
    { ok: true; refundedCredits: number; refundAmountEur: number } | { ok: false; error: "unknown_account" | "bad_token" | "export_pending" };

export function deleteAccount(accountId: string, token: string): DeleteAccountResult {
    const account = getAccount(accountId);
    if (!account) return { ok: false, error: "unknown_account" };
    if (token === DEV_MOCK_TOKEN) {
        // Dev-only stand-in for the emailed single-use token (see DEV_MOCK_TOKEN).
    } else {
        const record = store.deletionTokens.get(token);
        if (!record || record.accountId !== accountId || record.expiresAt < Date.now()) return { ok: false, error: "bad_token" };
        store.deletionTokens.delete(token); // single use
    }
    // A pending export blocks deletion until delivered or cancelled (R16 contracts).
    if (hasPendingExport(accountId)) return { ok: false, error: "export_pending" };

    const { unusedCredits, refundAmountEur } = deletionPreview(accountId);

    // Spec order (§5): refund unused credits (mock Stripe refund) at the
    // per-credit price paid → purge → anonymise receipts → unlist publics.
    const owned = new Set<string>(store.unlocks.get(accountId) ?? []);
    for (const run of store.runs.values()) {
        if (run.accountId === accountId) {
            const analysis = getBySlug(run.slug);
            if (analysis) owned.add(analysis.id);
        }
    }
    for (const reportId of owned) setReportVisibility(reportId, false); // unlisted

    // Receipts stay 6 years, anonymised — kirjanpitolaki, stated on the card:
    // amounts and dates kept for the books, identity stripped.
    for (const intent of store.intents.values()) {
        if (intent.accountId === accountId || intent.email === account.email) intent.email = `anon_${intent.id}@receipts.invalid`;
    }
    for (const invoice of store.invoices.values()) {
        if (invoice.email === account.email) {
            invoice.email = `anon_${invoice.id}@receipts.invalid`;
            invoice.name = undefined;
            invoice.company = undefined;
        }
    }

    // Purge account + content (reports, tracking, watches, chat history). Runs
    // keep their replay value detached; "drop from all mail lists" = the
    // notifications record goes with the account (the mock has no lists).
    store.accountByEmail.delete(account.email);
    store.accounts.delete(accountId);
    store.ledger.delete(accountId);
    store.unlocks.delete(accountId);
    store.chatTurns.delete(accountId);
    store.checklist.delete(accountId);
    store.watches.delete(accountId);
    store.notifications.delete(accountId);
    store.refunds.delete(accountId);
    store.exports.delete(accountId);
    for (const run of store.runs.values()) {
        if (run.accountId === accountId) run.accountId = undefined;
    }

    return { ok: true, refundedCredits: unusedCredits, refundAmountEur };
}
