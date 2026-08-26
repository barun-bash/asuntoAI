"use client";

import { useEffect, useRef, useState } from "react";
import { SheetDialog } from "@/components/account/sheet-dialog";
import { formatDate } from "@/lib/format";
import type { RefundReason } from "@/lib/types";
import { tpl, useLang } from "@/providers/lang";
import { cx } from "@/utils/cx";

/** The report a refund is requested for (from the My-reports row). */
export interface RefundSubject {
    slug: string;
    addr: string;
    number: string;
    unlockTs: number;
}

type Stage = "form" | "confirmed" | "pending";

const REASONS: RefundReason[] = ["misread", "wrong_listing", "other"];

/**
 * Refund sheet (R11-2 default / R11-4 mobile / R11-3 confirmation): reason
 * radiogroup + note (required only for "misread" — it routes to the extraction
 * team), then one of two targets. Credit = synchronous restore, the report
 * stays open, the 30-day re-lock date is stated (R11-3); card = human review
 * ≤ 1 business day (R11-3 copy variant). §11: the sheet is a focus-trapped
 * dialog, Esc closes (SheetDialog), the confirmation moves focus to the
 * heading and the balance change is announced politely (aria-live).
 */
export function RefundSheet({
    subject,
    open,
    onClose,
    onBalance,
}: {
    subject: RefundSubject;
    open: boolean;
    onClose: () => void;
    onBalance: (balance: number) => void;
}) {
    const { t, lang } = useLang();
    const [stage, setStage] = useState<Stage>("form");
    const [reason, setReason] = useState<RefundReason | null>(null);
    const [note, setNote] = useState("");
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<"reason" | "note" | "generic" | "already_refunded" | "ticket_pending" | null>(null);
    const [balance, setBalance] = useState<number | null>(null);
    const [reLockUntil, setReLockUntil] = useState<number | null>(null);
    /** Set when the refunded unlock was free — no credit was minted, the claim
       came back instead (see the regression guard in store.refundReport). */
    const [restoredFree, setRestoredFree] = useState(false);
    const headingRef = useRef<HTMLHeadingElement>(null);

    // Reset per subject/open; confirmation moves focus to the heading (§11).
    useEffect(() => {
        if (open) {
            setStage("form");
            setReason(null);
            setNote("");
            setError(null);
            setBalance(null);
            setReLockUntil(null);
            setRestoredFree(false);
        }
    }, [open, subject.slug]);
    useEffect(() => {
        if (stage !== "form") headingRef.current?.focus();
    }, [stage]);

    async function submit(target: "credit" | "card") {
        if (pending) return;
        if (!reason) {
            setError("reason");
            return;
        }
        if (reason === "misread" && !note.trim()) {
            setError("note");
            return;
        }
        setPending(true);
        setError(null);
        try {
            const res = await fetch(`/api/reports/${subject.slug}/refund`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason, note: note.trim() || undefined, target }),
            });
            const data = (await res.json()) as { status?: string; balance?: number; reLockUntil?: number; restored?: "free"; error?: string };
            if (!res.ok) {
                setError(data.error === "already_refunded" || data.error === "ticket_pending" ? data.error : "generic");
                return;
            }
            if (target === "credit") {
                const next = data.balance ?? 0;
                setBalance(next);
                setReLockUntil(data.reLockUntil ?? null);
                setRestoredFree(data.restored === "free");
                onBalance(next); // the drawer pill updates instantly (R11 acceptance)
                setStage("confirmed");
            } else {
                setStage("pending");
            }
        } catch {
            setError("generic");
        } finally {
            setPending(false);
        }
    }

    const unlockedDate = formatDate(new Date(subject.unlockTs).toISOString(), lang);

    return (
        <SheetDialog open={open} onClose={onClose} label={t.refund.title}>
            {stage === "form" ? (
                <>
                    <h2 className="pr-10 font-display text-xl font-medium text-rsm-midnight">{t.refund.title}</h2>
                    <p className="mt-1.5 text-[13px] leading-[1.5] wrap-anywhere text-rsm-slate">
                        <span className="max-md:hidden">{tpl(t.refund.reportLine, { addr: subject.addr, date: unlockedDate })}</span>
                        <span className="md:hidden">{tpl(t.refund.reportLineShort, { addr: subject.addr })}</span>
                    </p>
                    <fieldset className="mt-5">
                        <legend className="sr-only">{t.refund.reasonLegend}</legend>
                        <div className="flex flex-col gap-2" role="radiogroup" aria-label={t.refund.reasonLegend}>
                            {REASONS.map((key) => (
                                <div key={key}>
                                    <label
                                        className={cx(
                                            "flex min-h-12 cursor-pointer items-center gap-3 rounded-rsm-input border px-3.5 text-[15px] font-medium transition-colors duration-200 ease-rsm",
                                            reason === key
                                                ? "border-rsm-steel bg-rsm-steel-25/40 text-rsm-midnight"
                                                : "border-rsm-hairline bg-white text-rsm-charcoal hover:border-rsm-steel-50",
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name="refund-reason"
                                            value={key}
                                            checked={reason === key}
                                            onChange={() => {
                                                setReason(key);
                                                setError(null);
                                            }}
                                            className="size-4 shrink-0 accent-rsm-steel"
                                        />
                                        {t.refund.reasons[key]}
                                    </label>
                                    {key === "misread" && reason === "misread" ? (
                                        <div className="mt-2 rounded-rsm-input border border-rsm-hairline bg-rsm-editor-bg p-3.5">
                                            <label htmlFor="refund-note" className="text-[11px] font-bold tracking-[0.08em] text-rsm-steel uppercase">
                                                {t.refund.tellUs}
                                            </label>
                                            <textarea
                                                id="refund-note"
                                                value={note}
                                                onChange={(e) => setNote(e.target.value)}
                                                rows={3}
                                                aria-label={t.refund.noteLabel}
                                                aria-invalid={error === "note"}
                                                className="mt-2 w-full rounded-[10px] border border-rsm-hairline bg-white px-3 py-2.5 text-[14px] leading-[1.5] wrap-anywhere text-rsm-midnight outline-none placeholder:text-rsm-slate-50 focus:border-rsm-steel"
                                            />
                                            <p className="mt-2 text-[12.5px] leading-[1.5] wrap-anywhere text-rsm-slate">{t.refund.noteHint}</p>
                                        </div>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    </fieldset>
                    <p className="mt-4 text-[13.5px] leading-[1.6] wrap-anywhere text-rsm-charcoal max-md:hidden">
                        {t.refund.policyA}
                        <strong className="font-bold">{t.refund.policyStrong1}</strong>
                        {t.refund.policyB}
                        <strong className="font-bold">{t.refund.policyStrong2}</strong>
                        {t.refund.policyC}
                    </p>
                    <p className="mt-4 text-[13px] leading-[1.55] wrap-anywhere text-rsm-charcoal md:hidden">{t.refund.policyShort}</p>
                    {error ? (
                        <p role="alert" className="mt-3 text-sm font-medium text-rsm-coral-deep">
                            {error === "reason"
                                ? t.refund.errReason
                                : error === "note"
                                  ? t.refund.errNote
                                  : error === "already_refunded"
                                    ? t.refund.alreadyRefunded
                                    : error === "ticket_pending"
                                      ? t.refund.ticketPending
                                      : t.refund.errGeneric}
                        </p>
                    ) : null}
                    <div className="mt-5 flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={() => submit("credit")}
                            disabled={pending}
                            className="inline-flex min-h-12 items-center justify-center rounded-full bg-rsm-lime px-6 text-base font-bold text-rsm-midnight transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75 disabled:opacity-50"
                        >
                            {t.refund.submitCredit}
                        </button>
                        <button
                            type="button"
                            onClick={() => submit("card")}
                            disabled={pending}
                            className="inline-flex min-h-12 items-center justify-center rounded-full px-6 text-base font-bold text-rsm-midnight shadow-[inset_0_0_0_1px_var(--color-rsm-hairline)] transition-colors duration-200 ease-rsm hover:shadow-[inset_0_0_0_1px_var(--color-rsm-steel)] disabled:opacity-50"
                        >
                            <span className="max-md:hidden">{t.refund.submitCard}</span>
                            <span className="md:hidden">{t.refund.submitCardShort}</span>
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <h2 ref={headingRef} tabIndex={-1} className="tnum pr-10 font-display text-xl font-medium text-rsm-midnight outline-none">
                        {stage === "confirmed"
                            ? restoredFree
                                ? tpl(t.refund.confirmedFreeTitle, { n: balance ?? 0 })
                                : tpl(t.refund.confirmedTitle, { n: balance ?? 0 })
                            : t.refund.pendingTitle}
                    </h2>
                    {/* Balance change announced politely (§11). */}
                    <span aria-live="polite" className="sr-only">
                        {stage === "confirmed" && balance !== null ? tpl(t.refund.balanceAnnouncement, { n: balance }) : ""}
                    </span>
                    <p className="mt-3 text-[14px] leading-[1.6] wrap-anywhere text-rsm-charcoal">
                        {stage === "confirmed" ? (
                            <>
                                {reason === "misread" && note.trim() ? t.refund.confirmedNoteTeam : null}
                                {restoredFree
                                    ? tpl(t.refund.confirmedFreeBody, { date: reLockUntil ? formatDate(new Date(reLockUntil).toISOString(), lang) : "" })
                                    : tpl(t.refund.confirmedBody, { date: reLockUntil ? formatDate(new Date(reLockUntil).toISOString(), lang) : "" })}
                            </>
                        ) : (
                            t.refund.pendingBody
                        )}
                    </p>
                    <div className="mt-5 flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex min-h-12 items-center justify-center rounded-full bg-rsm-lime px-6 text-base font-bold text-rsm-midnight transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75"
                        >
                            {t.refund.backToReports}
                        </button>
                        {stage === "confirmed" ? (
                            <button
                                type="button"
                                onClick={() => submit("card")}
                                disabled={pending}
                                className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-medium text-rsm-steel underline underline-offset-2 disabled:opacity-50"
                            >
                                {t.refund.moneyBack}
                            </button>
                        ) : null}
                    </div>
                </>
            )}
        </SheetDialog>
    );
}
