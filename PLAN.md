# Agile Implementation Plan

This plan builds Agile into the base theme described in [README.MD](README.MD): Claude receives a design and a copy of Agile, generates the theme tokens, modules, page DnD JSON and header/footer content, and the result is delivered to HubSpot through the CLI and APIs.

Progress is tracked in [Agile-Theme/TODO.md](Agile-Theme/TODO.md), which follows the same milestones.

---

## Guiding priorities

1. **Make generated output reliable before building more modules.** Shared macros, shared field groups, a clear contract and a worked example improve every site built from now on. A larger module catalogue helps only the designs that happen to match it.
2. **Verify platform behaviour before building on it.** Several steps depend on HubSpot behaving a certain way. Each gets a small test first, and every finding goes into [HUBSPOT-PLATFORM.md](../HUBSPOT-PLATFORM.md).
3. **Keep to the editing levels in the README.** Theme sets the default; Page and Module can override; every override starts as "inherit".
4. **Each milestone ends with something uploaded to the test portal (the `demo` sandbox, 51425289) and checked in the HubSpot editor.** Before every upload, run `hs cms lint <path> --account demo` and parse the output: its exit code is always 0, and upload itself does not validate HubL (`HUBSPOT-PLATFORM.md` › CLI / Validation).
5. **Never upload to or change the `gk3capital` portal.** The CLI defaults to `gk3capital`, so every `hs` command for Agile passes `--account demo` explicitly. Never use `--clean`.

---

## Milestone overview

| # | Milestone | Outcome |
|---|---|---|
| 0 | Platform tests and housekeeping | Every platform assumption the plan relies on is confirmed or ruled out |
| 1 | Shared foundations | Macros, shared field groups, complete tokens; existing modules rebuilt on them |
| 2 | Global header and footer | Header and footer editable in the global content editor |
| 3 | Templates and site essentials | Thin API-ready templates, system templates, blog, forms |
| 4 | Generation kit | The documents and starter files Claude follows to build a site |
| 5 | Automation | New-site setup, validation and page-push scripts |
| 6 | Worked examples | Two complete design-to-HubSpot builds checked into the repo |
| 7 | Quality and extension mode | Accessibility, performance, and partial-site delivery |

Milestones 1–3 can partly overlap. Milestone 4 needs 1–3 done. Milestone 6 is the real test of everything before it, and will feed changes back into 1–5.

---

## Milestone 0: Platform tests and housekeeping

**Goal:** remove uncertainty before building. Each test is small and is uploaded to the `demo` sandbox (`--account demo`).

### Platform tests

| Test | Question | If it fails | Status |
|---|---|---|---|
| **T1. Macro import in modules** | Can a module's `module.html` `{% import %}` a theme macro file by relative path? | Put the macros in a partial pulled in with `{% include %}`, or keep them inline in each module | **Confirmed at upload-validation level (demo, 2026-10-13).** It works, but the theme root from a module is `../../`, not `../` (`HUBSPOT-PLATFORM.md` › Paths). All modules updated. **Render confirmed 2026-10-13:** the renderer accepts both `../` and `../../`, but upload accepts only `../../`, so `../../` is the rule |
| ~~T2. `fields.js`~~ | **Dropped.** Shared field groups are composed locally by our own script (see 1.2), so we don't rely on HubSpot's `fields.js` conversion | — | Dropped |
| **T3. Seeded global partial defaults** | When a global partial's `dnd_area` is renamed, do the new seeded `dnd_module` defaults appear in the global content editor? | Document the manual step needed to reset global content | Open |
| **T4. Pages API with Agile modules** | Does a page created through the CMS Pages API with a `layoutSections` payload render Agile modules with the given field values? | Find the payload shape HubSpot accepts and document it | **Payload confirmed; Agile render still to check.** On demo (2026-10-15), the GK3 Agile Page Builder app token created a draft and a full `layoutSections` PATCH stored every Agile module with its values (`HUBSPOT-PLATFORM.md` › Pages API). The Madison build (2026-10-16) showed that API-stored layouts render in a real preview. Remaining: open an Agile draft on demo in the editor, or publish one, and check it renders |
| **T5. Version stamp** | Does `theme.json` accept a `version` key without upload errors? | Record the version in a separate `AGILE-VERSION` file instead | **Confirmed (demo):** accepted and stored as written (`HUBSPOT-PLATFORM.md` › CLI / Validation) |
| **T6. Push route** | Which route is better for creating pages: a script using a private app token, or the HubSpot connector tools (`manage_website_page`, `manage_landing_page`)? | Pick the one that handles `layoutSections` reliably | **Decided (2026-10-16):** a script using the project-based **GK3 Agile Page Builder** app token (`content` scope), stored per portal in `Automation/.env.<portal>`. The script is `utilities/page-build.js`: it reads the page spec, builds the layout from module defaults plus overrides, creates the draft, PATCHes it and reads it back. It was used for the Madison home draft. Its `--apply` path still needs a first real run (see Milestone 5) |
| **DnD on demo** | Does the `demo` sandbox accept DnD templates? | Use another portal | **Confirmed:** yes. The earlier failures came from misspelled `enddnd_*` closers (`HUBSPOT-PLATFORM.md` › DnD) |

