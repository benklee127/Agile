# Agile

Agile is the base theme we use to turn a free-form website design into a production HubSpot site.

It is not a marketplace theme and not a module library that tries to cover every design. It is a **skeleton and a rulebook**. It defines how a HubSpot site we deliver is structured, styled and made editable, so that each generated site is custom but built the same way as every other.

---

## Objective

Give clients a **truly custom HubSpot theme** with full creative freedom in the design, without giving up consistency, maintainability or a good editing experience in HubSpot.

Designs are not limited to what a prebuilt theme can do. Agile makes sure that whatever gets built from a design:

- follows good front-end practice (accessibility, performance, responsive behaviour)
- follows HubSpot practice (DnD areas, theme fields, global partials, module field conventions)
- is structured the same way across every client, so any team member (or Claude) can pick it up
- is editable in the right places for marketers, and nowhere it doesn't need to be

---

## End-to-end workflow

```
 1. Design            2. Generate                    3. Deliver
 ─────────            ───────────                    ──────────
 HTML (built with     Claude + a copy of Agile       Theme uploaded with the CLI
 Claude / AI)    ──►  ─────────────────────────  ──► (hs cms upload)
 or a graphic         • theme tokens filled in       Pages, landing pages and blog
                      • custom modules built         content pushed through the
                      • page layouts as DnD JSON     HubSpot APIs
                      • header/footer content
```

1. **Design.** The site is designed with full creative freedom, either as HTML (usually made with Claude) or as a graphic. The design does not need to know about HubSpot.
2. **Generate.** The design and a fresh copy of Agile go to Claude. Claude produces:
   - **Theme tokens:** the design's colours, fonts, type scale, spacing, radius and so on, written as the defaults in the theme's `fields.json`.
   - **Modules:** every module needed to reproduce the design, built to the Agile module contract.
   - **Page layouts:** each page as HubSpot DnD JSON (sections → columns → rows → modules). Every page sets all of its own copy, links and media explicitly. Module defaults are only for an editor's new instances (PLAN A1).
   - **Global content:** header and footer content, seeded into the global partials.
   - **Blog templates:** blog listing and blog post templates, where the site needs them.
3. **Deliver.** The theme is uploaded to the client portal with the HubSpot CLI. Pages, landing pages and blog content are created through the HubSpot APIs.

**North star:** designed HTML → production-ready HubSpot. When speed and fidelity conflict, fidelity wins.

**Done** means three things:
- a render check against the design at every breakpoint;
- a human preview;
- the production-readiness list: forms wired, real links, licensed media, approved compliance copy, nothing that blocks publishing.

### Process and toolkit (required)

Agile is the theme. The build process and the scripts live in the **GK3 HubSpot toolkit**, and Agile links to them rather than keeping copies:

| Document | Use |
|---|---|
| [HUBSPOT-SITE-BUILD-PLAYBOOK.md](../HUBSPOT-SITE-BUILD-PLAYBOOK.md) | The single build workflow, phase by phase |
| [BUILD-BRIEF-TEMPLATE.md](../BUILD-BRIEF-TEMPLATE.md) | Filled in and settled with the client owner before any build starts |
| [HUBSPOT-PLATFORM.md](../HUBSPOT-PLATFORM.md) | Confirmed HubSpot platform facts |
| [utilities/utils.md](../utilities/utils.md) | Scripts for every repeatable step. Agile presets: `presets/agile.json`, `presets/agile-prelude.hubl` |

**Until the toolkit migration is done:** the toolkit is the parent workspace folder (`Hubspot Themes/`), which isn't in Git yet. The scripts there also load `Automation/hubspot-api.js` from this repo. A clone of this repo on its own therefore has neither the scripts nor the playbook. The migration moves `hubspot-api.js` and the page-builder app into the toolkit, so that Agile depends on the toolkit and not the other way round.

---

## Agile's role

Agile does three jobs in this workflow.

### 1. Skeleton

The parts every site needs, which generated work builds on and does not rewrite:

