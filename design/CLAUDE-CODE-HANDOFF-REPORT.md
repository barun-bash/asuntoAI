# Claude Code handoff — Resimator Report (€79 paste-a-link product)

> **Superseded:** the full, canonical R-series spec now lives in `R-SERIES-HANDOFF.md` (covers Claude Code AND Kimi Code). This file remains as the recent-changes log only.

**Standalone project.** This is NOT the SaaS platform (J/M/P boards, `CLAUDE-CODE-HANDOFF.md`) and must not share its codebase, nav, or auth. New repo suggestion: `resimator-report`. Scope of this handoff = the recent design pass only: the five R-boards, their deferred + tablet frames, and the marketing landing page.

## Design sources of truth
| File | What it specifies |
| --- | --- |
| `Resimator R1 Paste and Verdict.dc.html` | Landing (product), analysis progress, free verdict + seam, errors/refusal, FI pass, first-run onboarding (R15: example chip + 3 anchored tips). Frames R1-1…R1-16, R15-* |
| `Resimator R2 Policy and Purchase.dc.html` | Policy (14 tests, live re-verdict), purchase/packs, payment states. R5-1…R5-5, R6-1…R6-10 |
| `Resimator R3 Full Report and Chat.dc.html` | Full report document §1–§7, chat, A4 PDF (P1–P3 + P4 bank summary), price/rent history (R7-9/10), agent checklist (R7-11), tablet chat pattern. R7-1…R7-11, P1–P4 |
| `Resimator R4 Public Emails Account.dc.html` | Public page, OG card variants (R8-5 mapping: verdict / price-drop / passes-policy / refused / private-generic+noindex), 6 emails, My reports, watch, refunds (R11), tracking (R12), compare (R13), notification settings (R14), account deletion & GDPR export (R16), partner API (R17), sign-in. R8-* … R17-* |
| `Resimator R5 Components and Handoff.dc.html` | Component inventory C1–C12 + system rules (read FIRST) |
| `Resimator Report Landing.dc.html` | Marketing landing, route `/raportti` · `/report` |

Per-frame implementation notes sit in dashed annotation cards next to each frame; per-flow data contracts in the "Handoff notes" card at the end of each board section.

