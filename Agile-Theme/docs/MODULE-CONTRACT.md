# Agile Module Contract

Every Agile module follows this contract, so that editors see the same tabs, the same override fields and the same behaviour in every module. The rules behind it are in the "Strict around the edges, free inside" and "Editing levels" sections of [../../README.MD](../../README.MD). [EDITING-LEVELS.md](EDITING-LEVELS.md) lists each setting by level.

## Two tiers (plus global modules)

| Tier | Root element | Standard field groups | Wrapper macro | Examples |
|---|---|---|---|---|
| **Section [S]** | `<section>` with `.agile-section` and an `.agile-container` child | `layout`, `style`, `advanced` | `agile.section_attrs()` | Hero, Rich Section, Section Header, Card Grid, Logo Bar |
| **Component [C]** | Any element; no section chrome | `advanced` only | `agile.component_attrs()` | Card Item |
| **Global [G]** | A landmark (`<header>`, `<footer>`) | `advanced` (+ a module-specific `style` group if needed) | `agile.component_attrs()` | Site Header, Site Footer |

A Section module owns its background, top and bottom padding, container **and any grid inside it**. A Component module fills whatever DnD column it is placed in.

**Rule: Section modules own their grid.** A `dnd_area` cannot be placed inside a module on standard CMS (`HUBSPOT-PLATFORM.md` › DnD), so a module cannot act as a container for other modules. A repeated layout (cards, stats, features, team members) is therefore one Section module with a repeater, which renders the header band, the grid and every item itself. Card Grid is the reference: a header, a `content.cards` repeater (1 to 12) and `layout.columns`. A section that is only a heading band (eyebrow, heading, intro, optional button) above other content is a **Section Header**: an ordinary, self-contained Section module.

**Components are for standalone use.** Use a Component module (Card Item) only for a one-off block an editor places by hand in a DnD column. Background and padding around it come from HubSpot's native DnD **Section styles** in the editor, which do not set text, link or button colours, so framed Components add `.agile-reset-colors` to stay readable. A Section module that renders the same kind of item reuses the Component's class names (Card Grid renders `.agile-card-item`), and the shared rules live once in a theme partial (`css/components/_card.css`), not in either module's `module.css`.

**Global modules** live in `globals/` and are placed only by a global partial (`templates/partials/header.html`, `footer.html`), never by editors: `meta.json` has `"global": false` and `"is_available_for_new_content": false`. Their content is edited in HubSpot's global content editor. They read the theme and Page Controls settings that decide their mode themselves (see [ARCHITECTURE.md](ARCHITECTURE.md) › Global header and footer). Their CSS lives in `css/components/_header.css` / `_footer.css` (loaded by `main.css`); their `module.css` may be a comment-only stub. Use prefixed local variable names (`hdr_logo`, `hdr_content`, `ftr_content`, `footer_logo`): an undefined local named like a HubSpot built-in (`logo`, `content`) falls through to the built-in (`HUBSPOT-PLATFORM.md` › HubL).

## Tabs and field paths

Fields are grouped in this order: **Content, Layout, Style, Advanced**. Content fields are specific to each module. The other groups come from the shared field groups in `field-groups/`.

HubSpot's module editor has two tabs, **Content** and **Style**. The `style` group carries `"tab": "STYLE"` (set once in `field-groups/style.json`, so every module that uses it gets it), and shows on the Style tab. `content`, `layout` and `advanced` have no `tab` key and stay on the Content tab. Card Item's own `style` group sets `"tab": "STYLE"` itself.

HubSpot's rules for the Style tab (developers.hubspot.com, "Module and theme fields overview" › Style fields), which the composer enforces:

- All of a module's style fields go in **one** top-level group with `"tab": "STYLE"`. That group may contain nested groups.
- Only these field types may be module style fields: alignment, gradient, spacing, background image, border, boolean, choice, number, color, icon, image, font, text alignment. `text`, `richtext`, `link` and similar content types cannot go in the Style tab.
- Style fields are still read as `module.<group>.<field>`, so `module.style.*` paths are unchanged.

