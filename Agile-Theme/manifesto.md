# Agile Theme Manifesto

> **Note:** This manifesto is the original vision. Where it disagrees with `Agile/README.MD` (the current source of truth), the README wins; superseded points are marked inline.

## Purpose

Agile exists to solve two recurring delivery modes without forcing the team into separate theme systems:

1. Net-new HubSpot websites where the theme owns the entire experience.
2. Partial-site work where the theme must plug into an existing client site for blogs, landing pages, resource pages, or campaign content.

This project is not a marketplace-theme clone. It is a standalone delivery framework for repeated client work.

## Core Goals

- Build one theme that works well for both full-site ownership and partial-site extension.
- Make theme-level styling substantially more expressive than standard HubSpot theme controls.
- Allow local overrides in every major module so editors are not trapped by rigid global defaults.
- Support native header/footer systems and custom client-matching header/footer injection modes.
- Keep the foundation maintainable enough that the team can extend it without turning the codebase into a pile of exceptions.

## Operating Principles

### 1. Design System First

Theme fields should define tokens and behaviors, not just isolated colors.

Agile should own:

- color tokens
- typography tokens
- spacing scale
- border and radius rules
- shadows
- motion and hover behavior
- CTA variants
- container widths
- form styling
- navigation and footer styling

**Platform constraints do not justify removing tokens from the editor.** HubSpot's `theme fields.json` only supports `color`, `font`, `number`, `choice`, `boolean`, `image`, and `group` — not `text` or `link`. When a token cannot be expressed as a free-text field, it must be decomposed into structured equivalents: use `number` fields for blur, spread, opacity, and offset; use `choice` for preset behaviors like hover effects; use `color` for shadow tints. Never hardcode what should be configurable. Hardcoding a design token because of a platform constraint is always the wrong answer.

### 2. Inheritance With Escape Hatches

Every module should support three levels of styling:

- inherit theme defaults
- choose approved local variants
- override locally when needed

If a client use case still exceeds that model, a scoped custom CSS field should exist at the module, page, or infrastructure level.

> **Superseded (see `Agile/README.MD`):** scoped custom CSS now exists **only at page level** (Page Controls `page_css`). The per-module scoped CSS field and `data-agile-scope` were dropped; modules expose real fields and stable hooks instead. See `docs/SCOPED-CSS.md`.

### 3. Full-Site and Extension Modes Are First-Class

Agile must not assume it always owns the whole website.

It should support:

- native full header/footer
- native minimal landing page header/footer
- no header/footer
- custom HTML/CSS header/footer for client-matching scenarios

### 4. Standalone Ownership

Agile should not depend on a parent marketplace theme. We own the file structure, tokens, modules, templates, and upgrade path.

### 5. Flexibility Without Chaos

More controls are only useful if they are organized well.

Agile should prefer:

- standardized field group patterns
- shared style controls across modules
- scoped CSS, never unbounded CSS blobs
- variant systems over one-off hacks
- minimal global JS and intentional enhancements

## Inspiration Sources

### From Trust / `my-local-hubspot-folder`

- maintainable base layout structure
- reusable global modules
- centralized styling controls
- strong framework mindset

### From STORM

- breadth of templates and page archetypes
- larger section and module inventory
- conversion-oriented content patterns
- strong support for campaign and landing page builds

## What Agile Must Become

Agile should become a delivery framework with:

- a token-rich theme editor
- universal module-level style tabs *(now the shared `layout` / `style` / `advanced` field groups — see `docs/MODULE-CONTRACT.md`)*
- scoped custom CSS at theme, page, header/footer, and module level *(superseded: page level only — see `docs/SCOPED-CSS.md`)*
- native and custom infrastructure modes
- reusable presets for common client categories
- strong support for rapid campaign work without weakening the system

## Immediate Focus

The first implementation phase should establish:

- standalone theme scaffold
- token-capable `fields.json`
- base layout and homepage template
- native/custom header and footer modes
- CSS variable architecture
- minimal JS foundation
- tracked implementation plan in-repo

## Quality Bar

The theme is only successful if it is:

- flexible for editors
- predictable for developers
- fast to adapt for client work
- structured enough to scale
- not dependent on fragile global hacks
