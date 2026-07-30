# Resimator Report — R-series engineering handoff
**Canonical build spec for the €79 paste-a-link apartment risk report.** Agent-agnostic: works as the driving document for Claude Code, Kimi Code, or a human team. v2 · 29.07.2026.

---

## 0 · Scope

Standalone product and repo (`resimator-report`). It is NOT the Resimator SaaS platform (J/M/P boards, `Resimator Platform.dc.html`, `CLAUDE-CODE-HANDOFF.md`) — no shared codebase, nav, auth, or portfolio concepts. The product: paste an Oikotie/Etuovi listing URL → ~60 s streamed analysis → free summary with an honest paywall seam → 79 € full report (packs 199 €/349 €) → living document (re-runs, tracking, chat, print artifacts) → partner JSON API.

## 1 · Design sources of truth (in this project)

| File | Contents | Frames |
| --- | --- | --- |
| `Resimator R5 Components and Handoff.dc.html` | **Read FIRST.** Component inventory C1–C13 + system rules (colour, register, coverage) | C1–C13 |
| `Resimator R1 Paste and Verdict.dc.html` | Landing, streamed analysis, free verdict + seam, errors/refusal/withdrawn, FI pass, onboarding | R1-1…16, R15-* |
| `Resimator R2 Policy and Purchase.dc.html` | 14-test policy w/ live re-verdict, offer calculator, packs & payment states, invoice fallback | R5-1…6, R6-1…10 |
| `Resimator R3 Full Report and Chat.dc.html` | Report document §1–§7, chat, price/rent history, agent checklist, tablet chat, print P1–P4 | R7-1…11, P1–P4 |
| `Resimator R4 Public Emails Account.dc.html` | Public page, OG variants, 6 emails, My reports, watch, refunds, tracking, compare, notifications, deletion/export, partner API | R8-* … R17-* |
| `Resimator Report Landing.dc.html` | Marketing landing `/raportti` · `/report`: pain-led hero + pain chips, 12 s how-it-works loop (production: captioned mp4/webm, muted/loop/playsinline, poster = verdict beat, reduced-motion → poster), FI hero | 1 page |

Conventions on the boards: dashed cards = implementation annotations (routes, a11y, FI strings, contracts); "Handoff notes" card ends each section; `data-screen-label` names every frame; flow-lines describe the state machine per section.

## 2 · Design system

- Copy tokens verbatim from `_ds/resimator-design-system-49c94fcd-9278-450e-9b10-e68a6d818c8c/tokens/` (colors, fonts incl. Satoshi woff2, typography, spacing, elevation). Space Grotesk from Google Fonts. Components referenced: Button (incl. `fullWidth`, `destructive`), ButtonUtility, ButtonCloseX, InputField, Slider (`showLabel`, `formatValue`), Toggle (`pressed`), Logo, Icon (55 glyphs — names in `components/icons/Icon.d.ts`; there is NO lock/search/link/share/gift glyph: lock is an inlined Lucide path, see C13 usage), LineAndBarChart (`data[{label,value,line}]`).
- **Colour discipline**: paper `#F6F3EE`, white sheets, hairline `#DFE1E7`. Steel Blue `#427AA1` = interaction + evidence. Seafoam/Amber/Coral = verdicts only (washes + deep text). Neon Lime `#E7FE4D` = one primary action per screen (exception: lime-on-Midnight featured pack). Midnight fills: OG cards, recommended pack, FI pill, user chat bubble, timeline/check discs, docs code blocks — never page backgrounds.
- **Type**: Space Grotesk 500 = headings + data values; Satoshi = everything else; `ui-monospace` only for code literals (R17). All numerals `font-variant-numeric: tabular-nums`.
- **Register**: every surface is a numbered, dated, sourced document (№, engine v2.3, read-at). No dashboards/sidebars. Sentence case, contractions, "you/we", no emoji, no hype.

## 3 · Routes

```
/                      product landing (paste bar)            R1-1/2/3, R15-1
/raportti · /report    marketing landing (FI default · EN)    Landing
/analysing/:id         SSE progress                           R1-4/5
/r/:slug               verdict → full report (unlock in place; public = free tier)  R1-6…16, R7-*, R8-1/3
/r/:slug/pdf           A4 print, 3 pages + appendices A/B/C   P1–P3, R7-9/10/11
/r/:id/bank-summary.pdf?lang=fi|en                            P4
/unlock                packs + payment                        R6-*
/reports               drawer · compare · tracking entries    R10-*, R12, R13
/reports/compare?ids=  compare table (2–4)                    R13
/signin                magic link                             R10-2/6
/account/notifications                                        R14
/account/data          export + deletion                      R16
partner: docs.resimator.fi + console                          R17
```