Agile's style children are all `choice`, `color` or `number`, so they comply. Logo Bar adds a `choice`, Card Item and Card Grid add `card_style` (a `choice`), and Site Header's style group holds two `number` fields (`logo_max_height`, `logo_max_height_mobile`). The docs don't say whether `visibility` rules work inside the Style tab; `style.background_color` relies on one, so check it in the editor.

### Content (module-specific)

- Expose every piece of content the design shows.
- Headings use `content.heading` (text) plus `content.heading_level` (choice `h1`–`h4`). The default is `h1` for a Hero, `h3` for Card Item and `h2` for everything else.
- Body copy uses `content.body_text`. `body` is a reserved HubSpot field name, as are `label` and `name`.
- Each button is a `cta` group placed inside `content`, renamed per CTA (`content.cta`, `content.primary_cta`, `content.secondary_cta`). It has three fields:
  - `text` (text). An empty value hides the button.
  - `link` (link)
  - `style`: `inherit` (default), `primary`, `secondary`, `ghost` or `link`.

### Layout (`layout`, Section modules)

| Path | Values | Default |
|---|---|---|
| `layout.spacing.padding_top` / `padding_bottom` | `theme`, `none`, `xs`, `sm`, `md`, `lg`, `xl`, `custom` | `theme` |
| `layout.spacing.padding_top_custom` / `padding_bottom_custom` | number, px, step 4. Only shown when the matching choice is `custom` | 80 |
| `layout.container_width` | `inherit` (Page default), `narrow`, `default` (Standard), `wide`, `full` | `inherit` |
| `layout.text_align` | `inherit`, `left`, `center` | `inherit` |

Module-specific layout variants are appended to this group, for example Hero `layout.media_position` and Logo Bar `layout.columns`.

### Style (`style`, Section modules)

| Path | Values | Default |
|---|---|---|
| `style.background` | `inherit` (page background), `surface`, `primary`, `secondary`, `accent`, `custom` | `inherit` |
| `style.background_color` | colour. Only shown when `background` is `custom` | — |
| `style.text_color` | colour. An empty default (`{"color": null, "opacity": null}`) means inherit | empty |
| `style.button_style` | `inherit`, `primary`, `secondary`, `ghost`, `link` | `inherit` |

**Rule: omit standard fields a module cannot use.** A standard field that would have no effect in a module is left out with `$omit`, so editors never see a control that does nothing. Today that means `button_style`: Logo Bar has no buttons, so it uses `{"$use": "style", "$omit": ["button_style"]}`. Omit only fields the module truly cannot use, never ones it merely does not use yet, and keep the remaining standard paths unchanged so the macros still find them. Module-specific style variants are appended, for example Logo Bar `style.logo_treatment`. Card Item, a Component, keeps its own `style.card_style` group.

### Advanced (`advanced`, all modules)

| Path | Type | Default |
|---|---|---|
| `advanced.component_id` | text: the anchor `id` (lower-cased; invalid characters are stripped) | empty |
| `advanced.custom_class` | text: extra classes on the wrapper, for use as a hook in Page Controls `page_css` | empty |
| `advanced.visibility.hide_on_mobile` | boolean (767px and below) | false |
| `advanced.visibility.hide_on_desktop` | boolean (768px and above) | false |

There is **no per-module custom CSS field and no animation group.** Custom CSS lives only at page level (see [SCOPED-CSS.md](SCOPED-CSS.md)).

### Precedence

Every override starts as `inherit` or `theme`. The narrower level wins: **Module > Page > Theme**. A button's style is chosen in this order:

1. `cta.style`
2. `module.style.button_style`
3. `theme.buttons.primary_style`, which is the bare `.agile-button` class

`agile.resolve_style()` implements this order.

## Building fields: the composer

Modules do not hand-write `fields.json`. Each module has a `fields.source.json` that references the shared groups. `Automation/compose-fields.js` (Node, no dependencies) expands it into the module's `fields.json`.

