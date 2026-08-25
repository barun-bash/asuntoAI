"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Slider } from "@/components/base/slider/slider";
import type { Dict } from "@/i18n/dict";
import { capFirst, formatEUR, formatTime, numberWord } from "@/lib/format";
import {
    type PolicyRun,
    type PolicyTestResult,
    dirtyCountAgainst,
    evaluatePolicy,
    formatPolicyLine,
    formatPolicyMargin,
    formatPolicyMarginAbs,
} from "@/lib/policy";
import type { PolicyData, PolicyPresetKey, PolicyTestDef } from "@/lib/types";
import { tpl, useLang } from "@/providers/lang";
import { cx } from "@/utils/cx";

/**
 * Policy panel (R5-1…R5-5): fourteen tests, live verdict. The re-run is the
 * spec-sanctioned §6.2 exception — pure client evaluation over engine-published
 * actuals (src/lib/policy.ts), no network on preset tap or threshold edit.
 * Preset pills = radiogroup; verdict banner aria-live=assertive (a11y §11).
 * Anonymous policies persist to localStorage, debounced 800 ms (board contract).
 */

const STORAGE_KEY = "resimator:policy:v1";
const PRESET_ORDER: (PolicyPresetKey | "custom")[] = ["conservative", "balanced", "yield", "custom"];

type LastRun = { kind: "initial" } | { kind: "preset"; at: Date } | { kind: "edit" };

/* ── Verdict pill: wash + dot + label — grayscale-safe (rule §6.6) ── */
function VerdictPill({ pass, t }: { pass: boolean; t: Dict }) {
    return (
        <span
            className={cx(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.05em] uppercase",
                pass ? "bg-rsm-seafoam-25 text-rsm-seafoam-deep" : "bg-rsm-coral-25 text-rsm-coral-deep",
            )}
        >
            <span aria-hidden className={cx("size-[5px] rounded-full", pass ? "bg-rsm-seafoam-deep" : "bg-rsm-coral-deep")} />
            {pass ? t.policy.passPill : t.policy.failPill}
        </span>
    );
}

/* ── Threshold editor: ± steppers + DS Slider, commit on release, Esc cancels ── */
function ThresholdEditor({ test, value, onCommit, onCancel }: { test: PolicyTestDef; value: number; onCommit: (value: number) => void; onCancel: () => void }) {
    const { lang, t } = useLang();
    // Draft while dragging: the committed value only changes on release, so the
    // thumb tracks a local draft via onChange; onChangeEnd commits and clears it.
    const [draft, setDraft] = useState<number | null>(null);
    const cfg = test.edit;
    if (!cfg) return null;
    const name = lang === "fi" ? test.labelFi : test.label;
    // Steps of 5 per the board annotation; decimal-unit tests carry their own
    // finer engine-published step in the fixture (flagged in the PR).
    const stepBy = (dir: 1 | -1) => {
        const next = Math.round((value + dir * cfg.step) * 100) / 100;
        setDraft(null);
        onCommit(Math.min(cfg.max, Math.max(cfg.min, next)));
    };

    return (
        <div
            role="group"
            aria-label={tpl(t.policy.editLine, { name })}
            onKeyDown={(e) => {
                if (e.key === "Escape") {
                    e.stopPropagation();
                    setDraft(null);
                    onCancel();
                }
            }}
            className="flex items-center gap-3"
        >
            <button
                type="button"
                onClick={() => stepBy(-1)}
                aria-label={t.policy.decrease}
                className="flex size-11 shrink-0 items-center justify-center rounded-rsm-input bg-white text-lg font-bold text-rsm-midnight shadow-[inset_0_0_0_1px_var(--color-rsm-hairline)] transition-shadow duration-200 ease-rsm hover:shadow-[inset_0_0_0_1px_var(--color-rsm-steel)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rsm-steel"
            >
                −
            </button>
            <div className="policy-slider min-w-0 flex-1">
                <Slider
                    aria-label={tpl(t.policy.editLine, { name })}
                    minValue={cfg.min}
                    maxValue={cfg.max}
                    step={cfg.step}
                    value={draft ?? value}
                    onChange={(v) => setDraft(v as number)}
                    onChangeEnd={(v) => {
                        setDraft(null);
                        onCommit(Math.round((v as number) * 100) / 100);
                    }}
                    formatOptions={{ style: "decimal", maximumFractionDigits: 2 }}
                    labelFormatter={(v) => formatPolicyLine(test, v, lang, t.policy.lineRequired)}
                />
            </div>
            <button
                type="button"
                onClick={() => stepBy(1)}
                aria-label={t.policy.increase}
                className="flex size-11 shrink-0 items-center justify-center rounded-rsm-input bg-white text-lg font-bold text-rsm-midnight shadow-[inset_0_0_0_1px_var(--color-rsm-hairline)] transition-shadow duration-200 ease-rsm hover:shadow-[inset_0_0_0_1px_var(--color-rsm-steel)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rsm-steel"
            >
                +
            </button>
        </div>
    );
}

