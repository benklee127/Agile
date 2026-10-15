# Agile Responsibilities

## Editors

Editors should primarily work through:

- theme-level tokens and infrastructure controls
- page controls
- module content fields
- approved local style overrides

Editors should only use page-scoped CSS (Page Controls `page_css`, the only custom CSS field) when standard controls and documented variants are not sufficient. Modules have no custom CSS field.

## Developers

Developers are responsible for:

- adding and maintaining token systems
- defining and documenting reusable module field patterns
- keeping page-scoped CSS predictable (modules expose stable hooks: `data-agile-module`, `custom_class`, `component_id`)
- deciding when a repeated override should become a first-class field or variant
- preserving the distinction between Full Site Mode and Extension Mode

## Escalation Rules

If a styling need repeats across multiple pages or clients, it should move from ad hoc CSS into one of these layers:

1. theme token
2. component variant
3. module field
4. infrastructure option

If it is genuinely one-off, page-scoped CSS is acceptable.