### Housekeeping

- [x] Update the upload path in the workspace `CLAUDE.md` to `"Agile/Agile-Theme" "Agile"` (and the account to `demo`).
- [x] Remove the placeholder `"module_id": 1000000001` from `Page Controls.module/meta.json`.
- [x] Add a version stamp to the theme (`theme.json` `"version": "0.1.0"`, per T5).
- [x] Write `docs/EDITING-LEVELS.md`. It lists every current setting with its level (Theme / Global / Page / Module) and its override, if any. New settings get added here when they're created.

**Done when:** T1 and T3–T6 have results recorded in `HUBSPOT-PLATFORM.md`, and the housekeeping items are merged. Status: T1, T5 and T6 are done; T4 needs only the render check; T3 is open.

---

## Milestone 1: Shared foundations

**Goal:** every module is built from the same parts, so generated modules come out consistent and short.

**Status:** 1.1–1.4 are done locally. The macros exist, the reference modules use them and the shared groups, and the token groups are in `fields.json` and `_tokens.css`. What remains is the "Done when" check: render on demo.

### 1.1 Shared HubL macros: `macros/agile.html` [x]

Modules import it with `{% import "../../macros/agile.html" as agile %}`. The theme root from a module is `../../` (`HUBSPOT-PLATFORM.md` › Paths).

| Macro | Purpose |
|---|---|
| `section_attrs(module, base_class, extra_classes="")` | Builds the Section module wrapper: `agile-section`, spacing classes, background class, visibility classes, custom class, anchor ID, `data-agile-module`, and module overrides as inline CSS custom properties (`--agile-module-pt/pb`, `--agile-section-bg`, `--agile-section-text`) |
| `component_attrs(module, base_class, extra_classes="")` | The same for Component modules (no section chrome): anchor ID, base/visibility/custom classes, `data-agile-module` |
| `link_attrs(link)` | `href`, `target`, and the correct `rel` |
| `button(text, link, style="")` | A complete button link using theme or overridden button style |
| `resolve_style(local, fallback)` | Precedence helper: CTA style > module `button_style` > theme default |
| `image(img, sizes, loading)` | Responsive `<img>` with `srcset` from `resize_image_url`, width/height, alt text |
| `heading(text, level, class)` | Heading at the chosen level (no fixed `<h1>`s) |

### 1.2 Shared field groups [x]

Shared field groups live in `field-groups/` as JSON. A local composer script (`Automation/compose-fields`) expands references to them into each module's ordinary `fields.json` before upload. The output is plain `fields.json`, so uploads need no special flags and nothing depends on HubSpot's `fields.js` support. The **standard override set** every Section module gets:

- **Layout:** padding top/bottom (theme scale or custom), container width, alignment
- **Style:** background (inherit / theme surfaces / custom colour), text colour, button style. The group sits on HubSpot's Style tab (`"tab": "STYLE"`). Modules without buttons omit `button_style`
- **Advanced:** anchor ID, custom class, hide on mobile/desktop