/* ── Banner body: assembled from engine explanation fields via dict templates ── */
function BannerBody({
    run,
    basePreset,
    dirty,
    thresholds,
}: {
    run: PolicyRun;
    basePreset: PolicyPresetKey;
    dirty: boolean;
    thresholds: Record<string, number>;
}) {
    const { lang, t } = useLang();

    if (!run.passing) {
        // R5-4 — Conservative preset, verbatim board body ("walk away, not negotiate").
        if (basePreset === "conservative" && !dirty) {
            // Board spells the count ("six failures", FI "Kuutta hylkäystä");
            // the FI word is sentence-initial here, hence capitalized.
            const failsWord = numberWord(run.failCount, lang, "part");
            return (
                <>
                    {tpl(t.policy.bodyConservativeA, { failsWord: lang === "fi" ? capFirst(failsWord) : failsWord })}
                    <strong className="font-bold">{t.policy.bodyConservativeBold}</strong>
                    {t.policy.bodyConservativeB}
                </>
            );
        }
        const buildingFails = run.results.filter((r) => !r.pass && r.test.explanation?.reason === "building");
        const fixableFails = run.results.filter((r) => !r.pass && (r.test.explanation?.fixablePrice || r.test.explanation?.fixableRent));
        // R5-1 — building tests vs the one fixable cash-flow line.
        if (buildingFails.length > 0 && fixableFails.length > 0) {
            const blurbs = buildingFails
                .map((r) => r.test.explanation?.blurb?.[lang])
                .filter(Boolean)
                .join(lang === "fi" ? " tai " : " or ");
            const fix = fixableFails[0].test.explanation ?? {};
            // Board: "Two of the three failures are the building…" — sentence-initial word.
            const buildingLead = capFirst(
                tpl(t.policy.bodyBuildingA, {
                    buildingCountWord: numberWord(buildingFails.length, lang),
                    failCountWord: numberWord(run.failCount, lang),
                    failCount: run.failCount,
                }),
            );
            return (
                <>
                    {buildingLead}
                    <strong className="font-bold">{t.policy.bodyBuildingBold}</strong>
                    {tpl(t.policy.bodyBuildingB, { blurbs })}
                    {t.policy.bodyFixableLead}
                    {/* R5-6 entry point (the frame: "the fail banner's fix line")
                       — the fix offer links to the offer calculator (#offer). */}
                    <a
                        href="#offer"
                        className="underline decoration-rsm-coral-deep/40 underline-offset-2 transition-colors duration-200 ease-rsm hover:decoration-rsm-coral-deep"
                    >
                        <strong className="font-bold">
                            {tpl(t.policy.bodyFixableOffer, {
                                price: fix.fixablePrice ? formatEUR(fix.fixablePrice, lang) : "",
                                pct: fix.fixablePricePct?.[lang] ?? "",
                                rent: fix.fixableRent ? formatEUR(fix.fixableRent, lang) : "",
                            })}
                        </strong>
                    </a>
                </>
            );
        }
        // Generic fail (custom edits / yield preset): names are engine-published labels.
        const names = run.results
            .filter((r) => !r.pass)
            .map((r) => (lang === "fi" ? r.test.labelFi : r.test.label))
            .join(", ");
        return (
            <>
                {tpl(t.policy.bodyFailGeneric, { names })}
                {buildingFails.length > 0 ? ` ${t.policy.bodyFailBuilding}` : ""}
            </>
        );
    }

    // R5-2 — pass with thin margins flagged, not celebrated.
    const near = run.results.filter((r) => r.near);
    if (near.length === 0) return <>{t.policy.bodyPassClean}</>;
    const sentences = near
        .map((r) =>
            tpl(t.policy.nearSentence, {
                name: lang === "fi" ? r.test.labelFi : r.test.label,
                // Board: "clears your −100 € line by 86 €" — no op symbol, unsigned margin.
                line: formatPolicyLine(r.test, thresholds[r.test.key], lang, t.policy.lineRequired, false),
                margin: formatPolicyMarginAbs(r.test, r.margin, lang),
            }),
        )
        .join(" ");
    return (
        <>
            {t.policy.bodyPassLead}
            {sentences} {t.policy.bodyPassTail}
        </>
    );
}

