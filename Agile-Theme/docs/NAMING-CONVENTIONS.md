# Agile Naming Conventions

## Files and Folders

- Theme folders use PascalCase only when matching HubSpot module naming conventions.
- General project docs use uppercase descriptive filenames where useful.
- CSS partials use lowercase with leading underscores for non-entry files.
- JavaScript entrypoints use simple lowercase names.

## Modules

- Module folders use human-readable names ending in `.module`.
- Outer wrapper classes should follow the pattern `.agile-<component-name>`.
- Inner structural elements should use `__` element naming.
- Modifier classes should use `--` suffixes.

## Fields

- Top-level module groups should be `content`, `layout`, `style`, and `advanced` when the module fits the standard pattern.
- Field names should be lowercase snake_case.
- Boolean fields should read clearly as toggles.
- Override fields should end in `_override` only when there is also a non-override equivalent.

## Docs

- Theme architecture and conventions should be documented before major module families are added.
- If a pattern is reused twice, it should be documented instead of relying on memory.
