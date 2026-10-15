# Agile macros

`macros/agile.html` is Agile's shared HubL macro library. Every module uses it for wrapper markup, links, buttons, images and headings, so all of these behave the same everywhere. The file contains only macro definitions plus HubSpot's `templateType: none` annotation, so importing it outputs nothing.

## Import line

> **Confirmed by platform test T1 on demo** (see `HUBSPOT-PLATFORM.md` › Paths). From `modules/<Name>.module/module.html`, use **`../../`** to reach the theme root. The upload checker resolves `../` to `modules/`, and an unguarded failed import makes the module upload fail. The page renderer accepts both `../` and `../../`. `../../` is the only form that works for both. Confirmed for upload and render, 2026-10-13.

| File location | Import line |
|---|---|
| `modules/<Name>.module/module.html` | `{% import "../../macros/agile.html" as agile %}` |
| `templates/<x>.html` | `{% import "../macros/agile.html" as agile %}` |
| `templates/layouts/*.html`, `templates/partials/*.html` | `{% import "../../macros/agile.html" as agile %}` |
| `sections/*.html` | `{% import "../macros/agile.html" as agile %}` |

Put the import at the top of `module.html`, once. Asset paths in a module follow the same rule: `get_asset_url("../../images/...")`.

## Macro reference

| Macro | Output |
|---|---|
| `section_attrs(module, base_class, extra_classes="")` | Attribute string for a Section module's `<section>`: `id`, `class`, `data-agile-module`, and `style` only when it's needed |
| `component_attrs(module, base_class, extra_classes="")` | Attribute string for a Component module's root element: `id`, `class` (base, visibility, custom), `data-agile-module` |
| `link_attrs(link)` | `href` plus `target`/`rel`. Outputs nothing when there's no href |
| `new_tab_sr(link)` | Visually hidden " (opens in a new tab)" span when the link (field, or menu `linkTarget` string) opens a new tab. Put it inside the `<a>` after the text |
| `menu_link_attrs(node)` | `link_attrs` for a `menu()` node; adds `target`/`rel` only when `linkTarget == "_blank"` |
| `button(text, link, style="")` | `<a class="agile-button[ agile-button--STYLE]" …>`. Adds the `new_tab_sr` cue itself. Outputs nothing when the text or the href is empty |
| `resolve_style(local, fallback="")` | First value that isn't `""`, `inherit` or `theme`. Otherwise `""`, which means the theme default |
| `image(img, sizes="100vw", loading="lazy", class="")` | Responsive `<img>` with a srcset of 480–1920 px widths that never exceeds the original. Outputs nothing when `img.src` is empty |
| `heading(text, level="h2", class="")` | `<hN>`, with the level limited to h1–h6. Outputs nothing when the text is empty |
| `color_value(c)` | Turns a colour field into `#rrggbb`, or `rgba(...)` when opacity is below 100. Outputs `""` when the colour is unset |

The header comment in `agile.html` documents every argument.

### What `section_attrs` reads

These are the exact paths from the module field contract. A missing path is treated as "inherit" and adds nothing.

| Field path | Becomes |
|---|---|
| `layout.spacing.padding_top` / `padding_bottom` | `agile-pt--X` / `agile-pb--X` (`theme` adds no class) |
| `layout.spacing.padding_top_custom` / `padding_bottom_custom` | `--agile-module-pt` / `--agile-module-pb` in px, only when the matching choice is `custom` |
| `layout.container_width` | `agile-section-width--narrow\|default\|wide\|full` (`inherit` adds no class) |
| `layout.text_align` | `agile-align--left\|center` |
| `style.background` | `agile-bg--surface\|primary\|secondary\|accent`. `custom` adds `agile-bg--custom` plus `--agile-section-bg`, but only when `style.background_color` is set |
| `style.text_color` (+ optional `style.override_text_color`) | `--agile-section-text`. Skipped when the toggle exists and is off, or when the colour is unset |
| `advanced.component_id` | `id` (lowercased, spaces become `-`, other characters stripped) |
| `advanced.custom_class` | appended to `class` |
| `advanced.visibility.hide_on_mobile` / `hide_on_desktop` | `agile-hide-mobile` / `agile-hide-desktop` |

`style.button_style` isn't used by `section_attrs`. Pass it to `resolve_style` when you render a button.

## Example: Section module (Hero)

```jinja
{% import "../../macros/agile.html" as agile %}
<section {{ agile.section_attrs(module, "agile-hero") }}>
  <div class="agile-container">
    <div class="agile-hero__grid">
      <div class="agile-hero__content">
        {{ agile.heading(module.content.heading, module.content.heading_level|default("h1", true), "agile-hero__title") }}
        <div class="agile-hero__body">{{ module.content.body_text }}</div>
        <div class="agile-button-group agile-hero__actions">
          {{ agile.button(module.content.primary_cta.text, module.content.primary_cta.link, agile.resolve_style(module.content.primary_cta.style, module.style.button_style)) }}
          {{ agile.button(module.content.secondary_cta.text, module.content.secondary_cta.link, agile.resolve_style(module.content.secondary_cta.style, module.style.button_style)) }}
        </div>
      </div>
      <div class="agile-hero__media">
        {{ agile.image(module.content.image, "(min-width: 768px) 50vw, 100vw", "eager", "agile-hero__img") }}
      </div>
    </div>
  </div>
</section>
```

