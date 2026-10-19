#!/usr/bin/env node
// Minimal HubSpot API client for Agile automation scripts (Node 22, zero dependencies).
//
// Usage:
//   node hubspot-api.js --portal demo get  "cms/v3/pages/site-pages?limit=5"
//   node hubspot-api.js --portal demo post "cms/v3/pages/site-pages" page.json
//
// Reads settings from Automation/.env.<portal> (see .env.example). Before every call it checks
// that the access token belongs to HUBSPOT_PORTAL_ID, and it always refuses the gk3capital
// production portal. The token is never printed.
'use strict';
const fs = require('fs');
const path = require('path');

const FORBIDDEN_PORTALS = new Set([3075079]); // gk3capital: Agile must never touch it

function loadEnv(portal) {
  const file = path.join(__dirname, `.env.${portal}`);
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}. Copy .env.example to .env.${portal} and fill it in.`);
  const env = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

function createClient(portal) {
  const env = loadEnv(portal);
  const portalId = Number(env.HUBSPOT_PORTAL_ID);
  const token = env.HUBSPOT_ACCESS_TOKEN;
  if (!portalId) throw new Error(`HUBSPOT_PORTAL_ID is not set in .env.${portal}`);
  if (FORBIDDEN_PORTALS.has(portalId)) throw new Error(`Refusing to run against portal ${portalId}.`);
  if (!token) throw new Error(`HUBSPOT_ACCESS_TOKEN is empty in .env.${portal} (copy it from the app's Distribution tab).`);

  async function raw(method, url, data) {
    const res = await fetch('https://api.hubapi.com/' + url.replace(/^\//, ''), {
      method: method.toUpperCase(),
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
    const text = await res.text();
    let body;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    return { status: res.status, data: body };
  }

  // One token check per client. Concurrent calls share the same in-flight promise; a failed check is not cached.
  let verifying = null;
  function verifyPortal() {
    if (!verifying) {
      verifying = (async () => {
        const r = await raw('get', 'account-info/v3/details');
        const actual = r.data && Number(r.data.portalId);
        if (r.status !== 200 || actual !== portalId || FORBIDDEN_PORTALS.has(actual)) {
          throw new Error(`Token check failed: expected portal ${portalId}, got ${actual ?? 'unknown'} (HTTP ${r.status}).`);
        }
      })().catch(e => { verifying = null; throw e; });
    }
    return verifying;
  }

  async function call(method, url, data) {
    await verifyPortal();
    return raw(method, url, data);
  }

  return { call, portalId, accountName: env.HUBSPOT_ACCOUNT_NAME };
}

module.exports = { createClient };

if (require.main === module) {
  const args = process.argv.slice(2);
  const i = args.indexOf('--portal');
  if (i === -1 || !args[i + 1]) {
    console.error('Usage: node hubspot-api.js --portal <name> <get|post|patch|put|delete> <url> [body.json]');
    process.exit(1);
  }
  const portal = args[i + 1];
  const [method, url, file] = args.filter((_, j) => j !== i && j !== i + 1);
  const data = file ? JSON.parse(fs.readFileSync(file, 'utf8')) : undefined;
  Promise.resolve()
    .then(() => createClient(portal).call(method, url, data))
    .then(r => console.log(JSON.stringify(r, null, 2)))
    .catch(e => { console.error('ERROR: ' + e.message); process.exit(2); });
}