The shared groups replace the copy-paste references in `field-groups/`.

### 1.3 Complete the design tokens [x]

Add the missing token groups to `fields.json` and `css/base/_tokens.css`:

- **Forms:** input background, border, radius, focus colour, label style, error colour
- **Links:** colour, hover colour, underline behaviour
- **Header:** background, text colour, height, sticky on/off, transparent-on-hero on/off
- **Footer:** background, text colour, link colour
- **Motion:** duration and easing scale, respecting `prefers-reduced-motion`

Remove the leftover `primary_color` / `secondary_color` top-level fields and their `default()` fallbacks in `_tokens.css` once nothing depends on them.

### 1.4 Rebuild the existing modules [x]

Rebuild Hero, Rich Section, the heading-band section module (now Section Header, see Milestone 2 status), Logo Bar and Card Item on the macros and shared field groups. Fix the fixed `<h1>` and inline colour styles along the way. These become the **reference modules** the generator copies from.

### Decided

- **Per-module scoped CSS field:** dropped. Scoped CSS lives at page level only (Page Controls `page_css`); module overrides are emitted inline as CSS custom properties by `section_attrs` (see `Agile-Theme/docs/SCOPED-CSS.md`).

**Done when:** all five modules use the macros and shared groups, render correctly on demo, and each module's `module.html` is mostly its own markup rather than wrapper code.

---

## Milestone 1.5: Theme revisions from the Madison review (2026-10-19)

A multi-agent review compared Agile with what the Madison × Trust build needed (`MadisonCapital/DESIGN-DECISIONS.md` M0–M39, D1–D36). Adversarial verifiers then checked each proposal. **Verdict:** keep Agile's structure and add a small amount of shared behaviour. The issues found:
- **Structure:**
  - Agile is standalone, with zero `inherited_value`.
  - One token path: `fields.json` → `_tokens.css` → `var(--agile-*)`.
  - Context colour works by re-pointing custom properties, with no `*` recolouring.
  - Per-instance values are passed as inline custom properties.

  These avoid most of what made Madison expensive.
- **Missing behaviour:** reveal, count-up, scroll state, a media frame and disclosure in every footer mode. Madison wrote about 255 lines of shared CSS/JS plus a `base.html` override; Agile's `js/main.js` has 5 lines.
- **Hard-coded visuals:** some visual constants are fixed in CSS that a comp will need to change.
- **Scoping by convention only:** no `:where()` anywhere, so a few base rules sit above one class.

Most modules get their comp-specific layout locally (overlaps, glass cards, rails). Promote a module or option to the theme only when a second client needs it.

**P1 (before the next comp-driven build):**
- **R1 Zero-specificity base rules.** Wrap the rules above one class in `:where()`:
  - `a:hover` (`css/elements/_typography.css:28-31`);
  - `.agile-richtext h*` (`:58-65`);
  - the footer descendant link rules (`css/components/_footer.css:23-31`; switch to longhand `text-decoration-line`);
  - the `.agile-section` defaults (`css/base/_sections.css:11-19`).

  Then delete the guard in `css/templates/_blog.css:30-36`. Bare `a`/`h*`/`img` are already (0,0,1), so leave them. Keep `img{display:block}`, and keep `_header.css:119-126`: that is the nav's own hover and active design, not a guard. Include HubSpot-injected CSS in the demo visual check.
