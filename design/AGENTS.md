# Kimi Code — Resimator Report

(Identical rules to `CLAUDE.md`; if your agent is configured to read `KIMI.md`, copy this file there.)

Read `R-SERIES-HANDOFF.md` fully before any task. The `.dc.html` boards in this handoff folder are the visual spec: match implementation screens to frames by `data-screen-label`. Never invent colors or copy — lift exact values and strings (EN + FI) from the boards.

Rules that gate every PR:
- Sections 6 (product rules) and 12 (acceptance checklist) of `R-SERIES-HANDOFF.md` apply to every feature.
- No client-side financial arithmetic — the engine computes, the UI formats (§6.2).
- Every number carries a provenance chip; every extracted claim shows its Finnish source quote.
- Refusal is a verdict, never an error. Nothing is charged before a verdict exists.
- Locked data never reaches the client; the paywall veil is a paper gradient, not blur.
- Verify each screen against its frame at 1440 / 768 / 390. Touch targets ≥44 px.
- FI primary, EN parity; € always fi-FI format (`118 000 €`, NBSP thousands, U+2212 minus).
- Design tokens come verbatim from `_ds/…/tokens/`; verdict colours are wash + border + label (grayscale-safe).
- Sentence case, contractions, "you/we", no emoji, no hype.

Build order: `R-SERIES-HANDOFF.md` §13. Do not share code with the Resimator SaaS platform.
