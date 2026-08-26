"use client";

import { useState } from "react";
import Link from "next/link";
import { AccountTopBar } from "@/components/account/account-top-bar";
import { SheetDialog } from "@/components/account/sheet-dialog";
import { formatEUR, maskEmail } from "@/lib/format";
import { tpl, useLang } from "@/providers/lang";

/**
 * Account & data (R16-1 / R16-2 / R16-3): the GDPR Article 20 export and the
 * danger zone. Export is offered above the fold of the same page — before
 * deletion, per acceptance §12. Deletion is passwordless-confirmed: the
 * emailed single-use link (15 min) IS the confirmation — no type-DELETE
 * theatre (R16 flow line). The destructive Button is the product's ONLY coral
 * button (R16 contracts). The dialog is focus-trapped, Esc closes (§11).
 */
export function AccountDataView({
    email,
    balance,
    since,
    reportCount,
    unusedCredits,
    refundAmountEur,
    linkError,
}: {
    email: string;
    balance: number;
    /** "03/2026" — account creation month (R16-1 subline). */
    since: string;
    reportCount: number;
    unusedCredits: number;
    refundAmountEur: number;
    /** ?error=link — the emailed deletion link failed (expired/used). */
    linkError: boolean;
}) {
    const { t, lang } = useLang();
    const [dialog, setDialog] = useState<"closed" | "confirm" | "sent">("closed");
    const [exportSent, setExportSent] = useState(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refundAmount = formatEUR(refundAmountEur, lang, 2);

    async function requestExport() {
        if (pending || exportSent) return;
        setPending(true);
        try {
            const res = await fetch("/api/account/export", { method: "POST" });
            if (!res.ok) throw new Error(String(res.status));
            setExportSent(true);
        } catch {
            setError("generic");
        } finally {
            setPending(false);
        }
    }

    async function requestDeletion() {
        if (pending) return;
        setPending(true);
        setError(null);
        try {
            const res = await fetch("/api/account/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            if (!res.ok) {
                const data = (await res.json()) as { error?: string };
                setError(data.error ?? "generic");
                return;
            }
            setDialog("sent");
        } catch {
            setError("generic");
        } finally {
            setPending(false);
        }
    }

    return (
        <div className="min-h-dvh">
            <AccountTopBar balance={balance} email={email} />
            <main className="mx-auto w-full max-w-[704px] px-4 pt-4 pb-20">
                <h1 className="font-display text-3xl font-medium text-rsm-midnight">{t.accountData.title}</h1>
                <p className="mt-1.5 text-[13.5px] text-rsm-slate">{tpl(t.accountData.subline, { email: maskEmail(email), since })}</p>
                {/* ?error=link — a dead deletion link lands back here (same
                    pattern as /signin?error=link). */}
                {linkError ? (
                    <p
                        role="alert"
                        className="mt-4 rounded-rsm-tile border border-rsm-coral-25 bg-rsm-fail-wash px-3.5 py-2.5 text-[13.5px] leading-[1.5] font-medium wrap-anywhere text-rsm-coral-deep"
                    >
                        {t.accountData.errorLink}
                    </p>
                ) : null}

                {/* Export — offered before deletion (acceptance §12). */}
                <section className="mt-6 rounded-rsm-card border border-rsm-hairline bg-white p-5">
                    <p className="text-[14px] leading-[1.65] wrap-anywhere text-rsm-charcoal">{tpl(t.accountData.exportBody, { n: reportCount })}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={requestExport}
                            disabled={pending || exportSent}
                            className="inline-flex min-h-12 items-center justify-center rounded-full bg-rsm-lime px-6 text-base font-bold text-rsm-midnight transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75 disabled:opacity-50"
                        >
                            {t.accountData.exportCta}
                        </button>
                        <p className="tnum text-[12.5px] text-rsm-slate">
                            {exportSent ? tpl(t.accountData.exportSent, { email: maskEmail(email) }) : t.accountData.exportNote}
                        </p>
                    </div>
                </section>

                {/* Danger zone — the consequence list states what happens, the
                    retention rules said plainly instead of hidden (R16). */}
                <section className="mt-4 rounded-rsm-card border border-rsm-hairline bg-white p-5">
                    <h2 className="font-display text-xl font-medium text-rsm-midnight">{t.accountData.deleteTitle}</h2>
                    <ul className="mt-3 flex flex-col gap-2.5">
                        <Consequence sign="−" tone="coral" text={t.accountData.conDeleted} />
                        <Consequence
                            sign="+"
                            tone="seafoam"
                            text={unusedCredits > 0 ? tpl(t.accountData.conRefund, { n: unusedCredits, amount: refundAmount }) : t.accountData.conRefundZero}
                        />
                        <Consequence sign="§" tone="slate" text={t.accountData.conReceipts} />
                        <Consequence sign="§" tone="slate" text={t.accountData.conPublic} />
                    </ul>
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                        {/* The product's ONLY coral button (R16 contracts). */}
                        <button
                            type="button"
                            onClick={() => setDialog("confirm")}
                            className="inline-flex min-h-12 items-center justify-center rounded-full bg-rsm-coral px-6 text-base font-bold text-white transition-colors duration-200 ease-rsm hover:bg-rsm-coral-75"
                        >
                            {t.accountData.deleteCta}
                        </button>
                        <p className="text-[12.5px] text-rsm-slate">{t.accountData.deleteNote}</p>
                    </div>
                </section>
            </main>

            <SheetDialog open={dialog !== "closed"} onClose={() => setDialog("closed")} label={t.accountData.deleteTitle}>
                {dialog === "confirm" ? (
                    <>
                        <h2 className="pr-10 font-display text-xl font-medium text-rsm-midnight">{t.accountData.confirmTitle}</h2>
                        <p className="mt-3 text-[14px] leading-[1.6] wrap-anywhere text-rsm-charcoal">
                            {tpl(t.accountData.confirmBody, { email: maskEmail(email) })}
                        </p>
                        {error ? (
                            <p role="alert" className="mt-3 text-sm font-medium text-rsm-coral-deep">
                                {error === "export_pending" ? t.accountData.exportPending : t.accountData.errorGeneric}
                            </p>
                        ) : null}
                        <div className="mt-5 flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={requestDeletion}
                                disabled={pending}
                                className="inline-flex min-h-12 items-center justify-center rounded-full bg-rsm-coral px-6 text-base font-bold text-white transition-colors duration-200 ease-rsm hover:bg-rsm-coral-75 disabled:opacity-50"
                            >
                                {t.accountData.confirmCta}
                            </button>
                            <button
                                type="button"
                                onClick={() => setDialog("closed")}
                                className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-medium text-rsm-charcoal"
                            >
                                {t.accountData.cancel}
                            </button>
                        </div>
                    </>
                ) : (
                    /* R16-2 — confirmation sent; nothing has changed yet. */
                    <>
                        <h2 className="pr-10 font-display text-xl font-medium text-rsm-midnight">{t.accountData.sentTitle}</h2>
                        <p className="mt-3 text-[14px] leading-[1.6] wrap-anywhere text-rsm-charcoal">
                            {unusedCredits > 0
                                ? tpl(t.accountData.sentBody, { email: maskEmail(email), n: unusedCredits, amount: refundAmount })
                                : tpl(t.accountData.sentBodyZero, { email: maskEmail(email) })}
                        </p>
                        <p className="mt-3 text-[13px] leading-[1.55] wrap-anywhere text-rsm-slate">{t.accountData.changedMind}</p>
                        {/* Dev-only: the mock never sends mail — the link the
                            email would carry (token=dev). Never in production. */}
                        {process.env.NODE_ENV !== "production" ? (
                            <p className="mt-4 rounded-rsm-tile border border-dashed border-rsm-hairline px-3 py-2 text-[12px] leading-[1.5] text-rsm-slate">
                                {t.accountData.devComplete}{" "}
                                <a href="/api/account/delete/confirm?token=dev" className="font-medium break-all text-rsm-steel underline underline-offset-2">
                                    /api/account/delete/confirm?token=dev
                                </a>
                            </p>
                        ) : null}
                    </>
                )}
            </SheetDialog>
        </div>
    );
}

function Consequence({ sign, tone, text }: { sign: string; tone: "coral" | "seafoam" | "slate"; text: string }) {
    return (
        <li className="flex items-start gap-3">
            <span
                aria-hidden
                className={
                    tone === "coral"
                        ? "inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-rsm-coral-25 text-[13px] font-bold text-rsm-coral-deep"
                        : tone === "seafoam"
                          ? "inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-rsm-seafoam-25 text-[13px] font-bold text-rsm-seafoam-deep"
                          : "inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-rsm-slate-25 text-[13px] font-bold text-rsm-slate"
                }
            >
                {sign}
            </span>
            <span className="pt-0.5 text-[14px] leading-[1.55] wrap-anywhere text-rsm-charcoal">{text}</span>
        </li>
    );
}
