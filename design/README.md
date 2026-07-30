# Handoff: Resimator Report (€79 paste-a-link apartment risk report)

Design handoff package for **Claude Code and Kimi Code**. Covers the complete R-series (R1–R17 flows on five boards), the marketing landing page, and the project-level spec.

**Read order:** this README → `R-SERIES-HANDOFF.md` (the canonical build spec) → `Resimator R5 Components and Handoff.dc.html` (component system) → the flow boards.

## Overview

A standalone product: paste an Oikotie/Etuovi listing URL → ~60 s streamed analysis → free summary verdict with an honest paywall seam → 79 € full report (packs 199 €/349 €) → living document (re-runs, tracking, chat, print artifacts, compare) → partner JSON API. FI-primary with EN parity.

It is **not** the Resimator SaaS platform — new repo (`resimator-report`), no shared nav, auth, or portfolio concepts.

## About the design files

The `.dc.html` files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior, not production code to copy. Your task is to **recreate these designs in the target codebase's environment** (any React meta-framework; SSR required for `/r/:slug`) using its established patterns. If no codebase exists yet, choose an appropriate framework and implement the designs there.

Open the boards directly in a browser (keep folder structure intact — they load `support.js`, `_ds/…`, and `assets/…` relatively). Every frame carries a `data-screen-label` attribute (e.g. `R1-6 Free summary verdict`) — match implementation screens to frames by that label. Dashed cards on the boards are implementation annotations (routes, a11y, FI strings, contracts); each section ends with a "Handoff notes" card carrying data contracts and a `Breakpoints` line.

## Fidelity

**High-fidelity.** Colors, typography, spacing, copy (EN + FI), and states are final. Recreate pixel-perfectly at 1440 / 768 / 390, lifting exact values and strings from the boards — never invent copy or colors.

## Screens / views

| Board file | Flows | Frames |
| --- | --- | --- |
| `Resimator R5 Components and Handoff.dc.html` | **Read first.** Component inventory + system rules (colour discipline, register, coverage) | C1–C13 |
| `Resimator R1 Paste and Verdict.dc.html` | Product landing, streamed analysis, free verdict + paywall seam, errors/refusal/withdrawn, FI pass, first-run onboarding | R1-1…16, R15-* |
| `Resimator R2 Policy and Purchase.dc.html` | 14-test policy with live re-verdict, offer calculator, packs & payment states, invoice fallback | R5-1…6, R6-1…10 |
| `Resimator R3 Full Report and Chat.dc.html` | Report document §1–§7, chat, price/rent history, agent checklist, tablet chat, A4 print | R7-1…11, P1–P4 |
| `Resimator R4 Public Emails Account.dc.html` | Public page, OG variants, 6 emails, My reports, watch, refunds, tracking, compare, notifications, deletion/GDPR export, partner API | R8-* … R17-* |
| `Resimator Report Landing.dc.html` | Marketing landing `/raportti` · `/report`: pain-led hero, 12 s how-it-works loop, cost calculator, DIY ledger, sample embed, FAQ, FI hero | 1 page |

Routes, data model, and API contracts: `R-SERIES-HANDOFF.md` §3–§5.

## Interactions & behavior

Authoritative detail lives in `R-SERIES-HANDOFF.md` and per-frame annotations. Highlights:

- SSE-streamed analysis with per-step aria-live announcements; refusal is a verdict (`status:"refused"`), never an error.
- Policy edits re-run the verdict client-side <100 ms over engine-published actuals; any threshold edit → preset becomes Custom + Reset.
- Unlock happens in place on `/r/:slug` (no route change); locked flags arrive server-redacted; the veil is a paper gradient, never blur.
- Chat: cited answers only, hard cap 15/run; what-ifs re-run the engine.
- Motion: 200–250 ms, `cubic-bezier(.4,0,.2,1)`, no spring/scale-in. Landing loop: production = captioned mp4/webm, muted/loop/playsinline, reduced-motion → poster.
- Breakpoints: ≥1280 desktop · 768–1279 tablet (chat rail → right overlay panel) · ≤767 mobile (sticky unlock bar, bottom sheets). Touch targets ≥44 px.
- FI/EN swap in place: strings + number formats flip, Finnish source quotes never translate, scroll kept.

## State management

Server-owned: Analysis (status machine `queued|running|done|refused|withdrawn|failed`), report versions, credits ledger (append-only), watch, tracking, checklist, pinned offer, partner org — schemas in `R-SERIES-HANDOFF.md` §4. Client: UI language, policy draft (until saved), onboarding-seen (localStorage for guests), chat draft.

## Design tokens

Copy verbatim from `_ds/resimator-design-system-49c94fcd-9278-450e-9b10-e68a6d818c8c/tokens/` (included: colors, typography, spacing, elevation, fonts incl. real Satoshi woff2). Key values: paper `#F6F3EE`, white sheets, hairline `#DFE1E7`, Deep Midnight `#14222D`, Steel Blue `#427AA1` (interaction + evidence), Neon Lime `#E7FE4D` (one primary action per screen), Seafoam/Amber/Coral (verdicts only). Space Grotesk 500 = headings + data values (Google Fonts); Satoshi = everything else; `tabular-nums` on all numerals. Radii: cards 20, tiles 14, inputs 12, buttons pill. € formatting per §7 of the spec (fi-FI both locales, NBSP thousands, minus U+2212).

## Assets

- `assets/logo/` — official logomark/lockup SVGs (referenced by boards via the DS `Logo` component).
- `assets/patterns/` — "Knot of Connection" brand pattern SVGs.
- `_ds/…/assets/fonts/` — Satoshi woff2 binaries; `_ds/…/_ds_bundle.js` + `styles.css` — the component bundle the boards load (reference only, not production code).
- Landing imagery uses `image-slot.js` placeholders — production images to be supplied.

## Files

- `README.md` — this file (orientation)
- `R-SERIES-HANDOFF.md` — **canonical spec**: scope, routes, data model, API contracts, product rules, i18n, breakpoints, emails/OG, print, a11y, acceptance checklist, build order
- `CLAUDE-CODE-HANDOFF-REPORT.md` — superseded recent-changes log (extra per-contract detail)
- `CLAUDE.md` — Claude Code agent instructions (drop at repo root)
- `AGENTS.md` — Kimi Code agent instructions (identical rules; rename to `KIMI.md` if that's your configured agent file)
- Six `.dc.html` design boards + `support.js`, `image-slot.js`, `_ds/`, `assets/` (needed to open the boards)

## Running in a coding agent

Drop this folder into the repo (e.g. `design/`), keep `CLAUDE.md` / `AGENTS.md` content at repo root. Both agents must: (a) read `R-SERIES-HANDOFF.md` fully first, (b) treat board annotations as requirements, (c) run the acceptance checklist (§12) per feature, (d) never do client-side financial arithmetic (rule §6.2).
