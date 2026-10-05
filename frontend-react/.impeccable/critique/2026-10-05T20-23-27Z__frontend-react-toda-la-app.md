---
target: frontend-react (toda la app)
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 4
timestamp: 2026-10-05T20-23-27Z
slug: frontend-react-toda-la-app
---
⚠️ DEGRADED: single-context (the harness's fork mechanism only supports one active fork per turn — a second parallel `Agent` call for Assessment A returned "Fork is not available inside a forked worker," so Assessment A ran sequentially, in the same context, after Assessment B, rather than in true isolation)

Method: degraded single-context. Assessment B (detector + browser evidence) ran first and completed fully isolated from any design-review framing; Assessment A (design review) was then written by the same agent, informed by the pages/files already visited for B. This is the documented sequential fallback in critique.md's sub-agent gate, not a silent shortcut — flagging it per that gate's own rule.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Button has a real loading/disabled state, inline form errors, auth-loading text — solid, but no confirmed success toast after booking submit |
| 2 | Match Between System and Real World | 3 | Strong es-GT/usted/Quetzal/Zona-level address realism; undercut by "Presencial o virtual" copy that may not match actual product positioning (see P2 below) |
| 3 | User Control and Freedom | 3 | Modal has a real focus trap + Escape + focus restore; NotFound/back links present |
| 4 | Consistency and Standards | 2 | Component patterns (Button/Input/Modal) are consistent, but the color *system* is not: decorative quetzal-green brand vs. a completely different interactive violet/copper/cyan palette everywhere else; Google-stub uses a native `prompt()` breaking from the designed UI |
| 5 | Error Prevention | 3 | Input has aria-invalid + inline error/hint pattern, password rules shown up front, Button self-disables while loading |
| 6 | Recognition Rather Than Recall | 3 | lucide icons always paired with text labels, nav and dashboard cards self-describe |
| 7 | Flexibility and Efficiency of Use | 2 | No keyboard shortcuts or bulk actions found anywhere in an Operate-heavy app (tutor dashboard/bookings); Google-stub path is a blocking native dialog |
| 8 | Aesthetic and Minimalist Design | 2 | Real restraint in typography/radius choices, undercut by confirmed text-occlusion bugs and the color-system split |
| 9 | Help Users Recognize, Diagnose, and Recover from Errors | 3 | Centralized `getErrorMessage()` surfaces plain Spanish messages inline, not raw codes |
| 10 | Help and Documentation | 1 | No contextual help/tooltips/FAQ found anywhere, including on Operate surfaces (weekly availability setup, booking) that would benefit from it |
| **Total** | | **25/40** | **Acceptable — solid component engineering, let down by a handful of concrete, fixable issues** |

## Design Specificity Verdict

**Start here — this is the headline finding, and the detector only hints at it indirectly.**

Reading `src/styles/_theme.scss` directly (not just the rendered pages) surfaces the real story: the actual interactive `--color-primary` token is **`#5b21b6`, a violet/indigo** — not the documented "Verde Quetzal" `#0f7a5c` green tied to the national bird and the Quetzal currency already shown on every tutor's rate. The file's own section comments read like generic AI-palette marketing copy, not product-specific brand language:

> "LIGHT MODE — Moderno, Elegante & Energético / Base: Slate Ultra-Limpio | Acentos: Violeta Índigo & Cobre"
> "DARK MODE — Profundo, Electrónico & Alto Contraste... Acentos: Neón Neumórficos... M3-Inspired Tonal Surfaces"

The quetzal green survives only as two **hardcoded decorative gradients** (`$brand-gradient-start`/`$brand-gradient-end`, used solely on the Home hero background and the Auth brand panel). Every interactive element in the entire product — every button, active nav link, selected tab, the "Confirmar reserva" booking button, focus rings — renders in this generic violet-indigo/copper/cyan system instead, confirmed visually across every screenshot taken in this session (Crear cuenta button, Estudiante/Tutor tab selection, active "Buscar tutores" nav state, booking confirm button: all purple, never quetzal green).

This is very likely the actual root of "feels generic / parece de IA": the product's one real, defensible visual differentiator (a color genuinely tied to Guatemala, the national bird, and the currency already on screen) was confined to two decorative backgrounds, while the system-wide interaction color language is an off-the-shelf "modern SaaS" violet/copper/cyan trio with zero connection to tutoring, Guatemala, or this product specifically. A travel app, a fintech dashboard, or any other SaaS could ship this exact token file unchanged — that's the textbook definition of category-interchangeable.

**Deterministic scan**: `detect.mjs --json` against the entire `src/` tree returned **zero findings** (verified the tool itself works by running it against a deliberately generic dummy CSS snippet, which it correctly flagged for `overused-font: Inter`). The real project uses Public Sans + Petrona — outside the detector's "overused font" list — so the font layer is genuinely fine; a 12-day-old stored memory claiming the type system is Inter/Fraunces is stale and wrong, separate from the color-token finding above.

Live browser injection (5 representative pages/states) did catch 9 anti-patterns on Home alone, 2 on TutorSearch, 1 each on Register and the Tutor Dashboard, 0 on the TutorProfile+booking page — see Priority Issues below. Two of those (`ai-color-palette: Cyan gradient background`, on the Home hero and the Auth panel) are likely **false positives for that specific flag**: the gradient is the deliberate, documented quetzal-green brand gradient, and its hue (~163°) just sits close enough to the cyan boundary that the detector's hue-bucket classifier mislabels it. The *real* color-system problem is the one found by reading the token file directly, not by that flag.

**Visual overlays**: not left running in a persistent browser tab — the live-server instance used to serve the detector script was stopped after evidence collection (per the critique flow's instruction to leave no stray background process). All findings below are transcribed directly from the console groups captured during the session.

## Overall Impression

The component layer (Button, Input, Modal) and the Spanish/es-GT/Quetzal copy are genuinely well-built and locale-authentic — better engineering than the visual impression suggests. The actual problem is narrower and more fixable than "redo the whole UI": the brand's real differentiator color never made it past two decorative backgrounds, a shared page-header pattern skips a heading level everywhere, and a couple of layout bugs let a content card visually swallow a button, a distance badge, and two footer links entirely.

## What's Working

- **The route/distance motif and quetzal-green brand gradient, where they do appear** (Home hero, Auth panel): genuinely authored for this product, not generic — tied to the real "closest viable tutor" mechanism, not decoration for its own sake.
- **The TutorProfile + booking page**: zero detector findings, clean layout, real Leaflet map with quetzal-green pins, distance badges, Q-priced courses with modality tags — the actual core-value screen works well.
- **Modal component**: real focus trap, Escape-to-close, focus restored to the trigger on close, `aria-modal`/`aria-labelledby` wired correctly — better accessibility engineering than most of this app's visual polish would suggest.

## Priority Issues

**[P1] Design-system split: decorative quetzal green vs. generic interactive violet/copper/cyan**
- **Why it matters**: this is very likely the direct cause of the "feels AI-generated" complaint that motivated this critique. The one color genuinely tied to the product (Guatemala's quetzal, the Q currency already on every price tag) is invisible everywhere a user actually clicks.
- **Fix**: pick one system. If quetzal green is the committed brand, extend `--color-primary` (and a secondary/tertiary built from the same family, not an unrelated copper/cyan pair) from it, and rewrite `_theme.scss`'s section comments to describe the real intended system instead of the current generic "Moderno, Elegante & Energético / Violeta Índigo & Cobre / Neón Neumórficos" language.
- **Suggested command**: `/impeccable colorize` (or `/impeccable document` first to lock the corrected system in DESIGN.md, then `/impeccable polish`).

**[P1] Text-occlusion: a feature card covers a button, a distance badge, and two footer links**
- **Why it matters**: on Home, `div._feature_7djqc_139` sits on top of other content — the "Buscar tutores" button is 61% covered, a "3.2 km" badge 50%, three category spans 33-58%, and the footer's "Políticas de convivencia" and "Soporte" links are **100% covered** (present in the DOM, invisible on screen). A very similar visual symptom (footer content interleaved oddly with page cards) was also observed on the Tutor Dashboard, though not independently DOM-confirmed there.
- **Fix**: audit the layout CSS around the feature-card grid and the footer for an absolute-positioned or negative-margin element colliding with sibling content; move to a standard flow-based sticky-footer layout.
- **Suggested command**: `/impeccable layout` or `/impeccable harden`.

**[P1] Skipped heading level app-wide (h1 → h3, missing h2)**
- **Why it matters**: confirmed verbatim on two independent pages (Home: "Conectamos estudiantes..." → "Presencial o virtual"; Tutor Dashboard: "Panel del tutor" → "Mis cursos"), meaning it's a shared page-header component bug, not isolated content. Breaks heading-level navigation for screen-reader users.
- **Fix**: insert a real `<h2>` or demote the `<h3>` subtitles used right after page `<h1>`s.
- **Suggested command**: `/impeccable audit`.

**[P1] WCAG contrast failure on the core search page's "use my real location" button**
- **Why it matters**: 1.7:1 contrast (`#5b21b6` on `#6b6b6b`, need 4.5:1) on `button._switchLocation`, in `/tutores` — the control that drives the product's actual differentiator (real-location matching). This is the single button most load-bearing for the stated positioning, and it fails basic legibility.
- **Fix**: darken the background or lighten/adjust the text color to hit 4.5:1.
- **Suggested command**: `/impeccable audit` or `/impeccable colorize`.

**[P2] Positioning/copy inconsistency: "Presencial o virtual" vs. confirmed in-person-only positioning**
- **Why it matters**: Home's feature card literally reads "Presencial o virtual," and real seeded course data carries "Virtual" and "A domicilio del estudiante" modality tags — but the product positioning just confirmed during `/impeccable init` (this same session) states sessions are in-person-only, and PRODUCT.md was written on that basis. One of the two is wrong and needs reconciling before more design/positioning work locks in an inaccurate premise.
- **Fix**: confirm with the user whether virtual/at-home modalities are real product scope; update either the copy/data or PRODUCT.md accordingly.
- **Suggested command**: none of the design commands — this is a product-truth question, best resolved in conversation (or a follow-up `/impeccable init` amendment).

## Persona Red Flags

**Jordan (Confused First-Timer)**: Home and Register feel authored and trustworthy — green, the route motif, product-specific copy ("Su próxima clase está más cerca de lo que cree"). The moment Jordan logs in, every interactive element switches to a generic violet with no visual throughline to the marketing pages — a jarring, unexplained shift that could read as "did I leave the real site?" The "Presencial o virtual" copy on Home vs. an in-person-centric booking flow could also leave Jordan unsure what they're actually signing up for.

**Sam (Accessibility-Dependent User)**: the one confirmed WCAG failure sits on the single most load-bearing button of the core search flow (the real-location button, for a product whose entire differentiator is real-location matching). The skipped h1→h3 heading structure (present on at least two pages) would also garble heading-based screen-reader navigation, since an entire visual section has no h2 landmark to land on.

**Riley (Deliberate Stress Tester)**: the text-occlusion bugs are exactly this persona's territory — the footer's "Soporte" and "Políticas de convivencia" links are still in the DOM (likely still reachable by Tab) but 100% visually covered, so a keyboard user tabbing through would land on a focused link with no visible confirmation of where they are.

## Minor Observations

- `flat-type-hierarchy` on TutorSearch before data loads: type sizes 12/13.3/14/16/20.8px, ratio only 1.7:1 — a fairly compressed scale.
- `cramped-padding` on the Leaflet map container: children sit flush against the bottom edge with no inset.
- The Google-login stub uses a native blocking `prompt()` dialog rather than any in-UI form — jarring against the rest of the crafted UI, though it's a known, accepted stub per PRODUCT.md, not a bug to silently "complete."

## Questions to Consider

- If quetzal green is genuinely the brand — tied to the national bird and the currency already shown on every price — why does every clickable element in the product ignore it in favor of a palette with no connection to Guatemala, education, or tutoring at all?
- Would a first-time visitor recognize the Tutor Dashboard as the same product they saw on Home, color-wise?
- Is "presencial o virtual" actually true of the product, or did the positioning get locked into PRODUCT.md before this copy/data was reconciled?
