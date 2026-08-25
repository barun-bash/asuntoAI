# Workflow — R-series journey (self-orchestrated slice loop)

**Loop**: the remaining R-series build journey for asuntoAI, slice by slice, per `design/R-SERIES-HANDOFF.md` §13.
**Runner**: the Kimi Code session in the repo root (self-orchestrating; spins off subagents).
**Trigger**: event — completion of the previous slice, or a user message (feedback, reprioritisation, "good to go").

## Slice sequence (§13 build order; slice 1 done)

1. ~~R1 read path + C1–C3 primitives~~ — PR #1 (`frontend-web` → `main`), awaiting user merge.
2. Policy + 14 tests, client re-run (R5-1…R5-5 + FI rows).
3. Checkout + credits (R6-*).
4. Full report §1–§7 + chat (R7-1…R7-8).
5. Print P1–P4.
6. Public page + OG + emails (R8/R9).
7. Account: drawer, watch, notifications, refunds, deletion (R10/R11/R14/R16).
8. Tracking, compare, history panels, checklist, offer calculator (R12/R13/R7-9…11/R5-6).
9. Onboarding (R15-2/3) + marketing landing (`/raportti`, `/report`).
10. Partner API (R17).

## One run (one slice)

1. **Plan** — orchestrator extracts the target board's frames + handoff-notes card (routes, contracts, FI strings, Breakpoints line) and writes a slice plan: screens, contracts, dict keys, acceptance subset. Lift every string and value from the board; where FI is missing, translate from EN board copy using the boards' FI vocabulary and flag it in the PR.
2. **Build** — a coder subagent implements on a fresh branch `frontend-web-<slice>` cut from `frontend-web`. Rules in force: `AGENTS.md`; §6 product rules (no client-side financial arithmetic beyond the spec-sanctioned policy re-run over engine-published actuals; locked data server-redacted; refusal is a verdict; veil = paper gradient); verdict colours = wash + border + label; touch targets ≥44 px; tokens verbatim; Untitled UI for base primitives, boards win on looks.
3. **Verify** — `npm run build` + `npx tsc --noEmit` clean; smoke tests for every new/changed route incl. `?lang=en`; mock-engine boundary (`src/lib/store.ts`) stays the only data source.
4. **Review** — a reviewer subagent (fresh context) checks: (a) spec compliance — §6 rules + the slice's §12 acceptance subset + board contracts; (b) design fidelity — frames by `data-screen-label`, structure/breakpoints/copy; (c) code quality — minimal diff, house style. Findings go back to the coder until clean.
5. **PR + brief (the checkpoint, pushed right)** — push the slice branch, open PR → `frontend-web`, post the user a tight brief: what shipped, what was verified, what's flagged for eyes. The user reads the brief, not the diff.
6. **Merge** — orchestrator merges the slice PR into `frontend-web` once review is clean (belt: CI-green build). The `frontend-web` → `main` PR (#1) accumulates slices; **only the user merges to main**, on "good to go".

## Interrupts

- **User feedback** (chat or PR comment): pause the loop, address it on the relevant branch, resume.
- **"Good to go"**: merge `frontend-web` → `main` PR(s) as instructed, then continue.
- **Reprioritisation** (e.g. "do the landing next"): reorder the sequence, note it in NOTES.md.

## Definition of done (per slice)

An implementer can verify each box:
- [ ] Every board frame for the slice is implemented, FI + EN, at ≥1280 / 768–1279 / ≤767 per the board's Breakpoints line.
- [ ] Slice's §12 acceptance subset verified with evidence (commands + outputs in the PR).
- [ ] Build + typecheck clean; smoke tests pass; no blur in any veil; NBSP formats in rendered HTML.
- [ ] Slice PR open → `frontend-web`, with brief and flagged translations.
- [ ] NOTES.md updated if terminology or decisions changed.

## Stop condition

All ten slices merged into `frontend-web`; final brief lists what remains for production (real engine swap, Stripe, email sending, OG rendering, partner docs hosting) — those are out of this repo's journey unless the user says otherwise.