export function PolicyPanel({
    policy,
    addr,
    flagCount,
    seamAnchorId,
    showUnlockStrip = true,
}: {
    policy: PolicyData;
    addr: string;
    flagCount: number;
    seamAnchorId: string;
    /** The full report (R7) has no seam — the mobile unlock strip stays off there. */
    showUnlockStrip?: boolean;
}) {
    const { lang, t } = useLang();
    const [basePreset, setBasePreset] = useState<PolicyPresetKey>("balanced");
    const [thresholds, setThresholds] = useState<Record<string, number>>({ ...policy.presets.balanced });
    const [activeKey, setActiveKey] = useState<string | null>(null);
    const [showRest, setShowRest] = useState(false);
    const [lastRun, setLastRun] = useState<LastRun>({ kind: "initial" });
    const [hydrated, setHydrated] = useState(false);
    const radioRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const saveTimer = useRef<number | null>(null);

    // Restore the anonymous policy (localStorage). Account persistence is a backend
    // concern; the mock keeps it in the browser per the board contract.
    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const saved = JSON.parse(raw) as { base?: string; thresholds?: Record<string, number> };
                const base = saved.base as PolicyPresetKey;
                if (base && base in policy.presets && saved.thresholds) {
                    const clean: Record<string, number> = {};
                    for (const test of policy.tests) {
                        const v = saved.thresholds[test.key];
                        clean[test.key] = typeof v === "number" && Number.isFinite(v) ? v : policy.presets[base][test.key];
                    }
                    setBasePreset(base);
                    setThresholds(clean);
                }
            }
        } catch {
            // Corrupt or unavailable storage — fall back to Balanced.
        }
        setHydrated(true);
    }, [policy]);

    // Save debounced 800 ms (board contract) — anonymous tier only.
    useEffect(() => {
        if (!hydrated) return;
        if (saveTimer.current) window.clearTimeout(saveTimer.current);
        saveTimer.current = window.setTimeout(() => {
            try {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ base: basePreset, thresholds }));
            } catch {
                // Storage unavailable — the policy just won't persist.
            }
        }, 800);
        return () => {
            if (saveTimer.current) window.clearTimeout(saveTimer.current);
        };
    }, [hydrated, basePreset, thresholds]);

    // The re-verdict: 14 comparisons over engine-published actuals — «100 ms.
    const run = useMemo(() => evaluatePolicy(policy, thresholds), [policy, thresholds]);

    const dirtyCount = dirtyCountAgainst(policy.presets[basePreset], thresholds);
    const dirty = dirtyCount > 0;
    const activePresetKey: PolicyPresetKey | "custom" = dirty ? "custom" : basePreset;
    const presetName = t.policy.presets[activePresetKey];
    const activeTest = activeKey ? (policy.tests.find((test) => test.key === activeKey) ?? null) : null;
    // R5-4: clean Conservative drops the word "tests" from the summary ("fails 6 of 14 · Conservative").
    const conservativeClean = basePreset === "conservative" && !dirty;
    // Failing runs: failing tests sort first and passing collapse behind
    // "Show the rest" — at ALL widths (R5-4 desktop annotation), not just mobile.
    const failing = !run.passing;

    const selectPreset = (key: PolicyPresetKey) => {
        setBasePreset(key);
        setThresholds({ ...policy.presets[key] });
        setActiveKey(null);
        setLastRun({ kind: "preset", at: new Date() });
    };

    const commitThreshold = (key: string, value: number) => {
        setThresholds((prev) => ({ ...prev, [key]: value }));
        setLastRun({ kind: "edit" });
    };

    // Radiogroup keyboard: arrows move selection (roving tabindex); Custom is
    // skipped while clean — it only becomes selectable once an edit dirties it.
    const onGroupKeyDown = (e: React.KeyboardEvent) => {
        const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        const selectable = PRESET_ORDER.filter((key) => key !== "custom" || dirty);
        const idx = selectable.indexOf(activePresetKey);
        const next = selectable[(idx + dir + selectable.length) % selectable.length];
        if (next !== "custom") selectPreset(next);
        radioRefs.current[next]?.focus();
    };

    const bannerMeta =
        lastRun.kind === "initial"
            ? t.policy.engineSet
            : lastRun.kind === "preset"
              ? tpl(t.policy.reran, { time: formatTime(lastRun.at, lang) })
              : t.policy.reranRelease;

    return (
        <section id="policy" aria-labelledby="policy-title" className="flex flex-col gap-4">
            <div className="flex flex-col gap-5 rounded-rsm-card border border-rsm-hairline bg-white p-4 shadow-rsm-sm md:p-6 xl:p-8">
                {/* Header: eyebrow + heading + preset rail (scrolls horizontally on mobile). */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                    <div className="min-w-0">
                        <p className="text-[10.5px] font-bold tracking-[0.09em] text-rsm-steel uppercase">
                            {dirty ? t.policy.eyebrowEdited : t.policy.eyebrow}
                        </p>
                        <h2 id="policy-title" className="mt-1 font-display text-xl font-medium wrap-anywhere text-rsm-midnight md:text-2xl">
                            {tpl(t.policy.heading, { addr })}
                        </h2>
                    </div>
                    <div
                        role="radiogroup"
                        aria-label={t.policy.groupLabel}
                        onKeyDown={onGroupKeyDown}
                        className="-mx-1 scrollbar-hide w-full overflow-x-auto md:mx-0 md:ml-auto md:w-auto md:overflow-visible"
                    >
                        <div className="flex w-max gap-2 px-1 py-1 md:w-auto md:flex-wrap md:justify-end">
                            {PRESET_ORDER.map((key) => {
                                const checked = activePresetKey === key;
                                const disabled = key === "custom" && !dirty;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        role="radio"
                                        aria-checked={checked}
                                        aria-disabled={disabled || undefined}
                                        tabIndex={checked ? 0 : -1}
                                        ref={(el) => {
                                            radioRefs.current[key] = el;
                                        }}
                                        onClick={() => {
                                            if (key === "custom" || disabled) return;
                                            selectPreset(key);
                                        }}
                                        className={cx(
                                            "flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[12.5px] font-bold whitespace-nowrap transition-colors duration-200 ease-rsm",
                                            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rsm-steel",
                                            checked
                                                ? "bg-rsm-midnight text-rsm-paper"
                                                : "text-rsm-midnight shadow-[inset_0_0_0_1px_var(--color-rsm-hairline)] hover:shadow-[inset_0_0_0_1px_var(--color-rsm-steel-50)]",
                                            disabled && "opacity-60",
                                        )}
                                    >
                                        {t.policy.presets[key]}
                                        {key === "custom" && dirty ? (
                                            <span aria-hidden className="size-1.5 rounded-full bg-rsm-lime ring-1 ring-rsm-midnight-25" />
                                        ) : null}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Verdict banner — re-run answers the user's action: aria-live assertive. */}
                <div
                    aria-live="assertive"
                    aria-atomic="true"
                    className={cx(
                        "flex flex-wrap items-center gap-4 rounded-rsm-tile border border-l-4 border-rsm-hairline p-4 md:px-6 md:py-[18px]",
                        run.passing ? "border-l-rsm-seafoam bg-rsm-pass-wash" : "border-l-rsm-coral bg-rsm-fail-wash",
                    )}
                >
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <span
                                className={cx(
                                    "font-display text-[21px] leading-[1.1] font-medium md:text-[27px]",
                                    run.passing ? "text-rsm-seafoam-deep" : "text-rsm-coral-deep",
                                )}
                            >
                                {run.passing ? t.policy.passes : t.policy.doesNotPass}
                            </span>
                            <span className="tnum text-[12px] font-medium text-rsm-slate max-md:hidden md:text-sm">
                                {run.passing
                                    ? run.nearCount > 0
                                        ? tpl(t.policy.passSummary, { total: run.total, near: run.nearCount })
                                        : tpl(t.policy.passSummaryClean, { total: run.total })
                                    : tpl(conservativeClean ? t.policy.failSummaryNoTests : t.policy.failSummary, {
                                          n: run.failCount,
                                          total: run.total,
                                          preset: presetName,
                                      })}
                            </span>
                            <span className="tnum text-[12px] font-medium text-rsm-slate md:hidden">
                                {run.passing
                                    ? tpl(t.policy.passSummaryClean, { total: run.total })
                                    : tpl(t.policy.failSummaryShort, { n: run.failCount, total: run.total })}
                            </span>
                        </div>
                        <p className="mt-1.5 text-[12.5px] leading-relaxed wrap-anywhere text-rsm-charcoal md:text-[13.5px]">
                            <BannerBody run={run} basePreset={basePreset} dirty={dirty} thresholds={thresholds} />
                        </p>
                    </div>
                    <span className="tnum shrink-0 text-right text-xs leading-normal text-rsm-misty max-md:hidden">{bannerMeta}</span>
                </div>

                {/* Test table — header ≥768 only; margin column ≥1280 (R5-5 folds it). */}
                <div
                    aria-hidden
                    className="grid grid-cols-[minmax(0,1fr)_104px_96px_64px] gap-x-3 border-b border-rsm-hairline px-1 pb-2 text-[10.5px] font-bold tracking-[0.07em] text-rsm-misty uppercase max-md:hidden xl:grid-cols-[minmax(0,1fr)_128px_118px_96px_74px]"
                >
                    <span>{t.policy.colTest}</span>
                    <span className="text-right">{t.policy.colDeal}</span>
                    <span className="text-right">{t.policy.colLine}</span>
                    <span className="text-right max-xl:hidden">{t.policy.colMargin}</span>
                    <span className="text-right">{t.policy.colVerdict}</span>
                </div>

                <div className="flex flex-col">
                    {run.results.map((r) => (
                        <PolicyRow
                            key={r.test.key}
                            result={r}
                            thresholds={thresholds}
                            active={activeKey === r.test.key}
                            failing={failing}
                            collapsed={failing && r.pass && !showRest}
                            showNear={run.passing}
                            onToggleEdit={() => setActiveKey(activeKey === r.test.key ? null : r.test.key)}
                            onCommit={(value) => commitThreshold(r.test.key, value)}
                            onCancelEdit={() => setActiveKey(null)}
                        />
                    ))}
                    {failing && run.passCount > 0 ? (
                        <button
                            type="button"
                            onClick={() => setShowRest((v) => !v)}
                            className="flex min-h-11 items-center justify-center text-[12.5px] font-medium text-rsm-steel underline-offset-4 hover:underline"
                        >
                            {showRest ? t.policy.hideRest : t.policy.showRest}
                        </button>
                    ) : null}
                </div>

                {/* Footer: edit hint (clean) / Custom marker + Reset (dirty). */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px] leading-relaxed text-rsm-misty">
                    {dirty ? (
                        <span className="inline-flex items-center gap-2">
                            <span aria-hidden className="size-1.5 rounded-full bg-rsm-lime ring-1 ring-rsm-midnight-25" />
                            {tpl(t.policy.customMarker, { preset: t.policy.presets[basePreset], n: dirtyCount })}
                        </span>
                    ) : (
                        <span>
                            {t.policy.editHintA}
                            <strong className="font-bold">{t.policy.editHintBold}</strong>
                            {t.policy.editHintB}
                        </span>
                    )}
                    {dirty ? (
                        <button
                            type="button"
                            onClick={() => selectPreset(basePreset)}
                            className="ml-auto flex min-h-11 items-center font-medium text-rsm-steel underline-offset-4 hover:underline"
                        >
                            {tpl(t.policy.resetTo, { preset: t.policy.presets[basePreset] })}
                        </button>
                    ) : null}
                </div>
            </div>

            {/* R5-3 — unlock strip below the panel on mobile, link to the seam.
               Suppressed on the full report (nothing left to unlock there). */}
            {showUnlockStrip ? (
                <div className="flex items-center gap-3 rounded-rsm-card border border-rsm-hairline bg-white p-4 shadow-rsm-sm md:hidden">
                    <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-rsm-midnight">{t.policy.unlockStripTitle}</p>
                        <p className="tnum mt-0.5 text-[11px] text-rsm-misty">{tpl(t.policy.unlockStripMeta, { n: flagCount })}</p>
                    </div>
                    <a
                        href={`#${seamAnchorId}`}
                        className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-rsm-lime px-5 text-sm font-bold text-rsm-midnight transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75"
                    >
                        {t.policy.unlock}
                    </a>
                </div>
            ) : null}

            {/* R5-3 — mobile bottom sheet: threshold stepper + slider. */}
            {activeTest?.edit ? (
                <div
                    className="fixed inset-0 z-50 flex items-end md:hidden"
                    role="dialog"
                    aria-modal="true"
                    aria-label={tpl(t.policy.editLine, { name: lang === "fi" ? activeTest.labelFi : activeTest.label })}
                >
                    <button
                        type="button"
                        aria-label={t.policy.closeEditor}
                        onClick={() => setActiveKey(null)}
                        className="absolute inset-0 bg-rsm-midnight/40"
                    />
                    <div
                        autoFocus
                        tabIndex={-1}
                        className="relative flex w-full flex-col gap-3 rounded-t-rsm-card border border-rsm-hairline bg-white p-5 pb-8 outline-none"
                        onKeyDown={(e) => {
                            if (e.key === "Escape") setActiveKey(null);
                        }}
                    >
                        <p className="pr-8 text-sm font-bold wrap-anywhere text-rsm-midnight">{lang === "fi" ? activeTest.labelFi : activeTest.label}</p>
                        <ThresholdEditor
                            test={activeTest}
                            value={thresholds[activeTest.key]}
                            onCommit={(value) => commitThreshold(activeTest.key, value)}
                            onCancel={() => setActiveKey(null)}
                        />
                        <p className="text-[11.5px] leading-normal text-rsm-misty">{t.policy.sliderHint}</p>
                    </div>
                </div>
            ) : null}
        </section>
    );
}

/* ── One test row: mobile tap-row (≤767), grid row (≥768), inline editor (≥768) ── */
function PolicyRow({
    result,
    thresholds,
    active,
    failing,
    collapsed,
    showNear,
    onToggleEdit,
    onCommit,
    onCancelEdit,
}: {
    result: PolicyTestResult;
    thresholds: Record<string, number>;
    active: boolean;
    /** True when the run is failing — failing rows sort first at every width (R5-4). */
    failing: boolean;
    /** Passing row in a failing run, hidden behind "Show the rest" (all widths). */
    collapsed: boolean;
    showNear: boolean;
    onToggleEdit: () => void;
    onCommit: (value: number) => void;
    onCancelEdit: () => void;
}) {
    const { lang, t } = useLang();
    const { test, pass } = result;
    // The board marks "near your line" only in the pass state (R5-2) — gated by the parent.
    const near = showNear && result.near;
    const name = lang === "fi" ? test.labelFi : test.label;
    const actual = lang === "fi" ? result.actual.displayFi : result.actual.display;
    const line = formatPolicyLine(test, thresholds[test.key], lang, t.policy.lineRequired);
    const margin = formatPolicyMargin(test, result.margin, lang);
    const marginAbs = formatPolicyMarginAbs(test, result.margin, lang);
    const marginColor = pass ? (near ? "text-rsm-amber-deep" : "text-rsm-seafoam-deep") : "text-rsm-coral-deep";
    const building = !pass && test.explanation?.reason === "building";

    // Subline variants per breakpoint (boards R5-1 / R5-3 / R5-5).
    const termSubline = [test.term, lang === "fi" ? test.termNoteFi : test.termNote].filter(Boolean).join(" · ");
    const desktopSubline = [termSubline, near ? t.policy.nearLine : null].filter(Boolean).join(" · ") + (active ? ` — ${t.policy.editing}` : "");
    const tabletSubline =
        test.unit === "flag"
            ? termSubline
            : [tpl(pass ? t.policy.marginClears : t.policy.marginMisses, { m: marginAbs }), building ? t.policy.buildingNotPrice : null]
                  .filter(Boolean)
                  .join(" · ");
    const mobileDetail = [
        tpl(t.policy.vsActual, { actual, line }),
        building ? t.policy.buildingNotPrice : null,
        !pass && test.explanation?.fixablePrice ? tpl(t.policy.fixOffer, { price: formatEUR(test.explanation.fixablePrice, lang) }) : null,
        near ? t.policy.nearLine : null,
    ]
        .filter(Boolean)
        .join(" · ");

    const mobileInner = (
        <>
            <span className="min-w-0 flex-1">
                <span className="block text-[13px] leading-snug font-medium wrap-anywhere text-rsm-midnight">{name}</span>
                <span className="tnum mt-0.5 block text-[11px] leading-snug wrap-anywhere text-rsm-misty">{mobileDetail}</span>
            </span>
            <span className="tnum shrink-0 font-display text-[13.5px] font-medium whitespace-nowrap text-rsm-midnight">{actual}</span>
            <VerdictPill pass={pass} t={t} />
        </>
    );

    return (
        <div className={cx("flex flex-col", failing && !pass && "order-first", collapsed && "hidden")}>
            {/* ≤767 — the whole row is the tap target (opens the bottom sheet). */}
            {test.edit ? (
                <button
                    type="button"
                    onClick={onToggleEdit}
                    aria-expanded={active}
                    className={cx("flex min-h-11 items-center gap-2.5 border-b border-rsm-row-line px-1 py-3 text-left md:hidden", !pass && "bg-rsm-coral-row")}
                >
                    {mobileInner}
                </button>
            ) : (
                <div className={cx("flex min-h-11 items-center gap-2.5 border-b border-rsm-row-line px-1 py-3 md:hidden", !pass && "bg-rsm-coral-row")}>
                    {mobileInner}
                </div>
            )}

            {/* ≥768 — Test / This deal / Your line / Margin (≥1280) / Verdict. */}
            <div
                className={cx(
                    "hidden grid-cols-[minmax(0,1fr)_104px_96px_64px] items-center gap-x-3 border-b border-rsm-row-line px-1 py-2.5 md:grid xl:grid-cols-[minmax(0,1fr)_128px_118px_96px_74px]",
                    !pass && !active && "bg-rsm-coral-row",
                    active && "rounded-[10px] bg-rsm-soft-sky shadow-[inset_0_0_0_1.5px_var(--color-rsm-steel)]",
                )}
            >
                <span className="min-w-0">
                    <span
                        className={cx("block text-[13px] leading-snug wrap-anywhere text-rsm-midnight md:text-[13.5px]", active ? "font-bold" : "font-medium")}
                    >
                        {name}
                    </span>
                    <span className="tnum mt-0.5 hidden text-[11px] leading-snug wrap-anywhere text-rsm-misty xl:block">{desktopSubline}</span>
                    <span
                        className={cx(
                            "tnum mt-0.5 text-[10.5px] leading-snug wrap-anywhere max-xl:block xl:hidden",
                            test.unit === "flag" ? "text-rsm-misty" : marginColor,
                        )}
                    >
                        {tabletSubline}
                    </span>
                </span>
                <span className="tnum text-right font-display text-[13.5px] font-medium text-rsm-midnight md:text-sm">{actual}</span>
                <span className="text-right">
                    {test.edit ? (
                        <button
                            type="button"
                            onClick={onToggleEdit}
                            aria-expanded={active}
                            aria-label={tpl(t.policy.editLine, { name })}
                            className={cx(
                                "tnum inline-flex min-h-11 items-center justify-end rounded-rsm-input px-2 text-[12px] font-medium whitespace-nowrap text-rsm-slate md:text-[12.5px]",
                                "underline-offset-4 transition-colors duration-200 ease-rsm hover:text-rsm-steel hover:underline",
                                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rsm-steel",
                            )}
                        >
                            {line}
                        </button>
                    ) : (
                        <span className="tnum inline-flex min-h-11 items-center justify-end px-2 text-[12px] font-medium whitespace-nowrap text-rsm-slate md:text-[12.5px]">
                            {line}
                        </span>
                    )}
                </span>
                <span className={cx("tnum text-right text-[12.5px] font-medium whitespace-nowrap max-xl:hidden", marginColor)}>{margin}</span>
                <span className="text-right">
                    <VerdictPill pass={pass} t={t} />
                </span>
            </div>

            {/* ≥768 — slider appears under the active row; Esc cancels. */}
            {active && test.edit ? (
                <div className="border-b border-rsm-row-line bg-rsm-editor-bg px-2.5 py-3 max-md:hidden">
                    <ThresholdEditor test={test} value={thresholds[test.key]} onCommit={onCommit} onCancel={onCancelEdit} />
                    <p className="mt-1.5 text-[11.5px] leading-normal text-rsm-misty">{t.policy.sliderHint}</p>
                </div>
            ) : null}
        </div>
    );
}
