# NOTES — the user's world

_Canonical terms and facts, sharpened as the grilling resolves them._

## The project
- **asuntoAI** — repo `barun-bash/asuntoAI` (GitHub, public). Product: **Resimator Report** (€79 paste-a-link apartment risk report, FI-primary with EN parity).
- Canonical spec: `design/R-SERIES-HANDOFF.md`; visual spec: `design/*.dc.html` boards (match by `data-screen-label`).
- Stack: Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind v4 + Untitled UI React. Mock engine behind `src/lib/store.ts` (swap point for a real backend).
- Git discipline (user-set): **never touch `main`**; all code on `frontend-web`, lands via PR.

## The journey (user's words)
- "/loop -> plan - build - review - feedback - plan - build - review - feedback - good to go - push"
- Slice 1 (R1 read path) is built: PR #1 open, user tested live on localhost.
- Remaining per spec §13: policy (R5) → checkout (R6) → report + chat (R7) → print (P1–P4) → public/OG/emails (R8/R9) → account (R10/R11/R14/R16) → tracking/compare/history/checklist/offer (R12/R13/R7-9…11/R5-6) → onboarding + marketing landing → partner API (R17).

## Cast
- **The orchestrator-builder** — this Kimi Code session. RESOLVED (user, 2026-07-30): no external orchestrator agent. This session self-orchestrates: reads the spec, picks the next slice per §13, spins off subagents (coder for builds, reviewer for design/code review), runs the loop autonomously.
- **Subagents** — ephemeral workers spun off per task by the orchestrator-builder.
- **The user** — product owner. Reviews PRs; says "good to go". Interjects anytime; otherwise the loop runs without waiting.

## Resolved decisions
1. **Orchestration**: self-orchestrated by this session with subagents (user directive). Event-triggered: a finished slice fires the next slice.
2. **Branch/PR topology**: per-slice branches `frontend-web-<slice>` cut from `frontend-web`; slice PRs target `frontend-web` (integration branch, orchestrator may merge after review). `frontend-web` → `main` PR is the product gate — only the user merges that ("good to go"). `main` is never committed to.
3. **Review**: automated dual review per slice — design fidelity vs boards (frames by `data-screen-label` at 1440/768/390) + spec compliance (§6 rules, §12 acceptance subset) — run by a reviewer subagent; findings fixed before the slice PR.
4. **Feedback**: user feedback arrives as chat messages or PR comments; treated as new events that interrupt the loop.
5. **Good to go**: user merges the `frontend-web` → `main` PR. Slice PRs into `frontend-web` may be merged by the orchestrator once review is clean.
6. **Backend**: mock engine (`src/lib/store.ts`) carries the whole journey unless the user delivers a real engine; contracts stay engine-shaped so the swap is one file.
7. **Checkpoint cadence (push right)**: the user is involved once per slice, late — a PR + brief (what shipped, what was verified, what needs eyes), not raw output.

## Journey status (2026-07-30): COMPLETE
All ten §13 slices merged into `frontend-web` (PRs #2–#10 squash-merged; PR #1 `frontend-web`→`main` awaits the user's "good to go"). Reviewers caught real issues each round — three §6.4 payload leaks, a free-credit refund exploit, slider/a11y defects — all fixed pre-merge.
Production follow-ups (outside the journey): real engine swap behind `src/lib/store.ts`, Stripe, email sending, partner backend, translator review of composed FI strings (flagged inline in `src/i18n/dict.ts`), browser pixel pass at 1440/768/390.