```json
[
  {"name": "content", "label": "Content", "type": "group", "children": [
    {"name": "heading", "label": "Heading", "type": "text", "default": "Headline"},
    {"name": "heading_level", "label": "Heading level", "type": "choice", "display": "select",
     "choices": [["h1","H1"],["h2","H2"],["h3","H3"],["h4","H4"]], "default": "h2"},
    {"$use": "cta", "name": "primary_cta", "label": "Primary button", "$defaults": {"text": "Get started"}}
  ]},
  {"$use": "layout", "$defaults": {"spacing.padding_top": "lg"}},
  {"$use": "style"},
  {"$use": "advanced"}
]
```

- **Directives:**
  - `$use`: insert a group. Plain keys on the same element override the group's own properties.
  - `$defaults`: set the default of a child, found by its dotted path.
  - `$omit`: remove a child.
  - `$prepend` / `$append`: add fields at the start or end of the group.
- **Field ids:** the composer gives every field without an explicit id a path-based one, for example `layout__spacing__padding_top`. HubSpot requires ids to be unique across a module, and the shared groups repeat names.
- **Commands:** run these from `Agile/`.
  - `node Automation/compose-fields.js` regenerates the files.
  - `node Automation/compose-fields.js --check` must pass before an upload.
  - `--self-test` runs the composer's own tests.
- **Local-only files:** `fields.source.json` and `field-groups/` stay local. `Agile-Theme/.hsignore` keeps them out of uploads, but only when `hs` is run from inside `Agile-Theme/`.

Full syntax is in `Agile/Automation/README.md` and `field-groups/README.md`.

## Markup: the shared macros

Every module imports the macro library and uses it for the wrapper, headings, buttons, links and images. Modules do not build these by hand.

```jinja
{% import "../../macros/agile.html" as agile %}
<section {{ agile.section_attrs(module, "agile-hero", extra_classes) }}>
  <div class="agile-container"> … </div>
</section>
```

| Macro | Output |
|---|---|
| `section_attrs(module, base_class, extra_classes="")` | Attribute string for a Section module's `<section>`. It includes `id` (only when set) and `class="agile-section <base> agile-pt--X agile-pb--Y agile-bg--B agile-align--A agile-section-width--W <hide classes> <custom_class> <extra>"`, leaving out any modifier whose value is inherit or theme. It adds `data-agile-module="<base>"`. It adds a `style` attribute only when one of `--agile-module-pt`/`-pb`, `--agile-section-bg` or `--agile-section-text` is needed. |
| `component_attrs(module, base_class, extra_classes="")` | `id`, `class` (base, hide classes, custom_class, extra) and `data-agile-module` for a Component module. |
| `link_attrs(link)` | `href` plus `target="_blank"` and a single combined `rel` (`noopener noreferrer`, `nofollow`, `sponsored`, `ugc`). Outputs nothing when there is no href. |
| `new_tab_sr(link)` | `<span class="u-sr-only"> (opens in a new tab)</span>` when the link opens a new tab (a link field's `open_in_new_tab`, or a menu node's `linkTarget == "_blank"`), else nothing. |
| `menu_link_attrs(node)` | `link_attrs` for a `menu()` node, plus `target="_blank" rel="noopener noreferrer"` only when `node.linkTarget == "_blank"`. Used by Site Header and Site Footer. |
| `button(text, link, style="")` | `<a class="agile-button[ agile-button--STYLE]">`, with the `new_tab_sr` cue when the link opens a new tab. Outputs nothing when text or href is empty. |

**New-tab rule.** A menu item opens a new tab only when `linkTarget == "_blank"` (header and footer both use `menu_link_attrs`). Every text link that opens a new tab puts `agile.new_tab_sr(link)` inside the `<a>`, after its text (`button()` does this itself). Icon-only links (footer social) put " (opens in a new tab)" in their `aria-label` instead.
| `resolve_style(local, fallback="")` | The first value that is not `inherit`, `theme` or empty. Otherwise `""`, which means the theme default. |
| `image(img, sizes="100vw", loading="lazy", class="")` | Responsive `<img>` with a `resize_image_url` srcset (480/768/1024/1440/1920 w, never above the original width), width/height when known, and escaped alt. Outputs nothing when `src` is empty. |
| `heading(text, level="h2", class="")` | `<hN>` with the level whitelisted to h1–h6 (otherwise h2). Outputs nothing when the text is empty. |
| `color_value(c)` | A colour field as `#hex`, or as `rgba()` when opacity is below 100. |

