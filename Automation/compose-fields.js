#!/usr/bin/env node
/*
 * compose-fields.js — Agile local field-group composer.
 *
 * Expands every modules/** /fields.source.json and globals/** /fields.source.json
 * under a theme folder into the sibling fields.json, inlining the shared field
 * groups from <themeDir>/field-groups/<name>.json.
 *
 * Usage:
 *   node compose-fields.js [themeDir] [--check] [--quiet]
 *   node compose-fields.js --self-test [--update-expected]
 *   node compose-fields.js --help
 *
 * CommonJS, Node 18+ (written for Node 22), zero dependencies.
 * See Automation/README.md for the source syntax.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_THEME_DIR = path.resolve(__dirname, '..', 'Agile-Theme');
const SOURCE_FILE = 'fields.source.json';
const OUTPUT_FILE = 'fields.json';
const GROUPS_DIR = 'field-groups';
const SCAN_DIRS = ['modules', 'globals'];
// Confirmed upload failures: body, label, name (see HUBSPOT-PLATFORM.md).
const RESERVED_NAMES = new Set(['body', 'label', 'name']);
const ID_SEPARATOR = '__';
const DIRECTIVES = new Set(['$use', '$defaults', '$omit', '$append', '$prepend']);
const GROUP_NAME_RE = /^[A-Za-z0-9_-]+$/;
// Module style fields (HubSpot docs, "Module and theme fields overview" > Style fields):
// all of them sit in ONE top-level group with "tab": "STYLE" (it may contain nested
// groups), and only these field types may be used as module style fields.
const STYLE_TAB = 'STYLE';
const STYLE_FIELD_TYPES = new Set(['alignment', 'gradient', 'spacing', 'backgroundimage', 'border', 'boolean',
  'choice', 'number', 'color', 'icon', 'image', 'font', 'textalignment']);

/** Marks a "./" path that is relative to the module root (no enclosing group). */
const ROOT = Object.freeze({ root: true });

class ComposeError extends Error {}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function clone(v) {
  return v === undefined ? undefined : JSON.parse(JSON.stringify(v));
}

function serialize(fields) {
  return JSON.stringify(fields, null, 2) + '\n';
}

function normalizeEol(s) {
  return s.replace(/\r\n/g, '\n');
}

/**
 * Creates a loader for group definitions stored as <groupsDir>/<name>.json.
 * Each group file holds exactly one field object (normally type "group").
 */
function fileGroupLoader(groupsDir) {
  const cache = new Map();
  const loader = (name) => {
    if (!GROUP_NAME_RE.test(name)) {
      throw new ComposeError(`invalid group name "${name}" (letters, digits, "_" and "-" only)`);
    }
    if (!cache.has(name)) {
      const file = path.join(groupsDir, name + '.json');
      if (!fs.existsSync(file)) {
        const available = fs.existsSync(groupsDir)
          ? fs.readdirSync(groupsDir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5))
          : [];
        throw new ComposeError(
          `unknown group "${name}" (no ${path.join(GROUPS_DIR, name + '.json')}). ` +
            `Available: ${available.length ? available.join(', ') : '(none)'}`
        );
      }
      let def;
      try {
        def = JSON.parse(fs.readFileSync(file, 'utf8'));
      } catch (e) {
        throw new ComposeError(`group "${name}": invalid JSON in ${file}: ${e.message}`);
      }
      if (!isPlainObject(def)) {
        throw new ComposeError(`group "${name}": ${file} must contain a single field object`);
      }
      cache.set(name, def);
    }
    return clone(cache.get(name));
  };
  loader.groupsDir = groupsDir;
  return loader;
}

/** Same interface as fileGroupLoader, backed by an in-memory object (tests). */
function memoryGroupLoader(groups) {
  return (name) => {
    if (!Object.prototype.hasOwnProperty.call(groups, name)) {
      throw new ComposeError(`unknown group "${name}". Available: ${Object.keys(groups).join(', ') || '(none)'}`);
    }
    return clone(groups[name]);
  };
}

/* ------------------------------------------------------------------ */
/* Expansion                                                           */
/* ------------------------------------------------------------------ */

/**
 * Expands a fields.source.json array.
 * @param {Array} source       parsed fields.source.json
 * @param {Function} loadGroup name -> fresh copy of the group definition
 * @returns {Array} plain fields.json array (validated)
 */
