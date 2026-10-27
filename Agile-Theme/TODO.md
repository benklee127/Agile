# Agile To-Do

This is the checklist for [../PLAN.md](../PLAN.md). The plan explains the why and the order. This file tracks progress. Each section matches a plan milestone.

---

## Already in place

- [x] Standalone theme scaffold (`theme.json`, `fields.json`, CSS and JS entry points, placeholder images, preview image)
- [x] Design tokens for colour, typography, buttons, radius, shadows, section spacing and layout, mapped to CSS custom properties in `css/base/_tokens.css`
- [x] Page shell (`templates/layouts/base.html`) with skip link and header/footer global partials
- [x] Page Controls module: header/footer mode, page width, spacing density, body classes, page CSS
- [x] Theme-level header/footer mode with page-level override
- [x] Module field layout (Content / Layout / Style / Advanced; the Style group on HubSpot's Style tab) and the `field-groups/` reference library
- [x] Spacing utility classes (`agile-pt--*` / `agile-pb--*`) and visibility classes
- [x] Module wrapper convention (`agile-section`, `data-agile-module`)
- [x] Starter modules: Hero, Rich Section, Section Header, Card Grid, Logo Bar (Section modules), Card Item (Component module)
- [x] Starter templates: homepage, landing page, blog listing, blog post
- [x] Platform finding: a `dnd_area` cannot sit inside a module on standard CMS, so multi-item layouts are built as Section modules with their own grid (see `HUBSPOT-PLATFORM.md`)

---

## Milestone 0: Platform tests and housekeeping

- [x] T1. Macro import from `module.html` by relative path: confirmed on demo for both upload and render. Use `../../` from a module; it is the only form that works for both (`HUBSPOT-PLATFORM.md` › Paths). All modules updated
- [x] T1 follow-up: render preview checked 2026-10-13. The renderer accepts both `../` and `../../` for import, include and `get_asset_url`; the upload checker accepts only `../../`
- [x] Choose a test portal: the `demo` sandbox (51425289). Every `hs` command uses `--account demo`; `gk3capital` stays off limits
- [x] DnD templates upload and validate on demo (closing tags are `end_dnd_*`; see `HUBSPOT-PLATFORM.md` › DnD)
- [x] ~~T2. `fields.js`~~: dropped in favour of the local composer script
- [ ] T3. Seeded defaults appear after renaming a global partial's `dnd_area` (partials renamed to `header_area` / `footer_area`; full upload done; check in the global content editor)
- [x] T4a. Pages API `layoutSections` payload is stored with Agile module values (demo, 2026-10-15; `HUBSPOT-PLATFORM.md` › Pages API)
- [ ] T4b. An API-built Agile draft renders on demo (open it in the editor or publish it). API-stored layouts are known to render from the Madison build (2026-10-16)
- [x] T5. `theme.json` accepts a `version` key: confirmed on demo (accepted and stored as written; whether HubSpot shows it is unchecked)
- [x] T6. Page push route: `utilities/page-build.js` with the GK3 Agile Page Builder app token (`content` scope, `Automation/.env.<portal>`)
- [ ] Record T1 and T3–T6 results in `HUBSPOT-PLATFORM.md` (T1, T4a, T5 and T6 recorded; T3 and T4b open)
- [x] Fix the upload path in the workspace `CLAUDE.md` (`"Agile/Agile-Theme" "Agile"`)
- [x] Remove placeholder `module_id` from `Page Controls.module/meta.json`
- [x] Add the Agile version stamp (`theme.json` `"version": "0.1.0"`)
- [x] Write `docs/EDITING-LEVELS.md`

## Milestone 1: Shared foundations

- [x] Decide: keep or drop the per-module scoped CSS field (dropped; page-level `page_css` only, see `docs/SCOPED-CSS.md`)
- [x] `macros/agile.html`: `section_attrs`, `component_attrs`, `link_attrs`, `button`, `resolve_style`, `image`, `heading`
- [x] Shared field groups for the standard override set, plus `Automation/compose-fields` to expand them
- [x] `style` group on HubSpot's Style tab (`"tab": "STYLE"`), with composer checks for HubSpot's style-field type list
- [x] Page Controls `page_width` / `spacing_density` use `theme_default` like the header/footer overrides
- [x] Form tokens
- [x] Link tokens
- [x] Header tokens (background, text, height, sticky, transparent-on-hero)
- [x] Footer tokens
- [x] Motion tokens, with `prefers-reduced-motion` support
- [x] Remove the leftover top-level `primary_color` / `secondary_color` fields
- [x] Rebuild Hero on the macros and shared groups (first reference module)
- [x] Rebuild Rich Section
- [x] Rebuild the heading-band section module (now Section Header; see Milestone 2)
- [x] Rebuild Logo Bar
- [x] Rebuild Card Item
- [x] Upload to demo (`--account demo`, after `hs cms lint`)
- [ ] Check the Milestone 1 modules in the editor

## Milestone 1.5: Theme revisions from the Madison review

Details and amendments are in PLAN Milestone 1.5. Start with R13(a), because R4, R7 and R10 depend on it.

- [ ] R13 Demo checks: `widget_data.page_controls` reaches DnD modules and the global header/footer on a live page; `page_css` load order; a two-column `dnd_row`; `load_external_fonts` and the Google Fonts weights. Log each result in `HUBSPOT-PLATFORM.md`
- [ ] R13 Harden `page_css` (`</style`, unbalanced braces); add `widgets.page_controls` support to `utilities/page-build.js`
- [ ] Decide: exact comp values as site tokens vs editor fields, and amend `manifesto.md` to match
- [ ] R1 `:where()` on `a:hover`, `.agile-richtext h*`, the footer link rules and the `.agile-section` defaults; remove the `_blog.css` guard
- [ ] R2 Typography constants as tokens; `.agile-lead`, `.agile-fineprint`, `.agile-num`; eyebrow, lead and small fields
- [ ] R3 `css/site/_site.css` and `templates/partials/head-extra.html`; the "no override of field-backed tokens" check; fix the font weights request
- [ ] R4 Shared reveal (CSS keyframes) and count-up, `agile-scrolled`, `agile-editor`; `motion.reveal_sections` off by default; Page Controls `reveal_override`
- [ ] R7 Footer disclaimer in minimal mode (boolean, default on); Page Controls `page_disclosure`
- [ ] R11 JS, per-instance, z and prefix contracts in `MODULE-CONTRACT.md`; the "no review devices, no cascade accidents" rule in the playbook
- [ ] R5 `_media.css`, the `media()` macro, `focal.json`, card aspect token
- [ ] R6 Button tokens shared with the form submit; `accent` and `outline` variants
- [ ] R8 Context classes and `on_custom_tone`; `.agile-on-dark`; alias re-declaration in `:where(:root, .agile-page)`
- [ ] R9 Layout tokens, mobile custom padding, breakpoint ladder, `--agile-space-scale` (default 1), as separate items
- [ ] R10 Header scroll state, `height_mobile`, `header_sticky_override`
- [ ] R12 Empty `cta.json` defaults, plus `$defaults` for Hero and Rich Section; section background image
- [ ] R14 Colour slots `surface_alt`/`on_surface_alt`, `ink`, `accent_hover`; shadow colour; footer text opacity
- [ ] R16 Scroll tokens and `:where(.agile-scroll)`; shared `[data-agile-rail]` (snap, prev/next, progress, focusable track); Card Grid `rail` layout; contract rule "no hidden scrollbar without controls"
- [ ] R15 (P3) Footer grid and heading tokens
- [ ] Apply the amendments from the Madison test (PLAN Milestone 1.5 › Test result) to R1–R7, R10–R12, R14 and R15 before implementing them
- [ ] N1 Heading ids: `heading()` id/attrs, a `heading_id()` helper, `aria-labelledby` on `section_attrs`
- [ ] N2 Keep `layout.text_align` out of split layouts (or document `$omit`)
- [ ] N6 Close the mobile panel when a link inside it is clicked; N7 prefix the Site Header HubL locals (`hdr_`)
- [ ] N8 Footer: keep legal items without a URL, add a brand-logo fallback, scope the `ul` reset; N9 guard `new_tab_sr()` on a usable href
- [ ] N10 List-of-text field group
- [ ] N11 `module-check` detects the root printed by `section_attrs`/`component_attrs`; N12 `lint-check --inline-imports --stub-assets` for themes that aren't uploaded yet; N13 `render-check --styles`
- [ ] N14 Safe srcset for theme-asset images (check `resize_image_url` on theme asset URLs)

Multi-page learnings (PLAN Milestone 1.5 › A1–A7):

- [ ] **A1 (high)** Explicit page content: write the rule into `docs/MODULE-CONTRACT.md` and `docs/PAGE-JSON.md`; page specs set every copy, link and media field; QA fails a page whose rendered media is a theme fallback
- [ ] **A2 (high)** Hover and pointer-motion contract in `docs/MODULE-CONTRACT.md` (stable wrapper, `translate` lift, rAF-throttled pointer motion on the wrapper); browser-check the button and form-submit hover lift (`_buttons.css:42`, `_forms.css:311`) and change it only if it flickers
- [ ] **A3 (high)** "Variants, not per-page options" rule in `docs/MODULE-CONTRACT.md` and the module template
- [ ] A4 Form Section module (HubSpot form field, editor placeholder, token styling, "(optional)" labels); replaces the Milestone 3 Form Section item
- [ ] A5 Header current-page state (path or page id, ignore `#` links, `aria-current`), with R10
- [ ] A6 Recurring components, one at a time when a second site needs it: Stats variants, page-header Hero, compact CTA, statement list, offering/status tiles, people cards with bio drawer, quote band, notice line, steps/cycle
- [ ] A7 Draft-assets convention in the generation flow (File Manager page media, theme fallbacks only, pre-launch draft-reference list)
- [ ] Fix the stock-module warnings from `verify-modules --preset agile` (2026-10-27): locals `content` (Hero, Card Item) and `logo` (Logo Bar) shadow HubL globals; Logo Bar `content.logos` repeater default isn't an array; Site Footer prints `aria-label` even when empty (module.html:137)

## Milestone 2: Global header and footer

- [x] `globals/Site Header.module`: logo (theme fallback), menu with one dropdown level, CTA, mobile menu, mode handling
- [x] `globals/Site Footer.module`: logo, company name, link columns, social, legal links, disclaimer, copyright, mode handling
- [x] Rewrite `partials/header.html` and `partials/footer.html` as seeded DnD areas (`header_area`, `footer_area`)
- [x] Remove the empty `header_extensions` / `footer_extensions` areas
- [x] Mobile menu and dropdown JS (`Site Header.module/module.js`); sticky is CSS only (`theme.header.sticky`)
- [x] Header style override in Page Controls (`header_style_override`: Theme Default / Solid / Transparent)
- [x] Decide Blank Section: replaced by Section Header; repeated layouts are Section modules with a repeater (Card Grid built)
- [x] Shared card CSS moved to `css/components/_card.css`; dead `.agile-site-header__cta a` selectors removed from `_buttons.css`
- [x] Render-tested on demo with `hs cms lint --debug` and mock data (all header/footer modes)
- [x] Full theme upload to demo (`hs cms upload . Agile --account demo`; files fetched back and match local)
- [x] Review fixes (2026-10-14): footer logo-link name chain, one `Footer` nav with no empty columns, `ftr_*` locals, hidden-footer editor note, shared new-tab rule (`agile.menu_link_attrs`, `agile.new_tab_sr`), hover dropdowns limited to `(hover: hover)` and dismissed by a toggle click, focus kept across the 767px reset, transparent trigger anchored to the first `dnd_area` in `<main>`, sticky + auto-transparent scroll padding, right-anchored last dropdown. Uploaded and render-tested (`lint --debug`)
- [ ] Browser-check the 2026-10-14 header JS/CSS fixes on a published page (click-to-close while hovering, iPad tap, zoom across 767px with focus in the nav, last-item dropdown edge, blog-listing with a Hero in the lower area)
- [ ] Remove stale demo paths (`Agile/docs`, `Agile/field-groups`, `Agile/manifesto.md`, `Agile/TODO.md`, `Agile/modules/Blank Section.module`, `Agile/sections/blank-section.html`); done by hand with the user, not by agents
- [ ] Check editing in the global content editor (T3) and on a published page: menus, dropdown/mobile JS, sticky, transparent overlay
- [ ] Create a menu on demo and check the header dropdown and a footer menu column

## Milestone 3: Templates and site essentials

- [ ] `templates/page.html`: thin page template with `dnd_area "main"`
- [ ] Rework `templates/landing-page.html` to a thin template with `dnd_area "main"`
- [ ] Keep `templates/homepage.html` as a preview/demo only
- [ ] System templates: 404, 500, search results, password prompt, subscription preferences, backup unsubscribe, subscription confirmation
- [ ] Blog listing: featured post, grid, pagination, topic filter
- [ ] Blog post: author, date, reading time, tags, related posts, CTA area
- [ ] Global HubSpot form styling
- [ ] Form Section reference module (see A4)

## Milestone 4: Generation kit

- [ ] `docs/GENERATING-A-SITE.md`: a short Agile supplement to the root `HUBSPOT-SITE-BUILD-PLAYBOOK.md`, not a second playbook (see PLAN Milestone 4)
- [x] Link the toolkit from `README.MD` and PLAN (north star, `BUILD-BRIEF-TEMPLATE.md`, playbook, definition of done); keep them linked, never copied (2026-10-27)
- [ ] `dd-index.js` in the decisions-log template's instructions
- [ ] Decisions-log template for client builds (Agile canon / client extensions / deviations register), modelled on `MadisonCapital/DESIGN-DECISIONS.md`
- [ ] `docs/TOKEN-SHEET.md` and token sheet JSON template
- [ ] `module-template/` starter module folder
- [ ] `docs/PAGE-JSON.md`: an Agile page spec for `utilities/page-build.js` (area `page_sections`), linking to playbook 6.3 for the `layoutSections` structure
- [ ] Bring `MODULE-CONTRACT.md`, `ARCHITECTURE.md`, `SCOPED-CSS.md` and `manifesto.md` in line with the README

## Milestone 5: Automation

- [ ] `Automation/new-site`
- [ ] Validator: add Agile rules to `utilities/module-check.js`, plus the Madison checks (repeater `default` length matches `occurrence.default`, no `href=""` / `aria-label=""`, no HubL tokens in JS, two renders with different `name`s); lint and render with `utilities/lint-check.js`
- [x] Page push script: `utilities/page-build.js` (built 2026-10-16; checked read-only against the Madison draft)
- [ ] Validator passes on the reference modules
- [x] First real `page-build.js --apply` run: draft `224845212223` on demo (Agile-Madison), read-back OK (2026-10-19). Its rendering is still to be checked under Example 1

## Milestone 6: Worked examples

- [ ] Choose the two example designs (recommended: the Madison homepage comp rebuilt on Agile, compared with the Trust build, then a contrasting design)
- [ ] Example 1 built end to end and checked into `Agile/Examples/`. **In progress (2026-10-19):** the Madison comp is built in `Examples/madison/` (git-ignored, client material), uploaded to demo as `Agile-Madison`, and draft page `224845212223` exists. Still to do: the render check against the comp, which needs an editor preview saved as HTML or approval to publish on demo, and the design calls listed in its README
- [ ] Fix the issues Example 1 uncovered
- [ ] Example 2 built from the updated kit
- [ ] Examples added as validator test fixtures

## Milestone 7: Quality and extension mode

- [ ] Accessibility pass (landmarks, focus, keyboard header, contrast, reduced motion)
- [ ] Performance pass (CSS size, images, JS)
- [ ] Extension mode: custom header/footer matching a client's live site
- [ ] Extension mode: grafting guide for partial-site delivery (blog-only, landing pages only)

---

## Later

Ideas from the earlier backlog that still make sense but are not scheduled. Add them when a real project needs them.

- Header extras: mega menu, top bar, hello/announcement bar, site search
- Footer extras: CTA band above the footer, testimonial/proof block
- More reference modules: FAQ, testimonials, stats, pricing, comparison table, team, gallery, blog feed, resource grid
- More saved sections for editors (`sections/`) for common layouts
- Membership templates (login, register, password reset)
- Presets for common client types
