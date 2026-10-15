# Agile HubSpot Testing Checklist

Use this checklist during uploads and smoke tests.

**Upload target:** the `demo` sandbox (portal 51425289). Every `hs` command must pass `--account demo` explicitly, because the CLI default is `gk3capital`. **Never upload Agile to `gk3capital` or make changes there.** Never use `--clean`.

Before any upload:

- run `node Automation/compose-fields.js --check` from `Agile/`. It must pass.
- run `hs cms lint <path> --account demo` on the changed templates and modules, and **parse the output**: the exit code is always 0, even when there are errors. HubL syntax errors are real, with one exception: when lint cannot resolve a relative `{% import "../../macros/agile.html" as agile %}`, every `agile.*` call is reported as `ERROR ... Cannot find method <macro> with N parameters in class ...SizeLimitingPyMap`. Those errors are false. To check a module properly, lint a scratch copy in which quoted `./` / `../` / `../../` paths are rewritten to absolute Design Manager paths, e.g. `sed 's#"\.\./\.\./#"/Agile/#g'` (the theme must already be uploaded to demo), and treat only errors that remain in that copy as real. `Missing template` / `Unable to find module` warnings for relative paths are expected, because lint has no file-path context (`HUBSPOT-PLATFORM.md` › CLI / Validation). An upload alone proves nothing: upload does not validate HubL.
- run `hs cms upload . Agile --account demo` from **inside** `Agile-Theme/`, so that `.hsignore` keeps `fields.source.json` and `field-groups/` out of the upload.

---

## Theme Registration

- confirm theme appears in Design Manager
- confirm homepage preview renders
- confirm landing page template is available
- confirm custom modules appear in the editor module panel

## Templates (DnD; supported on `demo`, closing tags are `end_dnd_*`)

- open `Agile Homepage` in the page editor
- open `Agile Landing Page` in the page editor
- confirm header and footer render (see "Global Header and Footer" below)
- confirm starter modules render without errors
- confirm editor can add/remove/reorder sections via the DnD interface

## Page Controls

On a test page, verify:

- header mode override (native / minimal / hidden)
- footer mode override (native / minimal / hidden)
- narrow / wide / full page widths, and `theme_default` falls back to the theme container width
- compact / relaxed spacing density, and `theme_default` keeps the theme spacing
- body classes applied to `.agile-page`
- page-scoped CSS injected correctly, and able to target a module through `data-agile-module`, `advanced.custom_class` or `advanced.component_id`

## Modules

For each module, verify:

- default rendering, with no `id` or `style` attribute on the wrapper
- the macro import `../../macros/agile.html` resolves at render time (T1 confirmed it at upload-validation level; see `HUBSPOT-PLATFORM.md` › Paths), and the Hero placeholder image (`get_asset_url("../../images/...")`) loads
- Style-group fields appear on the editor's **Style** tab, and `style.background_color` still shows and hides with `style.background`
- background options (inherit / surface / primary / secondary / accent / custom), with readable text on each
- the text colour override
- spacing options (theme / none / xs through xl / custom px)
- container width and text alignment overrides beat the Page Controls page width
- button style precedence (CTA style > module button style > theme)
- advanced: custom class, anchor ID, hide on mobile / desktop
- responsive image srcset for File Manager images

## Global Header and Footer (global content editor)

The header and footer are global modules (`globals/Site Header.module`, `globals/Site Footer.module`) seeded by `templates/partials/header.html` (`dnd_area "header_area"`) and `footer.html` (`dnd_area "footer_area"`). Check them on demo after a full upload (`hs cms upload . Agile --account demo` from inside `Agile-Theme/`):

1. **Seeded defaults (T3).** Open a test page built on `Agile Homepage`. The header should show the theme logo (or the company-name text if `theme.branding.logo` is empty), the `default` menu if the portal has one, and no button. The footer should show "Company Name", "© <current year> Company Name. All rights reserved." and a Privacy Policy link. If the page still shows the old header/footer content, record in `HUBSPOT-PLATFORM.md` whether the renamed areas picked up the seed and what manual reset was needed.
2. **Global content editor.** From the page editor, select the header, choose to edit the global content, and confirm the Site Header module's fields appear: Content (logo, logo link, logo alt, navigation menu, button, show button on mobile) and Style (logo max height desktop/mobile). Change the button text, publish the global content, and confirm the change shows on a second page without editing that page. Repeat for the footer (columns, social links, legal links, disclaimer, copyright). Note the exact menu path in this file.
3. **Menus.** Demo has no menus yet. Create one (Settings › Content › Navigation Menus) with at least one item that has children, then check: the header dropdown (one level), a footer column set to "Menu", and that a menu item set to open in a new tab gets `rel="noopener noreferrer"`.
4. **Modes and style (Page Controls).** On one test page, set `header_mode_override` to native / minimal / hidden and `footer_mode_override` to native / minimal / hidden; set `header_style_override` to Solid and Transparent, and with Theme Default, toggle `theme.header.transparent_on_hero` with and without a coloured Hero as the first section. Also confirm `theme.header.sticky`.
5. **Header behaviour on a published page.** Keyboard only: Tab through the menu, open a dropdown with Enter/Space, close it with Escape (focus returns to its toggle); at phone width open the mobile menu, Escape closes it and returns focus to the menu button; click outside closes everything; resizing across 767px resets the menus. With JS disabled, the desktop dropdowns open on hover/focus and the mobile menu shows expanded. Check that `prefers-reduced-motion` removes the transitions.
6. **Render-test without pages.** Until pages can be created on demo, `hs cms lint <absolute-path copy> --account demo --debug` renders the module with mock `theme`, `widget_data` and `module` values (`HUBSPOT-PLATFORM.md` › CLI / Validation).

## Infrastructure Modes

Verify theme-level header and footer modes:

- native
- minimal
- hidden

## Known Platform Constraints

- `{% dnd_area %}` inside module HTML is not supported (CMS Hub Enterprise only)
- The demo sandbox does support DnD. The old upload errors came from the misspelled `enddnd_*` closers
- Upload does not validate HubL; use `hs cms lint` (exit code always 0, so parse the output). `Cannot find method ... SizeLimitingPyMap` errors after an unresolved relative import are false: lint an absolute-path copy instead (`HUBSPOT-PLATFORM.md` › CLI / Validation)
- Relative paths resolve from the file's own folder: the theme root is `../../` from a module
- Full constraint log: `HUBSPOT-PLATFORM.md` at workspace root

## If Something Fails

Capture:

- the file path
- the exact template or module
- the error message
- whether it occurs in preview, page editor, or live render
- add confirmed platform constraints to `HUBSPOT-PLATFORM.md` before moving on