function compose(source, loadGroup, { ids = true } = {}) {
  if (!Array.isArray(source)) {
    throw new ComposeError('source must be a JSON array of field objects');
  }
  // anchors: visibility-like object -> group node (or ROOT) that "./" is relative to
  const ctx = { loadGroup, anchors: new WeakMap(), stack: [] };
  const fields = expandList(source, ROOT, ctx, '');
  resolveAndValidate(fields, ctx, { ids });
  const out = ids ? assignIds(fields, '') : fields;
  finalizeIds(out, { ids });
  return out;
}

/**
 * Runs after ids are assigned (or skipped with ids:false):
 *  - resolves occurrence.sorting_label_field. HubSpot documents this as the
 *    *id* of the repeater child whose text labels the draggable cards. A value
 *    starting with "./" names a direct child of the repeater group and is
 *    rewritten to that child's final id (or its name with ids:false). Any other
 *    value must already equal the id of a direct child.
 *  - fails on any duplicate id across the whole module (generated vs generated,
 *    or generated vs explicit). HubSpot needs ids to be unique module-wide.
 */
function finalizeIds(fields, { ids = true } = {}) {
  const errors = [];
  const idOf = (f) => (f.id !== undefined ? f.id : f.name);
  const seenIds = new Map(); // id -> [dotted paths]
  const walk = (list, prefix) => {
    for (const f of list) {
      const at = prefix ? `${prefix}.${f.name}` : f.name;
      if (ids) {
        const id = idOf(f);
        if (!seenIds.has(id)) seenIds.set(id, []);
        seenIds.get(id).push(at);
      }
      const occ = f.occurrence;
      if (isPlainObject(occ) && occ.sorting_label_field !== undefined) {
        const v = occ.sorting_label_field;
        const kids = Array.isArray(f.children) ? f.children : [];
        if (typeof v !== 'string' || !v) {
          errors.push(`${at}: occurrence.sorting_label_field must be a non-empty string`);
        } else if (v.startsWith('./')) {
          const target = kids.find((c) => c.name === v.slice(2));
          if (!target) errors.push(`${at}: occurrence.sorting_label_field "${v}" is not a direct child of this group`);
          else occ.sorting_label_field = idOf(target);
        } else if (!kids.some((c) => idOf(c) === v)) {
          errors.push(`${at}: occurrence.sorting_label_field "${v}" does not match the id of any direct child ` +
            `(children: ${kids.map(idOf).join(', ') || '(none)'}); use "./<child name>" to let the composer resolve it`);
        }
      }
      if (Array.isArray(f.children)) walk(f.children, at);
    }
  };
  walk(fields, '');
  for (const [id, paths] of seenIds) {
    if (paths.length > 1) errors.push(`duplicate field id "${id}" shared by: ${paths.join(', ')}`);
  }
  if (errors.length) throw new ComposeError(errors.join('\n'));
}

/**
 * HubSpot requires field ids to be unique across the WHOLE module, and derives
 * the id from the name when none is given. Shared groups reuse child names
 * (e.g. style + cta.style, or two CTAs), so every field without an explicit id
 * gets a deterministic one built from its absolute path:
 *   layout.spacing.padding_top  ->  id "layout__spacing__padding_top"
 * Output key order: name, id, then the field's other keys.
 */
function assignIds(list, prefix) {
  return list.map((f) => {
    const p = prefix ? prefix + ID_SEPARATOR + f.name : f.name;
    const { name, id, ...rest } = f;
    const out = { name, id: id !== undefined ? id : p, ...rest };
    if (Array.isArray(out.children)) out.children = assignIds(out.children, p);
    return out;
  });
}

function expandList(list, anchor, ctx, where, inDef = false) {
  if (!Array.isArray(list)) {
    throw new ComposeError(`${where || '(root)'}: expected an array of fields`);
  }
  const out = [];
  list.forEach((el, i) => {
    const here = describe(where, el, i);
    if (!isPlainObject(el)) {
      throw new ComposeError(`${here}: each field must be an object, got ${JSON.stringify(el)}`);
    }
    out.push(expandField(el, anchor, ctx, here, inDef));
  });
  return out;
}