## Recent changes covered here
1. 13 formerly-deferred frames rendered (states: submitting, fetch-fail mobile, EN⇄FI, returning-user, Conservative fail, paying, invoice fallback, mobile success/declined, report mobile, chat exhausted, listing-changed, FI report body; plus chat share preview, EN receipt, watch-edit, link-sent).
2. Tablet 768 breakpoint frames on every screen board: R1-16 verdict · R5-5 policy · R6-10 unlock · R7-7/R7-8 report + chat panel · R10-7 my reports. Each board's handoff card now carries a `Breakpoints` line — treat those as the responsive spec.
3. Marketing landing page (new file above).
4. Finnish pass rows for every new frame (R1-FI, R2-FI, R3-FI, R4-FI, landing FI hero + string map).
5. Refund & support flow — R4 `#r11` (entry menu, refund sheet, confirmation, mobile sheet) + email R9-5.
6. Landing v2 — pain-led hero (rounded 58 000 € pain figure + pain chips) and how-it-works revamped into a 12 s three-beat product loop (CSS storyboard on the board; production = captioned mp4/webm with reduced-motion poster).
7. Landing: mobile 390 frame + "maths on one bad buy" miss-cost section (#cost) — slider × engine-published stats, 736× canonical ratio, honesty footer — and FAQ section (#faq, six questions, accordion + FAQPage JSON-LD).
8. Landing: DIY-vs-report comparison ledger (#diy, concedes the viewing), live sample-report embed (#sample — production: lazy iframe of the real public page), and a COMPLETE FI localization table covering every landing string.

## Stack & tokens
- Any React meta-framework; SSR required for `/r/:slug` (public SEO page serves free-tier data in HTML).
- Copy DS tokens verbatim from `_ds/resimator-design-system-49c94fcd-9278-450e-9b10-e68a6d818c8c/tokens/` (colors, fonts incl. Satoshi woff2, typography, spacing, elevation). Space Grotesk via Google Fonts. No new colors: verdict hues (Seafoam/Amber/Coral washes), Steel Blue interaction/evidence, Neon Lime one primary per screen (exception: lime-on-Midnight featured pack card), paper `#F6F3EE`.
- Numbers: engine computes everything; UI formats only. fi-FI € both locales (`118 000 €`), decimals `.`/`,` by UI language, minus U+2212, `font-variant-numeric: tabular-nums` on all numerals. Dates FI-style both languages.

## Routes
```
/                      landing (product paste bar)  [R1-1/2/3]
/raportti, /report     marketing landing            [Landing]
/analysing/:id         SSE progress                 [R1-4/5]
/r/:slug               verdict → full report (same URL; unlock in place) [R1-6…, R7-*]
/r/:slug/pdf           A4, 3 pages                  [P1–P3]
/unlock                packs + payment              [R6-*]
/reports               my reports drawer            [R10-*]
/signin                magic link                   [R10-2/6]
```

## Core contracts (details on the boards)
- `Analysis` status: `queued|running|done|refused|withdrawn|failed` — refusal is a first-class verdict (R1-11), never an error toast. No charge before a verdict exists.
- Locked flags arrive **server-redacted**: `{severity, costRange, locked:true}` only. The paywall veil is a paper gradient, never blur.
- Policy re-runs are client-side over engine-published actuals (<100 ms); threshold edit → preset becomes `custom` + Reset link.
- Checkout: payment intent carries `reportId`; webhook mints account + credits + unlock atomically. Declines map to plain-language copy; 3rd decline offers invoice (R6-7).
- Refunds: `POST /reports/:id/refund {reason, note?, target: credit|card}` — credit returns synchronously (append-only ledger `{delta:+1, reason:"refund", reportId}`), report stays unlocked, same listing re-lockable after 30 days; card target → human review ≤ 1 business day → Stripe refund. One refund per report. Support = prefilled mailto with report №, no ticket UI (R11).
- Chat: `POST /r/:id/chat` → `{answer, citations[{section,anchor}], turnsLeft}`; hard cap 15/run, what-ifs re-run the engine, uncited answers are a bug.
- Price & rent history: `GET /r/:id/price-history` → `{series[{year, medianSqm, n}], dealSqm}` and `GET /r/:id/rent-history` → `{series[{year, medianRent, n}], tenancyRent}` — annual medians (nominal, stated); panels expand from the header €/m² stat and §4's lettings line, export as PDF appendices A + B on one sheet (R7-9/R7-10). Charts = DS LineAndBarChart, misty bars / steel deal-line.
- Offer calculator: `POST /r/:id/offer {price}` → full recomputed metric + test set (same engine as the verdict — no client arithmetic); slider steps 500 €, re-run on release; flips shown as FAIL→PASS / STAYS FAIL with price-independent tests named; pinned offer `{offerPrice, pinnedAt}` renders in §1 + PDF + checklist header; locked at asking on unpaid summaries (R5-6).
- Tracking: `GET /reports/:id/tracking` → `{listingStatus, checkedAt, priceAtRead, priceNow, domAtRead, domNow, versions[{v, at, fails, trigger}], events[], checklistProgress, pinnedOffer}` — auto-on at unlock, daily check while listing live + 30 days, append-only timeline, versions frozen (v1 stays downloadable); emails reuse R9-3/R9-6 rules. NOT the platform portfolio — never models ownership (R12).
- Compare: `GET /reports/compare?ids=a,b,c` (2–4) → each report's engine metrics frozen at its own version; per-column staleness stated with inline free re-run; "best in row" marks facts only, never the verdict row; summary-only columns carry free-tier rows + lock markers; mobile = sticky label column + horizontal snap (R13).
- Notifications: `GET/PATCH /account/notifications {tracking:{on,digest}, watch:{on,digest}, analysisDone, productNews}` — autosave toggles; List-Unsubscribe flips exactly its category (never whole-account); transactional mail (receipt/refund/sign-in) has no toggle; digest default daily 08.00, instant capped 3/day; per-object mutes live on R12/R10-5 (R14).
- Onboarding: first visit shows an example-listing chip under the paste bar (runs a real analysis); the first OWNED verdict gets 3 anchored, non-modal tips (provenance chip → citation block → policy pills) with 45 % dim + steel halo; Esc/Skip ends all; `{onboardingSeen}` on account, localStorage for guests; never on share-link /r/ pages (R15). Note: the original brief scoped tours out — this is the sanctioned minimal replacement.
- Account & data: `POST /account/export` → job → emailed zip link (48 h): report PDFs all versions, per-analysis engine JSON, chat transcripts, policy.json, ledger.csv, watches.json. `DELETE /account` via single-use emailed token (15 min): refund unused credits at per-credit price paid → purge → anonymise receipts (kirjanpitolaki, 6 y) → unlist owned public analyses. Destructive Button is the product's only coral button (R16).
- Bank summary: `GET /r/:id/bank-summary.pdf?lang=fi|en` — one A4: purchase → loan (re-derived from current version: debt-free + transfer tax − equity) → monthly serviceability at base AND stress rate with P10 rent stated as deliberate → known liabilities disclosed (renovation, ground-lease reset). Not a loan offer — disclaimer fixed (P4).
- Partner API: `POST /v1/analyses {url, webhook?}` → 202 job; `GET /v1/analyses/:id` → full JSON with per-figure `provenance` and per-flag Finnish `quote` — the payload carries the honesty. Bearer keys (shown once, 24 h rotate overlap), HMAC webhooks, 60 req/min, prepaid pooled reports volume-tiered, refusals never billed, sandbox key replays the canonical fixture (R17). Docs EN-only; consumer surfaces unchanged.
- Breakpoints: ≥1280 / 768–1279 / ≤767 as per each board's `Breakpoints` line. Chat: dock ≥1280, rail→right overlay panel at 768 (R7-8), bottom sheet ≤767.
- Agent checklist: `GET /r/:id/agent-checklist` → `items[{question, questionFi, basis:{flagId|gap}, answersWith, checked}]` — engine rules emit one item per flag and per missing-document gap (LLM phrases, never invents items); checkbox state persists per report; prints as PDF appendix C; "Copy all" → plain text with address header (R7-11).

## Acceptance checklist
- [ ] Every number renders with a provenance chip (C1) adjacent; every extracted claim shows its Finnish quote (C2) directly beneath.
- [ ] Free summary is fully crawlable HTML on `/r/:slug`; locked payloads never reach the client.
- [ ] Verdict states pass/caution/fail are wash+border+label — never color alone (grayscale print survives).
- [ ] FI/EN swap in place: strings + number formats flip, quotes stay Finnish, scroll kept (R1-14, C12).
- [ ] Touch targets ≥44 px; progress list and verdict banner use aria-live as annotated.
- [ ] PDF: A4, 17 mm margins, running header from p2, footer = public URL + page x/y.
- [ ] Emails: 600 px tables, system font body, lime button as padded `<a>`, data as HTML text (R9-1…6: receipt FI/EN, report ready, listing changed, watch match, refund).
- [ ] Refund returns the credit instantly, never revokes an open report, and states the human-review SLA on the money path (R11).
