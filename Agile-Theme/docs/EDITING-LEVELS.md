# Agile Editing Levels — Settings Inventory

Every editable design decision in Agile lives at exactly one level. This file lists **every current setting**, its level, what it controls, and how a narrower level overrides it. The rules come from the "Editing levels" section of [../../README.MD](../../README.MD).

## Rules

- **Precedence: Module > Page > Theme.** The broader level sets the default; the narrower level can override it. Where a decision appears at more than one level, the narrowest non-inherit value wins.
- **Every override starts as "inherit".** Page overrides default to "Theme default" (`theme_default`). Module overrides default to `inherit` / `theme`. A newly placed module or new page always looks like the theme until someone changes it.
- **Decide each setting's level once and use it everywhere.** A setting does not move between levels from site to site.
- **No duplicate decisions without an order.** If a decision is editable at two levels, this file must state which one wins.

| Level | Where it's edited | Read in code as |
|---|---|---|
| Theme | Theme settings (`fields.json`) | `theme.*` → CSS custom properties in `css/base/_tokens.css` |
| Global | Global content editor: the Site Header / Site Footer modules seeded by `templates/partials/header.html` / `footer.html` | `module.*` inside `globals/Site Header.module` / `globals/Site Footer.module` |
| Page | Page Controls module | `widget_data.page_controls.*` |
| Module | Module fields: Content, Layout and Advanced groups on HubSpot's Content tab; the Style group on the Style tab | `module.*` (via `macros/agile.html`) |

---

## Theme level (`fields.json`)

| Setting (`theme.` path) | Controls | Narrower override |
|---|---|---|
| `branding.logo` | Fallback site logo for the header and footer | Global: Site Header `content.logo` / Site Footer `content.logo` (the module logo wins; empty falls back to this) |
| `colors.primary` | Primary brand colour (`--agile-color-primary`) | Module `style.background = primary` uses it; no per-module redefinition |
| `colors.secondary` | Secondary brand colour | Module `style.background = secondary` |
| `colors.accent` | Accent colour | Module `style.background = accent` |
| `colors.on_primary` / `on_secondary` / `on_accent` | Readable text colour on a primary / secondary / accent background (used by `.agile-bg--*` and solid buttons) | Module `style.text_color` (inline `--agile-section-text` beats the preset) |
| `colors.text` | Default body text colour | Module `style.text_color` |
| `colors.muted_text` | Secondary/muted text | None |
| `colors.surface` | Alternate section/card surface | Module `style.background = surface` |
| `colors.background` | Page background | Module `style.background` (any non-inherit value) |
| `colors.border` | Borders and dividers | None |
| `typography.heading_font` | Heading font family | None |
| `typography.body_font` | Body font family | None |
| `typography.heading_weight` | Heading font weight | None |
| `typography.h1_size` … `h5_size` | Heading size scale (px) | None (modules choose the heading *level* via `content.heading_level`, not the size) |
| `typography.body_size` | Body font size (px) | None |
| `typography.line_height` | Base line height | None |
| `links.color` / `links.hover_color` | Link colours (`--agile-link-color-base`, `--agile-link-hover-color-base`) | Inside a coloured section links follow the section text colour (`.agile-bg--*` or module `style.text_color`) |
| `links.underline` | Link underline: `always` / `hover` / `none` | Forced to underline inside coloured sections |
| `buttons.primary_style` | Default button style (`solid` / `outline` / `ghost`) applied by `.agile-button` | Module `style.button_style` → CTA `cta.style` |
| `buttons.border_radius` | Button corner radius | None |
| `buttons.padding_y` / `padding_x` | Button padding | None |
| `buttons.transition_duration_ms` | Button hover transition speed | None |
| `buttons.hover_effect` | Button hover effect (lift / sink / grow / none) | None |
| `shadows.card_blur` / `card_opacity` | Card shadow | None |
| `shadows.elevated_blur` / `elevated_opacity` | Elevated shadow | None |
| `shape.radius_sm` / `md` / `lg` / `xl` | Radius scale | None |
| `forms.label_color`, `input_background`, `input_text_color`, `placeholder_color`, `input_border_color`, `focus_color`, `error_color` | Form colours for new HubSpot forms (`--hsf-*`), legacy `.hs-form` markup and `.agile-form`; `focus_color` also drives the global `:focus-visible` outline | Form labels follow the section text colour inside coloured sections |
| `forms.border_width` / `radius` / `field_gap` | Input border width, radius and spacing between fields (px) | None |
| `motion.duration_fast_ms` / `duration_base_ms` / `easing` | Transition durations and easing (`--agile-duration-*`, `--agile-easing`) | None. `prefers-reduced-motion` sets durations to 0 regardless |
| `spacing.section_xs` … `section_xl` | Section padding scale (values behind `agile-pt--*` / `agile-pb--*`, multiplied by `--agile-density`) | Page `spacing_density` (scales every step); Module `layout.spacing.padding_top` / `padding_bottom` (pick a step or `custom`) |
| `layout.container_width` | Standard container width (px) | Page `page_width`; Module `layout.container_width` |
| `layout.content_gap` | Default gap between content items | None |
| `header.mode` | Header mode: `native` / `minimal` / `hidden` | Page `header_mode_override` |
| `header.background_color` / `text_color` | Header colours | None |
| `header.height` | Header height (px); also the hero top offset when the header is transparent | None |
| `header.sticky` | Sticky header (class `agile-site-header--sticky`; a transparent header scrolls away instead) | None |
| `header.show_border` | Bottom border under the header | None |
| `header.transparent_on_hero` / `transparent_text_color` | Applies only when the page's `header_style_override` is Theme Default. When the page's **first section** holds a Hero with a coloured background (`style.background` = primary / secondary / accent / custom), the header overlays that Hero transparently with this text colour (and scrolls away instead of sticking). A Hero further down, or a top Hero on the page background or Surface, keeps the solid header. First-section detection uses HubSpot's `.dnd-section.row-number-1` markup inside `.agile-main`, verified with the demo renderer (`HUBSPOT-PLATFORM.md` › DnD) | Page `header_style_override` (Solid / Transparent) |
| `footer.mode` | Footer mode: `native` / `minimal` / `hidden` | Page `footer_mode_override` |
| `footer.background_color` / `text_color` / `link_color` | Footer colours (muted and legal text are derived from `text_color`) | None |

