"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle } from "@untitledui/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/format";
import { tpl, useLang } from "@/providers/lang";
import { cx } from "@/utils/cx";

interface StepEvent {
    index: number;
    total: number;
    key: string;
    label: string;
    labelFi: string;
    foundFact?: string;
    foundFactFi?: string;
    flagged?: boolean;
    t: number;
}

interface StartEvent {
    total: number;
    estimateSeconds: number;
    listing: { addr: string; oikotieId: string; fetchedAt: string };
}

/**
 * Analysis progress (R1-4/5) — SSE steps, each completing with its found-fact
 * and optional FLAGGED marker. List is aria-live polite, timer aria-hidden,
 * steel progress bar. Refresh re-attaches; done auto-navigates to /r/:slug.
 */
export function AnalysingView({ runId }: { runId: string }) {
    const { lang, t } = useLang();
    const router = useRouter();
    const [steps, setSteps] = useState<StepEvent[]>([]);
    const [meta, setMeta] = useState<StartEvent | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const startedAt = useRef(Date.now());

    useEffect(() => {
        const source = new EventSource(`/api/analysing/${runId}`);

        source.addEventListener("start", (event) => {
            setMeta(JSON.parse((event as MessageEvent).data) as StartEvent);
        });
        source.addEventListener("step", (event) => {
            const step = JSON.parse((event as MessageEvent).data) as StepEvent;
            setSteps((prev) => (prev.some((s) => s.key === step.key) ? prev : [...prev, step]));
        });
        source.addEventListener("done", (event) => {
            const { slug } = JSON.parse((event as MessageEvent).data) as { slug: string };
            source.close();
            router.push(`/r/${slug}`);
        });
        source.onerror = () => {
            // Transient drops: EventSource retries on its own.
        };
        return () => source.close();
    }, [runId, router]);

    useEffect(() => {
        const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 1000);
        return () => clearInterval(timer);
    }, []);

    const estimate = meta?.estimateSeconds ?? 60;
    const remaining = Math.max(estimate - elapsed, 0);
    const clock = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;
    const progress = useMemo(() => Math.min(steps.length / (meta?.total ?? 6), 1), [steps.length, meta]);

    return (
        <div className="min-h-screen">
            <main className="mx-auto flex w-full max-w-[704px] flex-col gap-6 px-4 py-10 md:py-16">
                <div>
                    <Link href="/" className="inline-flex min-h-11 items-center text-sm font-medium text-rsm-steel underline-offset-4 hover:underline">
                        <span className="hidden md:inline">{t.analysing.cancel}</span>
                        <span className="md:hidden">{t.analysing.cancelShort}</span>
                    </Link>
                </div>

                <header className="flex flex-col gap-2">
                    <h1 className="font-display text-3xl font-medium text-rsm-midnight md:text-4xl">{t.analysing.title}</h1>
                    {meta ? (
                        <>
                            <p className="text-lg font-medium wrap-anywhere text-rsm-charcoal">{meta.listing.addr}</p>
                            <p className="tnum text-xs text-rsm-misty">
                                Oikotie {meta.listing.oikotieId} · {t.analysing.pastedAt} {formatDateTime(meta.listing.fetchedAt, lang).split(" ")[1]} ·{" "}
                                {t.analysing.runsAbout}
                            </p>
                        </>
                    ) : null}
                    <div className="mt-2 flex items-baseline gap-3" aria-hidden>
                        <span className="tnum font-display text-5xl font-medium text-rsm-midnight">{clock}</span>
                        <span className="tnum text-sm text-rsm-misty">{tpl(t.analysing.leftAbout, { s: remaining })}</span>
                    </div>
                    {/* Steel Blue progress — lime is reserved for the verdict CTA. */}
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-rsm-misty-25">
                        <div
                            className="h-full rounded-full bg-rsm-steel transition-[width] duration-250 ease-rsm"
                            style={{ width: `${Math.max(progress * 100, 4)}%` }}
                        />
                    </div>
                </header>

                <ol aria-live="polite" className="flex flex-col gap-2">
                    {steps.map((step) => (
                        <li key={step.key} className="flex items-start gap-3 rounded-rsm-tile border border-rsm-hairline bg-white p-4 shadow-rsm-sm">
                            <CheckCircle aria-hidden className="mt-0.5 size-5 shrink-0 text-rsm-steel" />
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-bold text-rsm-midnight">{lang === "fi" ? step.labelFi : step.label}</span>
                                    {step.flagged ? (
                                        <span className="rounded-full border border-rsm-amber-50 bg-rsm-amber-25 px-1.5 py-0.5 text-[10px] font-bold tracking-[0.06em] text-rsm-charcoal uppercase">
                                            {t.analysing.flagged}
                                        </span>
                                    ) : null}
                                </div>
                                {step.foundFact ? (
                                    <p className="tnum mt-0.5 text-sm wrap-anywhere text-rsm-charcoal">{lang === "fi" ? step.foundFactFi : step.foundFact}</p>
                                ) : null}
                            </div>
                        </li>
                    ))}
                    {steps.length < (meta?.total ?? 6) ? (
                        <li className="flex items-center gap-3 rounded-rsm-tile border border-dashed border-rsm-hairline p-4">
                            <span
                                aria-hidden
                                className="size-5 shrink-0 animate-spin rounded-full border-2 border-rsm-steel-25 border-t-rsm-steel motion-reduce:animate-none"
                            />
                            <span className="sr-only">{t.analysing.title}…</span>
                        </li>
                    ) : null}
                </ol>

                <div className="flex flex-col gap-2 text-sm leading-relaxed text-rsm-misty">
                    <p className="hidden md:block">{t.analysing.honesty}</p>
                    <p className="md:hidden">{t.analysing.honestyShort}</p>
                    <p className="hidden md:block">{t.analysing.cacheNote}</p>
                </div>
            </main>
        </div>
    );
}