function describe(where, el, i) {
  const label = isPlainObject(el) ? (el.$use ? `$use:${el.$use}` : el.name) : undefined;
  const seg = label ? String(label) : `[${i}]`;
  return where ? `${where} > ${seg}` : seg;
}

function expandField(el, anchor, ctx, where, inDef) {
  for (const key of Object.keys(el)) {
    if (key.startsWith('$') && !DIRECTIVES.has(key)) {
      throw new ComposeError(`${where}: unknown directive "${key}" (allowed: ${[...DIRECTIVES].join(', ')})`);
    }
  }

  let node;
  let childAnchor;

  if (el.$use !== undefined) {
    const name = el.$use;
    if (typeof name !== 'string' || !name) {
      throw new ComposeError(`${where}: "$use" must be a non-empty group name string`);
    }
    if (ctx.stack.includes(name)) {
      throw new ComposeError(`${where}: circular $use: ${[...ctx.stack, name].join(' -> ')}`);
    }
    let def;
    try {
      def = ctx.loadGroup(name);
    } catch (e) {
      if (e instanceof ComposeError) throw new ComposeError(`${where}: ${e.message}`);
      throw e;
    }
    if ('children' in el || 'type' in el) {
      throw new ComposeError(`${where}: "children" and "type" cannot be overridden on a $use element (use $append/$prepend/$omit/$defaults)`);
    }
    node = def;
    // Plain (non-$) keys on the $use element override the group's own properties.
    for (const [k, v] of Object.entries(el)) {
      if (!k.startsWith('$')) node[k] = clone(v);
    }
    // "./" in the group's own visibility refers to the scope it is placed in.
    anchorOwn(node, anchor, ctx);
    childAnchor = node; // "./" inside the group's definition is relative to this group
    ctx.stack.push(name);
    try {
      if (Array.isArray(node.children)) {
        node.children = expandList(node.children, childAnchor, ctx, where, true);
      } else if (node.type === 'group') {
        throw new ComposeError(`${where}: group "${name}" has no children array`);
      }
    } finally {
      ctx.stack.pop();
    }
  } else {
    node = {};
    for (const [k, v] of Object.entries(el)) {
      if (!k.startsWith('$')) node[k] = clone(v);
    }
    anchorOwn(node, anchor, ctx);
    // Inside a group file, "./" stays relative to the group being expanded.
    // In a module's own source, "./" is relative to the field's parent group.
    childAnchor = inDef ? anchor : node;
    if (Array.isArray(node.children)) {
      node.children = expandList(node.children, childAnchor, ctx, where, inDef);
    }
  }

  applyModifiers(node, el, childAnchor, ctx, where, inDef);
  return node;
}

/** Record the anchor for every "./" controlling_field_path on this node (not its children). */
function anchorOwn(node, anchor, ctx) {
  for (const holder of visibilityHolders(node)) {
    const p = holder.controlling_field_path;
    if (typeof p === 'string' && p.startsWith('./') && !ctx.anchors.has(holder)) {
      ctx.anchors.set(holder, anchor);
    }
  }
}

/** Objects on a field that may carry a controlling_field_path. */
function visibilityHolders(node) {
  const holders = [];
  if (isPlainObject(node.visibility)) holders.push(node.visibility);
  const adv = node.advanced_visibility;
  if (isPlainObject(adv) && Array.isArray(adv.criteria)) {
    for (const c of adv.criteria) if (isPlainObject(c)) holders.push(c);
  }
  return holders;
}

function applyModifiers(node, el, anchor, ctx, where, inDef) {
  const hasMods = ['$prepend', '$append', '$omit', '$defaults'].some((k) => el[k] !== undefined);
  if (!hasMods) return;
  if (!Array.isArray(node.children)) {
    throw new ComposeError(`${where}: $prepend/$append/$omit/$defaults need a field with children (a group)`);
  }
  if (el.$prepend !== undefined) {
    node.children = expandList(el.$prepend, anchor, ctx, `${where} ($prepend)`, inDef).concat(node.children);
  }
  if (el.$append !== undefined) {
    node.children = node.children.concat(expandList(el.$append, anchor, ctx, `${where} ($append)`, inDef));
  }
  if (el.$omit !== undefined) {
    if (!Array.isArray(el.$omit) || el.$omit.some((p) => typeof p !== 'string')) {
      throw new ComposeError(`${where}: "$omit" must be an array of dotted child paths`);
    }
    for (const p of el.$omit) {
      const { list, index } = locate(node, p, where, '$omit');
      list.splice(index, 1);
    }
  }
  if (el.$defaults !== undefined) {
    if (!isPlainObject(el.$defaults)) {
      throw new ComposeError(`${where}: "$defaults" must be an object of { "dotted.child.path": value }`);
    }
    for (const [p, value] of Object.entries(el.$defaults)) {
      const { list, index } = locate(node, p, where, '$defaults');
      list[index].default = clone(value);
    }
  }
}

