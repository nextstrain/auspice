/**
 * Render-equivalence regression suite.
 *
 * For each operation (colorBy, layout, distance, filter, zoom, …) and for
 * sequences of operations, this drives the INCREMENTAL update path in-app and
 * asserts the settled SVG DOM is identical to a from-scratch FULL render of the
 * same end state. A mismatch = a stale-DOM regression in the incremental path.
 *
 * Driving: history.pushState(newURL) + a popstate event triggers the app's own
 * listener (monitor.js) which takes the incremental branch (navigation.js Case 1,
 * createStateFromQueryOrJSONs) — the same phylotree.change() path a control uses,
 * with zero source changes. Reference: a fresh page at the app's resulting URL.
 *
 *   npm run render-equiv            (reuses the current dist/ build)
 *   npm run render-equiv -- --build (force a fresh build first)
 *   npm run render-equiv -- --only ebola-colorby-categorical,ebola-zoom
 */

import { chromium } from "playwright";
import { ensureTimingBuild, startServer, stopServer, BASE_URL } from "./buildAndServe.mjs";
import { snapshot, compare, countChanged, signature } from "./domSnapshot.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Build a query string, supporting valueless params (value === true -> `key`). */
function buildQuery(params) {
  const parts = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === false) continue;
    parts.push(v === true ? encodeURIComponent(k) : `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  }
  return parts.join("&");
}

async function settle(page, { min = 700, max = 30000, interval = 250 } = {}) {
  await sleep(min);
  let prev = await signature(page);
  let stable = 0;
  const deadline = Date.now() + max;
  while (Date.now() < deadline) {
    await sleep(interval);
    const cur = await signature(page);
    if (cur === prev) { if (++stable >= 2) return; } else stable = 0;
    prev = cur;
  }
}

async function loadFull(page, url, loadTimeout) {
  await page.goto(url, { waitUntil: "commit", timeout: loadTimeout });
  await page.locator("circle.tip").first().waitFor({ state: "attached", timeout: loadTimeout });
  await settle(page, { max: loadTimeout });
}

async function driveIncremental(page, path, loadTimeout) {
  await page.evaluate((p) => {
    history.pushState({}, "", p);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, path);
  await settle(page, { max: loadTimeout });
}

// --- Scenarios -------------------------------------------------------------
// dataset: URL path segment. base: initial query params. steps: each merges
// `set` into the running params and drives one incremental op.
const SCENARIOS = [
  // ---- ebola: single operations ----
  { id: "ebola-colorby-categorical", dataset: "ebola", base: { d: "tree", c: "country" }, steps: [{ set: { c: "division" } }] },
  { id: "ebola-colorby-continuous", dataset: "ebola", base: { d: "tree", c: "country" }, steps: [{ set: { c: "num_date" } }] },
  { id: "ebola-layout-radial", dataset: "ebola", base: { d: "tree", l: "rect" }, steps: [{ set: { l: "radial" } }] },
  { id: "ebola-layout-unrooted", dataset: "ebola", base: { d: "tree", l: "rect" }, steps: [{ set: { l: "unrooted" } }] },
  { id: "ebola-layout-clock", dataset: "ebola", base: { d: "tree", l: "rect" }, steps: [{ set: { l: "clock" } }] },
  { id: "ebola-layout-scatter", dataset: "ebola", base: { d: "tree", l: "rect" }, steps: [{ set: { l: "scatter" } }] },
  { id: "ebola-distance", dataset: "ebola", base: { d: "tree", m: "num_date" }, steps: [{ set: { m: "div" } }] },
  { id: "ebola-datefilter", dataset: "ebola", base: { d: "tree" }, steps: [{ set: { dmin: "2014-08-01", dmax: "2015-03-01" } }] },
  { id: "ebola-traitfilter", dataset: "ebola", base: { d: "tree" }, steps: [{ set: { f_country: "Sierra Leone" } }] },
  { id: "ebola-zoom", dataset: "ebola", base: { d: "tree" }, steps: [{ set: { f_country: "Sierra Leone", treeZoom: "selected" } }] },
  { id: "ebola-confidence", dataset: "ebola", base: { d: "tree", m: "num_date" }, steps: [{ set: { ci: true } }] },

  // ---- ebola: combinations (sequenced incremental ops) ----
  { id: "ebola-filter-then-colorby", dataset: "ebola", base: { d: "tree", c: "country" }, steps: [{ set: { f_country: "Sierra Leone" } }, { set: { c: "division" } }] },
  { id: "ebola-colorby-then-zoom", dataset: "ebola", base: { d: "tree", c: "country" }, steps: [{ set: { c: "division" } }, { set: { f_country: "Sierra Leone", treeZoom: "selected" } }] },
  { id: "ebola-date-then-layout", dataset: "ebola", base: { d: "tree" }, steps: [{ set: { dmin: "2014-08-01", dmax: "2015-03-01" } }, { set: { l: "radial" } }] },
  { id: "ebola-filter-date-colorby", dataset: "ebola", base: { d: "tree", c: "country" }, steps: [{ set: { f_country: "Sierra Leone" } }, { set: { dmin: "2014-08-01", dmax: "2015-03-01" } }, { set: { c: "division" } }] },

  // ---- zika: variety ----
  { id: "zika-colorby", dataset: "zika", base: { d: "tree", c: "country" }, steps: [{ set: { c: "region" } }] },
  { id: "zika-layout-unrooted", dataset: "zika", base: { d: "tree", l: "rect" }, steps: [{ set: { l: "unrooted" } }] },

  // ---- spike-sm: scale + streamtrees (slow) ----
  { id: "spike-colorby", dataset: "spike-sm", base: { d: "tree", c: "clade_membership" }, steps: [{ set: { c: "region" } }], slow: true },
  { id: "spike-datefilter", dataset: "spike-sm", base: { d: "tree" }, steps: [{ set: { dmin: "2021-01-01", dmax: "2021-09-01" } }], slow: true },
];

async function runScenario(browser, scn) {
  const loadTimeout = scn.slow ? 180000 : 45000;
  const ctxIncr = await browser.newContext();
  const incrPage = await ctxIncr.newPage();
  const errors = [];
  incrPage.on("pageerror", (e) => errors.push(e.message));

  let params = { ...scn.base };
  await loadFull(incrPage, `${BASE_URL}/${scn.dataset}?${buildQuery(params)}`, loadTimeout);
  const base = await snapshot(incrPage);

  for (const step of scn.steps) {
    params = { ...params, ...step.set };
    await driveIncremental(incrPage, `/${scn.dataset}?${buildQuery(params)}`, loadTimeout);
  }
  const incr = await snapshot(incrPage);
  const synced = new URL(incrPage.url()).pathname + new URL(incrPage.url()).search;
  await ctxIncr.close();

  const ctxRef = await browser.newContext();
  const refPage = await ctxRef.newPage();
  refPage.on("pageerror", (e) => errors.push(e.message));
  await loadFull(refPage, `${BASE_URL}${synced}`, loadTimeout);
  const ref = await snapshot(refPage);
  await ctxRef.close();

  const result = compare(ref, incr);
  const changed = countChanged(base, incr);
  const pass = result.total === 0;
  return { pass, changed, result, synced, errors };
}

function fmt(scn, r) {
  const status = r.pass ? "PASS" : "FAIL";
  const counts = Object.entries(r.result.byClass)
    .filter(([, v]) => v.diffs || v.onlyRef || v.onlyIncr)
    .map(([k, v]) => `${k}:${v.diffs}${v.onlyRef || v.onlyIncr ? `(+/-${v.onlyRef}/${v.onlyIncr})` : ""}`)
    .join(" ");
  let line = `  [${status}] ${scn.id.padEnd(30)} mismatch=${r.result.total} changed=${r.changed}${counts ? "  " + counts : ""}`;
  if (r.changed === 0) line += "  ⚠ op produced no DOM change (drive may have no-oped)";
  if (r.errors.length) line += `  ⚠ ${r.errors.length} pageerror`;
  return line;
}

async function main() {
  const argv = process.argv.slice(2);
  const build = argv.includes("--build");
  const onlyIdx = argv.indexOf("--only");
  const only = onlyIdx >= 0 ? argv[onlyIdx + 1].split(",") : null;
  const scenarios = only ? SCENARIOS.filter((s) => only.includes(s.id)) : SCENARIOS;

  await ensureTimingBuild({ force: build });
  await startServer();
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  try {
    for (const scn of scenarios) {
      let r;
      try {
        r = await runScenario(browser, scn);
      } catch (e) {
        console.log(`  [ERROR] ${scn.id}: ${e.message}`);
        failures.push(scn.id);
        continue;
      }
      console.log(fmt(scn, r));
      if (!r.pass) {
        failures.push(scn.id);
        for (const ex of r.result.examples) {
          console.log(`        ${ex.cls} ${ex.id} ${ex.prop}: ref=${JSON.stringify(ex.ref)} incr=${JSON.stringify(ex.incr)}`);
        }
      }
    }
  } finally {
    await browser.close();
    await stopServer();
  }
  console.log(`\n${scenarios.length - failures.length}/${scenarios.length} scenarios passed.`);
  if (failures.length) {
    console.log(`FAILED: ${failures.join(", ")}`);
    process.exitCode = 1;
  }
}

main().catch((e) => { console.error("[FATAL]", e); stopServer().finally(() => process.exit(1)); });