## 4 · Data model (server-owned)

- **Analysis** `{id, slug, status: queued|running|done|refused|withdrawn|failed, steps[], listing{…, oikotieId, fetchedAt}, verdict{grossYield, realYield, liability{total, window, items[]}, grades, flags[{severity, title?, quotes[]?, locked, costRange}]}, engine:"v2.3"}` — locked flags are **server-redacted** (`{severity, costRange, locked:true}` only).
- **Report versions**: re-run appends v2… (frozen, downloadable); chat count resets per run; re-runs free ≤30 days of unlock or on listing change.
- **Policy** `{preset: conservative|balanced|yield|custom, tests[14]{key,label,labelFi,op,threshold,unit}}` — verdict re-runs client-side over engine-published actuals; failing tests emit `{failsBy, fixablePrice?, fixableRent?, fixable:false→reason:"building"}`.
- **Credits ledger** — append-only `{delta, reason: purchase|spend|refund, reportId?, packId?, ts}`; credits never expire; first full unlock free per account.
- **Watch** `{district, type, maxPrice, policyFilter}` — matches auto-run the free tier only.
- **Tracking** — auto-on at unlock; `{listingStatus, price/dom at read vs now, versions[], events[], checklistProgress, pinnedOffer}`; live +30 days.
- **Agent checklist** — engine emits one item per flag + per missing-document gap; LLM phrases only; `checked` persists.
- **Pinned offer** `{offerPrice, pinnedAt}` — renders in §1, PDF, checklist header.
- **Partner org** `{agreementNo, keys[live|sandbox], webhook{url, secret}, pool, tierPrice}`.

## 5 · API contracts

Consumer: `POST /analyses` · SSE `/analysing/:id` · `GET /r/:slug` · `POST /checkout {packId,email,reportId}` (Stripe; webhook mints account+credits+unlock atomically; 3 declines → invoice fallback) · `POST /r/:id/chat {q}` → `{answer, citations[{section,anchor}], turnsLeft}` (cap 15/run; what-ifs re-run the engine) · `GET /r/:id/price-history` · `/rent-history` · `/agent-checklist` · `POST /r/:id/offer {price}` (full engine recompute; slider 500 € steps) · `POST /reports/:id/refund {reason, note?, target: credit|card}` (credit = synchronous restore; card = human ≤1 business day; report stays unlocked; 30-day re-lock guard; one refund/report) · `GET /reports/:id/tracking` · `GET /reports/compare?ids=` · `GET/PATCH /account/notifications` · `POST /account/export` (zip: PDFs all versions, per-analysis JSON, chat, policy, ledger, watches; 48 h link) · `DELETE /account` (emailed 15-min token → refund unused credits → purge → anonymise receipts 6 y kirjanpitolaki → unlist public analyses).
Partner (R17): `POST /v1/analyses {url, webhook?}` → 202; `GET /v1/analyses/:id` → JSON with per-figure `provenance` and per-flag Finnish `quote`; Bearer keys shown once (24 h rotate overlap); HMAC webhooks, 5× retries; 60 req/min (429 + Retry-After); prepaid pool, volume tiers; refusals never billed; sandbox replays the canonical fixture.

## 6 · Non-negotiable product rules

1. **Provenance everywhere**: every number carries OBSERVED / MAPPED / MODELLED / ESTIMATED (FI: HAVAITTU / YHDISTETTY / MALLINNETTU / ARVIOITU); every extracted claim shows its Finnish source sentence directly beneath (C2) — translated only when UI ≠ FI; quotes never translate away.
2. **Engine computes, LLM phrases**: UI performs no financial arithmetic; prose never originates a figure.
3. **Refusal is a verdict** (`status:"refused"`), never an error; nothing charged before a verdict exists; refusals/withdrawn state what WAS read.
4. **Honest seam**: locked data never reaches the client; veil is paper gradient, not blur; severity + cost ranges stay visible.
5. **Underwriting at P10** rent, stated wherever rent appears; user-supplied figures shown dashed, never used.
6. **Verdict colours** (pass/caution/fail) are wash + border + label — legible in grayscale print.
7. **Fairness rules are product features**: free re-runs on change/≤30 d, refunds return credit instantly, refused runs free — retail and partner alike.

## 7 · i18n & formatting (C12)