/** Find a dotted child path inside a group node. Returns the containing list and index. */
function locate(node, dotted, where, directive) {
  const parts = dotted.split('.');
  let list = node.children;
  for (let i = 0; i < parts.length; i++) {
    const index = Array.isArray(list) ? list.findIndex((f) => f && f.name === parts[i]) : -1;
    if (index === -1) {
      throw new ComposeError(`${where}: ${directive} path "${dotted}" not found (no "${parts[i]}" at "${parts.slice(0, i).join('.') || '(group root)'}")`);
    }
    if (i === parts.length - 1) return { list, index };
    list = list[index].children;
  }
  /* istanbul ignore next */
  throw new ComposeError(`${where}: ${directive} path "${dotted}" is empty`);
}

/* ------------------------------------------------------------------ */
/* Resolution + validation                                             */
/* ------------------------------------------------------------------ */

function resolveAndValidate(fields, ctx, { ids = true } = {}) {
  const errors = [];
  const moduleNames = new Map(); // name -> first absolute path (used with ids:false)
  const explicitIds = new Map(); // explicit id -> absolute path
  const nodePaths = new Map(); // node -> absolute dotted path
  const allPaths = new Set();

  // Pass 1: structure, names, path table.
  const walk = (list, prefix) => {
    const seen = new Set();
    for (const f of list) {
      const at = f && f.name ? (prefix ? `${prefix}.${f.name}` : f.name) : `${prefix || '(root)'}[?]`;
      for (const key of ['name', 'type', 'label']) {
        if (f[key] === undefined || f[key] === null || (key !== 'label' && f[key] === '')) {
          errors.push(`${at}: missing required "${key}"`);
        }
      }
      for (const k of Object.keys(f)) {
        if (k.startsWith('$')) errors.push(`${at}: leftover directive "${k}"`);
      }
      if (typeof f.name === 'string') {
        if (f.name.includes(ID_SEPARATOR) || f.name.includes('.')) {
          errors.push(`${at}: field name "${f.name}" must not contain "${ID_SEPARATOR}" (clashes with generated ids) or "." (makes controlling_field_path ambiguous)`);
        }
        if (RESERVED_NAMES.has(f.name)) {
          errors.push(`${at}: "${f.name}" is a reserved HubSpot field name (use e.g. "body_text")`);
        }
        if (seen.has(f.name)) errors.push(`${at}: duplicate field name "${f.name}" among siblings`);
        seen.add(f.name);
        if (!ids) {
          if (moduleNames.has(f.name)) {
            errors.push(`${at}: field name "${f.name}" also used at ${moduleNames.get(f.name)}; without explicit ids HubSpot requires names to be unique module-wide`);
          } else moduleNames.set(f.name, at);
        }
      }
      if (f.id !== undefined) {
        if (typeof f.id !== 'string' || !f.id) errors.push(`${at}: "id" must be a non-empty string`);
        else if (explicitIds.has(f.id)) errors.push(`${at}: id "${f.id}" also used at ${explicitIds.get(f.id)}`);
        else explicitIds.set(f.id, at);
      }
      if (isPlainObject(f.occurrence)) {
        for (const k of Object.keys(f.occurrence)) {
          if (!['min', 'max', 'default', 'sorting_label_field'].includes(k)) {
            errors.push(`${at}: unknown occurrence key "${k}" (HubSpot documents min, max, default, sorting_label_field)` +
              (k === 'sorting_label_field_name' ? '; use "sorting_label_field": "./<child name>"' : ''));
          }
        }
      }
      nodePaths.set(f, at);
      allPaths.add(at);
      if (f.type === 'group') {
        if (!Array.isArray(f.children)) errors.push(`${at}: group has no "children" array`);
      }
      if (Array.isArray(f.children)) walk(f.children, at);
    }
  };
  walk(fields, '');

  // Style tab: one top-level group, nested groups allowed, style field types only.
  const styleGroups = [];
  const checkStyle = (list, inStyle, depth) => {
    for (const f of list) {
      if (!f) continue;
      const at = nodePaths.get(f);
      if (f.tab !== undefined && f.tab !== STYLE_TAB && f.tab !== 'CONTENT') {
        errors.push(`${at}: unknown tab "${f.tab}" (HubSpot uses "CONTENT" or "STYLE")`);
      }
      let here = inStyle;
      if (f.tab === STYLE_TAB) {
        if (f.type !== 'group') errors.push(`${at}: "tab": "STYLE" belongs on a group, not a ${f.type} field`);
        else if (depth > 0) errors.push(`${at}: the STYLE-tab group must be top-level`);
        styleGroups.push(at);
        here = true;
      }
      if (here && f.type !== 'group' && !STYLE_FIELD_TYPES.has(f.type)) {
        errors.push(`${at}: field type "${f.type}" cannot be a module style field (allowed: ${[...STYLE_FIELD_TYPES].join(', ')})`);
      }
      if (Array.isArray(f.children)) checkStyle(f.children, here, depth + 1);
    }
  };
  checkStyle(fields, false, 0);
  if (styleGroups.length > 1) {
    errors.push(`only one STYLE-tab group is allowed per module; found ${styleGroups.join(', ')}`);
  }

  // Pass 2: rewrite "./" paths, then check every controlling_field_path exists.
  const check = (list) => {
    for (const f of list) {
      const at = nodePaths.get(f);
      for (const holder of visibilityHolders(f)) {
        let p = holder.controlling_field_path;
        if (p === undefined || p === null) continue;
        if (typeof p !== 'string') {
          errors.push(`${at}: controlling_field_path must be a string`);
          continue;
        }
        if (p.startsWith('./')) {
          const anchor = ctx.anchors.get(holder) || ROOT;
          const rel = p.slice(2);
          const base = anchor === ROOT ? '' : nodePaths.get(anchor);
          if (anchor !== ROOT && base === undefined) {
            errors.push(`${at}: controlling_field_path "${p}" is relative to a group that was removed`);
            continue;
          }
          p = base ? `${base}.${rel}` : rel;
          holder.controlling_field_path = p;
        }
        if (!allPaths.has(p)) {
          errors.push(`${at}: controlling_field_path "${p}" does not match any field`);
        } else if (p === at) {
          errors.push(`${at}: field controls its own visibility`);
        }
      }
      if (Array.isArray(f.children)) check(f.children);
    }
  };
  check(fields);

  if (errors.length) throw new ComposeError(errors.join('\n'));
}

