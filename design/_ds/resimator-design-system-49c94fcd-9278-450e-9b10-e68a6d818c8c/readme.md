# Resimator design system

Resimator is a boutique technology consultancy. Founded in 2018 in Turku, Finland, it started
as a property-management product and has grown into a global consultancy with teams in **Finland
and Nepal**, delivering product strategy, design, custom software, DevOps and applied-AI work to
scale-ups in real estate, media and events, hospitality and retail.

The brand's promise is one word: **Beyond**. Beyond the role, beyond the build, beyond delivery.
Everything in this system is built to sound and look like a partner who is embedded in your team,
not a vendor who invoices you.

## Sources this was built from

| Source | What came from it |
| --- | --- |
| `Resimator - Branding.fig` (attached Figma file) | Colour system with published tints, type scales, logo construction and rules, the "Knot of Connection" pattern, imagery direction, brand voice, and the 1440px Web-Design page that the UI kit recreates |
| [github.com/Resimator-Ltd/resimator-website-v2](https://github.com/Resimator-Ltd/resimator-website-v2) (private) | Real Satoshi `.woff2` binaries, the production Tailwind palette, component implementations (button, navbar, footer, accordion, forms), brand pattern SVGs, and the shipped page copy |

Explore that repository directly if you have access — `next/tailwind.config.ts`,
`next/components/elements/`, `next/components/navbar/` and `next/components/dynamic-zone/`
are where the live implementation lives, and reading them will make anything you build here
more faithful. See `github.md` for the sync record.

> The Figma file also contains pages for **Numu** (a separate POS product brand: drafts, a brand
> guideline and stationery). Those are a different identity and are deliberately **not** part of
> this design system.

---

## Index

| Path | What's in it |
| --- | --- |
| `styles.css` | The single entry point consumers link. Nothing but `@import`s. |
| `tokens/` | `fonts.css` (@font-face), `colors.css`, `typography.css`, `spacing.css`, `elevation.css`, plus `fig-tokens.css` / `fig-typography.css` generated from the Figma Variables |
| `components/` | 81 React primitives in nine groups — see the Components index below |
| `ui_kits/website/` | Click-through recreation of the Resimator marketing site (5 screens) |
| `templates/marketing-page/` | A starting page consumers can copy and fill in |
| `guidelines/` | 19 foundation specimen cards (colour, type, spacing, elevation, brand) |
| `assets/` | `logo/`, `fonts/`, `patterns/`, `imagery/`, `icons/` |
| `SKILL.md` | Agent Skills front-matter so this folder works in Claude Code |
| `github.md` | Source-repo association and sync record |

---

## CONTENT FUNDAMENTALS

Resimator's own brandbook states the voice in three words: **approachable, purposeful,
collaborative**. Underneath that sit four adjectives: *smart* (clear thinking, explained simply),
*confident* (direct, without arrogance), *strategic* (grounded in intent), *innovative*.

### The rules, verbatim from the brandbook

- **Sentence case for all headlines and buttons.** Not Title Case. `Start a project`, not `Start A Project`.
- **Use contractions** — we're, it's, you'll, don't.
- **Prefer active voice, not passive.**
- **Short sentences and short paragraphs.**
- **Use "you" and "we".** Inclusive *we* — it signals we're on the same team.
- **Avoid jargon, hype and empty buzzwords.**
- **Avoid capitalisation of words** for emphasis.
- Talk as a true extension of the client, not a supplier.

### Their own before/after examples

| Don't | Do |
| --- | --- |
| "We create SOLUTIONS to accelerate GROWTH." | "We build tech that works. And keeps working." |
| "You don't need to hire a dedicated technical team to fulfill your vision." | "We'll take care of the tech, saving you time and money." |
| "We deliver scalable, cloud-native architecture solutions to maximize stakeholder alignment." | "We build modular platforms for real estate teams." |

### The house voice in the wild

- Hero: *"Beyond tech. Built for what matters."*
- Hero subhead: *"— Delivering robust and reliable software development services in the Nordics since 2018. Let's bring your vision to life."* (that em dash opener is a real tic — it appears on the live hero)
- Section heading: *"What makes Resimator different?"* — questions are used often, always sentence case.
- Card copy is one sentence: *"We ask the right questions and shape direction."*
- Footer CTA: *"From idea to launch & beyond"* / *"Let's build smarter, together."*

### Practical notes

- **Headings ask or assert; they never sell.** Aim for 4–8 words.
- **Body copy runs one to two sentences.** If a paragraph needs three, it probably needs a card.
- **Numbers are stated plainly** — "3+ Years Partnership", "8+ Years of Industry Knowledge". No decimals, no fake precision.
- **No emoji.** Not in product, not in marketing, not in the brandbook. Anywhere you'd reach for one, use a Lucide-style line icon from `components/icons`.
- **Square brackets are a real markup convention** on this site: text inside `[brackets]` in a
  section heading renders in Steel Blue. `HeaderSection` implements it.
- Legal entity is **Resimator OY**; the consultancy is also written **Resimator OÜ** in older
  testimonials. Contact is `hello@resimator.fi`.

---

## VISUAL FOUNDATIONS

### Colour

Deep Midnight `#14222D` and Neon Lime `#E7FE4D` are the whole identity. The brandbook is explicit
about proportion:

- **Primary (Deep Midnight) ≈ 60%** of a composition.
- **Secondary ≈ 25%** — Slate Grey, Steel Blue, Misty Blue, Seafoam Green, Coral Red, Amber.
- **Neon Lime is a high-impact accent used sparingly** — CTAs, active states, key highlights. Overuse kills it.
- Backgrounds default to **Off White `#F6F3EE`** or **Soft Sky `#EBF2FA`**; Deep Midnight is for immersive, high-contrast bands.
- **Never set body copy in an accent.** "Coral Red or Amber paragraphs are visually tiring."
- Always use the published HEX/CMYK/RGB. Every hue ships **75 / 50 / 25% tints** — use those, don't compute your own.
- Deep Midnight on Soft Sky measures **14.35:1** — the brandbook cites it as the WCAG AAA reference pairing.

The live marketing pages add one surface the brandbook doesn't name: **`#DCECFF`**, a pale blue
field the light pages sit on, with the navbar going **`#F6FBFF`** once you scroll.

> **Palette drift, flagged:** the production Tailwind config uses slightly different hexes for six
> secondary hues (`slate-grey #708090`, `steel-blue #4682B4`, `seafoam-green #66C6BA`,
> `coral-red #EF5F60`, `amber #FFBF00`, `warm-charcoal #2A2A2A`). This system follows the **Figma
> brandbook** values, which are the documented brand. Worth reconciling in code.

### Type

Two families, strictly divided:

- **Space Grotesk** — display and headings. Structure, voice, the wordmark.
- **Satoshi** — body, UI, labels. Everything you actually read. The brandbook permits **Plus Jakarta Sans** as a fallback "due to certain limitations", but says to use Satoshi whenever possible.

Real Satoshi `.woff2` files ship in `assets/fonts/` (lifted from the production repo, so weights
300–900 plus the variable cut are all genuine). Space Grotesk loads from Google Fonts — the
production site loads it the same way via `next/font/google`, so this is not a substitution.

Two scales coexist and both are real:

- The **documentation scale** in `tokens/typography.css` (`--doc-*`) is the brandbook's print scale — Display 60/70, H1 36 Bold at −1%, paragraph 12/1.6 at +2%. Small on purpose.
- The **screen scale** (`--text-*`) is the 1440px web canvas — hero 88/1.1 Medium, section 52/1.25 Bold, card title 24/1.3 Medium, body 18/1.7 Medium, buttons 16 Bold.

Body copy runs **loose** — 1.55 to 1.7 line height everywhere. Headings run tight (1.1–1.3).

### Layout

1440px canvas. Content caps at **1280px** with **140px** side gutters on the Figma canvas (40px in
the shipped responsive build). Sections breathe at **80px** vertical, sometimes 88px on the hero.
Cards sit in a 24px-gap grid. The services grid deliberately offsets its second column by ~96px so
the two stacks stagger.

### Backgrounds and the pattern

The brand pattern is called **"The Knot of Connection"**. It is *constructed from the logomark's
own geometry* — circles, half-circles and angular lines drawn as sets of four parallel strokes that
loop and interlock. The brandbook's rules for it:

- Stay true to the geometry; never introduce unrelated forms.
- Let content lead — the pattern supports the message, never competes.
- Brand palette only, with opacity adjustments for layering.
- Scale with intention: bold and large, or subtle and fine. Avoid awkward mid-scales.
- Maintain balance with white space.

Real pattern SVGs live in `assets/patterns/`. Full-bleed photography is used for case studies and
service cards; otherwise pages are colour fields plus pattern.

### Cards

Two card treatments, both 20px radius:

1. **Frosted** — `rgba(246,243,238,.9)` with `backdrop-filter: blur(4px)`, no border, no shadow. This is the homepage feature card, sitting on the pattern. `.rsm-frosted` implements it.
2. **Solid** — white, 1px `#DFE1E7` hairline, and either `--shadow-sm` or the deep six-stop `--shadow-stack`.

Icon tiles inside cards are **52×52 at 14px radius**, Steel Blue fill, 28px white glyph.

### Shadows

Near-invisible by design. The house shadow is a **1px inset ring plus two micro-lifts**
(`--shadow-chip`, straight out of the Figma badge): `inset 0 0 0 1px #DFE1E7, 0 1px 3px rgba(13,13,18,.05), 0 1px 2px rgba(13,13,18,.04)`.
The only heavy shadow in the system is the navbar once it's scrolled. There is no inner-shadow system
beyond the frosted-glass inset used on `.rsm-glass`.

### Radii

`2 · 4 · 6 · 8 · 10 · 12 · 14 · 16 · 20 · 24 · pill`. In practice: **cards 20**, **icon tiles 14**,
**inputs and menus 12**, **nav items and utility buttons 8**, and **anything clickable that isn't a
utility button is a pill** (`border-radius: 1000px`). Never square a Resimator button.

### Motion

Restrained. The site uses framer-motion but only for fades, height auto-expansion and a 0.4s navbar
resize. Durations are **200–250ms**, easing is **`cubic-bezier(.4,0,.2,1)`**. No bounce, no spring,
no scale-in-on-scroll. Two named keyframes exist in the production config: a 5s linear `move` and a
3s `spin-circle`, both decorative.

### Interaction states

- **Hover, primary button:** background lightens to `--accent-hover`; the trailing dot inverts (Deep Midnight circle, lime glyph).
- **Hover, nav item:** background fills with Neon Lime — the same treatment as the active state, one step lighter.
- **Hover, cards:** 4px lift plus a step up in shadow. No colour change.
- **Hover, links:** Steel Blue → underline. Links never turn lime.
- **Press:** colour only. Nothing in this brand shrinks on press.
- **Focus:** 3px `rgba(66,122,161,.35)` ring plus a Steel Blue border — `--ring-focus`.
- **Disabled:** Misty Blue 25% fill, Misty Blue label, `not-allowed`.

### Transparency and blur

Used in exactly three places: the frosted feature card (`.9` + 4px blur), the sticky navbar
(`.92` + 8px blur), and `.rsm-glass` (the production `.glass-card`, 1px blur + inset highlight).
Everywhere else, surfaces are opaque.

### Imagery

Real people at real desks — team photography, client environments, product screens on real hardware.
Natural light, a cool-neutral grade, no heavy filters, no grain, no stock gloss. Warm skin tones read
naturally against the cool Soft Sky fields. Images are cropped to `554:312` in the services grid and
`450:550` / `326:386` / `320:340` in blog and case grids.

---

## ICONOGRAPHY

- **The system icon set is [Lucide](https://lucide.dev).** The production site imports
  `lucide-react` and its `DynamicIcon`, and CMS-driven blocks store Lucide icon names as strings.
  Line icons, 1.5–2px stroke, 24px grid, `currentColor`.
- **55 of those glyphs are extracted verbatim from the brand file** into
  `components/icons/icon-data.js` and exposed through `<Icon name="…" />`. Read
  `components/icons/Icon.d.ts` for the full name list. This is the set the designs actually use:
  arrows, checks, chevrons, plus/minus, alert/info/help circles, mail/phone/message, users, eye,
  copy, layers, cube, container, dataflow, bezier-curve, code-square, chart-breakout, coins-hand,
  magic-wand, zap, and seven bespoke `AIIcon*` marks.
- **For anything not in that set, pull the matching glyph from Lucide** — same family, no visual seam.
- **Social marks are copied SVGs, not redraws.** `assets/icons/social-linkedin.svg`,
  `social-twitter-x.svg`, `social-facebook.svg` come straight out of the Figma file. LinkedIn is the
  only channel the shipped footer actually links.
- **No emoji, ever.** No unicode characters used as icons either — the one typographic tic is the
  em dash that opens the hero subhead.
- **Icons are almost always paired with a tile** (`FeaturedIcon`) or wrapped in the inverted dot
  inside a button. A naked icon appears only in utility buttons and inline links.

---

## Components

81 primitives, grouped by concern. Each directory has `<Name>.jsx`, `<Name>.d.ts`,
`<Name>.prompt.md`, and one `@dsCard` HTML preview.

**`components/actions/`** — `Button`, `ButtonInverted`, `ButtonUtility`, `ButtonCloseX`, `ButtonLoadingIcon`

**`components/forms/`** — `InputField`, `TextInput`, `Select`, `Checkbox`, `RadioButton`, `Toggle`, `Slider`, `FileUpload`, `Recaptcha`, `RecaptchaV2Checkbox`

**`components/data-display/`** — `Badge`, `BadgeGroup`, `Tag`, `Avatar`, `AvatarLabelGroup`, `VerifiedTick`, `Dot`

**`components/feedback/`** — `Alert`, `Tooltip`, `HelpIcon`, `Spinner`, `ProgressSteps`, `ActivityGauge`

**`components/navigation/`** — `HorizontalTabs`, `Dropdown`, `PaginationDotGroup`, `FAQ`, `ProcessSteps`

**`components/graphics/`** — `FeaturedIcon`, `FeaturedIconOutline`, `SocialIcon`, `CheckIcon`, `Cursor`, `FileTypeIcon`, `BackgroundPattern`, `BackgroundPatternDecorative`, `LinePattern`, `HandDrawnArrow`, `PaymentMethodIcon`, `USUnitedStates`

**`components/marketing/`** — `HeaderSection`, `Features`, `CheckItemText`, `PricingTierCard`, `PricingPageHeader`, `PricingTableCell`

**`components/charts/`** — `LineAndBarChart`, `Legend`

**`components/brand/`** — `Logo`

**`components/icons/`** — `Icon` (55 glyphs)

**`components/internals/`** — the base parts the Figma file defines as separate components: `CheckboxBase`, `ToggleBase`, `ControlHandle`, `FileUploadBase`, `TagCheckbox`, `TagCloseX`, `TagCount`, `BadgeCloseX`, `SelectMenuItem`, `DropdownListItem`, `DropdownListHeader`, `DropdownHeaderNavigationButton`, `NavigationActions`, `TabButtonBase`, `StepBase`, `StepIconBase`, `AvatarOnlineIndicator`, `AvatarCompanyIcon`, `PaginationDotIndicator`, `BackgroundMask`, `ChartData`, `XAxis`, `YAxis`, `YAxisLine`, `PricingTableCellHeader`, `ScrollBar`

> Reach for the primitive that owns a base part (`Checkbox`, not `CheckboxBase`) unless you're
> assembling something the primitive doesn't cover. They're exported because the source defines
> them as real components, and because a few — `BackgroundMask`, `YAxisLine`, `NavigationActions`
> — are genuinely useful on their own.

### Coverage against the Figma inventory

The file's metadata lists **92 component families**. 81 are built — including every `_`-prefixed base
part, now exported from `components/internals/`. The remaining gap is fully accounted for:

**Duplicate-name sets collapsed.** The file carries five distinct `Button` sets, two `Buttons/Button`
sets, three `Featured icon` sets, three `_Dot` sets and two `Cursor` sets — a Resimator original plus
Untitled-UI library copies used on scratch frames. Each is one component with props, so several kit
families map onto a single built name.

**Namespaced duplicates left unaliased — the last 4 families.** `Buttons/Button` (×2),
`Buttons/Button utility` and `Buttons/Button loading icon` are the same Untitled-UI components as
`Button`, `ButtonUtility` and `ButtonLoadingIcon`, filed under a `Buttons/` prefix in the library.
Exporting `ButtonsButton` alongside `Button` would give consumers two names for one component and a
real chance of picking the wrong one. The one axis those sets had that `Button` lacked — **Icon only**
— is now the `iconOnly` prop, so nothing is functionally missing. **This is the terminal state: 81 of
92, with 11 accounted for as duplicate names of built components.**

**Not built on purpose — native platform behaviour:** `_Scroll bar (control fill with bottom padding)`
is represented by `ScrollBar` for decorative rails, but real scrolling stays native.

**Artwork, extracted verbatim — never redrawn.** `HandDrawnArrow` (42 marker strokes),
`PaymentMethodIcon` (card-brand and wallet marks) and `USUnitedStates` (the locale-switcher flag)
carry the real path data pulled straight out of the brand file. Two notes:

- `PaymentMethodIcon` is **~550 KB of path data**. If a page needs two or three brands, lift those
  paths into a local SVG rather than shipping the whole set.
- Card brands and flags are fixed assets. Do not recolour, restretch or restyle them.

### Intentional additions

Two things exist here that the Figma file has no component for. Both are confirmed additions, not oversights:

- **`Logo`** — the file documents the logomark and its rules (two colours only, 24px minimum, 2× clear
  space) but ships no `Logo` *component*. Consumers need one, and hand-rolling it risks the wrong
  geometry, so it composes the real copied SVGs at the exact Figma offsets from node `2118:467`.
- **`Icon`** — a thin wrapper over the 55 glyphs extracted from the file, so consumers reference them
  by name instead of pasting path data. The glyphs themselves are all from the source.

### Fonts the compiler will keep asking about

`tokens/fig-tokens.css` is generated from the file's Figma Variables, and four of those variables
point at faces this project has no binaries for: **Ambit TRIAL** (`--font-family-font-family-body`,
`--font-family-font-family-display`) and the weight tokens **Medium / Regular / Semibold**. They come
from the file's **Numu** pages, not the Resimator brand — no Resimator component references them, and
nothing renders in a wrong face because of them. The tokens are left pointing at their real names so
they resolve correctly if you ever upload the files; **do not swap them for a lookalike.**

---

## Using this system

```html
<link rel="stylesheet" href="styles.css">
<script src="_ds_bundle.js"></script>
<script type="text/babel">
  const { Button, HeaderSection, FeaturedIcon, Icon } = window.ResimatorDesignSystem_49c94f;
</script>
```

Reach for tokens (`var(--rsm-deep-midnight)`, `var(--text-muted)`, `var(--radius-card)`) rather
than literals — the semantic aliases in `tokens/colors.css` flip correctly inside `.rsm-dark`.
