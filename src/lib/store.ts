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
import type { Lang } from "@/lib/i18n";
import { isSupportedListingUrl } from "@/lib/listing-url";
import type { Account, Analysis, ChatResponse, ClientFlag, DeclineCode, FlagFull, InvoiceRecord, LedgerEntry, Pack, PackId, PaymentIntent } from "@/lib/types";
import { CHAT_TURN_CAP } from "@/lib/types";
import { canonicalAnalysis, fixtures, packs } from "@/mocks/fixtures";

export { isSupportedListingUrl };

/** Engine-authored pack figures (single 79 € · 5-pack 199 € · 20-pack 349 €,
   VAT 25.5 % included) — screens read them here, at the boundary. */
export { packs };

interface RunRecord {
    id: string;
    slug: string;
    status: Analysis["status"];
    startedAt: number;
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
    };
}
const store = globalStore.__asuntoStore;

export function createRun(): RunRecord {
    // Every supported URL replays the canonical analysis (the sandbox fixture pattern, R17).
    const id = `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const run: RunRecord = { id, slug: canonicalAnalysis.slug, status: "running", startedAt: Date.now() };
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
              | "already_unlocked";
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
