/**
 * Policy evaluation — the spec-sanctioned exception to §6.2 (R-SERIES-HANDOFF §4
 * "Policy data" + R2 handoff notes): the verdict re-run is PURE CLIENT evaluation
 * over engine-published actuals. Compare actual vs threshold per op; margins are
 * numeric differences, formatted via format.ts. No other arithmetic lives here —
 * actuals and explanation figures arrive pre-computed from the fixture (engine).
 * Fourteen comparisons run in well under the 100 ms budget; no network involved.
 */
import { NBSP, formatEUR, formatEURSigned, formatGradeMargin, formatPercent, formatPpSigned } from "@/lib/format";
import type { Lang } from "@/lib/i18n";
import type { PolicyActual, PolicyData, PolicyTestDef } from "@/lib/types";

/** A–E grade scale as ranks (E=0 … A=4). Fixture stores ranks; display uses letters. */
export const GRADE_LETTERS = ["E", "D", "C", "B", "A"] as const;

const EPSILON = 1e-9;

export interface PolicyTestResult {
    test: PolicyTestDef;
    actual: PolicyActual;
    pass: boolean;
    /** Signed margin in the test's unit: positive = clears the line, negative = misses. */
    margin: number;
    /**
     * "Near your line" (R-2): passing rows within a thin margin of the line.
     * Brief-sanctioned client computation: |margin| ≤ 1 pp for percent tests,
     * ≤ 100 € for monthly/one-off euro tests. Excluded: grades, the boolean
     * flag, and €/m² (a 100 € band is meaningless on a sub-€ scale). The board
     * marks near rows only in the PASS state (R5-2), so the UI gates display
     * on the whole policy passing — fail states (R5-1/R5-4) show no markers.
     * The board's exact R5-2 set (2 rows) isn't reproducible by any clean rule;
     * this approximation is flagged in the PR.
     */
    near: boolean;
}

export interface PolicyRun {
    results: PolicyTestResult[];
    passCount: number;
    failCount: number;
    nearCount: number;
    total: number;
    passing: boolean;
}

function marginFor(test: PolicyTestDef, actualValue: number, threshold: number): number {
    const raw = test.op === "lte" ? threshold - actualValue : test.op === "gte" ? actualValue - threshold : 0;
    // Tame float noise (50 − 49.3 = 0.7000…028) — margins are display-grade numbers.
    return Math.round(raw * 100) / 100;
}

function passFor(test: PolicyTestDef, actualValue: number, threshold: number): boolean {
    switch (test.op) {
        case "gte":
            return actualValue >= threshold - EPSILON;
        case "lte":
            return actualValue <= threshold + EPSILON;
        case "eq":
            return actualValue === threshold;
    }
}

function nearFor(test: PolicyTestDef, pass: boolean, margin: number): boolean {
    if (!pass) return false;
    if (test.unit === "percent") return Math.abs(margin) <= 1;
    if (test.unit === "eurMonth" || test.unit === "eur") return Math.abs(margin) <= 100;
    return false; // grade, flag, eurSqm — the band doesn't map to those scales
}

/** Re-runs the verdict over engine-published actuals. Pure client evaluation. */
export function evaluatePolicy(data: PolicyData, thresholds: Record<string, number>): PolicyRun {
    const results = data.tests.map((test) => {
        const actual = data.actuals.find((a) => a.key === test.key);
        if (!actual) throw new Error(`policy: missing actual for ${test.key}`);
        const threshold = thresholds[test.key];
        const pass = passFor(test, actual.value, threshold);
        const margin = marginFor(test, actual.value, threshold);
        return { test, actual, pass, margin, near: nearFor(test, pass, margin) };
    });
    const failCount = results.filter((r) => !r.pass).length;
    const nearCount = results.filter((r) => r.near).length;
    return {
        results,
        passCount: results.length - failCount,
        failCount,
        nearCount,
        total: results.length,
        passing: failCount === 0,
    };
}

/** How many thresholds differ from a preset (drives Custom + "dirty on n thresholds"). */
export function dirtyCountAgainst(preset: Record<string, number>, thresholds: Record<string, number>): number {
    return Object.keys(preset).filter((key) => preset[key] !== thresholds[key]).length;
}

/* ── Display formatting (formatting only — engine published the numbers) ── */

function decimalCount(value: number): number {
    const rounded = Math.round(value * 100) / 100;
    return Number.isInteger(rounded) ? 0 : (String(rounded).split(".")[1]?.length ?? 0);
}

/** "Your line" cell: "≥ 6.0 %" · "≤ 25 %" · "≥ +50 €" · "≤ 6,00 €" · "≥ B" · "required". */
export function formatPolicyLine(test: PolicyTestDef, threshold: number, lang: Lang, flagLabel: string): string {
    const op = test.op === "gte" ? "≥" : test.op === "lte" ? "≤" : "";
    let body: string;
    switch (test.unit) {
        case "percent": {
            const decimals = Math.max(test.lineDecimals, decimalCount(threshold));
            body = formatPercent(threshold, lang, decimals);
            if (test.showPlus && threshold > 0) body = `+${body}`;
            break;
        }
        case "eurMonth":
            body = threshold > 0 && test.showPlus ? `+${formatEUR(threshold, lang)}` : formatEUR(threshold, lang);
            break;
        case "eur":
            body = formatEUR(threshold, lang);
            break;
        case "eurSqm":
            body = formatEUR(threshold, lang, Math.max(test.lineDecimals, decimalCount(threshold)));
            break;
        case "grade":
            body = GRADE_LETTERS[Math.round(threshold)] ?? String(threshold);
            break;
        case "flag":
            return flagLabel;
    }
    return op ? `${op}${NBSP}${body}` : body;
}

/** Margin cell: "+2.6 pp" · "−14 €" · "−1 grade" · "—" (flag test, board R5-1). */
export function formatPolicyMargin(test: PolicyTestDef, margin: number, lang: Lang): string {
    switch (test.unit) {
        case "percent":
            return formatPpSigned(margin, lang);
        case "eurMonth":
        case "eur":
            return formatEURSigned(margin, lang);
        case "eurSqm":
            return formatEURSigned(margin, lang, 2);
        case "grade":
            return formatGradeMargin(margin, lang);
        case "flag":
            return "—";
    }
}

/** Tablet subline margin (R5-5): the amount, unsigned — direction lives in the template. */
export function formatPolicyMarginAbs(test: PolicyTestDef, margin: number, lang: Lang): string {
    return formatPolicyMargin(test, Math.abs(margin), lang).replace("+", "");
}