/* ------------------------------------------------------------------ */
/* File-system driver                                                  */
/* ------------------------------------------------------------------ */

function findSources(themeDir) {
  const found = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.isFile() && e.name === SOURCE_FILE) found.push(full);
    }
  };
  for (const d of SCAN_DIRS) walk(path.join(themeDir, d));
  return found.sort();
}

function composeFile(sourcePath, loadGroup, opts) {
  let source;
  try {
    source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  } catch (e) {
    throw new ComposeError(`invalid JSON: ${e.message}`);
  }
  return serialize(compose(source, loadGroup, opts));
}

function run(themeDir, { check = false, quiet = false, ids = true } = {}) {
  const log = quiet ? () => {} : (m) => console.log(m);
  if (!fs.existsSync(themeDir) || !fs.statSync(themeDir).isDirectory()) {
    console.error(`compose-fields: theme folder not found: ${themeDir}`);
    return 2;
  }
  const loadGroup = fileGroupLoader(path.join(themeDir, GROUPS_DIR));
  const sources = findSources(themeDir);
  if (!sources.length) {
    log(`compose-fields: no ${SOURCE_FILE} files under ${SCAN_DIRS.map((d) => path.join(themeDir, d)).join(', ')}`);
    return 0;
  }

  let failed = 0;
  const stale = [];
  for (const src of sources) {
    const rel = path.relative(themeDir, src);
    const out = path.join(path.dirname(src), OUTPUT_FILE);
    const relOut = path.relative(themeDir, out);
    let text;
    try {
      text = composeFile(src, loadGroup, { ids });
    } catch (e) {
      if (!(e instanceof ComposeError)) throw e;
      failed++;
      console.error(`ERROR ${rel}:\n  ${e.message.split('\n').join('\n  ')}`);
      continue;
    }
    const current = fs.existsSync(out) ? normalizeEol(fs.readFileSync(out, 'utf8')) : null;
    if (current === text) {
      log(`ok       ${relOut}`);
    } else if (check) {
      stale.push(`${current === null ? 'missing ' : 'outdated'} ${relOut}`);
    } else {
      fs.writeFileSync(out, text);
      log(`${current === null ? 'created ' : 'updated '} ${relOut}`);
    }
  }

  if (stale.length) {
    console.error(`compose-fields --check: ${stale.length} fields.json file(s) need regenerating:`);
    for (const s of stale) console.error(`  ${s}`);
    console.error('Run: node Automation/compose-fields.js');
  }
  if (failed) console.error(`compose-fields: ${failed} source file(s) failed.`);
  return failed || stale.length ? 1 : 0;
}

