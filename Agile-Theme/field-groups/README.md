# Agile shared field groups

The JSON files in this folder are the **standard override set** every Agile module shares. They are not copied by hand. A module's `fields.source.json` references them with `{"$use": "<group>"}`, and the local composer (`Automation/compose-fields.js`) expands each source into the module's ordinary `fields.json`.

This folder and every `fields.source.json` are **local only**. The theme's `.hsignore` keeps them out of uploads, but only when you run `hs` from inside `Agile-Theme/` (see `Automation/README.md`).

## Groups

| File | Field path in the module | Used by |
|------|--------------------------|---------|
| `layout.json` | `layout.spacing.*`, `layout.container_width`, `layout.text_align` | Section modules |
| `spacing.json` | `layout.spacing.padding_top`, `padding_top_custom`, `padding_bottom`, `padding_bottom_custom` | Nested inside `layout` via `$use` (it can also be used by itself) |
| `style.json` | `style.background`, `style.background_color`, `style.text_color`, `style.button_style` (Style tab) | Section modules. Modules without buttons `$omit` `button_style` |
| `advanced.json` | `advanced.component_id`, `advanced.custom_class`, `advanced.visibility.hide_on_mobile`, `advanced.visibility.hide_on_desktop` | Section and Component modules |
| `cta.json` | `content.<name>.text`, `.link`, `.style` | Any module with a button. Place it inside `content` and rename it per CTA (`primary_cta`, `secondary_cta`) |

Values and defaults:

- `padding_top` / `padding_bottom`: `theme` (default), `none`, `xs`, `sm`, `md`, `lg`, `xl`, `custom`. The `*_custom` number (px, step 4, default 80) only appears when `custom` is chosen.
- `container_width`: `inherit` (Page default, the default), `narrow`, `default` (Standard), `wide`, `full`.
- `text_align`: `inherit` (default), `left`, `center`.
- `background`: `inherit` (None, the default), `surface`, `primary`, `secondary`, `accent`, `custom`. `background_color` only appears when `custom` is chosen.
- `text_color`: a colour field with an empty default (`{"color": null, "opacity": null}`, the same form HubSpot's own exported Trust theme uses). Empty means inherit.
- `button_style` and `cta.style`: `inherit` (default), `primary`, `secondary`, `ghost`, `link`.
- `hide_on_mobile` / `hide_on_desktop`: `false`.

Every override starts as "inherit" or "theme default". The narrower level wins: Module > Page > Theme.

## Rules for editing these files

- Each file holds **one field object** (normally `"type": "group"`). The file name is the group name used in `$use`.
- Theme `fields.json` rules do not apply here: these are **module** fields, so `text`, `link` and `richtext` are allowed.
- Never name a field `body`, `label` or `name`. HubSpot rejects them, and the composer checks for them.
- Write `visibility.controlling_field_path` as `"./<child>"`, relative to the group being expanded. The composer rewrites it to the absolute path, for example `./padding_top` inside `spacing` inside `layout` becomes `layout.spacing.padding_top`.
- A group may nest another group with `{"$use": "spacing"}`.
- `style.json` carries `"tab": "STYLE"`, so every module that uses it shows those fields on HubSpot's Style tab. HubSpot allows one top-level Style-tab group per module and only style field types inside it (alignment, gradient, spacing, background image, border, boolean, choice, number, color, icon, image, font, text alignment). Don't add `text`, `richtext` or `link` fields to `style`. The composer rejects them (see `docs/MODULE-CONTRACT.md` › Tabs and field paths).
- A repeater's `occurrence.sorting_label_field` is a field **id**. Write it as `"./<child>"` and the composer rewrites it to the child's generated id (e.g. `content__logos__alt_text`).
- After changing a group, run `node Automation/compose-fields.js` to regenerate every module, then `node Automation/compose-fields.js --self-test`. If the golden file changed on purpose, run `--self-test --update-expected` and review the diff.

## HubL usage

Modules read these values through the shared macros in `macros/agile.html` (`agile.section_attrs`, `agile.component_attrs`, `agile.button`, and so on). They do not build class strings by hand. See the module contract in [`docs/MODULE-CONTRACT.md`](../docs/MODULE-CONTRACT.md).
