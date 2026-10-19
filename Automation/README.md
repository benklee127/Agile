# Agile Automation

## compose-fields.js

This script builds each module's `fields.json` from a `fields.source.json` plus the shared groups in `Agile-Theme/field-groups/`. It is CommonJS and needs Node 18 or later (it was written for Node 22). It has no dependencies.

```bash
# from c:/workspace/Hubspot Themes/Agile
node Automation/compose-fields.js                 # default theme: Agile-Theme
node Automation/compose-fields.js path/to/theme   # a client copy of the theme
node Automation/compose-fields.js --check         # writes nothing; exit 1 if any fields.json is missing or out of date
node Automation/compose-fields.js --self-test     # runs the tests in Automation/test
node Automation/compose-fields.js --help
```

The script looks for every `fields.source.json` under `<theme>/modules/**` and `<theme>/globals/**`. It writes the sibling `fields.json` as 2-space JSON with a trailing newline, and leaves the file untouched when nothing changed. Errors are reported for each file, and the exit code is 1 if any source fails.

**Treat `fields.json` as generated.** Edit `fields.source.json` or the shared group, then re-run the script. A module without a `fields.source.json` is left alone, so a hand-written `fields.json` keeps working.

Exit codes: `0` ok, `1` errors or (with `--check`) stale output, `2` bad arguments or a missing theme folder.

## Source syntax

`fields.source.json` is a JSON **array of field objects**, the same as `fields.json`. Any element can use these directives instead of (or alongside) literal field properties:

| Key | Meaning |
|-----|---------|
| `"$use": "layout"` | Insert `field-groups/layout.json` here. Works at the top level and inside any group's `children` (nested expansion). |
| any plain key (`name`, `label`, `help_text`, `tab`, `expanded`, `visibility`, …) | Overrides that property on the used group. `type` and `children` cannot be overridden. |
| `"$defaults": {"spacing.padding_top": "lg"}` | Sets `default` on a child, found by its dotted path relative to the group. |
| `"$omit": ["button_style"]` | Removes a child, found by its dotted path. |
| `"$prepend": [ …fields ]` / `"$append": [ …fields ]` | Adds fields at the start or end of the group's children. They may use `$use` themselves. |

Order of operations for one element: load the group → apply property overrides → expand nested `$use` → `$prepend`/`$append` → `$omit` → `$defaults`. That means `$omit` and `$defaults` can target appended fields and fields inside nested groups.

`$defaults`, `$omit`, `$prepend` and `$append` also work on a literal group, not only on `$use`.

### Relative visibility paths

`visibility.controlling_field_path` (and `advanced_visibility.criteria[].controlling_field_path`) may start with `./`:

- **inside a group file** (and in `$prepend`/`$append` fields): relative to the group being expanded. `./padding_top` in `spacing` nested in `layout` becomes `layout.spacing.padding_top`. If the group is renamed with `"name"`, the path follows the new name.
- **in a module's own source**: relative to the field's parent group, so `./show_cta` refers to a sibling field.

Paths without `./` are left as they are (absolute) but are still checked.

### Repeater sorting labels

HubSpot's `occurrence.sorting_label_field` takes the **id** of the repeater child whose text labels the draggable cards in the editor. Because the composer generates ids, write it as `"./<child name>"` in the source and the composer rewrites it to that child's final id (for example `"./alt_text"` inside `content.logos` becomes `"content__logos__alt_text"`). A value without `./` must already equal the id of a direct child. Unknown `occurrence` keys (anything other than `min`, `max`, `default`, `sorting_label_field`, such as the misspelt `sorting_label_field_name`) are rejected.

### Generated field ids

HubSpot requires every field **id** to be unique across the whole module, and it uses the name as the id when none is given. The shared groups reuse names: the top-level `style` group and `cta.style`, or two CTAs that both have `text`, `link` and `style`. To avoid clashes, the composer gives every field without an explicit `id` a path-based one, for example `layout.spacing.padding_top` gets `"id": "layout__spacing__padding_top"`. An explicit `id` is always kept. HubL access is unchanged because it uses names (`module.layout.spacing.padding_top`).

`--no-ids` turns this off. The composer then requires names to be unique across the module.

### Validation

The script stops with a clear error for:

- an unknown group or directive
- a circular `$use`
- a bad `$defaults` or `$omit` path
- duplicate sibling names
- a duplicate field id anywhere in the module, after ids are generated (generated vs generated, or generated vs explicit)
- a field name containing `__` (can collide with generated ids) or `.` (makes `controlling_field_path` ambiguous)
- an `occurrence.sorting_label_field` that does not match a direct child, or an unknown `occurrence` key
- the reserved names `body`, `label` or `name`
- a field with no `name`, `type` or `label`
- a group without `children`
- any `controlling_field_path` that does not point at a field after expansion (for example, one left dangling by `$omit`)
- Style tab rules from HubSpot's "Module and theme fields overview" › Style fields:
  - more than one `"tab": "STYLE"` group in a module
  - a STYLE-tab group that isn't top-level, or `"tab": "STYLE"` on a non-group field
  - a field inside the STYLE-tab group whose type isn't a module style type (allowed: `alignment`, `gradient`, `spacing`, `backgroundimage`, `border`, `boolean`, `choice`, `number`, `color`, `icon`, `image`, `font`, `textalignment`)
  - a `tab` value other than `CONTENT` or `STYLE`

### Example

