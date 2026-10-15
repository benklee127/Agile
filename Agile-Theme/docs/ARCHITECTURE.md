# Agile Architecture Overview

## Goal

Agile is a standalone HubSpot theme framework built to support two primary delivery modes:

1. **Full Site Mode** — Agile owns the site infrastructure, design system, templates, and modules.
2. **Extension Mode** — Agile is used for blogs, landing pages, resource pages, or campaign content that may need to match an existing client site.

---

## System Layers

### 1. Theme Tokens

The theme editor (`fields.json`) defines base tokens for colours (including the readable `on_*` colours), typography, links, buttons, shadows, shape, forms, motion, spacing, layout, header and footer. `css/base/_tokens.css` maps the tokens to CSS custom properties (`--agile-*`), and every other stylesheet reads those properties.

Allowed field types in `theme fields.json`: `color`, `font`, `number`, `choice`, `boolean`, `image`, `group` only. `text`, `link`, and `richtext` are not supported — decompose into structured equivalents.

### 2. Infrastructure

The base layout (`templates/layouts/base.html`), the global header and footer (see "Global header and footer" below), and the Page Controls module establish the page shell. Page Controls can override, for a single page:
- the header and footer modes (native, minimal, hidden)
- the header style (solid or transparent over the first section)
- the page width
- the spacing density
- extra page-wrapper classes (applied to `.agile-page`)
- page-scoped CSS

### 3. Templates

Page templates extend the base layout and use `{% dnd_area %}` to create editor-composable pages. Editors can add, remove, and reorder sections via HubSpot's page editor.

### 4. Modules — Two-Tier Model

Modules follow a two-tier contract:

**Section modules [S]**
- Always full-width
- Own their background color, top/bottom padding, and container
- Render a `<section class="agile-section ...">` as the root element
- Own any grid inside them: repeated items (cards, stats, features) are a repeater inside one Section module
- Examples: Hero, Rich Section, Section Header, Card Grid, Logo Bar; later Stats, Features

**Component modules [C]**
- No section chrome — no `.agile-section` padding, no own background
- Width-agnostic — fill whatever DnD column they are placed in
- For standalone use: a one-off block an editor places by hand in a DnD column
- Examples: Card Item

**Platform constraint:** `{% dnd_area %}` cannot be placed inside module HTML in standard HubSpot CMS (requires CMS Hub Enterprise). Multi-item, shared-background layouts are therefore pre-composed Section modules with a repeater (Card Grid), not a generic container that holds other modules. See `HUBSPOT-PLATFORM.md`.

**Global modules [G]** (`globals/Site Header.module`, `globals/Site Footer.module`) are placed only by the global partials. See the next section.

### 4a. Global header and footer

The header and footer follow the global partial → seeded DnD area → global module pattern:

```
templates/layouts/base.html
  {% global_partial path="../partials/header.html" %}
    templates/partials/header.html   (templateType: global_partial)
      {% dnd_area "header_area" label="Site Header" %}
        dnd_section → dnd_column → dnd_row →
          {% dnd_module path="../../globals/Site Header.module", content={ seed } %}
  … <main> …
  {% global_partial path="../partials/footer.html" %}
    templates/partials/footer.html → dnd_area "footer_area" → … → globals/Site Footer.module
```

- **Seed, then global content.** The `content={…}` in the partial is only the starting value for a new portal (header: Agile navigation links About / Services (with three dropdown links) / Insights / Contact, logo link `/`, a "Book a call" button to `/contact`; footer: company name and about text, three link columns (Company, Services, Resources), a LinkedIn link, Privacy Policy / Terms of Use / Disclosures, a placeholder disclaimer and a `© {year}` copyright line). Group children left out of the seed fall back to the module's `fields.json` defaults. After the first edit, HubSpot stores the content as global content, shared by every page that uses the partial.
- **Editing.** Editors change the header and footer in HubSpot's **global content editor** (open a page that uses the partial, select the header or footer, and choose to edit the global content; the exact menu path on demo is part of the T3 check in [HUBSPOT-TESTING.md](HUBSPOT-TESTING.md)). They do not edit them per page.
- **Mode resolution happens inside the module**, not in the partial or the layout:
  - Header and footer mode: `theme.header.mode` / `theme.footer.mode`, replaced by Page Controls `header_mode_override` / `footer_mode_override` when that is `native`, `minimal` or `hidden` (`theme_default` keeps the theme value). `hidden` renders nothing on the live page; in the editor both the header and the footer show a note instead (`.agile-site-header-note` / `.agile-site-footer-note`); `minimal` renders the logo and button (header) or the copyright and legal links (footer).
  - Header style: Page Controls `header_style_override` = `solid` or `transparent` always wins. `theme_default` follows `theme.header.transparent_on_hero`: the module adds `agile-site-header--auto-transparent`, and CSS makes the header transparent only when the first DnD section of `.agile-main` (`.dnd-section.row-number-1`, verified on demo) holds a Hero with a coloured background.
  - Sticky: `theme.header.sticky` only; no page override.
