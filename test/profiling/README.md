# Auspice profiling

There are two harnesses in `test/profiling/`:

1. `npm run profile` which collects JS timing measurements across a number of example datasets & actions.
  Its intention is to be run against different versions of the code to see any performance changes.
2. `npm run render-equiv` is a render-equivalence suite to check that in-app actions produce the exact same SVG DOM as a from-scratch full render of the same end state.

## Timing profiles

A headless, reproducible harness that measures Auspice's built-in `src/util/perf.js`
timers (`timerStart`/`timerEnd`) across representative datasets and produces a ranked
baseline of where time is spent. **Measure-only** — it changes no application code.

#### Quick start

```bash
# 1. build (--includeTiming, production) + serve data/ + run all scenarios
npm run profile -- --build

# subsequent runs can skip the rebuild if dist/ already has timers:
npm run profile

# compare a run against a previous baseline (before/after):
npm run profile -- --baseline test/profiling/baselines/baseline-latest.json

# emulate a slower device (also lifts small-tree spans above perf.js's 20ms floor):
npm run profile -- --throttle 4

# run a subset:
npm run profile -- --only zika-load,spike-animation
```

Outputs land in `test/profiling/baselines/`:
- `baseline-<gitSha>.json` and `baseline-latest.json` — machine-readable (per
  scenario × marker × span: median/p95/count/total + raw samples).
- `report-<gitSha>.md` — ranked hotspot report (also printed to stdout).

#### How it works

- **Timers must be compiled in.** Normal builds strip `timerStart`/`timerEnd`
  (`babel.config.cjs`). `cli/build.ts --includeTiming` keeps them in a **production,
  minified** bundle. The harness runs that build and serves it with `auspice view`
  — production-representative numbers, *not* `auspice develop` (dev mode distorts
  timings). It asserts the served bundle actually contains timer output or fails loudly.
- **Serving `data/`.** The stock `playwright.config.ts` webServer only serves
  `test/data test/fetched-jsons`; this harness serves the top-level `data/` dir too
  (so `/spike-sm` etc. resolve). It reuses an already-running :4000 server if present.
- **Capturing timers.** `page.on('console')` accepts both `log` and `warning`
  (perf.js uses `console.warn` for calls >20ms). It records the per-call `took`
  value and ignores perf.js's cumulative `Average`.
- **Isolation.** A fresh browser context per trial resets perf.js's accumulator, so
  samples never bleed across scenarios. Each sample is tagged with the interaction
  marker in flight.
- **Driving interactions.** Most spans are measured via URL-driven loads (a load with
  `?l=radial` runs the same layout/mapToScreen code as an in-app change). The
  incremental `phylotree.change()` cascade is captured by the URL-driven `animate`
  scenario. DOM-click steps (colorby/layout) are best-effort extras that skip
  gracefully if a control can't be driven.
- **Render-complete signal.** Waits for the `phyloTree render()` timer line (not
  `networkidle`, which is meaningless for a 35k-tip D3 render), with a
  `svg#MainTree circle.tip` DOM fallback.



## Render-equivalence suite

A regression suite (`renderEquivalence.mjs` + `domSnapshot.mjs`) that guards the
incremental tree-update path. For each operation (colorBy, layout, distance, filter,
zoom, confidence, …) and for sequences of operations, it drives the **incremental**
update in-app — via `history.pushState` + a `popstate` event, which the app's own
listener turns into an incremental `phylotree.change()` (zero source changes) — and
asserts the settled SVG DOM is **identical** to a from-scratch **full render** of the
same end state (a fresh page at the app's resulting URL). Any mismatch is a stale-DOM
regression.

```bash
npm run render-equiv                 # reuse current dist/ build
npm run render-equiv -- --build      # force a fresh build first
npm run render-equiv -- --only ebola-zoom,ebola-filter-date-colorby
```

Run it after any change to the tree render/update code.