Every macro escapes what it outputs and is whitespace-controlled, so it can sit inside a tag. The full reference is in `macros/README.md`.

**Relative paths.** Paths resolve from the folder that holds the file (`HUBSPOT-PLATFORM.md` › Paths, confirmed on demo). From `modules/<Name>.module/module.html`, `../` is `modules/`, so the theme root is **`../../`**: import with `../../macros/agile.html` and load assets with `get_asset_url("../../images/…")`. From `templates/*.html` and `sections/*.html` the theme root is `../`; from `templates/layouts/*` and `templates/partials/*` it is `../../`.

## CSS rules

- Module CSS lives in `module.css` and uses BEM under the module's base class, for example `.agile-hero__title` and `.agile-hero--media-left`.
- Do not hardcode hex colours or font names. Use `var(--agile-*)` tokens. Module-local custom properties are fine, for example `--agile-hero-measure`.
- Prefer the context-aware tokens: `--agile-heading-color`, `--agile-text-muted`, `--agile-link-color` and `--agile-color-border`. They adapt inside coloured sections.
- The theme provides these classes. Modules should not restyle them:
  - **Backgrounds:** `.agile-bg--{surface,primary,secondary,accent,custom}` set both the background and readable text colours.
  - **Padding:** `.agile-pt--*` / `.agile-pb--*` pick a step on the theme spacing scale, multiplied by `--agile-density`.
  - **Alignment and width:** `.agile-align--{left,center}`, and `.agile-section-width--*`, which beats the page-level `.agile-width--*`.
  - **Visibility:** `.agile-hide-mobile` / `.agile-hide-desktop`.
  - **Buttons:** `.agile-button` with the `--primary`, `--secondary`, `--ghost` and `--link` modifiers, and `.agile-button-group`.
  - **Text:** `.agile-eyebrow`, `.agile-richtext`.
  - **Light cards:** `.agile-reset-colors`, for a light card placed inside a coloured section.
- If a module needs a different default padding, it should apply it only when padding is left on "Theme default". The Hero does this with `.agile-section.agile-hero:not([class*="agile-pt--"])`, so the editor's choice still wins.

## Module files

| File | Rule |
|---|---|
| `fields.source.json` | The source of truth for fields (local only). |
| `fields.json` | Generated by the composer. Do not edit it by hand. |
| `module.html` | Imports the macro library before any output (line 1, or straight after a leading `{# … #}` comment) and uses the wrapper macro on the root element (`section_attrs` for Section modules, `component_attrs` for Component and global modules). |
| `module.css` | Tokens only. Responsive rules at the theme's 767px breakpoint. Rules shared by more than one module go in a `css/components/` partial included by `main.css` instead. |
| `module.js` | May be empty. |
| `meta.json` | No `module_id` (Agile is a standalone theme, not a child theme). Contains `label`, `host_template_types` and `is_available_for_new_content`. Do not rely on `tags`: HubSpot drops them silently on upload (see `HUBSPOT-PLATFORM.md`, "Module meta.json is normalized on upload"). |

## Seeding modules from templates

When a template or section seeds a module, the `dnd_module` arguments must use the field paths above:

```jinja
{% dnd_module "lp_hero" path="../modules/Hero.module",
  content={ "heading": "…", "primary_cta": { "text": "Start", "link": { "url": { "type": "EXTERNAL", "href": "#next" } } } },
  style={ "background": "surface" },
  advanced={ "component_id": "lp-hero" }
%}
```

The `dnd_module` `path` is resolved from the template's own folder: `../modules/` from `templates/*.html` and from `sections/*.html`; `../../globals/` from `templates/partials/*`. Agile always writes the `.module` suffix (both forms render). Seeded group children that are left out fall back to their `fields.json` defaults.
