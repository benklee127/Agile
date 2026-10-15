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
| **T4. Pages API with Agile modules** | Does a page created through the CMS Pages API with a `layoutSections` payload render Agile modules with the given field values? | Find the payload shape HubSpot accepts and document it | Open (the demo CLI key has read-only page scopes) |
| **T5. Version stamp** | Does `theme.json` accept a `version` key without upload errors? | Record the version in a separate `AGILE-VERSION` file instead | **Confirmed (demo):** accepted and stored as written (`HUBSPOT-PLATFORM.md` › CLI / Validation) |
| **T6. Push route** | Which route is better for creating pages: a script using a private app token, or the HubSpot connector tools (`manage_website_page`, `manage_landing_page`)? | Pick the one that handles `layoutSections` reliably | Open |
| **DnD on demo** | Does the `demo` sandbox accept DnD templates? | Use another portal | **Confirmed:** yes. The earlier failures came from misspelled `enddnd_*` closers (`HUBSPOT-PLATFORM.md` › DnD) |

### Housekeeping

- [ ] Update the upload path in the workspace `CLAUDE.md` to `"Agile/Agile-Theme" "Agile"` (and the account to `demo`).
- [x] Remove the placeholder `"module_id": 1000000001` from `Page Controls.module/meta.json`.
- [x] Add a version stamp to the theme (`theme.json` `"version": "0.1.0"`, per T5).
- [x] Write `docs/EDITING-LEVELS.md`. It lists every current setting with its level (Theme / Global / Page / Module) and its override, if any. New settings get added here when they're created.

**Done when:** T1 and T3–T6 have results recorded in `HUBSPOT-PLATFORM.md`, and the housekeeping items are merged.

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

- **`docs/GENERATING-A-SITE.md`**: the step-by-step process:
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
- **Page JSON reference** (`docs/PAGE-JSON.md`): the `layoutSections` structure with a commented example using Agile modules (based on T4).
- **Decision rules** in the guide:
  - Each design section becomes one Section module, with repeaters for repeated items.
  - Reuse a reference module only when it matches the design without bending it.
  - Use Component modules only for blocks editors will reuse across many pages.
- **Update the existing docs** (`MODULE-CONTRACT.md`, `ARCHITECTURE.md`, `SCOPED-CSS.md`, `manifesto.md`) to match the README. Most are still written in the future tense.

**Done when:** a fresh Claude session given only a design and a copy of Agile can follow the guide without needing extra instructions.

---

## Milestone 5: Automation

**Goal:** scripts for the repeatable steps, in `Automation/`.

| Script | What it does |
|---|---|
| `new-site` | Copies `Agile-Theme/` into a client folder, sets the theme label, stamps the Agile version |
| `validate` | Checks a generated site against the contract (see below) |
| `push-pages` | Creates or updates pages from page JSON files through the HubSpot API (route from T6) |
| `compose-fields` | Builds each module's `fields.json` from its field source plus the shared field groups (built in Milestone 1) |

**The validator checks:**

- theme `fields.json` uses only allowed field types
- no reserved field names (`body`)
- no hardcoded hex colours or font names in module CSS
- each Section module has the required wrapper (through the macro)
- `meta.json` has no hand-written `module_id`
- each page JSON references modules that exist and field names those modules define
- each page JSON uses the standard `dnd_area` name

**Done when:** the validator runs on the reference modules with no errors, and `push-pages` creates a test page on demo.

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

**Decision needed:** which designs to use. A real recent client design is the most useful test.

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
2. ~~Housekeeping.~~ Done, except the workspace `CLAUDE.md` upload path.
3. ~~Macros (1.1) and shared field groups (1.2), then rebuild Hero as the first reference module.~~ Done.
4. Lint (`hs cms lint <path> --account demo`, then parse the output), upload to demo (`--account demo`) and check it in the editor.

## Open decisions

| Decision | Recommendation | Needed by |
|---|---|---|
| ~~**Test portal**~~ (`gk3capital` is off limits) | **Decided:** the `demo` sandbox (51425289), always with `--account demo` | Any upload or platform test |
| ~~Keep per-module scoped CSS field?~~ | **Decided:** dropped; page-level `page_css` only (see `Agile-Theme/docs/SCOPED-CSS.md`) | Milestone 1.2 |
| ~~Header scope for v1~~ | **Decided and built:** logo, menu with one dropdown level, CTA, mobile menu | Milestone 2 |
| Page push route | Decide after T6 | Milestone 5 |
| ~~Blank Section~~ | **Decided (option A):** replaced by Section Header; repeated layouts are Section modules with a repeater (Card Grid) | Milestone 2 |
| Designs for the worked examples | A recent real client design, then a contrasting one | Milestone 6 |