```json
[
  {
    "name": "content", "label": "Content", "type": "group",
    "children": [
      { "name": "heading", "label": "Heading", "type": "text", "default": "Your headline" },
      { "name": "heading_level", "label": "Heading level", "type": "choice", "display": "select",
        "choices": [["h1","H1"],["h2","H2"],["h3","H3"],["h4","H4"]], "default": "h1" },
      { "name": "body_text", "label": "Body text", "type": "richtext", "default": "<p>Supporting copy.</p>" },
      { "$use": "cta", "name": "primary_cta", "label": "Primary button", "$defaults": { "text": "Get started" } },
      { "$use": "cta", "name": "secondary_cta", "label": "Secondary button",
        "$defaults": { "text": "" } }
    ]
  },
  { "$use": "layout", "$defaults": { "spacing.padding_top": "lg" },
    "$append": [
      { "name": "media_position", "label": "Media position", "type": "choice", "display": "select",
        "choices": [["left","Left"],["right","Right"]], "default": "right" }
    ] },
  { "$use": "style" },
  { "$use": "advanced" }
]
```

A Component module uses only `[ …content fields…, { "$use": "advanced" } ]`.

## Tests

`node Automation/compose-fields.js --self-test` checks the following:

- `test/sample.fields.source.json`, expanded with the real `Agile-Theme/field-groups`, must equal `test/expected.fields.json` (golden file)
- every shared group must expand on its own
- relative paths, ids, directives and every validation error must behave as described above

If you change a shared group on purpose, run `--self-test --update-expected` and review the diff of `expected.fields.json` before you commit.

## Uploading: keep sources out of HubSpot

`Agile-Theme/.hsignore` ignores `**/fields.source.json`, `/field-groups/` and the internal Markdown docs (`/docs/`, `*.md`; `md` is an allowed upload extension in CLI 8.9.1, so they would otherwise upload). Version 8.9.1 of the installed HubSpot CLI (`@hubspot/local-dev-lib/lib/ignoreRules.js`) handles it like this:

- It uses only the **nearest `.hsignore` found by walking up from the current working directory**. It does not look in the folder being uploaded.
- Patterns use gitignore syntax and are matched against paths relative to the folder that contains the `.hsignore`.

So **run uploads from inside the theme folder**:

```bash
cd "c:/workspace/Hubspot Themes/Agile/Agile-Theme"
node ../Automation/compose-fields.js --check   # make sure fields.json is current first
hs cms lint . --account demo                   # exit code is always 0: read the output for errors
hs cms upload . Agile --account demo
```

The test portal is the `demo` sandbox. Always pass `--account demo`, because the CLI default is `gk3capital`, which is off limits for Agile. Upload does not validate HubL, but `hs cms lint` does. Treat every syntax error it reports as real. Relative-path `Missing template` / `Unable to find module` warnings are expected (see `HUBSPOT-PLATFORM.md` › CLI / Validation). Relative paths in a module resolve from the module's own folder, so the theme root is `../../` (`HUBSPOT-PLATFORM.md` › Paths).

If you run from `c:/workspace/Hubspot Themes`, as the other themes do, this `.hsignore` is **not** applied. The sources and `field-groups/` would then upload as ordinary `.json` files, because `json` is an allowed upload extension.

## HubSpot API access (pages and other content)

Scripts that create or edit pages need an access token with the `content` scope. CLI personal access keys can't get that scope, so each portal installs the **GK3 Agile Page Builder** app instead (project `gk3-agile-page-builder`; it was called "Agile page builder" / `agile-page-builder` before, and older installs such as the demo sandbox may still show that name until re-uploaded). Deploying and installing it is a Phase 0 step: see [the playbook's Phase 0](../../HUBSPOT-SITE-BUILD-PLAYBOOK.md#phase-0-portal-prep-do-the-manual-steps-first) and [HUMAN-TODO.md](../../HUMAN-TODO.md) A.3.

**For page builds and uploads, use the utilities** (index: [`utilities/utils.md`](../../utilities/utils.md)), which call `hubspot-api.js` for you:
- [`utilities/page-build.js`](../../utilities/page-build.js): page spec → draft page (dry run by default; `--apply` with `--allow-prefix` and `--registry`), with read-back and `--compare-page` drift checks. It replaces the `build-layout.js` → `hubspot-api.js` chain for new builds.
- [`utilities/hs-upload.js`](../../utilities/hs-upload.js): guarded `hs cms upload` (dry run, `--allow-prefix`, manifest, fetch-back compare).

**One app source, one install per portal.** `agile-page-builder/` is a project-based private app (platform 2026.03, static auth, scopes `oauth` + `content`). Don't copy it per client. Upload the same source to each portal; every portal gets its own app and token:

```bash
cd Agile/Automation/agile-page-builder
hs project validate --account <portal>
hs project upload --account <portal> --force-create
```

Then, in that portal: **Development → Projects → gk3-agile-page-builder → GK3 Agile Page Builder → Distribution → Install now**, then **Show** and copy the access token into `.env.<portal>` yourself (never paste it in chat).

**Per-portal settings live in `Automation/.env.<portal>`.** Copy `.env.example` to `.env.demo`, `.env.<client>` and so on, and fill in the portal ID and token. These files are git-ignored and are never uploaded: theme uploads run from inside `Agile-Theme/`, and project uploads only send `src/`.

```bash
node hubspot-api.js --portal demo get "cms/v3/pages/site-pages?limit=5"
```

`hubspot-api.js` checks that the token belongs to `HUBSPOT_PORTAL_ID` before every run, and always refuses the gk3capital portal (3075079).