## Global level (global modules, edited in the global content editor)

The header and footer are global modules seeded by the global partials (see [ARCHITECTURE.md](ARCHITECTURE.md) › Global header and footer). Their content is shared site-wide and is not overridable per page; a page can only change the mode (and, for the header, the style).

| Setting (`module.` path) | Controls | Default / fallback | Narrower override |
|---|---|---|---|
| Site Header `content.logo` | Header logo | Empty: falls back to `theme.branding.logo` | None |
| Site Header `content.logo_link`, `content.logo_alt` | Logo link and alt text (alt also shows as text when there is no logo) | `/`; alt falls back to the image's own alt, then company name, then "Home" | None |
| Site Header `content.navigation_source` | Where the primary navigation comes from: `agile` (links edited in the header module) or `menu` (a HubSpot menu) | `agile` | Page `header_mode_override = minimal` hides navigation |
| Site Header `content.nav_links` | Agile links: up to 8 items, each with up to 8 dropdown links (one level) | About, Services (3 dropdown links), Insights, Contact | — |
| Site Header `content.navigation` | HubSpot menu used when the source is `menu` (one dropdown level) | `default` menu | — |
| Site Header `content.cta`, `content.show_mobile_cta` | Header button and whether it shows on mobile | Empty text: no button | — |
| Site Header `style.logo_max_height` / `logo_max_height_mobile` | Logo height (Style tab) | 48 / 36 px | None |
| Site Footer `content.show_logo`, `content.logo` | Footer logo | Empty: falls back to `theme.branding.logo`. The logo link's name: the logo's alt, then `content.company_name`, then `site_settings.company_name`, then "Home" | None |
| Site Footer `content.company_name`, `about_text`, `disclaimer`, `copyright` | Footer copy; `{year}` in the copyright becomes the current year | Seeded in `footer.html` | Page `footer_mode_override = minimal` keeps only copyright and legal links |
| Site Footer `content.columns` | Up to 4 link columns, each a menu or a list of up to 10 links. All columns share one `<nav aria-label="Footer">`; a column with no links is not rendered (editor-only placeholder) | Empty | — |
| Site Footer `content.social` | Up to 8 social links (icon per network) | Empty | — |
| Site Footer `content.legal_links` | Up to 6 legal links | Seeded: Privacy Policy | — |
| `advanced.*` on both | Anchor id, custom class, visibility | empty | — |

Header colours, height, border and sticky, and all footer colours, stay at Theme level.

## Page level (Page Controls module, `widget_data.page_controls.*`)