A Hero with default fields (everything set to inherit or theme default) renders as:

```html
<section class="agile-section agile-hero" data-agile-module="agile-hero">
```

With custom top padding, a custom 50% red background, a text colour override, a narrow width, an anchor and hide-on-mobile, it renders as:

```html
<section id="my-anchor" class="agile-section agile-hero agile-pt--custom agile-bg--custom agile-section-width--narrow agile-hide-mobile" data-agile-module="agile-hero" style="--agile-module-pt:40px;--agile-section-bg:rgba(255, 0, 0, 0.5);--agile-section-text:#ffffff;">
```

## Example: Component module (Card Item)

Component modules get only the `advanced` group. They have no section chrome and fill their DnD column.

```jinja
{% import "../../macros/agile.html" as agile %}
{% set cta = module.content.cta %}

<article {{ agile.component_attrs(module, "agile-card-item") }}>
  {{ agile.image(module.content.image, "(min-width: 768px) 33vw, 100vw", "lazy", "agile-card-item__img") }}
  {{ agile.heading(module.content.heading, module.content.heading_level|default("h3", true), "agile-card-item__title") }}
  <div class="agile-card-item__text agile-richtext">{{ module.content.body_text }}</div>
  {{ agile.button(cta.text, cta.link, agile.resolve_style(cta.style)) }}
</article>
```

A plain text link, without button styling:

```jinja
<a class="agile-card-item__link" {{ agile.link_attrs(module.content.link) }}>Read more</a>
```

Check first that the link has an href, because `link_attrs` outputs nothing when there isn't one.

## Rules for module authors

- Pass raw field values. The macros do all the escaping, so don't pre-escape.
- Never write the `<section>` attributes, `rel`/`target` logic or `<img>` srcset by hand. Use the macros.
- Button style precedence is CTA `style` > `module.style.button_style` > theme. Express it with `resolve_style(cta.style, module.style.button_style)`.
- Don't add inline colour styles. Colour overrides travel as CSS custom properties through `section_attrs`.
- Rich text (`body_text`) is printed directly and isn't passed through a macro.

## Platform assumptions still to check

These were checked against the HubSpot docs where the docs cover them. The rest come from Jinjava behaviour and from other themes, and haven't been tested on a portal.

1. **Import path.** Settled: `../../macros/agile.html` (T1, `HUBSPOT-PLATFORM.md` › Paths). Confirmed for both upload and render; `get_asset_url("../../images/...")` renders the correct URL.
2. **Sibling macro calls inside an imported file.** `button` calls `link_attrs`, and `section_attrs` calls `color_value`. Confirm these resolve when the file is imported under an alias.
3. **A macro parameter named `class`** (`image`, `heading`). If Jinjava rejects it, rename it to `css_class`. Passing it as a positional argument always works.
4. **`escape_url`** keeps relative (`/path`) and `#anchor` hrefs intact. `mailto:`/`tel:` links skip it and use `escape_attr`, because the docs don't list which schemes `escape_url` allows.
5. **`resize_image_url(src, width, 0, 0)`** returns a resized URL for File Manager images. srcset is only built for URLs that contain `/hubfs/`, `hubspotusercontent` or `hubspot.net`, that aren't SVG or GIF, and that have a known `width`. HubSpot doesn't resize images larger than 4096 px.
6. **Unset colour field.** The docs show only `{"color": "#…", "opacity": N}` defaults and don't say whether `"color": null` is accepted. `color_value` treats an empty or null `.color` as unset either way. If a null default is rejected, use the `override_text_color` toggle, which `section_attrs` already supports.
7. The `is string` test and `regex_replace` filter work as they do in the docs.

## Path evidence (historical)

Before T1 ran, the module contract said `../` was the theme root from a module, which treats an `X.module` folder as a single file. T1 on demo disproved that: `{% import "../macros/test.html" %}` from a module resolved to `<theme>/modules/macros/test.html`, and `"../../macros/test.html"` resolved to the theme-root file. The full result is in `HUBSPOT-PLATFORM.md` › Paths.

The local evidence gathered before the test pointed the same way:

- FreshJuice (a published theme with the same flat layout as Agile, `theme/modules/<name>.module/` and `theme/macros/`): `theme/modules/navigation-bar.module/module.html:1` has `{% from '../../macros/slugify.html' import slugify %}`.
- Base-Trust: every module's `get_asset_url` uses a path relative to `X.module/`, for example `modules/Cards/Cards.module/module.html:1` → `get_asset_url('../Cards.css')`, which resolves to `modules/Cards/Cards.css`.
- The one counter-example, Base-Trust `modules/LearningCenter/LearningCenter.module/module.html:4,6` (`{% import '../../css/_config.css' %}` inside `{% require_css %}`), points at a file that doesn't exist under file-relative resolution and was never shown to work.

Templates, sections and partials are ordinary files: `../` from `templates/x.html` and `sections/x.html`, `../../` from `templates/layouts/*` and `templates/partials/*`.
