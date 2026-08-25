"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LangToggle } from "@/components/report/lang-toggle";
import { maskEmail } from "@/lib/format";
import { tpl, useLang } from "@/providers/lang";

/**
 * Magic-link sign-in (R10-2 → R10-6): email in, "link sent" state out.
 * "The address you paid with is the account… there is no password to forget."
 * Resend enables after 30 s with the countdown on the button (R10-6
 * annotation). The mock never sends mail — in development the sent state
 * shows the link the email would carry (token=dev; never in production).
 */
export function SignInView({ linkError }: { linkError: boolean }) {
    const { t } = useLang();
    const [email, setEmail] = useState("");
    const [sentTo, setSentTo] = useState<string | null>(null);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<"email" | "link" | null>(linkError ? "link" : null);
    const [resendIn, setResendIn] = useState(0);
    const headingRef = useRef<HTMLHeadingElement>(null);

    // Resend countdown (R10-6: "Resend enables after 30 s").
    useEffect(() => {
        if (resendIn <= 0) return;
        const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
        return () => clearTimeout(id);
    }, [resendIn]);

    // State change moves focus to the heading (§11).
    useEffect(() => {
        if (sentTo) headingRef.current?.focus();
    }, [sentTo]);

    async function send(e?: React.FormEvent) {
        e?.preventDefault();
        if (pending) return;
        const value = email.trim();
        if (!/^\S+@\S+\.\S+$/.test(value)) {
            setError("email");
            return;
        }
        setPending(true);
        setError(null);
        try {
            const res = await fetch("/api/auth/magic-link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: value }),
            });
            if (!res.ok) throw new Error(String(res.status));
            setSentTo(value);
            setResendIn(30);
        } catch {
            setError("email");
        } finally {
            setPending(false);
        }
    }

    const devHref = sentTo ? `/api/auth/callback?token=dev&email=${encodeURIComponent(sentTo)}` : "#";

    return (
        <div className="flex min-h-dvh flex-col">
            <header className="mx-auto flex w-full max-w-[704px] items-center justify-between gap-4 px-4 py-4">
                <Link href="/" aria-label="Resimator Report" className="flex min-h-11 items-center">
                    <Image src="/assets/logo/logomark-glyph-positive.svg" alt="" width={28} height={28} priority />
                </Link>
                <LangToggle />
            </header>
            <main className="mx-auto flex w-full max-w-[704px] flex-1 flex-col justify-center px-4 pb-24">
                {sentTo === null ? (
                    <div className="w-full max-w-[420px]">
                        <h1 className="font-display text-3xl font-medium text-rsm-midnight">{t.signin.title}</h1>
                        <p className="mt-3 text-[15px] leading-[1.55] wrap-anywhere text-rsm-charcoal">{t.signin.lead}</p>
                        <form onSubmit={send} className="mt-6 flex flex-col gap-3" noValidate>
                            <label htmlFor="signin-email" className="text-sm font-medium text-rsm-midnight">
                                {t.signin.emailLabel}
                            </label>
                            <input
                                id="signin-email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                aria-invalid={error === "email"}
                                className="min-h-12 w-full rounded-rsm-input border border-rsm-hairline bg-white px-3.5 text-[15px] text-rsm-midnight outline-none placeholder:text-rsm-slate-50 focus:border-rsm-steel"
                            />
                            {error ? (
                                <p role="alert" className="text-sm font-medium text-rsm-coral-deep">
                                    {error === "email" ? t.signin.errEmail : t.signin.errorLink}
                                </p>
                            ) : null}
                            <button
                                type="submit"
                                disabled={pending}
                                className="inline-flex min-h-12 items-center justify-center rounded-full bg-rsm-lime px-6 text-base font-bold text-rsm-midnight transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75 disabled:opacity-50"
                            >
                                {t.signin.submit}
                            </button>
                        </form>
                        <p className="mt-4 text-[13px] leading-[1.5] text-rsm-slate">{t.signin.meta}</p>
                        <p className="mt-1 text-[13px] leading-[1.5] text-rsm-slate">{t.signin.newHere}</p>
                    </div>
                ) : (
                    <div className="w-full max-w-[420px]">
                        <h1 ref={headingRef} tabIndex={-1} className="font-display text-3xl font-medium text-rsm-midnight outline-none">
                            {t.signin.sentTitle}
                        </h1>
                        <p className="mt-3 text-[15px] leading-[1.55] wrap-anywhere text-rsm-charcoal">
                            {t.signin.sentBody} <strong className="font-bold">{maskEmail(sentTo)}</strong>. {t.signin.sentValid}
                        </p>
                        <button
                            type="button"
                            onClick={() => send()}
                            disabled={pending || resendIn > 0}
                            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full px-6 text-base font-bold text-rsm-midnight shadow-[inset_0_0_0_1px_var(--color-rsm-hairline)] transition-colors duration-200 ease-rsm hover:shadow-[inset_0_0_0_1px_var(--color-rsm-steel)] disabled:opacity-50"
                        >
                            {resendIn > 0 ? tpl(t.signin.resendIn, { s: resendIn }) : t.signin.resend}
                        </button>
                        <p className="mt-5 text-[13px] leading-[1.5] text-rsm-slate">
                            {t.signin.wrongAddress}{" "}
                            <button type="button" onClick={() => setSentTo(null)} className="min-h-11 font-medium text-rsm-steel underline underline-offset-2">
                                {t.signin.startOver}
                            </button>
                            {" · "}
                            {t.signin.spamNote}{" "}
                            <a href="mailto:hello@resimator.fi" className="font-medium text-rsm-steel underline underline-offset-2">
                                hello@resimator.fi
                            </a>
                        </p>
                        {/* Dev-only: the mock never sends mail, so the link the
                            email would carry is shown here locally. Never
                            rendered in production (the send layer exists there). */}
                        {process.env.NODE_ENV !== "production" ? (
                            <p className="mt-4 rounded-rsm-tile border border-dashed border-rsm-hairline px-3 py-2 text-[12px] leading-[1.5] text-rsm-slate">
                                {t.signin.devNote}{" "}
                                <a href={devHref} className="font-medium break-all text-rsm-steel underline underline-offset-2">
                                    {devHref}
                                </a>
                            </p>
                        ) : null}
                    </div>
                )}
            </main>
        </div>
    );
}
