#!/usr/bin/env node
// Turns a compact page spec into HubSpot `layoutSections` JSON (CMS Pages API v3).
//
// Spec shape (see examples/demo-homepage.json):
// {
//   "dndArea": "page_sections",              // must match the template's {% dnd_area "..." %}
//   "sections": [
//     { "module": "Hero", "params": { "content": {...}, "layout": {...} } },
//     ...
//   ]
// }
// Every section becomes one full-width DnD section holding one Agile module (Section modules own
// their own layout, background and padding). `module` is an Agile module folder name.
// Module params are the module's field values, keyed exactly as in its composed fields.json.
'use strict';

const MODULE_PATH = name => `../modules/${name}.module`; // relative to templates/, as the templates use

function moduleWidget(area, n, spec) {
  return {
    cells: [], cssClass: '', cssId: '', cssStyle: '',
    name: `${area}-module-${n}`,
    params: {
      child_css: {}, css: {}, css_class: 'dnd-module',
      path: MODULE_PATH(spec.module),
      schema_version: 2, smart_objects: [], smart_type: 'NOT_SMART', wrap_field_tag: 'div',
      ...spec.params,
    },
    rowMetaData: [], rows: [], styles: {},
    type: 'custom_widget', w: 12, x: 0,
  };
}

function buildLayout(spec) {
  const area = spec.dndArea;
  if (!area) throw new Error('spec.dndArea is required');
  let n = 1;
  const rows = [];
  const rowMetaData = [];
  for (const section of spec.sections) {
    const column = {
      cells: [], cssClass: '', cssId: '', cssStyle: '',
      name: `${area}-column-${n++}`,
      params: { css_class: 'dnd-column' },
      rowMetaData: [{ cssClass: 'dnd-row', styles: {} }],
      rows: [{ 0: moduleWidget(area, n++, section) }],
      styles: {}, type: 'cell', w: 12, x: 0,
    };
    rows.push({ 0: column });
    // Agile Section modules own their spacing and background, so the DnD section adds none.
    rowMetaData.push({ cssClass: 'dnd-section', styles: { forceFullWidthSection: false } });
  }
  return {
    [area]: {
      cells: [], cssClass: '', cssId: '', cssStyle: '',
      label: spec.label || 'Page Sections', name: area, params: {},
      rowMetaData, rows, type: 'cell', w: 12, x: 0,
    },
  };
}

module.exports = { buildLayout };

if (require.main === module) {
  const spec = JSON.parse(require('fs').readFileSync(process.argv[2], 'utf8'));
  console.log(JSON.stringify(buildLayout(spec), null, 2));
}