FI primary, EN parity; swap in place (no reload, scroll kept, `?lang=`). € always fi-FI (`118 000 €`, symbol after, NBSP thousands); decimals `.` EN / `,` FI; `−` U+2212; `−2.8 pp` / `−2,8 %-yks.`; dates `28.07.2026 13:41` / `28.7.2026 13.41`; `€/mo` / `€/kk`. Long FI compounds: `overflow-wrap:anywhere` on meta/body only, never headings. FI strings for every frame live in the boards' FI rows/annotations.

## 8 · Breakpoints

≥1280 desktop compositions · 768–1279 tablet (704 px content; chat = bottom rail → right overlay panel R7-7/8; policy margin folds to sublines R5-5; compare sticky-label + snap R13-2; dialogs center R11-5) · ≤767 mobile (sticky unlock bar, §-rail + chat sheet R7-3, packs stack, bottom sheets). Per-board `Breakpoints` lines are authoritative. Touch targets ≥44 px.

## 9 · Emails & OG

Six emails (R9-1…6: receipt FI + EN par, report ready, listing changed, watch match, refund) — 600 px tables, system-font body, lime button as padded `<a>`, List-Unsubscribe flips exactly its category (R14). OG cards per state (R8-2/R8-5): verdict, price-drop, passes-policy, refused (grey, never red), private-generic + noindex for receipt/refund/sign-in routes.

## 10 · Print

`/r/:slug/pdf`: A4, 17 mm margins, running header p2+, footer = public URL + page x/y; appendices A (price), B (rent) on one sheet, C (checklist, real checkboxes) last. P4 bank summary is its own one-pager (purchase → loan → base+stress serviceability → liabilities disclosed; fixed "not a loan offer" disclaimer).

## 11 · A11y

Progress list aria-live=polite (per-step announcements incl. flags); verdict banner aria-live=assertive on policy re-run; h1 focus on route arrival; preset pills = radiogroup; refund/deletion sheets = focus-trapped dialogs, Esc closes; locked rows carry descriptive aria-labels; dots/severity always paired with text; chips have title tooltips.

## 12 · Acceptance checklist

- [ ] Free summary crawlable HTML on `/r/:slug`; locked payloads absent from every response
- [ ] Every number has an adjacent provenance chip; every claim its quote block
- [ ] Policy edit re-runs <100 ms client-side; preset → Custom + Reset on edit
- [ ] Purchase: atomic mint; declined → inline, 3rd → invoice; first-free honored once
- [ ] Chat: cited answers only; cap enforced + visible; what-ifs hit the engine
- [ ] Refund: instant credit restore, report stays open, SLA stated on card path
- [ ] Tracking/watch/compare/notifications per contracts above; one-email-a-day honored
- [ ] Deletion: token flow, refund-first, receipts anonymised, export offered
- [ ] Partner API: provenance + quotes in payload; refusals unbilled; sandbox deterministic
- [ ] FI/EN swap in place with C12 formats; print artifacts P1–P4 match boards; grayscale-safe verdicts
- [ ] Onboarding: 3 anchored tips, once, skippable, never on shared pages

## 13 · Suggested build order

1. Engine-facing read path: `/` → analyse → SSE → free verdict (R1) with provenance/citation primitives (C1–C3) — these two components de-risk everything.
2. Policy + tests (R5-*) client re-run · 3. Checkout + credits (R6) · 4. Full report §1–§7 + chat (R7) · 5. Print P1–P4 · 6. Public page + OG + emails (R8/R9) · 7. Account: drawer, watch, notifications, refunds, deletion (R10/R11/R14/R16) · 8. Tracking, compare, history panels, checklist, offer calculator (R12/R13/R7-9…11/R5-6) · 9. Onboarding + marketing landing · 10. Partner API (R17).

## 14 · Running this handoff in a coding agent

**Claude Code** — drop this file at repo root and add to `CLAUDE.md`:
```
Read R-SERIES-HANDOFF.md fully before any task. The .dc.html boards in the design
project are the visual spec: match frames by data-screen-label. Never invent
colors/copy — lift from boards. Verify each screen against its frame at 1440/768/390.
Sections 6 (product rules) and 12 (acceptance) gate every PR.
```
**Kimi Code** — same file is the spec; add the identical instruction block to `AGENTS.md` (or `KIMI.md` if that's the configured agent file). No agent-specific content differs: both agents must (a) read this doc first, (b) treat board annotations as requirements, (c) run the acceptance checklist per feature, (d) never bypass rule §6.2 (no client-side financial arithmetic).

*Predecessor doc `CLAUDE-CODE-HANDOFF-REPORT.md` (recent-changes scope) is superseded by this file.*
