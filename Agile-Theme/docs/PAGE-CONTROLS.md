# Agile Page Controls Guide

The Page Controls module exists to let a page override infrastructure without forking the theme.

## Current Controls

- header mode override (native / minimal / hidden)
- header style override (Theme Default / Solid / Transparent over the first section)
- footer mode override (native / minimal / hidden)
- page width
- spacing density
- extra page-wrapper classes (applied to `.agile-page`)
- page-scoped CSS

## Intended Usage

Use page controls when a page needs different infrastructure or layout behavior but should still live inside the Agile theme system.

Examples:

- hide the header on a thank-you page
- make the header transparent over a full-bleed image section
- use a minimal footer on a landing page
- narrow the layout for a long-form content page
- apply page-specific CSS without affecting the rest of the theme

The header and footer modules read these values themselves (`widget_data.page_controls.*`); see [ARCHITECTURE.md](ARCHITECTURE.md) › Global header and footer. Every value lives at one level; see [EDITING-LEVELS.md](EDITING-LEVELS.md).