- **R2 Tokens for typography constants.** Replace the fixed heading line-height, clamp floors, h6 size and eyebrow (`_typography.css:6, 9-14, 39-46`) with tokens whose defaults are today's values. Add `.agile-lead`, `.agile-fineprint`, `.agile-num` and `.agile-richtext > :last-child { margin-bottom: 0 }`. Fluid sizes need unitless number companions emitted from HubL; CSS can't divide length by length. Editor fields: only an eyebrow group, `lead_size` and `small_size`.
- **R3 Site layer.** Add an empty `css/site/_site.css`, included last from `css/main.css`, where Claude writes per-comp token overrides. Add an empty `templates/partials/head-extra.html` include for extra font links, such as Madison's `opsz` axis (D3). Rule: `_site.css` may override only tokens that **no** theme field backs; `module-check`/`lint-check` flag violations. Fix the font weights: `base.html:25` asks every Google family for 400–700, which can make the whole Google Fonts request fail (HTTP 400) when a family lacks a weight, and 800/900 are offered but never requested. Request only the weights in use. Change `load_external_fonts` only after the R13 check.
- **R4 Shared reveal and count-up** (`js/main.js`, `css/utilities/_reveal.css`):
  - `[data-agile-reveal]` runs on a one-shot CSS `@keyframes` animation (opacity + translate), with an `animation-delay` stagger. An animation, not a transition, so it can't collide with module hover transitions (M31).
  - `[data-agile-countup]` keeps the final value in the HTML and jumps to the end under reduced motion.
  - `html.agile-scrolled` comes from a passive scroll listener.
  - An `agile-editor` class (`is_in_editor`) disables reveal and count-up in the editor.
  - The hidden start state is gated on `html.agile-js:not(.agile-editor)`, with a failsafe that shows content if `main.js` never runs.
  - Theme toggle `motion.reveal_sections` **defaults off**, and a Page Controls `reveal_override` sets a class on `.agile-page` in `base.html`, not in `section_attrs`.
- **R7 Disclosure in every footer mode.** Today the disclaimer renders only in the native footer branch (`globals/Site Footer.module/module.html:149-152`), so minimal-footer landing pages lose it. Add a "show disclaimer in minimal mode" boolean (default on), plus a Page Controls `page_disclosure` richtext above the global disclaimer.
- **R11 Write down the contracts** (`docs/MODULE-CONTRACT.md`):
  - the JS pattern: IIFE, `-ready` guard, `readyState` check, root-scoped queries, values passed as `data-*` attributes, a reduced-motion check;
  - per-instance values as inline custom properties;
  - z and isolation rules, and site prefixes;
  - a `module-check` rule against module roots re-declaring section padding or background.

  The playbook gains: don't build comp review devices or comp cascade accidents (M22, M38).
- **R13 Verify on demo first, and harden `page_css`:**
  - (a) Does `widget_data.page_controls` reach DnD modules and the global header/footer on a live page? The existing header/footer overrides, and R4, R7 and R10, all depend on it (`HUBSPOT-PLATFORM.md` › Module fields).
  - (b) `page_css` load order relative to `module.css`.
  - (c) A two-column `dnd_row`.
  - (d) `load_external_fonts` and the Google Fonts request for each candidate family.

  `page_css` is printed raw inside `.agile-page { }` (`templates/layouts/base.html:51-59`), and `docs/SCOPED-CSS.md:25` allows nested rules, so guard against `</style` and unbalanced braces. Extend `page-build.js` to allow only `widgets.page_controls`, with its keys validated against Page Controls `fields.json`; `widgets` is on its denylist today.