- **CSS** for both lives in `css/components/_header.css` and `_footer.css`, loaded once by `main.css`. The header's mobile menu and dropdown JS is in the module's `module.js` (vanilla, no jQuery). `base.html` adds the `agile-js` class in the `<head>` before first paint so the no-JS mobile menu state never flashes.
- **Logo.** Each module has its own logo field; when it is empty the module falls back to `theme.branding.logo`.

### 5. Shared Module Foundations

- **Field groups** (`field-groups/`): the standard override set (`layout`, `style`, `advanced`, `cta`). `Automation/compose-fields.js` composes these locally into each module's `fields.json`, starting from a `fields.source.json`.
- **Macros** (`macros/agile.html`): wrapper attributes, links, buttons, responsive images and headings. Every module imports them.
- **Section CSS** (`css/base/_sections.css`): `.agile-bg--*`, `.agile-pt--*` / `.agile-pb--*`, `.agile-align--*`, `.agile-section-width--*` and the visibility classes, which the macros output.

See [MODULE-CONTRACT.md](MODULE-CONTRACT.md).

### 6. Escape Hatch

Custom CSS is page-level only, through Page Controls `page_css`. There is no per-module scoped CSS. Page CSS targets modules through `data-agile-module`, `advanced.custom_class` or `advanced.component_id`. See [SCOPED-CSS.md](SCOPED-CSS.md).

---

## Module Field Contract

Fields are grouped as Content / Layout / Style / Advanced. Section modules get all three standard groups; Component modules get only Advanced.

| Group | Purpose |
|-----|---------|
| **Content** | Text, images, links, repeaters, `heading_level`, CTAs (shared `cta` group) |
| **Layout** | Spacing (`theme`/`none`/`xs`–`xl`/`custom`), container width, text alignment, plus module-specific layout variants |
| **Style** | Background (`inherit`/surface/primary/secondary/accent/custom), text colour, button style, plus module-specific style variants |
| **Advanced** | Anchor ID, custom class, visibility (hide on mobile / desktop) |

Every override starts as inherit; the narrower level wins (Module > Page > Theme). See [EDITING-LEVELS.md](EDITING-LEVELS.md).

---

## Current Implementation State

Built:
- Standalone theme scaffold with full token system
- Page Controls module (header mode, header style, footer mode, width, spacing, body classes and page CSS per page)
- DnD page templates (Homepage, Landing Page) and saved sections
- Global header and footer: `globals/Site Header.module` (logo, menu with one dropdown level, CTA, mobile menu) and `globals/Site Footer.module` (logo, company name, link columns, social, legal links, disclaimer, copyright), seeded through `header_area` / `footer_area`
- Section modules: Hero [S], Rich Section [S], Section Header [S], Card Grid [S], Logo Bar [S]
- Component modules: Card Item [C]
- Shared field groups (`field-groups/`) and the local composer (`Automation/compose-fields.js`)
- Shared macro library (`macros/agile.html`)
- Section CSS contract (backgrounds, padding, alignment, width, visibility), the shared card partial, and theme-driven links, forms, motion, header and footer

Next:
- Check the header and footer in the global content editor and on a published page on demo (milestone check T3)
- More pre-composed Section modules: Stats [S], Features [S], Left-Right Content [S]
- Thin page templates and system templates (Milestone 3)
