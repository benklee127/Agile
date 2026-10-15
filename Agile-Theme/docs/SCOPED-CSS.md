# Agile Scoped CSS Strategy

Scoped CSS is an escape hatch, not the main styling system. Agile has **one** place for it: the page.

## Where custom CSS lives

| Level | Custom CSS? | How |
|---|---|---|
| Theme | No free-form CSS field | Theme `fields.json` cannot hold `text` fields. Site-wide changes go into the theme's CSS files or new theme tokens. |
| Page | **Yes** | Page Controls → **Page Scoped CSS** (`page_css`) |
| Module | **No** | The per-module scoped CSS field and the `data-agile-scope` attribute were dropped. Modules expose real fields (variants, overrides) instead. |

## Page-level scoped CSS

`templates/layouts/base.html` reads `widget_data.page_controls.page_css` and outputs it through `{% require_css %}`, nested inside `.agile-page`:

```html
<style>
  .agile-page {
    /* contents of page_css */
  }
</style>
```

Write the field's contents as declarations or nested rules, scoped to the page wrapper. Because the CSS is nested, it relies on browser support for CSS nesting.

## Targeting one module from page CSS

Every module renders stable hooks that page CSS can target:

- `data-agile-module="<base class>"`, for example `[data-agile-module="agile-hero"]`, for every instance of a module on the page.
- `advanced.custom_class`, an editor-supplied class, for one instance.
- `advanced.component_id`, the anchor `id`, also for one instance.

```css
.agile-hero.promo-hero .agile-hero__title { letter-spacing: -0.02em; }
```

## Rules

- Prefer theme tokens first.
- Prefer module fields and variants second.
- Use page CSS only when the need is narrower than a reusable control. If the same CSS turns up on several pages, turn it into a field or a variant.
- Target a module only through the hooks above, and never through HubSpot's generated wrapper classes or DnD ids, which are not stable.
