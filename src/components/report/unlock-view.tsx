"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LangToggle } from "@/components/report/lang-toggle";
import { formatEUR, formatEURPerReport, numberWord } from "@/lib/format";
import type { Pack, PackId } from "@/lib/types";
import { tpl, useLang } from "@/providers/lang";
import { cx } from "@/utils/cx";

/**
 * /unlock view — packs + payment states (R6-1…R6-10). One screen whose states
 * swap in place: packs (R6-1/R6-5/R6-10) → paying (R6-6) → paid (R6-2/R6-8) ·
 * declined (R6-3/R6-9, inline, never a toast) → invoice (R6-7, from the 3rd
 * decline) · 0-credits (R6-4) · first-free claim (banner path, no card).
 * All payment logic lives behind /api/checkout; this component only formats
 * engine/store-authored figures (§6.2) and never transmits expiry/CVC — the
 * mock POST carries the card number only.
 */

export interface UnlockReportContext {
    id: string;
    slug: string;
    addr: string;
    lockedFlags: number;
    tests: number;
}

interface IntentPayload {
    id: string;
    kind: "pack" | "first-free" | "use-credit";
    packId?: PackId;
    status: "processing" | "paid" | "declined";
    declineCode?: "insufficient_funds" | "generic";
    creditsAdded: number;
    spent: number;
    declines: number;
    invoiceAvailable: boolean;
    reportId?: string;
    reportSlug?: string;
    balance: number | null;
}

type View = "packs" | "paying" | "paid" | "declined" | "invoice-sent";

const PACK_COPY = { single: "packSingle", five: "packFive", twenty: "packTwenty" } as const;

/** Browser-level first-free marker (R6-1 annotation: "account/browser has no prior full report"). */
const FIRST_FREE_KEY = "rsm_first_free";
const SESSION_KEY = "rsm_checkout_session";

const MIN_PAYING_MS = 1400; // R6-6 "Typical wait 2–5 s" — keep the paying state perceptible in the mock.

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function digitsOnly(value: string): string {
    return value.replace(/\D/g, "");
}

