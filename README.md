# asuntoAI — Resimator Report frontend

Standalone frontend for the **Resimator Report** product (€79 paste-a-link apartment risk report):
paste an Oikotie/Etuovi listing URL → ~60 s streamed analysis → free summary verdict with an honest
paywall seam → full report as a living document. FI-primary with EN parity.

- Stack: Next.js (App Router) + TypeScript + Tailwind CSS v4 + Untitled UI React.
- Canonical build spec: [`design/R-SERIES-HANDOFF.md`](design/R-SERIES-HANDOFF.md) — read it fully before any task.
- Design boards (visual spec, match by `data-screen-label`): `design/*.dc.html` — open in a browser with the folder structure intact.
- Design tokens: copied verbatim from `design/_ds/…/tokens/`; never invent colors or copy.

## Branching

- `main` — protected; never commit directly.
- `frontend-web` — all frontend work lands here and merges via PR.

## Non-negotiable product rules (spec §6)

1. Every number carries a provenance chip; every extracted claim shows its Finnish source quote.
2. Engine computes, UI formats — no client-side financial arithmetic.
3. Refusal is a verdict, never an error; nothing is charged before a verdict exists.
4. Locked data never reaches the client; the paywall veil is a paper gradient, not blur.
5. Underwriting at P10 rent, stated wherever rent appears.
6. Verdict colours are wash + border + label — legible in grayscale.
7. Fairness rules are product features (free re-runs, instant credit refunds, unbilled refusals).