**P1/P2:**
- **R5 Media layer.** Add `css/components/_media.css` (frame, `--cover` with `object-position: var(--agile-media-pos)`, and an overlay) and a `media()` macro around `image()`. It handles focal x/y, `fetchpriority` for the hero (no `loading=lazy` there), and an empty frame only when `show_empty` is set or in the editor. It also accepts a bare `src` string (the blog featured image). Add `field-groups/focal.json` (0–100). Make the card aspect a token with the current 16/9 default. Move the blog templates over only when they're next touched. No `<picture>` mobile image.
- **R6 Button tokens.** Tokens for border width, font size, weight, tracking, transform and shadow (`css/elements/_buttons.css:23-30`). The form submit uses the same tokens (`_forms.css:284-303`). Add an `accent` variant and a full-strength `outline` that is distinct from `--ghost`. Add the new variants to `cta.json`, `style.json` and the allow-list in `agile.button`. Theme fields: `border_width` (step 0.5), `font_weight`, `text_transform`.
- **R8 Context classes:**
  - `section_attrs` emits a neutral `agile-ctx` class, plus `--dark`/`--light` from an explicit `on_custom_tone` choice (HubL can't compute luminance). That replaces the `[style*="--agile-section-text"]` selector (`_sections.css:64`).
  - Keep the forced underline wherever the link colour equals the text colour (WCAG 1.4.1).
  - Add `.agile-on-dark` as the mirror of `.agile-reset-colors`, and a `--agile-muted-mix` token.
  - Re-declare the token aliases in `:where(:root, .agile-page)`, placed before the background presets, so `page_css` brand overrides reach buttons and links.

**P2:**
- **R9 Layout tokens**, split into separate items:
  - container narrow and wide (as fields with their own bounds) plus gutter tokens, and z tokens;
  - mobile custom padding in `spacing.json`, emitted with a media rule;
  - a breakpoint ladder of 1199 / 1023 / 767 / 479, replacing the "767 only" rule (`MODULE-CONTRACT.md:172`; Card Grid and Logo Bar already break it);
  - `--agile-space-scale`, which defaults to 1, multiplies density, and never overrides exact custom px.
- **R10 Header:** scroll-state tokens under `html.agile-scrolled`, `height_mobile`, and a Page Controls `header_sticky_override`. A transparent sticky header is a follow-up that needs the scrolled background. The logo crossfade, utility nav item and second CTA wait for a second client.
- **R12 CTA defaults:** empty the shared `cta.json` default ("Learn more", `#`). Add link `$defaults` to the Hero primary CTA, add `$defaults` to Rich Section, then run `compose-fields --check`. Add a section background image via the style-tab `backgroundimage` type.
- **R14 Colour slots:** `surface_alt` + `on_surface_alt`, `ink` and `accent_hover`. A `shadows.color` built with `color-mix()`; raise the shadow opacity cap from 30 to 60. Footer text opacity (needs `show_opacity` and the colour's css output).

**P3:** **R15** Footer grid and heading tokens: two template tokens, because Agile nests its link columns.

**Decided not to do:**
- copy Trust's breadth (its 9,338-line `fields.json`) or its global opinions;
- 40–60 new editor fields for per-level type;
- comp-specific theme modules (proof boxes, glass cards, rail, flow);
- `@layer` (load order on HubSpot is unverified);
- per-module CSS fields;
- a leaving-site interstitial, the `positive`/`negative` colours, a divider choice and `mobile_img` (no comp has needed them yet).

**Open decision:** see the table at the end. R2/R3 put exact comp values in git-versioned tokens that only Claude sets, not in editor fields. That conflicts with `manifesto.md:41` ("Never hardcode what should be configurable") and `:102` ("a token-rich theme editor").

---

## Milestone 2: Global header and footer

**Goal:** header and footer content is editable in the global content editor, following the Trust pattern.

**Status (2026-10-14):** built locally and render-tested on demo with `hs cms lint --debug` and mock data; composer `--check` passes. Done: both global modules, both partials rewritten as seeded `header_area` / `footer_area`, `*_extensions` areas removed, header JS in `module.js`, Page Controls `header_style_override`. The full theme is uploaded to demo with `hs cms upload . Agile --account demo` (run from `Agile-Theme/`); the remote files were fetched back and matched the local ones (2026-10-13/14). The 2026-10-14 review fixes (footer a11y and global-module contract, new-tab cue via `agile.new_tab_sr` / `agile.menu_link_attrs`, desktop dropdown hover/dismiss, focus kept across the 767px reset, transparent-header trigger anchored to the first `dnd_area` in `<main>`, sticky + auto-transparent scroll padding, right-anchored last dropdown) were uploaded the same way and render-tested with `hs cms lint --debug`. **Not yet checked:** the global content editor (T3), a real HubSpot menu, and the header JS, sticky and transparent overlay on a published page, because pages cannot be created on demo yet. The focus trap was dropped by design: the mobile panel is not modal, so Escape, outside click and focus leaving the header close it instead.

Also decided during this milestone: **Blank Section is retired.** A heading band is the self-contained **Section Header** module, and repeated layouts are Section modules that own their grid through a repeater (**Card Grid**). Shared card CSS lives once in `css/components/_card.css`.

- Create `globals/Site Header.module`:
  - logo (falls back to theme logo), logo link, max height (desktop/mobile)
  - navigation from a HubSpot `menu` field, with one level of dropdowns
  - optional CTA button
  - accessible mobile menu (button with `aria-expanded`, Escape to close and return focus; no focus trap, since the panel is not modal)
  - reads header mode from theme settings, overridden by Page Controls
- Create `globals/Site Footer.module`:
  - logo, company name
  - link columns (each a menu field or a list of links)
  - social links, legal links, rich-text disclaimer, copyright line
  - reads footer mode the same way as the header
- Both modules: `"global": false` and `"is_available_for_new_content": false` in `meta.json`.
- Rewrite `templates/partials/header.html` and `footer.html` as `dnd_area → dnd_section → dnd_column → dnd_row → dnd_module`, with seeded default content. Use new area names (`header_area`, `footer_area`), and remove the empty `*_extensions` areas.
- Page Controls: keep header/footer mode overrides; add a header style override (solid / transparent) if 1.3 adds the theme setting.
- Small JS for the mobile menu and sticky behaviour, in the header module's `module.js`.

**Deliberately left out of v1:** mega menu, top bar, hello bar, search. They can be added later as optional features of the same module.

**Done when:** a new portal shows a complete header and footer on upload, and both can be edited in the global content editor.

---

## Milestone 3: Templates and site essentials

**Goal:** everything a real site needs besides its custom sections.

### 3.1 Thin page templates

- **Agile Page** (`templates/page.html`) and **Agile Landing Page** (`templates/landing-page.html`), each with a single empty `dnd_area`.
- **Use the same `dnd_area` name in every page template** (`main`). API payloads then work with any page template.
- Keep the current homepage as a theme preview / demo, not as the main route.

### 3.2 System templates

404, 500, search results, password prompt, subscription preferences, backup unsubscribe, subscription update confirmation. Simple, token-styled, no custom design needed.

### 3.3 Blog

- **Listing:** featured post, grid, pagination, topic filter; the area above the listing stays editable.
- **Post:** author, date, reading time, tags, featured image, related posts, an optional CTA area after the post body.
- Blog settings use theme-level defaults (listing layout, show author, and so on).

### 3.4 Forms

- Global form styling driven by the form tokens from 1.3, covering HubSpot's form markup (including checkbox/radio, multi-column, error messages, submit button).
- A **Form Section** reference module (heading, intro, form, optional side content).

**Done when:** a page can be created through the API on either thin template; system pages, blog listing, blog post and a form all render correctly with token styling.

---

## Milestone 4: Generation kit

**Goal:** everything Claude needs to turn a design into an Agile site consistently.

**Since the Madison build (2026-10-16):** the theme-agnostic process now lives in the root [HUBSPOT-SITE-BUILD-PLAYBOOK.md](../HUBSPOT-SITE-BUILD-PLAYBOOK.md), with its scripts in [utilities/](../utilities/utils.md). `GENERATING-A-SITE.md` is therefore a **short Agile supplement** to the playbook, not a second playbook. It covers only what is specific to Agile: tokens, the macros, the shared groups, the `page_sections` area, Page Controls and the module template. It links to the playbook for everything else. These parts of the Madison process carry over:
- **The priority order, stated in the first prompt:** fidelity to the comp first, Agile's architecture second, and one recorded extension per gap.
- **One decisions log per client build**, with three parts:
  - Agile canon, cited by file and line;
  - client extensions, one approved way per gap;
  - a deviations register.

  Builders propose entries and one owner merges them. A consistency reviewer checks every module against the log. Madison's `DESIGN-DECISIONS.md` is the model to follow.
- **A build plan with a blockers and questions list for the user before any build work starts.** It covers approvals, existing pages, media, legal text, links and the slug. Adversarial critiques review the plan, and the outcome of each point is recorded.
- **Safe upload order:**
  - shared CSS/JS first;
  - then modules (both do nothing until they're placed);
  - then the site-wide files (theme `fields.json`, partials, layout), last and behind approval.

  Every upload is appended to an `UPLOAD-MANIFEST.txt`, and the plan includes a rollback table.
- **A "Before" record of theme-editor values ahead of any theme-settings change**, because editor-saved values beat `fields.json` defaults.
- **The comp's copy lives once, in module `fields.json` defaults.** Page specs carry only per-section overrides: spacing, anchor, surface, images. `page-build.js` merges the two.

- **`docs/GENERATING-A-SITE.md`**: the Agile-specific steps, in playbook order:
  1. Read the design and list its sections and repeated patterns
  2. Extract design tokens into a token sheet
  3. Map each section to an existing reference module, or decide to build a new one
  4. Build new modules from the module template
  5. Write header/footer seed content
  6. Write the page JSON payloads
  7. Run the validator
  8. Upload the theme; push the pages
  9. Visually compare against the design and fix differences
- **Token sheet** (`docs/TOKEN-SHEET.md` plus a JSON template): how to read colours, fonts, type scale, spacing and radius from a design, and where each value goes in `fields.json`.
- **Module template** (`module-template/`): a starter module folder already wired to the macros and shared field groups. New modules start as a copy of it.
- **Page JSON reference** (`docs/PAGE-JSON.md`): an Agile page spec for `utilities/page-build.js` (area `page_sections`, module paths `../modules/<Name>.module`, override keys from the shared groups), with a commented example. The general `layoutSections` structure is in playbook 6.3; link to it rather than repeat it.
- **Decision rules** in the guide:
  - Each design section becomes one Section module, with repeaters for repeated items.
  - Reuse a reference module only when it matches the design without bending it.
  - Use Component modules only for blocks editors will reuse across many pages.
- **Update the existing docs** (`MODULE-CONTRACT.md`, `ARCHITECTURE.md`, `SCOPED-CSS.md`, `manifesto.md`) to match the README. Most are still written in the future tense.

**Done when:** a fresh Claude session given only a design and a copy of Agile can follow the guide without needing extra instructions.

---

## Milestone 5: Automation

**Goal:** scripts for the repeatable steps. Theme-agnostic steps belong in the workspace [utilities/](../utilities/utils.md) and follow its binding conventions: dry run by default, `--apply` to write, `--allow-prefix` for uploads, gk3capital refused. Only Agile-specific scripts live in `Automation/`. Check `utils.md` before writing any script.

| Script | What it does | Status |
|---|---|---|
| `new-site` | Copies `Agile-Theme/` into a client folder, sets the theme label, stamps the Agile version | To do (Agile-specific, `Automation/`) |
| `validate` | Checks a generated site against the contract (see below) | Mostly covered: extend `utilities/module-check.js` (static rules) and use `utilities/lint-check.js` (lint and render with theme and module mocks). Add Agile rules to `module-check.js` rather than writing a second validator |
| `push-pages` | Creates or updates pages from page JSON files through the HubSpot API (route from T6) | **Built:** `utilities/page-build.js`. It was checked read-only against the Madison draft (`--compare-page`: MATCH). Its `--apply` path has not been run yet. Make the first real run a throwaway Agile draft on demo |
| `compose-fields` | Builds each module's `fields.json` from its field source plus the shared field groups (built in Milestone 1) | Done |
| upload | Uploads with fetch-back comparison and an upload manifest | **Built:** `utilities/hs-upload.js` |
| render check | Screenshots the comp and the page side by side at 1440 / 1024 / 768 / 375, whole page and per section | **Built:** `utilities/render-check.js` (`--sections <map>`) |

**The validator checks:**

- theme `fields.json` uses only allowed field types
- no reserved field names (`body`)
- no hardcoded hex colours or font names in module CSS
- each Section module has the required wrapper (through the macro)
- `meta.json` has no hand-written `module_id`
- each page JSON references modules that exist and field names those modules define
- each page JSON uses the standard `dnd_area` name

**More checks from the Madison build** (worth adding to `module-check.js`):

- every repeater's `default` array has exactly `occurrence.default` items
- no `href=""` or `aria-label=""` is printed (check the render output)
- inline JS contains no `{{`, `{%` or `{#`
- each module is rendered twice under different `name` values, so duplicated ids show up

**Done when:** the validator runs on the reference modules with no errors, and `page-build.js --apply` creates a test page on demo that renders.

---

## Milestone 6: Worked examples

**Goal:** prove the whole pipeline and give Claude real examples to copy.

- **Example 1:** a complete site of moderate size (home, about, a service page, contact, blog). Check in to `Agile/Examples/<name>/`:
  - the source design (HTML or images)
  - the filled-in token sheet
  - the generated theme copy
  - the page JSON files
  - before/after screenshots
  - notes on what was hard or unclear
- Fix the problems Example 1 uncovers in Milestones 1–5.
- **Example 2:** a design in a clearly different style, built from the updated kit. This tests whether the output is consistent across very different designs.
- The examples become test fixtures for the validator.

**Decision needed:** which designs to use. A real recent client design is the most useful test. **Recommendation:** make Example 1 the Madison homepage comp (`MadisonCapital/madison-homepage-comp-r3.html`), rebuilt on Agile. It already has a finished Trust build to compare against, a section map for `render-check.js --sections` (`MadisonCapital/pages/home.sections.json`), extracted media and a decisions log. That makes it a direct measure of how much Agile saves. Many Madison extensions (M24, M30, M35, M24.9) existed only to work around Trust's CSS cascade.

**Done when:** Example 2 needed no changes to the shared foundations, only new modules.

---

## Milestone 7: Quality and extension mode

- **Accessibility:** landmarks, focus states, keyboard navigation in the header, colour contrast check on tokens, reduced motion.
- **Performance:** CSS size, image loading, JS kept small, no render-blocking extras.
- **Extension mode** (manifesto goal): Agile used for only part of a client's site, such as the blog or landing pages, alongside their existing site:
  - custom header/footer that matches the client's live site
  - a way to match their styles through tokens and page-level CSS
  - documentation for grafting Agile into an existing portal

---

## Suggested first slice

1. ~~Choose a test portal, then run platform tests T1 and T5 there.~~ Done: `demo`. T1 and T5 confirmed.
2. ~~Housekeeping.~~ Done.
3. ~~Macros (1.1) and shared field groups (1.2), then rebuild Hero as the first reference module.~~ Done.
4. Lint (`hs cms lint <path> --account demo`, then parse the output), upload to demo (`--account demo`) and check it in the editor.

## Open decisions

| Decision | Recommendation | Needed by |
|---|---|---|
| ~~**Test portal**~~ (`gk3capital` is off limits) | **Decided:** the `demo` sandbox (51425289), always with `--account demo` | Any upload or platform test |
| ~~Keep per-module scoped CSS field?~~ | **Decided:** dropped; page-level `page_css` only (see `Agile-Theme/docs/SCOPED-CSS.md`) | Milestone 1.2 |
| ~~Header scope for v1~~ | **Decided and built:** logo, menu with one dropdown level, CTA, mobile menu | Milestone 2 |
| ~~Page push route~~ | **Decided (T6):** `utilities/page-build.js` with the GK3 Agile Page Builder app token | Milestone 5 |
| ~~Blank Section~~ | **Decided (option A):** replaced by Section Header; repeated layouts are Section modules with a repeater (Card Grid) | Milestone 2 |
| Exact comp values: editor fields or site tokens? (Milestone 1.5) | Site tokens in `css/site/_site.css`, versioned in git and set by Claude. Editor fields only for choices an editor really makes. Promote a token to a field when a second client needs editor control. Amend `manifesto.md:41, :102` to match | Milestone 1.5 (R2, R3) |
| Designs for the worked examples | The Madison homepage comp rebuilt on Agile (it has a Trust baseline to compare with), then a contrasting design | Milestone 6 |