| Setting | Controls | Default | Overrides | Narrower override |
|---|---|---|---|---|
| `header_mode_override` | Header mode for this page | `theme_default` | `theme.header.mode` | None |
| `header_style_override` | Header style for this page: Theme Default / Solid / Transparent (overlays the first section). An explicit Solid or Transparent always wins | `theme_default` | `theme.header.transparent_on_hero` | None |
| `footer_mode_override` | Footer mode for this page | `theme_default` | `theme.footer.mode` | None |
| `page_width` | Container width for the whole page (`.agile-width--*`) | `theme_default` | `theme.layout.container_width` | Module `layout.container_width` (`.agile-section-width--*` beats `.agile-width--*` by specificity) |
| `spacing_density` | Compact (×0.7) / relaxed (×1.25) section spacing via `--agile-density` | `theme_default` | `theme.spacing.*` | Module `layout.spacing.*` picks the step; density still scales it. `custom` px padding is not scaled |
| `body_classes` | Extra classes on the page wrapper (`.agile-page`, inside `<body>`) for this page; target them as `.agile-page.my-class` | empty | — | — |
| `page_css` | Page-scoped custom CSS. This is the **only** place for custom CSS; per-module scoped CSS was dropped | empty | — | — |

## Module level (shared field contract)

Section modules (`[S]`) get `layout`, `style` and `advanced`. Component modules (`[C]`) get only `advanced`.

| Field (`module.` path) | Applies to | Controls | Default (inherit) | Overrides |
|---|---|---|---|---|
| `layout.spacing.padding_top` / `padding_bottom` | S | Section top/bottom padding: `none`, `xs`–`xl`, `custom` | `theme` (no class) | `theme.spacing.*` and Page `spacing_density` |
| `layout.spacing.padding_top_custom` / `padding_bottom_custom` | S | Custom padding in px (visible only when choice is `custom`) | 80 | — |
| `layout.container_width` | S | Container width inside this section: narrow / standard / wide / full | `inherit` | Page `page_width`, `theme.layout.container_width` |
| `layout.text_align` | S | Text alignment: left / center | `inherit` | Theme CSS default (left) |
| `style.background` | S | Section background: surface / primary / secondary / accent / custom | `inherit` (page background) | `theme.colors.background` |
| `style.background_color` | S | Custom background colour (visible only when `background = custom`) | — | — |
| `style.text_color` | S | Text colour for this section; headings, links, muted text and outline buttons follow it. Empty default (`{"color": null, "opacity": null}`) = inherit | inherit | `theme.colors.text`, and the readable `on_*` colour set by a background variant |
| `style.button_style` | S (modules with buttons; Logo Bar omits it) | Button style for CTAs in this module: primary / secondary / ghost / link | `inherit` | `theme.buttons.primary_style` |
| `advanced.component_id` | S, C | Anchor `id` on the wrapper | empty | — |
| `advanced.custom_class` | S, C | Extra class on the wrapper (hook for `page_css`) | empty | — |
| `advanced.visibility.hide_on_mobile` / `hide_on_desktop` | S, C | Hide below / above the 767px breakpoint | false | — |
| `content.<…>.cta.style` (where a module has a CTA) | S, C | This button's style | `inherit` | `style.button_style` → `theme.buttons.primary_style` |
| `content.heading_level` | S, C | Semantic heading level h1–h4 (size comes from the theme scale) | Hero `h1`; others `h2`; Card Item `h3` | — |

Content fields (`content.heading`, `content.body_text`, images, `cta.text`, `cta.link`, …) are per-instance content, not overrides, and have no broader default.

### Button style resolution

`cta.style` (if not `inherit`) → `module.style.button_style` (if not `inherit`) → `theme.buttons.primary_style` (the bare `.agile-button` class). Implemented by `agile.resolve_style()` in `macros/agile.html`.

---

## Module-specific variants

These fields exist only on one module. They are design variants, not overrides of a broader level.

| Module | Field | Values (default) |
|---|---|---|
| Hero | `layout.media_position` | `right` / `left` / `none` (`right`) |
| Hero | second button look | `content.secondary_cta.style` starts as `inherit` like every CTA. When both it and `style.button_style` are `inherit`, Hero CSS gives the second button a ghost look; any explicit style wins |
| Logo Bar | `layout.columns` | `3`–`6` (`5`) |
| Logo Bar | `layout.logo_max_height` | 20–160 px (48) |
| Logo Bar | `style.logo_treatment` | `original` / `grayscale` / `grayscale-hover` (`grayscale-hover`) |
| Card Item | `style.card_style` | `default` (Raised) / `outlined` / `flat` (`default`) |
| Section Header, Card Grid | header alignment | follows `layout.text_align`; "Default" centres the header and leaves card text left-aligned (Card Grid card text is centred only when Centre is chosen explicitly) |
| Card Grid | `layout.columns` | `2` / `3` / `4` on desktop (`3`); 3 and 4 drop to 2 on tablet, all to 1 on phones |
| Card Grid | `style.card_style` | `default` (Raised) / `outlined` / `flat` (`default`) |
| Card Grid | `content.card_heading_level` | `h2`–`h5` (`h3`) |

## Open issues

- Header and footer colours have no Page Controls override. Only the mode (and the header style) is overridable per page.
- Resolved: the logo is Global (module field) with the Theme logo as fallback.
