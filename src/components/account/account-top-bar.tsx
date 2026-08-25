"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LangToggle } from "@/components/report/lang-toggle";
import { emailInitials, maskEmail } from "@/lib/format";
import { tpl, useLang } from "@/providers/lang";

/**
 * Account chrome (R10-1/R10-7 top bar): logomark, language, the credits
 * balance pill ("4 CREDITS" / mobile "4 CR"), "Buy more" → /unlock, and the
 * avatar menu — the entry to /account/notifications and /account/data
 * (R14/R16 flow lines: "avatar menu → …").
 */
export function AccountTopBar({ balance, email }: { balance: number; email: string }) {
    const { t } = useLang();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="mx-auto flex w-full max-w-[1120px] items-center justify-between gap-3 px-4 py-4 md:px-8">
            <Link href="/" aria-label="Resimator Report" className="flex min-h-11 items-center">
                <Image src="/assets/logo/logomark-glyph-positive.svg" alt="" width={28} height={28} priority />
            </Link>
            <nav className="flex items-center gap-2 md:gap-3">
                <LangToggle />
                <span className="tnum inline-flex min-h-7 items-center rounded-full px-3 text-[11px] leading-none font-bold text-rsm-midnight shadow-[inset_0_0_0_1px_var(--color-rsm-hairline)]">
                    <span className="max-md:hidden">{tpl(t.reports.creditsPill, { n: balance })}</span>
                    <span className="md:hidden">{tpl(t.reports.creditsPillShort, { n: balance })}</span>
                </span>
                <Link
                    href="/unlock"
                    className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-bold text-rsm-midnight shadow-[inset_0_0_0_1px_var(--color-rsm-hairline)] transition-colors duration-200 ease-rsm hover:shadow-[inset_0_0_0_1px_var(--color-rsm-steel)] max-md:hidden"
                >
                    {t.reports.buyMore}
                </Link>
                <div className="relative" onKeyDown={(e) => e.key === "Escape" && setMenuOpen(false)}>
                    <button
                        type="button"
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        aria-label={maskEmail(email)}
                        onClick={() => setMenuOpen((v) => !v)}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full transition-colors duration-200 ease-rsm hover:bg-rsm-midnight/5"
                    >
                        <span
                            aria-hidden
                            className="inline-flex size-9 items-center justify-center rounded-full bg-rsm-midnight text-xs font-bold text-rsm-paper"
                        >
                            {emailInitials(email)}
                        </span>
                    </button>
                    {menuOpen ? (
                        <>
                            <button type="button" aria-hidden tabIndex={-1} className="fixed inset-0 z-30 cursor-default" onClick={() => setMenuOpen(false)} />
                            <div
                                role="menu"
                                className="absolute right-0 z-40 mt-1 w-60 rounded-rsm-tile border border-rsm-hairline bg-white p-1.5 shadow-rsm-stack"
                            >
                                <p className="truncate px-3 py-2 text-xs text-rsm-slate">{maskEmail(email)}</p>
                                <Link
                                    role="menuitem"
                                    href="/account/notifications"
                                    onClick={() => setMenuOpen(false)}
                                    className="block rounded-[10px] px-3 py-2.5 text-sm font-medium text-rsm-charcoal transition-colors duration-200 ease-rsm hover:bg-rsm-paper hover:text-rsm-steel"
                                >
                                    {t.reports.menuNotifications}
                                </Link>
                                <Link
                                    role="menuitem"
                                    href="/account/data"
                                    onClick={() => setMenuOpen(false)}
                                    className="block rounded-[10px] px-3 py-2.5 text-sm font-medium text-rsm-charcoal transition-colors duration-200 ease-rsm hover:bg-rsm-paper hover:text-rsm-steel"
                                >
                                    {t.reports.menuData}
                                </Link>
                            </div>
                        </>
                    ) : null}
                </div>
            </nav>
        </header>
    );
}