/* ------------------------------------------------------------------ */
/* Self-test                                                           */
/* ------------------------------------------------------------------ */

function selfTest({ updateExpected = false } = {}) {
  const testDir = path.join(__dirname, 'test');
  const groupsDir = path.join(DEFAULT_THEME_DIR, GROUPS_DIR);
  const results = [];
  const test = (name, fn) => {
    try {
      fn();
      results.push([true, name]);
    } catch (e) {
      results.push([false, name, e.message]);
    }
  };
  const expectError = (fn, re) => {
    try {
      fn();
    } catch (e) {
      if (!(e instanceof ComposeError)) throw e;
      if (!re.test(e.message)) throw new Error(`error did not match ${re}:\n${e.message}`);
      return;
    }
    throw new Error(`expected an error matching ${re}`);
  };
  const assert = (cond, msg) => {
    if (!cond) throw new Error(msg);
  };

  // 1. Golden file: sample source + real shared groups -> expected fields.json
  test('sample fields.source.json matches expected.fields.json', () => {
    const actual = composeFile(path.join(testDir, 'sample.fields.source.json'), fileGroupLoader(groupsDir));
    const expectedPath = path.join(testDir, 'expected.fields.json');
    if (updateExpected) {
      fs.writeFileSync(expectedPath, actual);
      return;
    }
    const expected = normalizeEol(fs.readFileSync(expectedPath, 'utf8'));
    if (actual !== expected) {
      const a = actual.split('\n');
      const b = expected.split('\n');
      const i = a.findIndex((l, n) => l !== b[n]);
      throw new Error(`output differs from expected at line ${i + 1}:\n  actual:   ${a[i]}\n  expected: ${b[i]}`);
    }
  });

  // 2. Every real shared group expands and validates on its own.
  test('every field-groups/*.json composes standalone', () => {
    const loader = fileGroupLoader(groupsDir);
    const names = fs.readdirSync(groupsDir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
    assert(names.length > 0, 'no groups found');
    for (const n of names) compose([{ $use: n }], loader);
  });

  // 3. Relative path rewriting through nested $use.
  test('./ paths resolve to absolute dotted paths when nested', () => {
    const out = compose([{ $use: 'layout' }], fileGroupLoader(groupsDir));
    const spacing = out[0].children.find((f) => f.name === 'spacing');
    const custom = spacing.children.find((f) => f.name === 'padding_top_custom');
    assert(custom.visibility.controlling_field_path === 'layout.spacing.padding_top',
      `got ${custom.visibility.controlling_field_path}`);
  });

  // 4. Renaming a used group rewrites the paths under the new name.
  test('renamed group rewrites relative paths', () => {
    const out = compose([{ $use: 'style', name: 'colours', label: 'Colours' }], fileGroupLoader(groupsDir));
    const bg = out[0].children.find((f) => f.name === 'background_color');
    assert(bg.visibility.controlling_field_path === 'colours.background', `got ${bg.visibility.controlling_field_path}`);
  });

  // Error cases (in-memory groups).
  const mem = memoryGroupLoader({
    g: { name: 'g', label: 'G', type: 'group', children: [
      { name: 'a', label: 'A', type: 'boolean', default: false },
      { name: 'b', label: 'B', type: 'text', visibility: { controlling_field_path: './a', operator: 'EQUAL', controlling_value_regex: 'true' } },
    ] },
    loop1: { name: 'loop1', label: 'L1', type: 'group', children: [{ $use: 'loop2' }] },
    loop2: { name: 'loop2', label: 'L2', type: 'group', children: [{ $use: 'loop1' }] },
  });
  test('error: unknown group', () => expectError(() => compose([{ $use: 'nope' }], mem), /unknown group "nope"/));
  test('error: duplicate sibling names', () =>
    expectError(() => compose([{ $use: 'g' }, { name: 'g', label: 'X', type: 'text' }], mem), /duplicate field name "g"/));
  test('error: reserved name body (nested)', () =>
    expectError(() => compose([{ $use: 'g', $append: [{ name: 'body', label: 'Body', type: 'richtext' }] }], mem), /g\.body: "body" is a reserved/));
  test('ids: path-based, unique, explicit id kept', () => {
    const out = compose([{ $use: 'g' }, { name: 'h', label: 'H', type: 'group', children: [{ name: 'a', id: 'custom', label: 'A', type: 'text' }] }], mem);
    assert(out[0].id === 'g' && out[0].children[1].id === 'g__b', 'generated ids wrong');
    assert(out[1].children[0].id === 'custom', 'explicit id overwritten');
    assert(Object.keys(out[0].children[1]).slice(0, 2).join() === 'name,id', 'key order');
  });
  test('error: --no-ids rejects module-wide duplicate names', () =>
    expectError(() => compose([{ $use: 'g' }, { name: 'h', label: 'H', type: 'group', children: [{ name: 'a', label: 'A', type: 'text' }] }], mem, { ids: false }), /"a" also used at g.a/));
  test('error: reserved names label/name', () =>
    expectError(() => compose([{ name: 'label', label: 'L', type: 'text' }], mem), /"label" is a reserved/));
  test('error: missing name/type/label', () =>
    expectError(() => compose([{ name: 'x', type: 'text' }], mem), /x: missing required "label"/));
  test('error: dangling controlling_field_path after $omit', () =>
    expectError(() => compose([{ $use: 'g', $omit: ['a'] }], mem), /controlling_field_path "g\.a" does not match/));
  test('error: absolute controlling_field_path to nothing', () =>
    expectError(() => compose([{ name: 'x', label: 'X', type: 'text', visibility: { controlling_field_path: 'nope.field' } }], mem), /"nope\.field" does not match/));
  test('error: circular $use', () => expectError(() => compose([{ $use: 'loop1' }], mem), /circular \$use/));
  test('error: bad $defaults path', () =>
    expectError(() => compose([{ $use: 'g', $defaults: { 'a.zz': 1 } }], mem), /\$defaults path "a\.zz" not found/));
  test('error: unknown directive', () => expectError(() => compose([{ $use: 'g', $default: {} }], mem), /unknown directive "\$default"/));
  test('$defaults, $prepend, $append and ./ in appended fields', () => {
    const out = compose([{ $use: 'g', $defaults: { a: true }, $prepend: [{ name: 'p', label: 'P', type: 'text' }],
      $append: [{ name: 'z', label: 'Z', type: 'text', visibility: { controlling_field_path: './a', operator: 'EQUAL', controlling_value_regex: 'true' } }] }], mem);
    const names = out[0].children.map((f) => f.name).join(',');
    assert(names === 'p,a,b,z', `order was ${names}`);
    assert(out[0].children[1].default === true, '$defaults not applied');
    assert(out[0].children[3].visibility.controlling_field_path === 'g.a', 'appended ./ path not rewritten');
  });

  test('error: generated id collides with a name containing __', () =>
    expectError(() => compose([{ name: 'a__b', label: 'AB', type: 'text' },
      { name: 'a', label: 'A', type: 'group', children: [{ name: 'b', label: 'B', type: 'text' }] }], mem), /must not contain "__"/));
  test('error: name containing "."', () =>
    expectError(() => compose([{ name: 'a.b', label: 'AB', type: 'text' }], mem), /must not contain/));
  test('error: explicit id collides with a generated id', () =>
    expectError(() => compose([{ name: 'x', id: 'g__a', label: 'X', type: 'text' }, { $use: 'g' }], mem),
      /duplicate field id "g__a" shared by: x, g\.a/));
  test('sorting_label_field "./child" resolves to the generated child id', () => {
    const out = compose([{ name: 'r', label: 'R', type: 'group', occurrence: { min: 1, sorting_label_field: './t' },
      children: [{ name: 'img', label: 'I', type: 'image' }, { name: 't', label: 'T', type: 'text' }] }], mem);
    assert(out[0].occurrence.sorting_label_field === 'r__t', `got ${out[0].occurrence.sorting_label_field}`);
  });
  test('error: sorting_label_field that matches no child id', () =>
    expectError(() => compose([{ name: 'r', label: 'R', type: 'group', occurrence: { sorting_label_field: 't' },
      children: [{ name: 't', label: 'T', type: 'text' }] }], mem), /does not match the id of any direct child/));
  test('error: unknown occurrence key sorting_label_field_name', () =>
    expectError(() => compose([{ name: 'r', label: 'R', type: 'group', occurrence: { sorting_label_field_name: 't' },
      children: [{ name: 't', label: 'T', type: 'text' }] }], mem), /unknown occurrence key "sorting_label_field_name"/));

  test('shared style group sits on the STYLE tab', () => {
    const out = compose([{ $use: 'style' }], fileGroupLoader(groupsDir));
    assert(out[0].tab === 'STYLE', `got tab ${out[0].tab}`);
  });
  test('error: non-style field type inside the STYLE tab', () =>
    expectError(() => compose([{ name: 's', label: 'S', type: 'group', tab: 'STYLE',
      children: [{ name: 't', label: 'T', type: 'text' }] }], mem), /"text" cannot be a module style field/));
  test('error: two STYLE-tab groups', () =>
    expectError(() => compose([{ name: 's', label: 'S', type: 'group', tab: 'STYLE', children: [] },
      { name: 'u', label: 'U', type: 'group', tab: 'STYLE', children: [] }], mem), /only one STYLE-tab group/));
  test('error: nested STYLE-tab group', () =>
    expectError(() => compose([{ name: 'o', label: 'O', type: 'group', children: [
      { name: 's', label: 'S', type: 'group', tab: 'STYLE', children: [] }] }], mem), /must be top-level/));

  let failed = 0;
  for (const [ok, name, msg] of results) {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
    if (!ok) {
      failed++;
      console.log('      ' + String(msg).split('\n').join('\n      '));
    }
  }
  console.log(`\n${results.length - failed}/${results.length} passed${updateExpected ? ' (expected.fields.json rewritten — review the diff)' : ''}`);
  return failed ? 1 : 0;
}

/* ------------------------------------------------------------------ */
/* CLI                                                                 */
/* ------------------------------------------------------------------ */

const HELP = `Usage:
  node compose-fields.js [themeDir] [--check] [--quiet]
  node compose-fields.js --self-test [--update-expected]

  themeDir   theme folder (default: ${DEFAULT_THEME_DIR})
  --check    write nothing; exit 1 if any fields.json is missing or out of date
  --quiet    only print errors
  --no-ids   do not generate field ids; instead require names to be unique module-wide
  --self-test           run the composer's own tests (Automation/test)
  --update-expected     with --self-test: regenerate test/expected.fields.json`;

function main(argv) {
  const flags = new Set(argv.filter((a) => a.startsWith('--')));
  const positional = argv.filter((a) => !a.startsWith('--'));
  const known = new Set(['--check', '--quiet', '--no-ids', '--self-test', '--update-expected', '--help']);
  for (const f of flags) {
    if (!known.has(f)) {
      console.error(`compose-fields: unknown option ${f}\n\n${HELP}`);
      return 2;
    }
  }
  if (flags.has('--help')) {
    console.log(HELP);
    return 0;
  }
  if (flags.has('--self-test')) return selfTest({ updateExpected: flags.has('--update-expected') });
  if (positional.length > 1) {
    console.error(`compose-fields: expected at most one themeDir\n\n${HELP}`);
    return 2;
  }
  const themeDir = positional[0] ? path.resolve(positional[0]) : DEFAULT_THEME_DIR;
  return run(themeDir, { check: flags.has('--check'), quiet: flags.has('--quiet'), ids: !flags.has('--no-ids') });
}

module.exports = { compose, fileGroupLoader, memoryGroupLoader, findSources, run, ComposeError };

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}