- **Page shell** (`templates/layouts/base.html`): the HTML document wrapper every template extends. It holds `<head>`, the CSS/JS includes, HubSpot's required header/footer includes, the skip link, and the places where the header, page body and footer go. It contains no design. *(Not to be confused with page layouts, the arrangement of sections on a page, which are generated for each site as DnD JSON.)*
- **Global header and footer** as global partials, editable in HubSpot's global content editor
- **System templates:** 404, search results, password prompt, subscription preferences
- **Design-token system:** theme fields become CSS custom properties
- **Page Controls:** per-page overrides of theme defaults (see [Editing levels](#editing-levels))
- **Shared HubL macros and field groups** that every module reuses

### 2. Rulebook

The conventions that keep generated output consistent and correct:

- the module contract: field tabs, wrapper markup, naming, scoping
- which design decisions become theme fields, which become module fields, and which stay in code
- HubSpot platform rules (allowed field types, reserved names, DnD structure)
- accessibility, performance and responsive standards

### 3. Reference

Working examples Claude can copy from:

- starter modules that show the contract in practice
- a complete worked example, from design to tokens to modules to page JSON (planned)

### Strict around the edges, free inside

Agile has to balance **opinionated, good design** against **freedom to build truly custom modules**. The line is drawn at the module's edges:

| Fixed by Agile | Left to each generated module |
|---|---|
| Page shell, breakpoints, skip link | Inner markup and layout |
| Token names and the spacing scale | Module CSS (using tokens, plus module-local variables) |
| Module wrapper: `agile-section`, `data-agile-module`, anchor ID, visibility classes | Variants the design actually calls for |
| Field tab order (Content / Layout / Style / Advanced) and naming | Which content fields the module needs |
| Link, image and heading handling (through shared macros) | Interactions and motion specific to the module |
| No hardcoded colours or fonts: use `var(--agile-*)` | |

**Field rule:** always expose content. Every module also gets the **standard override set** from the shared field groups (spacing, background, text colour, button style, visibility), so overrides look and behave the same in every module. Beyond that, add a module-specific design option only when the design shows it varying, or when a client would realistically change it. A field nobody uses only makes the editor harder to use.

### Editing levels

Every editable design decision lives at one level, and levels follow the same pattern everywhere: **the broader level sets the default, and the narrower level can override it.**

| Level | Where it's edited | What belongs here | Example |
|---|---|---|---|
| **Theme** | Theme settings (`fields.json`) | Site-wide design tokens and default behaviour | Brand colours, fonts, type scale, button style, default header mode |
| **Global** | Global content editor (header/footer partials) | Site-wide shared content | Logo, navigation menu, footer links, legal text |
| **Page** | Page Controls module | Per-page overrides of theme defaults | Hide the header on a landing page, minimal footer, narrower page width |
| **Module** | Module fields | Content for that instance, the variants its design allows, and local overrides of theme styling | Heading, image, CTA, background variant, a different button style or spacing for this one section |

Rules:

- **Theme settings define the default; pages and modules can override it.** Anything set at theme level that a single page might reasonably need to differ on (header/footer mode, page width, spacing density, and so on) gets a matching Page Controls override. Anything a single module might need to differ on (colours, button style, spacing, alignment, and so on) gets an override in that module's Style or Layout tab.
- **Every override starts as "inherit".** Page overrides default to "Use theme default" and module overrides default to "Inherit". A newly placed module or newly created page always looks like the theme until someone chooses otherwise.
- **Decide each setting's level once and use it everywhere.** For example, if header mode is a theme setting with a page override, every site built from Agile handles it that way.
- **Don't put the same decision at two levels without a clear order of precedence.** Where it does appear at more than one level, the narrower level wins: Module > Page > Theme.

---

## One theme copy per client

Each client site gets its **own versioned copy of Agile**. It is not a child theme of a shared parent.

- The client ends up with a genuinely custom theme that they fully own.
- Generated modules are bespoke, so there is little shared code to keep in sync.
- It avoids the child-theme problems we have hit with Trust, such as `module_id` binding and override limits.
- The Agile version a site was built from is recorded in `theme.json`. Later improvements to Agile can be compared against it and brought across by hand when they're worth it.

---

## Repository layout

```
Agile/
├── README.MD          ← this file
├── Agile-Theme/       ← the theme itself (copied per client)
│   ├── fields.json    ← theme fields; design tokens live here
│   ├── theme.json
│   ├── css/           ← base, elements, components, utilities, templates
│   ├── js/
│   ├── globals/       ← global modules (Site Header, Site Footer) placed by the partials
│   ├── modules/       ← starter / reference modules
│   ├── sections/      ← saved sections for the editor
│   ├── templates/     ← layouts, partials, page and blog templates
│   ├── field-groups/  ← shared field group definitions (local-only; composed by Automation/compose-fields.js)
│   ├── macros/        ← shared HubL macro library (agile.html)
│   ├── docs/          ← architecture, module contract, naming, scoped CSS, testing
│   ├── manifesto.md
│   └── TODO.md
├── Automation/        ← generation and validation tooling (compose-fields.js; validator planned)
└── References/        ← reference themes (e.g. Base-Trust) for inspiration only
```

---

## Current state

Agile is still being built. The foundation is in place: token-driven theme fields, the base layout, Page Controls, reference modules that follow the module contract (Section modules Hero, Rich Section, Section Header, Card Grid and Logo Bar; Component module Card Item), the shared HubL macro library (`macros/agile.html`: section/component wrappers, link, button, image, heading) and shared field groups composed locally by `Automation/compose-fields.js`. The global Site Header and Site Footer modules are built and render-tested on the demo sandbox; checking them in the global content editor is still to do.

Planned work:

- [x] Header and footer as global modules seeded by the global partials (Trust pattern); editor check on demo still open
- [x] Shared HubL macros (section wrapper, link, button, image, heading)
- [x] Shared field groups without copy-paste (local composer script)
- [ ] Thin page templates for API-driven pages; system templates (404, search, password, subscription preferences)
- [x] Form styling tokens
- [ ] A generator guide written for Claude (`docs/GENERATING-A-SITE.md`)
- [ ] A complete worked example: design → tokens → modules → page JSON
- [ ] A validator in `Automation/` to check generated output against the contract

See [PLAN.md](PLAN.md) for the implementation plan, and [Agile-Theme/TODO.md](Agile-Theme/TODO.md) for the progress checklist.

---

## Uploading

Run from inside the theme folder so the CLI picks up `Agile-Theme/.hsignore` (it only reads the nearest .hsignore above the current directory), and check that the composed fields.json files are up to date first:

```bash
cd "c:/workspace/Hubspot Themes/Agile/Agile-Theme"
node ../Automation/compose-fields.js --check
hs cms lint . --account demo     # exit code is always 0: read the output
hs cms upload . Agile --account demo
```

`hs cms upload` does not validate HubL, so a clean upload proves nothing. `hs cms lint` does: treat every syntax error it prints as real. Its `Missing template` / `Unable to find module` warnings for relative paths are expected, because lint has no file-path context (see `HUBSPOT-PLATFORM.md` › CLI / Validation).

Relative paths resolve from the folder that holds the file. From `modules/<Name>.module/module.html` the theme root is `../../` (`{% import "../../macros/agile.html" as agile %}`, `get_asset_url("../../images/...")`). From `templates/*.html` and `sections/*.html` it is `../`, and from `templates/layouts/*` and `templates/partials/*` it is `../../` (see `HUBSPOT-PLATFORM.md` › Paths).

Running the upload from `c:\workspace\Hubspot Themes` (or anywhere outside `Agile-Theme/`) skips `.hsignore`, so every `fields.source.json`, the `field-groups/` folder and the internal docs would be uploaded into the theme.

**Do not upload to `gk3capital`.** Agile is tested on the `demo` sandbox (51425289), which supports DnD templates (close them with `end_dnd_*`). The CLI defaults to `gk3capital`, so always pass `--account demo` explicitly, and never use `--clean`.

## Further reading

- [Agile-Theme/manifesto.md](Agile-Theme/manifesto.md): original goals and principles
- [Agile-Theme/docs/ARCHITECTURE.md](Agile-Theme/docs/ARCHITECTURE.md): how the theme is put together
- [Agile-Theme/docs/MODULE-CONTRACT.md](Agile-Theme/docs/MODULE-CONTRACT.md): rules every module follows
- [../HUBSPOT-PLATFORM.md](../HUBSPOT-PLATFORM.md): confirmed HubSpot platform constraints
- [../HUBSPOT-SITE-BUILD-PLAYBOOK.md](../HUBSPOT-SITE-BUILD-PLAYBOOK.md) and [../BUILD-BRIEF-TEMPLATE.md](../BUILD-BRIEF-TEMPLATE.md): the build process (toolkit)