function formatCardInput(value: string): string {
    return digitsOnly(value)
        .slice(0, 19)
        .replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiryInput(value: string): string {
    const digits = digitsOnly(value).slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

function validEmail(value: string): boolean {
    return /^\S+@\S+\.\S+$/.test(value.trim());
}

/* Inline Lucide-style glyphs (the DS icon set ships no CoinsHand/Check in this repo). */
function IconCheck({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden
        >
            <path d="M20 6 9 17l-5-5" />
        </svg>
    );
}

function IconAlert({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    );
}

function IconCoins({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden
        >
            <circle cx="8" cy="8" r="6" />
            <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
            <path d="M7 6h1v4" />
            <path d="m16.71 13.88.7.71-2.82 2.82" />
        </svg>
    );
}

export function UnlockView({
    report,
    packs,
    reasonCredits,
    hasAccount,
    balance,
    used,
    firstFreeEligible,
    alreadyUnlocked,
}: {
    report?: UnlockReportContext;
    /** Engine-authored pack figures — read through the store by the page (swap rule). */
    packs: Pack[];
    reasonCredits: boolean;
    hasAccount: boolean;
    balance: number;
    used: number;
    firstFreeEligible: boolean;
    alreadyUnlocked: boolean;
}) {
    const { lang, t } = useLang();
    const u = t.unlock;

    const [view, setView] = useState<View>("packs");
    const [selectedPackId, setSelectedPackId] = useState<PackId>("five");
    const selectedPack = packs.find((p) => p.id === selectedPackId) ?? packs[1];

    const [email, setEmail] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvc, setCvc] = useState("");
    const [errors, setErrors] = useState<{ email?: string; card?: string; expiry?: string; cvc?: string; form?: string }>({});
    const [cardDeclinedStyle, setCardDeclinedStyle] = useState(false);

    const [intent, setIntent] = useState<IntentPayload | null>(null);
    const [declineCode, setDeclineCode] = useState<"insufficient_funds" | "generic">("insufficient_funds");
    const [invoiceAvailable, setInvoiceAvailable] = useState(false);
    const [invoiceName, setInvoiceName] = useState("");
    const [invoiceCompany, setInvoiceCompany] = useState("");
    const [invoiceBusy, setInvoiceBusy] = useState(false);
    const [invoiceEmail, setInvoiceEmail] = useState("");

    const [firstFreeVisible, setFirstFreeVisible] = useState(firstFreeEligible);
    const [claimOpen, setClaimOpen] = useState(false);
    const [claimBusy, setClaimBusy] = useState(false);
    const [claimError, setClaimError] = useState<string | null>(null);
    const [creditBusy, setCreditBusy] = useState(false);

    const h1Ref = useRef<HTMLHeadingElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const stateRef = useRef<HTMLDivElement>(null);
    const sessionIdRef = useRef<string>("");

    useEffect(() => {
        h1Ref.current?.focus();
        // Browser flag hides the banner even before any account exists.
        if (window.localStorage.getItem(FIRST_FREE_KEY) === "1") setFirstFreeVisible(false);
        let sessionId = window.sessionStorage.getItem(SESSION_KEY);
        if (!sessionId) {
            sessionId = `cs_${crypto.randomUUID()}`;
            window.sessionStorage.setItem(SESSION_KEY, sessionId);
        }
        sessionIdRef.current = sessionId;
    }, []);

    useEffect(() => {
        if (view !== "packs") stateRef.current?.focus();
    }, [view]);

    const amount = formatEUR(selectedPack.priceEur, lang);
    const packCopy = u[PACK_COPY[selectedPack.id]];
    const reportHref = report ? `/r/${report.slug}` : "/";

    const showOutOfCredits = !alreadyUnlocked && (reasonCredits || (hasAccount && used > 0 && balance === 0));
    const showUseCredit = hasAccount && balance > 0 && !!report && !alreadyUnlocked && !firstFreeVisible;

    async function postJSON(url: string, body: unknown): Promise<{ status: number; data: Record<string, unknown> }> {
        try {
            const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
            const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
            return { status: res.status, data };
        } catch {
            return { status: 0, data: {} };
        }
    }

    /** POST creates the intent; the UI then polls GET /api/checkout/:intent for the outcome (handoff contract). */
    async function pollIntent(id: string): Promise<IntentPayload | null> {
        for (let attempt = 0; attempt < 6; attempt++) {
            try {
                const res = await fetch(`/api/checkout/${id}`, { cache: "no-store" });
                if (res.ok) {
                    const payload = (await res.json()) as IntentPayload;
                    if (payload.status !== "processing") return payload;
                }
            } catch {
                /* keep polling */
            }
            await sleep(500);
        }
        return null;
    }

    function validateCardForm(): boolean {
        const next: typeof errors = {};
        if (!validEmail(email)) next.email = u.errEmail;
        if (!/^\d{12,19}$/.test(digitsOnly(cardNumber))) next.card = u.errCard;
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) next.expiry = u.errExpiry;
        if (!/^\d{3,4}$/.test(cvc)) next.cvc = u.errCvc;
        setErrors(next);
        return Object.keys(next).length === 0;
    }

    async function submitPay(event: React.FormEvent) {
        event.preventDefault();
        setCardDeclinedStyle(false);
        if (!validateCardForm()) return;
        setView("paying");
        const started = Date.now();
        // Only the card number leaves the browser, to the mock — expiry/CVC never do.
        const { data } = await postJSON("/api/checkout", {
            packId: selectedPack.id,
            email: email.trim(),
            reportId: report?.id,
            cardNumber,
            sessionId: sessionIdRef.current,
        });
        const payload = typeof data.id === "string" ? await pollIntent(data.id as string) : null;
        const waitLeft = MIN_PAYING_MS - (Date.now() - started);
        if (waitLeft > 0) await sleep(waitLeft);

        if (payload?.status === "paid") {
            setIntent(payload);
            setView("paid");
        } else if (payload?.status === "declined") {
            setDeclineCode(payload.declineCode ?? "generic");
            setInvoiceAvailable(payload.invoiceAvailable);
            setCardDeclinedStyle(true);
            setView("declined");
        } else {
            setErrors({ form: u.errGeneric });
            setView("packs");
        }
    }

    async function submitClaim(event: React.FormEvent) {
        event.preventDefault();
        if (!validEmail(email)) {
            setErrors({ email: u.errEmail });
            return;
        }
        setErrors({});
        setClaimBusy(true);
        const { status, data } = await postJSON("/api/checkout", {
            packId: "first-free",
            email: email.trim(),
            reportId: report?.id,
            sessionId: sessionIdRef.current,
        });
        setClaimBusy(false);
        if (status === 409) {
            // First-free honored once — the board-honest 409 copy replaces the banner.
            setClaimError(u.firstFreeUsed);
            setFirstFreeVisible(false);
            window.localStorage.setItem(FIRST_FREE_KEY, "1");
            return;
        }
        if (typeof data.id === "string" && data.status === "paid") {
            window.localStorage.setItem(FIRST_FREE_KEY, "1");
            setIntent(data as unknown as IntentPayload);
            setView("paid");
        } else {
            setErrors({ form: u.errGeneric });
        }
    }

    async function submitUseCredit() {
        setCreditBusy(true);
        const { status, data } = await postJSON("/api/checkout", { packId: "use-credit", reportId: report?.id, sessionId: sessionIdRef.current });
        setCreditBusy(false);
        if (typeof data.id === "string" && data.status === "paid") {
            setIntent(data as unknown as IntentPayload);
            setView("paid");
        } else if (status !== 0) {
            setErrors({ form: u.errGeneric });
        }
    }

    async function submitInvoice(event: React.FormEvent) {
        event.preventDefault();
        if (!validEmail(invoiceEmail || email)) {
            setErrors({ email: u.errEmail });
            return;
        }
        setInvoiceBusy(true);
        const { status } = await postJSON("/api/checkout/invoice", {
            packId: selectedPack.id,
            email: (invoiceEmail || email).trim(),
            name: invoiceName,
            company: invoiceCompany,
        });
        setInvoiceBusy(false);
        if (status === 200) {
            setInvoiceEmail(invoiceEmail || email);
            setView("invoice-sent");
        } else {
            setErrors({ form: u.errGeneric });
        }
    }

    const last4 = digitsOnly(cardNumber).slice(-4);
    const intentPack = intent?.packId ? (packs.find((p) => p.id === intent.packId) ?? null) : null;

    function clearError(field: "email" | "card" | "expiry" | "cvc" | "form") {
        setErrors((prev) => {
            if (!prev[field]) return prev;
            const next = { ...prev };
            delete next[field];
            return next;
        });
    }

    const inputClass = (invalid?: string | boolean) =>
        cx(
            "min-h-12 w-full rounded-rsm-input border bg-white px-4 text-sm text-rsm-midnight placeholder:text-rsm-misty-75",
            "focus:border-rsm-steel focus:outline-2 focus:outline-offset-1 focus:outline-rsm-steel-25 disabled:opacity-55",
            invalid ? "border-rsm-coral" : "border-rsm-hairline",
        );
    const labelClass = "mb-1.5 block text-xs font-bold text-rsm-charcoal";
    const errorClass = "mt-1 text-xs font-medium text-rsm-coral-deep";

    /* ── State screens ──────────────────────────────────────────────────── */

    function renderPaying() {
        return (
            <div
                ref={stateRef}
                tabIndex={-1}
                aria-live="polite"
                className="rounded-rsm-card border border-rsm-hairline bg-white p-6 shadow-rsm-sm outline-none md:p-7"
            >
                <div className="flex flex-wrap items-baseline gap-2.5">
                    <span className="font-display text-lg font-medium text-rsm-midnight">{tpl(u.payTitle, { amount, pack: packCopy.name })}</span>
                    <span className="text-xs text-rsm-misty">{u.payingProcessing}</span>
                </div>
                <div className="pointer-events-none mt-4 grid gap-3 opacity-55 min-[601px]:grid-cols-2" aria-hidden>
                    <div className="rounded-rsm-input border border-rsm-hairline px-4 py-3 text-sm text-rsm-charcoal">{email}</div>
                    <div className="tnum rounded-rsm-input border border-rsm-hairline px-4 py-3 text-sm text-rsm-charcoal">
                        •••• •••• •••• {last4} · {expiry} · •••
                    </div>
                </div>
                <div className="mt-4 flex flex-col gap-3 min-[601px]:flex-row min-[601px]:items-center">
                    <span className="inline-flex min-h-12 flex-none items-center justify-center gap-2.5 rounded-full bg-rsm-lime px-7 text-sm font-bold whitespace-nowrap text-rsm-midnight">
                        <span className="size-3.5 animate-spin rounded-full border-2 border-rsm-midnight/25 border-t-rsm-midnight" aria-hidden />
                        {tpl(u.payingCta, { amount })}
                    </span>
                    <span className="text-xs leading-relaxed text-rsm-misty">{u.payingNote}</span>
                </div>
            </div>
        );
    }

    function renderPaid() {
        if (!intent) return null;
        const slug = intent.reportSlug ?? report?.slug;
        const isFree = intent.kind === "first-free";
        const isCredit = intent.kind === "use-credit";
        const title = isFree || isCredit ? u.freeSuccessTitle : u.paidTitle;
        return (
            <div ref={stateRef} tabIndex={-1} className="rounded-rsm-card border border-rsm-hairline bg-white p-6 shadow-rsm-sm outline-none md:p-8">
                <div className="flex items-start gap-3.5">
                    <span className="flex size-[38px] flex-none items-center justify-center rounded-full bg-rsm-midnight text-rsm-lime">
                        <IconCheck className="size-[19px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <h2 className="font-display text-xl font-medium text-rsm-midnight">{title}</h2>
                        <p className="mt-2 text-sm leading-relaxed wrap-anywhere text-rsm-charcoal">
                            {isFree ? (
                                tpl(u.freeSuccessBody, { email })
                            ) : isCredit ? (
                                <>
                                    {tpl(u.creditSuccessBody, { addr: report?.addr ?? "" })}{" "}
                                    <strong className="tnum font-display font-medium text-rsm-midnight">
                                        {tpl(u.creditsLeft, { n: intent.balance ?? 0 })}
                                    </strong>{" "}
                                    {u.creditSuccessTail}
                                </>
                            ) : (
                                <>
                                    <span className="min-[601px]:hidden">
                                        {tpl(u.paidBodyShort, { added: intent.creditsAdded, spent: intent.spent })}{" "}
                                        <strong className="tnum font-display font-medium text-rsm-midnight">
                                            {tpl(u.creditsLeftShort, { n: intent.balance ?? 0 })}
                                        </strong>{" "}
                                        {u.paidTailShort}
                                    </span>
                                    <span className="hidden min-[601px]:inline">
                                        {tpl(u.paidBody, {
                                            amount: intentPack ? formatEUR(intentPack.priceEur, lang) : "",
                                            added: intent.creditsAdded,
                                            spent: intent.spent,
                                            addr: report?.addr ?? "",
                                        })}{" "}
                                        <strong className="tnum font-display font-medium text-rsm-midnight">
                                            {tpl(u.creditsLeft, { n: intent.balance ?? 0 })}
                                        </strong>{" "}
                                        {tpl(u.paidTail, { email })}
                                    </span>
                                </>
                            )}
                        </p>
                        <div className="mt-4 flex flex-col gap-2.5 min-[601px]:flex-row min-[601px]:items-center">
                            {slug ? (
                                <Link
                                    href={`/r/${slug}`}
                                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-rsm-lime px-6 text-base font-bold text-rsm-midnight shadow-rsm-chip transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rsm-steel min-[601px]:min-h-11 min-[601px]:text-sm"
                                >
                                    {u.openReport}
                                </Link>
                            ) : null}
                            <Link
                                href="/reports"
                                className="inline-flex min-h-11 items-center justify-center px-3 text-sm font-medium text-rsm-midnight underline-offset-4 hover:underline min-[601px]:justify-start"
                            >
                                {u.myReports}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    function renderDeclined() {
        const code = u.declineCodes[declineCode] ?? u.declineCodes.generic;
        return (
            <div ref={stateRef} tabIndex={-1} className="flex flex-col gap-4 outline-none">
                <div className="rounded-rsm-card border border-rsm-hairline bg-white p-5 shadow-rsm-sm md:p-6">
                    <div
                        role="alert"
                        className="flex items-start gap-2.5 rounded-[10px] border border-l-4 border-rsm-coral-25 border-l-rsm-coral bg-rsm-fail-wash px-4 py-3"
                    >
                        <span className="mt-0.5 flex text-rsm-coral-deep">
                            <IconAlert className="size-4" />
                        </span>
                        <span className="text-[13px] leading-relaxed text-rsm-midnight">
                            <span className="min-[601px]:hidden">
                                <strong>{u.declinedTitleShort}</strong> {tpl(u.declinedBodyMobile, { code })}
                            </span>
                            <span className="hidden min-[601px]:inline">
                                <strong>{u.declinedTitle}</strong> {tpl(u.declinedBody, { code })}
                            </span>
                        </span>
                    </div>
                    <div className="mt-4 grid items-end gap-3 min-[601px]:grid-cols-[1fr_auto]">
                        <div>
                            <label htmlFor="declined-card" className={labelClass}>
                                {u.cardNumberLabel}
                            </label>
                            <input
                                id="declined-card"
                                readOnly
                                aria-invalid="true"
                                value={`•••• •••• •••• ${last4}`}
                                className={cx(inputClass(true), "tnum bg-white")}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setView("packs")}
                            className="inline-flex min-h-12 items-center justify-center rounded-full bg-rsm-lime px-6 text-sm font-bold text-rsm-midnight shadow-rsm-chip transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rsm-steel"
                        >
                            <span className="min-[601px]:hidden">{u.tryAnother}</span>
                            <span className="hidden min-[601px]:inline">{u.tryAgain}</span>
                        </button>
                    </div>
                    <p className="mt-2.5 text-xs leading-relaxed text-rsm-misty">
                        <span className="min-[601px]:hidden">{u.declineMetaMobile}</span>
                        <span className="hidden min-[601px]:inline">{u.declineMeta}</span>
                    </p>
                </div>
                {/* R6-7 — the invoice route exists only from the third decline. */}
                {invoiceAvailable ? renderInvoice() : null}
            </div>
        );
    }

    function renderInvoice() {
        return (
            <form onSubmit={submitInvoice} className="rounded-rsm-card border border-rsm-hairline bg-white p-5 shadow-rsm-sm md:p-6" noValidate>
                <h2 className="font-display text-lg font-medium text-rsm-midnight">{u.invoiceTitle}</h2>
                <p className="mt-1.5 text-[13px] leading-relaxed text-rsm-charcoal">
                    {tpl(u.invoiceBody, { pack: u.invoicePack[selectedPack.id] })}{" "}
                    <strong className="font-display font-medium text-rsm-midnight">{u.invoiceBodyNet}</strong>
                    {u.invoiceBodyTail}
                </p>
                <div className="mt-4 grid gap-3 min-[601px]:grid-cols-2">
                    <div>
                        <label htmlFor="invoice-name" className={labelClass}>
                            {u.invoiceNameLabel}
                        </label>
                        <input
                            id="invoice-name"
                            value={invoiceName}
                            onChange={(e) => setInvoiceName(e.target.value)}
                            placeholder={u.invoiceNamePlaceholder}
                            autoComplete="name"
                            className={inputClass()}
                        />
                    </div>
                    <div>
                        <label htmlFor="invoice-email" className={labelClass}>
                            {u.invoiceEmailLabel}
                        </label>
                        <input
                            id="invoice-email"
                            type="email"
                            value={invoiceEmail || email}
                            onChange={(e) => {
                                setInvoiceEmail(e.target.value);
                                clearError("email");
                            }}
                            placeholder={u.emailPlaceholder}
                            autoComplete="email"
                            inputMode="email"
                            aria-invalid={!!errors.email}
                            className={inputClass(errors.email)}
                        />
                        {errors.email ? <p className={errorClass}>{errors.email}</p> : null}
                    </div>
                    <div>
                        <label htmlFor="invoice-company" className={labelClass}>
                            {u.invoiceCompanyLabel}
                        </label>
                        <input
                            id="invoice-company"
                            value={invoiceCompany}
                            onChange={(e) => setInvoiceCompany(e.target.value)}
                            placeholder={u.invoiceCompanyPlaceholder}
                            autoComplete="organization"
                            className={inputClass()}
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={invoiceBusy}
                            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-rsm-lime px-6 text-sm font-bold text-rsm-midnight shadow-rsm-chip transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rsm-steel disabled:opacity-55"
                        >
                            {tpl(u.invoiceCta, { amount })}
                        </button>
                    </div>
                </div>
                {errors.form ? <p className={errorClass}>{errors.form}</p> : null}
                <p className="mt-2.5 text-[11.5px] leading-relaxed text-rsm-misty">{u.invoiceMeta}</p>
            </form>
        );
    }

    function renderInvoiceSent() {
        return (
            <div ref={stateRef} tabIndex={-1} className="rounded-rsm-card border border-rsm-hairline bg-white p-6 shadow-rsm-sm outline-none md:p-8">
                <div className="flex items-start gap-3.5">
                    <span className="flex size-[38px] flex-none items-center justify-center rounded-full bg-rsm-midnight text-rsm-lime">
                        <IconCheck className="size-[19px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <h2 className="font-display text-xl font-medium wrap-anywhere text-rsm-midnight">
                            {tpl(u.invoiceSentTitle, { email: invoiceEmail || email })}
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-rsm-charcoal">{u.invoiceSentBody}</p>
                        <button
                            type="button"
                            onClick={() => setView("packs")}
                            className="mt-3 inline-flex min-h-11 items-center px-1 text-sm font-medium text-rsm-steel underline-offset-4 hover:underline"
                        >
                            {u.invoiceBack}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Packs-screen pieces ────────────────────────────────────────────── */

    function renderFirstFreeBanner() {
        if (!firstFreeVisible || !report) return null;
        return (
            <div className="mt-5 rounded-rsm-tile border border-rsm-hairline bg-white p-4 min-[601px]:px-5">
                {/* ≥601: full banner with inline email + button (R6-1). */}
                <form onSubmit={submitClaim} className="hidden items-center gap-4 min-[601px]:flex" noValidate>
                    <span className="flex size-[38px] flex-none items-center justify-center rounded-[10px] bg-rsm-lime-25 text-rsm-midnight">
                        <IconCoins className="size-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block font-display text-[15.5px] font-medium text-rsm-midnight">{u.firstFreeTitle}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-rsm-charcoal">{u.firstFreeBody}</span>
                    </span>
                    <label htmlFor="claim-email" className="sr-only">
                        {u.emailShort}
                    </label>
                    <input
                        id="claim-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={u.emailPlaceholder}
                        autoComplete="email"
                        inputMode="email"
                        aria-invalid={!!errors.email}
                        className={cx(inputClass(errors.email), "w-56")}
                    />
                    <button
                        type="submit"
                        disabled={claimBusy}
                        className="inline-flex min-h-11 flex-none items-center justify-center rounded-full border border-rsm-hairline bg-white px-5 text-sm font-bold text-rsm-midnight transition-colors duration-200 ease-rsm hover:border-rsm-steel hover:text-rsm-steel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rsm-steel disabled:opacity-55"
                    >
                        {claimBusy ? u.claimWorking : u.firstFreeCta}
                    </button>
                </form>
                {/* <601: compact row; Claim → expands the email field (R6-5). */}
                <div className="min-[601px]:hidden">
                    <div className="flex items-center gap-3">
                        <span className="flex size-8 flex-none items-center justify-center rounded-[9px] bg-rsm-lime-25 text-rsm-midnight">
                            <IconCoins className="size-[15px]" />
                        </span>
                        <span className="min-w-0 flex-1 text-xs leading-snug text-rsm-midnight">
                            <strong>{u.firstFreeMobileTitle}</strong> {u.firstFreeMobileBody}
                        </span>
                        <button
                            type="button"
                            aria-expanded={claimOpen}
                            onClick={() => setClaimOpen(true)}
                            className={cx("min-h-11 flex-none px-1 text-xs font-bold whitespace-nowrap text-rsm-steel", claimOpen && "hidden")}
                        >
                            {u.firstFreeMobileCta}
                        </button>
                    </div>
                    {claimOpen ? (
                        <form onSubmit={submitClaim} className="mt-3 flex gap-2" noValidate>
                            <label htmlFor="claim-email-m" className="sr-only">
                                {u.emailShort}
                            </label>
                            <input
                                id="claim-email-m"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={u.emailPlaceholder}
                                autoComplete="email"
                                inputMode="email"
                                aria-invalid={!!errors.email}
                                className={inputClass(errors.email)}
                            />
                            <button
                                type="submit"
                                disabled={claimBusy}
                                className="inline-flex min-h-12 flex-none items-center justify-center rounded-full bg-rsm-lime px-4 text-xs font-bold text-rsm-midnight shadow-rsm-chip disabled:opacity-55"
                            >
                                {claimBusy ? u.claimWorking : u.firstFreeCta}
                            </button>
                        </form>
                    ) : null}
                </div>
                {errors.email && view === "packs" ? <p className={cx(errorClass, "min-[601px]:text-right")}>{errors.email}</p> : null}
            </div>
        );
    }

    function renderUseCreditBanner() {
        if (!showUseCredit) return null;
        return (
            <div className="mt-5 flex flex-col items-start gap-3 rounded-rsm-tile border border-rsm-hairline bg-white p-4 min-[601px]:flex-row min-[601px]:items-center min-[601px]:gap-4 min-[601px]:px-5">
                <span className="flex size-[38px] flex-none items-center justify-center rounded-[10px] bg-rsm-lime-25 text-rsm-midnight">
                    <IconCoins className="size-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="tnum block font-display text-[15.5px] font-medium text-rsm-midnight">{tpl(u.useCreditTitle, { n: balance })}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-rsm-charcoal">{u.useCreditBody}</span>
                </span>
                <button
                    type="button"
                    onClick={submitUseCredit}
                    disabled={creditBusy}
                    className="inline-flex min-h-11 flex-none items-center justify-center rounded-full bg-rsm-lime px-5 text-sm font-bold text-rsm-midnight shadow-rsm-chip transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rsm-steel disabled:opacity-55"
                >
                    {u.useCreditCta}
                </button>
            </div>
        );
    }

    function renderOutOfCredits() {
        if (!showOutOfCredits) return null;
        // The board spells the count ("Your seven analyses") — number words from format.ts.
        const usedWord = numberWord(used, lang);
        return (
            <div className="mt-5 rounded-rsm-tile border border-rsm-hairline bg-white p-5 min-[601px]:px-6">
                <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-display text-lg font-medium text-rsm-midnight">{u.outOfCredits}</h2>
                    <span className="tnum rounded-full px-2.5 py-1 text-[11px] font-bold text-rsm-misty shadow-[inset_0_0_0_1px_var(--color-rsm-hairline)]">
                        {tpl(u.creditsPill, { left: balance, used })}
                    </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-rsm-charcoal">{used === 1 ? u.outBodyOne : tpl(u.outBody, { usedWord })}</p>
                <div className="mt-4 flex flex-wrap gap-2.5">
                    {(["five", "single", "twenty"] as const).map((packId, i) => {
                        const pack = packs.find((p) => p.id === packId)!;
                        const copy = u[PACK_COPY[packId]];
                        return (
                            <button
                                key={packId}
                                type="button"
                                onClick={() => selectPack(pack)}
                                className={cx(
                                    "tnum inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-bold transition-colors duration-200 ease-rsm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rsm-steel",
                                    i === 0
                                        ? "bg-rsm-lime text-rsm-midnight shadow-rsm-chip hover:bg-rsm-lime-75"
                                        : i === 1
                                          ? "border border-rsm-hairline bg-white text-rsm-midnight hover:border-rsm-steel"
                                          : "text-rsm-steel hover:underline",
                                )}
                            >
                                {`${copy.shortcut} · ${formatEUR(pack.priceEur, lang)}`}
                            </button>
                        );
                    })}
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-rsm-misty">{u.anneNote}</p>
            </div>
        );
    }

    function selectPack(pack: Pack) {
        setSelectedPackId(pack.id);
        setCardDeclinedStyle(false);
        emailRef.current?.focus();
    }

    function renderPackCards() {
        return (
            <>
                {/* ≥601: three-across cards, stack only ≤600 (R6-1/R6-10). */}
                <div className="mt-5 hidden grid-cols-3 items-stretch gap-3.5 min-[601px]:grid">
                    {packs.map((pack) => {
                        const copy = u[PACK_COPY[pack.id]];
                        const selected = pack.id === selectedPackId;
                        return (
                            <div
                                key={pack.id}
                                className={cx(
                                    "relative flex flex-col rounded-2xl p-5 min-[1280px]:p-6",
                                    pack.featured ? "border-2 border-rsm-midnight bg-rsm-midnight" : "border border-rsm-hairline bg-white",
                                )}
                            >
                                {pack.featured ? (
                                    <span className="absolute -top-2.5 left-5 rounded-full bg-rsm-lime px-2.5 py-1 text-[10px] font-bold tracking-[0.06em] text-rsm-midnight">
                                        {u.badge}
                                    </span>
                                ) : null}
                                <div className={cx("text-[10.5px] font-bold tracking-[0.07em] uppercase", pack.featured ? "text-rsm-misty" : "text-rsm-misty")}>
                                    {copy.name}
                                </div>
                                <div className="tnum mt-2 flex flex-wrap items-baseline gap-x-2">
                                    <span
                                        className={cx(
                                            "font-display text-[26px] font-medium min-[1280px]:text-[34px]",
                                            pack.featured ? "text-rsm-paper" : "text-rsm-midnight",
                                        )}
                                    >
                                        {formatEUR(pack.priceEur, lang)}
                                    </span>
                                    <span className="tnum text-xs text-rsm-misty">
                                        {pack.id === "single" ? copy.note : formatEURPerReport(pack.perReportEur, lang)}
                                    </span>
                                </div>
                                <p className={cx("mt-2 text-xs leading-relaxed", pack.featured ? "text-rsm-misty-50" : "text-rsm-charcoal")}>
                                    <span className="min-[1280px]:hidden">{copy.descShort}</span>
                                    <span className="hidden min-[1280px]:inline">{copy.desc}</span>
                                </p>
                                <div className="mt-auto pt-4">
                                    <button
                                        type="button"
                                        onClick={() => selectPack(pack)}
                                        aria-pressed={selected}
                                        className={cx(
                                            "inline-flex min-h-11 w-full items-center justify-center rounded-full px-4 text-xs font-bold transition-colors duration-200 ease-rsm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rsm-steel min-[1280px]:text-sm",
                                            pack.featured
                                                ? "bg-rsm-lime text-rsm-midnight hover:bg-rsm-lime-75"
                                                : "border border-rsm-hairline bg-white text-rsm-midnight hover:border-rsm-steel hover:text-rsm-steel",
                                        )}
                                    >
                                        {copy.cta}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {/* <601: stacked radio rows, featured first (R6-5). */}
                <div role="radiogroup" aria-label={u.eyebrow} className="mt-4 flex flex-col gap-2.5 min-[601px]:hidden">
                    {[...packs]
                        .sort((a) => (a.featured ? -1 : 0))
                        .map((pack) => {
                            const copy = u[PACK_COPY[pack.id]];
                            const selected = pack.id === selectedPackId;
                            return (
                                <button
                                    key={pack.id}
                                    type="button"
                                    role="radio"
                                    aria-checked={selected}
                                    onClick={() => setSelectedPackId(pack.id)}
                                    className={cx(
                                        "relative flex min-h-14 items-center gap-3 rounded-rsm-tile px-4 py-3.5 text-left",
                                        pack.featured ? "border-2 border-rsm-midnight bg-rsm-midnight" : "border border-rsm-hairline bg-white",
                                    )}
                                >
                                    {pack.featured ? (
                                        <span className="absolute -top-2 left-4 rounded-full bg-rsm-lime px-2 py-[3px] text-[9px] font-bold tracking-[0.06em] text-rsm-midnight">
                                            {u.badge}
                                        </span>
                                    ) : null}
                                    <span className="min-w-0 flex-1">
                                        <span
                                            className={cx(
                                                "tnum block font-display text-xl font-medium",
                                                pack.featured ? "text-rsm-paper" : "text-rsm-midnight",
                                            )}
                                        >
                                            {formatEUR(pack.priceEur, lang)}{" "}
                                            <span className="tnum font-body text-xs font-medium text-rsm-misty">
                                                {pack.id === "single"
                                                    ? copy.name.toLowerCase()
                                                    : `${copy.name} · ${formatEURPerReport(pack.perReportEur, lang)}`}
                                            </span>
                                        </span>
                                        {pack.featured ? <span className="mt-0.5 block text-[11.5px] text-rsm-misty-50">{copy.descShort}</span> : null}
                                    </span>
                                    <span
                                        aria-hidden
                                        className={cx(
                                            "flex size-[22px] flex-none items-center justify-center rounded-full",
                                            selected ? "border-2 border-rsm-lime" : "border-[1.5px] border-rsm-misty-50",
                                        )}
                                    >
                                        {selected ? <span className="size-2.5 rounded-full bg-rsm-lime" /> : null}
                                    </span>
                                </button>
                            );
                        })}
                </div>
                <p className="mt-2.5 text-center text-xs leading-relaxed text-rsm-misty">
                    <span className="min-[1280px]:hidden">{u.vatLineShort}</span>
                    <span className="hidden min-[1280px]:inline">{u.vatLine}</span>
                </p>
            </>
        );
    }

    function renderPayCard() {
        return (
            <div className="mt-6 rounded-2xl border border-rsm-hairline bg-white p-5 min-[601px]:p-6 min-[1280px]:px-8">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <div aria-live="polite" className="tnum font-display text-base font-medium text-rsm-midnight min-[1280px]:text-lg">
                        <span className="min-[1280px]:hidden">{tpl(u.payTitleShort, { amount })}</span>
                        <span className="hidden min-[1280px]:inline">{tpl(u.payTitle, { amount, pack: packCopy.name })}</span>
                    </div>
                    <span className="text-xs leading-relaxed text-rsm-misty">
                        <span className="min-[1280px]:hidden">{u.accountNoteShort}</span>
                        <span className="hidden min-[1280px]:inline">{u.accountNote}</span>
                    </span>
                </div>
                <div className="mt-4 grid gap-3.5 min-[601px]:grid-cols-2">
                    <div>
                        <label htmlFor="pay-email" className={labelClass}>
                            <span className="min-[1280px]:hidden">{u.emailShort}</span>
                            <span className="hidden min-[1280px]:inline">{u.emailLabel}</span>
                        </label>
                        <input
                            id="pay-email"
                            ref={emailRef}
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                clearError("email");
                            }}
                            placeholder={u.emailPlaceholder}
                            autoComplete="email"
                            inputMode="email"
                            aria-invalid={!!errors.email}
                            className={inputClass(errors.email)}
                        />
                        {errors.email ? <p className={errorClass}>{errors.email}</p> : null}
                    </div>
                    <div>
                        <label htmlFor="pay-card" className={labelClass}>
                            {u.cardNumberLabel}
                        </label>
                        <input
                            id="pay-card"
                            value={cardNumber}
                            onChange={(e) => {
                                setCardNumber(formatCardInput(e.target.value));
                                setCardDeclinedStyle(false);
                                clearError("card");
                            }}
                            placeholder={u.cardPlaceholder}
                            autoComplete="cc-number"
                            inputMode="numeric"
                            aria-invalid={!!errors.card || cardDeclinedStyle}
                            className={cx(inputClass(errors.card || cardDeclinedStyle), "tnum")}
                        />
                        {errors.card ? <p className={errorClass}>{errors.card}</p> : null}
                    </div>
                    <div className="grid grid-cols-2 gap-3.5 max-[1280px]:col-span-2 min-[601px]:max-[1280px]:col-span-1">
                        <div>
                            <label htmlFor="pay-expiry" className={labelClass}>
                                {u.expiryLabel}
                            </label>
                            <input
                                id="pay-expiry"
                                value={expiry}
                                onChange={(e) => {
                                    setExpiry(formatExpiryInput(e.target.value));
                                    clearError("expiry");
                                }}
                                placeholder="MM / YY"
                                autoComplete="cc-exp"
                                inputMode="numeric"
                                aria-invalid={!!errors.expiry}
                                className={cx(inputClass(errors.expiry), "tnum")}
                            />
                            {errors.expiry ? <p className={errorClass}>{errors.expiry}</p> : null}
                        </div>
                        <div>
                            <label htmlFor="pay-cvc" className={labelClass}>
                                {u.cvcLabel}
                            </label>
                            <input
                                id="pay-cvc"
                                value={cvc}
                                onChange={(e) => {
                                    setCvc(digitsOnly(e.target.value).slice(0, 4));
                                    clearError("cvc");
                                }}
                                placeholder="123"
                                autoComplete="cc-csc"
                                inputMode="numeric"
                                aria-invalid={!!errors.cvc}
                                className={cx(inputClass(errors.cvc), "tnum")}
                            />
                            {errors.cvc ? <p className={errorClass}>{errors.cvc}</p> : null}
                        </div>
                    </div>
                    {/* ≥1280: the pay button sits in the grid (R6-1). */}
                    <div className="hidden items-end min-[1280px]:flex">
                        <button
                            type="submit"
                            className="tnum inline-flex min-h-12 w-full items-center justify-center rounded-full bg-rsm-lime px-6 text-base font-bold text-rsm-midnight shadow-rsm-chip transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rsm-steel"
                        >
                            {tpl(report ? u.payCta : u.payCtaNoReport, { amount })}
                        </button>
                    </div>
                </div>
                {errors.form ? (
                    <p role="alert" className={errorClass}>
                        {errors.form}
                    </p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11.5px] leading-relaxed text-rsm-misty">
                    <span className="min-[601px]:hidden">{u.vatLineMobile}</span>
                    <span className="hidden min-[601px]:inline">{u.stripeNote}</span>
                    <span className="hidden min-[601px]:ml-auto min-[601px]:inline">{u.receiptNote}</span>
                    {/* 601–1279: the pay button sits on the meta row (R6-10). */}
                    <button
                        type="submit"
                        className="tnum hidden min-h-11 items-center justify-center rounded-full bg-rsm-lime px-6 text-sm font-bold text-rsm-midnight shadow-rsm-chip transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rsm-steel min-[601px]:inline-flex min-[601px]:max-[1280px]:ml-auto min-[1280px]:hidden"
                    >
                        {tpl(report ? u.payCta : u.payCtaNoReport, { amount })}
                    </button>
                </div>
            </div>
        );
    }

    /* ── Render ─────────────────────────────────────────────────────────── */

    return (
        <div className="min-h-screen pb-24 min-[601px]:pb-16">
            <header className="mx-auto flex w-full max-w-[980px] items-center justify-between gap-4 px-4 py-4 min-[601px]:px-8">
                <Link href="/" aria-label="Resimator Report" className="flex min-h-11 items-center">
                    <Image src="/assets/logo/logomark-glyph-positive.svg" alt="" width={28} height={28} priority />
                </Link>
                <nav className="flex items-center gap-2 min-[601px]:gap-3">
                    <LangToggle />
                    <Link
                        href={reportHref}
                        className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-rsm-midnight underline-offset-4 hover:text-rsm-steel hover:underline"
                    >
                        <span className="min-[601px]:hidden">{u.backShort}</span>
                        <span className="hidden min-[601px]:inline">{u.back}</span>
                    </Link>
                </nav>
            </header>

            <main className="mx-auto w-full max-w-[980px] px-4 min-[601px]:px-8">
                {view === "packs" ? (
                    <>
                        <div className="min-[601px]:text-center">
                            <p className="hidden text-[10.5px] font-bold tracking-[0.09em] text-rsm-steel uppercase min-[601px]:block">{u.eyebrow}</p>
                            <h1
                                ref={h1Ref}
                                tabIndex={-1}
                                className="font-display text-[22px] leading-snug font-medium wrap-anywhere text-rsm-midnight outline-none min-[601px]:mt-2.5 min-[601px]:text-2xl min-[1280px]:text-[34px]"
                            >
                                <span className="min-[601px]:hidden">{u.eyebrow}</span>
                                <span className="hidden min-[601px]:inline">
                                    {report ? tpl(u.h1, { addr: report.addr, locked: report.lockedFlags, tests: report.tests }) : u.eyebrow}
                                </span>
                            </h1>
                            <p className="tnum mt-1 text-xs leading-relaxed text-rsm-charcoal min-[601px]:mt-2 min-[601px]:text-sm">
                                <span className="min-[601px]:hidden">
                                    {report ? tpl(u.mobileMeta, { locked: report.lockedFlags, tests: report.tests }) : u.sublineShort}
                                </span>
                                <span className="hidden min-[601px]:inline min-[1280px]:hidden">{u.sublineShort}</span>
                                <span className="hidden min-[1280px]:inline">{u.subline}</span>
                            </p>
                        </div>

                        {claimError ? (
                            <p role="alert" className="mt-5 rounded-rsm-tile border border-rsm-hairline bg-white p-4 text-sm text-rsm-charcoal">
                                {claimError}
                            </p>
                        ) : null}
                        {alreadyUnlocked ? (
                            <div className="mt-5 flex flex-col items-start gap-3 rounded-rsm-tile border border-rsm-hairline bg-white p-4 min-[601px]:flex-row min-[601px]:items-center min-[601px]:px-5">
                                <span className="flex size-[38px] flex-none items-center justify-center rounded-full bg-rsm-midnight text-rsm-lime">
                                    <IconCheck className="size-[18px]" />
                                </span>
                                <span className="min-w-0 flex-1 text-sm font-medium text-rsm-midnight">{u.alreadyOpen}</span>
                                <Link
                                    href={reportHref}
                                    className="inline-flex min-h-11 flex-none items-center justify-center rounded-full bg-rsm-lime px-5 text-sm font-bold text-rsm-midnight shadow-rsm-chip transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75"
                                >
                                    {u.openReport}
                                </Link>
                            </div>
                        ) : null}

                        {renderFirstFreeBanner()}
                        {renderUseCreditBanner()}
                        {renderOutOfCredits()}

                        <form onSubmit={submitPay} id="unlock-pay-form" noValidate>
                            {renderPackCards()}
                            {renderPayCard()}
                        </form>
                    </>
                ) : view === "paying" ? (
                    <div className="mx-auto mt-6 max-w-[700px]">{renderPaying()}</div>
                ) : view === "paid" ? (
                    <div className="mx-auto mt-6 max-w-[700px]">{renderPaid()}</div>
                ) : view === "declined" ? (
                    <div className="mx-auto mt-6 max-w-[700px]">{renderDeclined()}</div>
                ) : (
                    <div className="mx-auto mt-6 max-w-[700px]">{renderInvoiceSent()}</div>
                )}
            </main>

            {/* ≤600: sticky pay bar in the thumb zone (R6-5). */}
            {view === "packs" ? (
                <div className="fixed inset-x-0 bottom-0 z-40 border-t border-rsm-hairline bg-rsm-paper/95 p-3 backdrop-blur min-[601px]:hidden">
                    <button
                        type="submit"
                        form="unlock-pay-form"
                        className="tnum inline-flex min-h-12 w-full items-center justify-center rounded-full bg-rsm-lime px-6 text-base font-bold text-rsm-midnight shadow-rsm-chip transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75"
                    >
                        {tpl(report ? u.payCta : u.payCtaNoReport, { amount })}
                    </button>
                </div>
            ) : null}
        </div>
    );
}
