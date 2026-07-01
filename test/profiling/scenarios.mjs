/**
 * Declarative profiling scenarios.
 *
 * Design note: most instrumented spans are best measured via URL-driven page
 * loads — a load with `?l=radial` runs exactly the same setLayout/mapToScreen
 * code as an in-app layout change, and a load with `?c=region` runs the same
 * changeColorBy calculation. The one path that only exists in-app (the
 * incremental `phylotree.change()` cascade) is captured robustly by the
 * `animate` scenario, whose every tick dispatches a date-filter change. DOM-click
 * steps (colorby/layout) are included as best-effort extras for true transition
 * numbers and degrade gracefully if a selector can't be driven.
 *
 * Scenario schema:
 *   { id, dataset, params, steps, repeat, warmup, loadTimeoutMs, settleAfterMs, animateMs }
 * Step schema:
 *   { label, kind: 'colorby'|'layout'|'wait', value?, waitMs? }
 */

const SPIKE = "/spike-sm";

export const scenarios = [
  // --- small/medium loads: fast sanity + the timers-present guard (zika is first) ---
  {
    id: "zika-load",
    dataset: "/zika",
    params: {},
    steps: [],
    repeat: 5,
    warmup: 1,
    loadTimeoutMs: 30000,
    settleAfterMs: 800,
  },
  {
    id: "ebola-load",
    dataset: "/ebola",
    params: { d: "tree,map,entropy" },
    steps: [],
    repeat: 5,
    warmup: 1,
    loadTimeoutMs: 45000,
    settleAfterMs: 1000,
  },

  // --- STRESS: 35k-tip spike, all panels — every load-time span ---
  {
    id: "spike-load-all-panels",
    dataset: SPIKE,
    params: { d: "tree,map,entropy,frequencies" },
    steps: [],
    repeat: 2,
    warmup: 1,
    loadTimeoutMs: 180000,
    settleAfterMs: 2500, // catch debounced updateFrequencyData + map + entropy
  },

  // --- per-layout compute cost on the big tree (tree-only to isolate + cut load) ---
  {
    id: "spike-load-radial",
    dataset: SPIKE,
    params: { d: "tree", l: "radial" },
    steps: [],
    repeat: 2,
    warmup: 1,
    loadTimeoutMs: 180000,
    settleAfterMs: 1500,
  },
  {
    id: "spike-load-unrooted",
    dataset: SPIKE,
    params: { d: "tree", l: "unrooted" },
    steps: [],
    repeat: 2,
    warmup: 1,
    loadTimeoutMs: 180000,
    settleAfterMs: 1500,
  },

  // --- incremental cascade + per-tick cost (URL-driven, robust) ---
  // animate = start,end,loop,cumulative,speedMs
  {
    id: "spike-animation",
    dataset: SPIKE,
    params: { d: "tree", animate: "2020-03-01,2022-06-01,0,0,3000" },
    steps: [],
    repeat: 2,
    warmup: 0,
    loadTimeoutMs: 180000,
    settleAfterMs: 500,
    animateMs: 10000, // capture animation ticks for this wall-clock window
  },

  // --- best-effort DOM incremental transitions (skipped gracefully on failure) ---
  {
    id: "spike-colorby",
    dataset: SPIKE,
    params: { d: "tree,entropy" },
    steps: [
      { label: "colorby-region", kind: "colorby", value: "region" },
      { label: "colorby-country", kind: "colorby", value: "country" },
    ],
    repeat: 2,
    warmup: 0,
    loadTimeoutMs: 180000,
    settleAfterMs: 1200,
  },
  {
    id: "spike-layout",
    dataset: SPIKE,
    params: { d: "tree" },
    steps: [
      { label: "layout-radial", kind: "layout", value: "radial" },
      { label: "layout-unrooted", kind: "layout", value: "unrooted" },
      { label: "layout-rect", kind: "layout", value: "rectangular" },
    ],
    repeat: 2,
    warmup: 0,
    loadTimeoutMs: 180000,
    settleAfterMs: 1200,
  },
];

/** Build a dataset URL path + query string from a scenario. */
export function scenarioUrl(scenario) {
  const qs = new URLSearchParams(scenario.params || {}).toString();
  return qs ? `${scenario.dataset}?${qs}` : scenario.dataset;
}
