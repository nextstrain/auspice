# Embedding Auspice via a single `render()` function — MVP plan

Status: plan. Branch: `stand-alone-components`.
Companion to `EMBED_MVP_PLAN.md` (the declarative React-registry variant). This
document narrows that work to **one imperative, framework-agnostic entrypoint**
targeting a static-site builder. Where they overlap, the hard internal work is
identical; this doc supersedes the registry/context pieces.

## Goal

Expose a single function from a public, browser-importable ESM build:

```ts
export function render(
  container: HTMLElement,
  data: { [sidecar: string]: unknown },   // parsed JSON, keyed: 'main', 'tip-frequencies', …
  opts: { query?: string; panels?: string[]; width?: number }
): {
  element: HTMLElement;
  resize(width?: number): void;
  destroy(): void;
  update(arg: string): void;               // arg is a URL query string; replaces state
};
```

The caller fetches and parses all JSON itself and hands it in. Auspice does **no
fetching, no watchers, and no URL interaction** in this mode.

## Decisions (fixed)

- **No data fetching.** `data` is pre-parsed JSON. `data.main` is the dataset
  (v2) JSON; other keys (`'tip-frequencies'`, `'root-sequence'`, `'measurements'`,
  …) are the sidecars. **MVP renders only the tree**, so only `data.main` is
  required; other keys are accepted and ignored until their panels land.
- **`opts.query`** (string) sets initial state; **`opts.panels`** (string[]) sets
  starting panels (MVP: effectively `["tree"]`); **`opts.width`** (number) sets
  starting width.
- **`update(arg)` replaces state entirely** from the query string — reusing the
  existing narrative-slide recompute pathway (see §E). No delta/merge semantics.
- **No observers/watchers.** The host owns sizing and lifecycle. `resize()` is the
  *only* way dimensions change; there is no `ResizeObserver`, no `window` resize
  or `popstate` listener. (This means **not** mounting `Monitor` or `Head`.)
- **No URL sync.** The URL-sync middleware is omitted from the store.
- **Self-contained ESM bundle.** The build bundles *all* dependencies (React,
  ReactDOM, react-redux, styled-components, d3, …) into Auspice's own ESM output.
  The caller imports one relative path with an explicit extension; no import map,
  no bundler, no bare specifiers. Auspice owns its own React instance (safe: it
  mounts only into `container`).
- **Isolation is per-`render()`-call.** Each call creates its own store and React
  root in its own container. Multiple embeds on a page are independent by
  construction — no registry needed. (Linking two panels to one dataset means
  putting them in the *same* `render` call; cross-call sharing is out of MVP.)
- **Animation is out of this MVP.** All date-animation work is deferred to a
  subsequent step (see §H). The embed does not mount `AnimationController` and
  does not expose animation controls. This avoids the one piece of global,
  cross-instance state (`window.NEXTSTRAIN`) in the MVP; until §H is done,
  animating two concurrent embeds is unsupported.

## Target usage

```html
<script type="module">
  import { render } from "./vendor/auspice/embed.js";   // relative path, explicit ext

  const data = { main: await (await fetch("/zika.json")).json() };
  const viz = render(document.getElementById("viz"), data, {
    query: "c=region&l=clock",
    panels: ["tree"],
    width: 800,
  });

  // later, driven entirely by the host page:
  viz.update("c=country");   // full-state replace from this query
  viz.resize(1000);
  viz.destroy();
</script>
```

The `render` body (authored by us, inside the build) is a thin shell over React:

```jsx
// pseudocode
function render(container, data, opts) {
  ensureI18n();
  const store = createAuspiceStore({ urlMiddleware: false });
  dispatch(store, cleanStartFrom(data, opts));          // §D
  const mount = document.createElement("div");
  container.appendChild(mount);
  ReactDOM.render(
    <Provider store={store}>
      <AuspiceContainer panels={opts.panels}>
        <Tree/>                                          {/* or <Map/> later */}
      </AuspiceContainer>
    </Provider>,
    mount
  );
  return {
    element: mount,
    resize: (w) => dispatchResize(store, mount, w),      // §F
    update: (q) => dispatch(store, applyQuery(data, q)), // §E
    destroy: () => teardown(store, mount, container),    // §G
  };
}
```

---

## Why the hard parts are unchanged (and what disappears)

Three facts about the codebase (unchanged from the companion doc) still drive the
internal work:

1. **The store is a module-level singleton** (`src/store.ts` + single `<Provider>`
   in `src/index.js`) → must become a factory so each `render()` gets its own.
2. **`<Tree>` reads ~6 slices and throws before `metadata.loaded`**
   (`src/components/tree/index.ts`) → the store must be fully populated before mount.
3. **Loading data is a whole-store transform** — `createStateFromQueryOrJSONs()`
   (`src/actions/recomputeReduxState.js:864`) builds all slices and `CLEAN_START`
   replaces the store. Reused verbatim; the host just supplies the JSON.

**What disappears versus the registry plan:** the `AuspiceRegistry`, the
`Map<id, store>` context, and `useAuspiceStore`. Store lookup is by closure (the
`render` call owns its store), so plan Step 3 and most of 4–6 collapse into the
~40-line `render` shell above.

**What stays, and is unavoidable either way:** the store factory, omitting URL
middleware, and Head/i18n/CSS hygiene. (Siloing animation off `window.NEXTSTRAIN`
is also unavoidable eventually, but is explicitly deferred out of this MVP — §H.)

---

## Implementation details, by concern

### A. Packaging: a self-contained, browser-importable ESM build

Today auspice is a CLI/server app: root `index.js` exports only node/server
helpers and the client is a webpack *app bundle* (`webpack.config.cjs`, entry
`./src/indexAsync`). This is a new, separate build target.

- New source entry `src/embed/index.ts` exporting exactly `{ render }` (plus, for
  advanced React hosts later, the component/action surface — not needed by the
  static-site caller).
- A dedicated bundler config emitting **ESM** with **all dependencies bundled in**
  and **explicit file extensions** on any emitted chunks, so output is importable
  by a browser over relative paths with no import map (e.g. webpack
  `experiments.outputModule` + `output.module`/`library.type: "module"`, or
  rollup/esbuild). Single file `embed.js` is simplest; if code-split, chunks must
  import each other via relative `./name.js`.
- `package.json`: add an `exports` entry (e.g. `"./embed"` → the built file) and
  include the output dir in `files`, so distributions ship it.
- The embed entry must **not** import the global CSS/bootstrap/fonts that
  `src/index.js` pulls in (they would restyle the host page). Auspice is mostly
  `styled-components` (scoped); ship only what the panels need. Styling-leak audit
  is a tracked risk.
- React 16.8 → the shell uses `ReactDOM.render` / `ReactDOM.unmountComponentAtNode`
  (not `createRoot`).

### B. Store: singleton → factory

- Refactor `src/store.ts` into `createAuspiceStore(options)` returning a fresh
  store; keep a thin default export so the existing app is unchanged.
- `options.urlMiddleware: false` **omits `changeURLMiddleware`**
  (`src/middleware/changeURL.js`) — it reads/writes `window.location` on nearly
  every action and must never run in embed mode. Keep `keepScatterplotStateInSync`
  and `performanceFlags` (store-local, safe).
- Re-derive `RootState`/`AppDispatch` from the reducer (not the singleton) so the
  exported types that `src/components/tree/index.ts` relies on still resolve.

### C. No page-level side effects (`Monitor`, `Head`, listeners)

The embed React tree must mount **none** of the components that attach global
listeners or mutate the page:

- **`Monitor`** (`src/components/framework/monitor.js`) adds `window` `resize` and
  `popstate` listeners and dispatches `changePage()`. Not rendered in embed —
  this is how we honour "no watchers/observers". Sizing comes only from
  `resize()` (§F).
- **`Head`** (`src/root.js`) mutates the document `<head>`. Not rendered.
- **`AnimationController`** (`src/components/framework/animationController.js`)
  uses `window.NEXTSTRAIN` + `setInterval`. Not rendered in the MVP — animation is
  deferred (§H).
- **i18n** is initialised globally in `src/index.js`. Provide an idempotent
  `ensureI18n()` the embed calls; never assume the host ran it.
- `loadData.js`'s `window.location` defaults are never reached (we never call the
  fetching loader in embed mode).

### D. Initial state from `data` + `opts` (`render`)

- Parse `opts.query` (string) → query object via `queryString.parse`.
- Map `data` keys to the existing pipeline inputs and call
  `createStateFromQueryOrJSONs({ json: data.main, query, measurementsData:
  data.measurements, secondTreeDataset: … })`, then `dispatch(CLEAN_START, …)`.
  For the **tree-only MVP**, `data.main` + `query` is sufficient; sidecar keys
  map to the same arguments the fetching loader uses (`loadData.js:128`) and are
  wired in panel-by-panel later.
- Cache the parsed `data` in the `render` closure so `update()` can re-run the
  transform without re-fetching (mirrors how narratives reuse
  `oldState.jsonCache.jsons`).
- `opts.panels` seeds `controls.panelsToDisplay`; MVP forces/filters to `["tree"]`.
  `AuspiceContainer` renders only the panels in that list.

### E. `update(arg)` — full-state replace from a query string

- This is exactly the narrative-slide mechanism. `src/actions/navigation.js:45`
  dispatches `URL_QUERY_CHANGE_WITH_COMPUTED_STATE` with
  `...createStateFromQueryOrJSONs({ json, query, … })`, and every slice reducer
  already handles that action type as a wholesale recompute.
- Factor a clean `applyQuery(query)` thunk out of the narrative-entangled code in
  `navigation.js` (it currently carries `pushState`, narrative blocks, and
  dataset-name parsing we don't want). The thunk: `queryString.parse(arg)` →
  `createStateFromQueryOrJSONs({ json: cachedData.main, query, … })` → dispatch
  `URL_QUERY_CHANGE_WITH_COMPUTED_STATE`. "Replace entirely" is the default
  behaviour of this path (state is rebuilt from JSON-derived defaults + query),
  which is why we chose it for the MVP.
- This refactor is the one genuinely new piece of internal surgery the contract
  implies.

### F. `resize(width?)` — host-driven, no observers

- `resize(w)` dispatches `{type: BROWSER_DIMENSIONS, data: {width, height, …}}`
  (the action `monitor.js:53` dispatches), reading `width` from the argument (or
  re-measuring `container` synchronously if omitted) and `height` from the
  container at call time. No listener is installed.
- `AuspiceContainer` is `connect`ed to `browserDimensions`, computes panel dims
  (reusing `calcPanelDims`/`calcStyles` from `src/components/main/utils.js`), and
  passes `width`/`height` as props to `<Tree>` (which takes them as ownProps).
- `opts.width` seeds the initial `BROWSER_DIMENSIONS` at render time. Skip the
  full↔grid / sidebar threshold logic that `Monitor` normally applies (MVP is a
  single panel).

### G. `destroy()` and the returned `element`

- `destroy()`: `ReactDOM.unmountComponentAtNode(mount)`, remove `mount` from
  `container`, and clear this instance's animation interval (§H). Because there
  are no global listeners, there is nothing else to detach.
- `element` is the `mount` div `render` created inside `container` (lets the host
  style/position the Auspice root without us touching `container` itself).

### H. Animation siloing (`window.NEXTSTRAIN`) — DEFERRED, not part of this MVP

Out of scope for this MVP; captured here so the MVP makes no choice that blocks
it. Animation state lives in a single global bag (`src/index.js`,
`src/components/framework/animationController.js`, `src/middleware/changeURL.js`)
and would collide across `render()` calls. The follow-up work: move it
per-instance (onto the store, or a per-store side-channel owned by the `render`
closure), update `animationController` to read it from there, mount
`AnimationController` inside `AuspiceContainer`, and have `destroy()` clear that
instance's interval. Until then the embed simply does not mount the controller or
expose animation.

### I. Sidebar future-proofing (not built, not precluded)

Keep `controls` authoritative for everything a sidebar would drive
(`showOnlyPanels`, `panelsToDisplay` already exist). A future sidebar is just
another thing `AuspiceContainer` can render for the same store — no architectural
change. The `render` contract would surface it via `opts` (e.g. a `sidebar: true`
flag) later.

---

## Ordered plan to MVP

Each step is independently reviewable; earlier steps unblock later ones.

1. **Self-contained ESM build skeleton.** Add `src/embed/index.ts` exporting a
   trivial `render` stub; stand up the ESM bundler config (all deps bundled,
   explicit extensions, `output.module`); add the `exports` map + `files`. Prove a
   plain `<script type="module">import {render} from "./embed.js"</script>` page
   loads it with no bundler/import map. *(De-risks the packaging constraint first.)*
2. **Store factory.** `src/store.ts` → `createAuspiceStore({urlMiddleware})`;
   keep the app working through it; fix `RootState`/`AppDispatch` typing.
3. **`AuspiceContainer` + panel wrapper.** A `connect`ed container that takes
   `panels`, reads `browserDimensions`, computes panel dims, and renders the
   existing connected `<Tree>` with `width`/`height` props. No `Monitor`, no `Head`.
4. **`render()` init path (§D).** Build the store, run
   `createStateFromQueryOrJSONs({json: data.main, query})` + `CLEAN_START`, mount
   the React tree into a `mount` div, return the handle. **First visible
   milestone: a static HTML page renders a tree from supplied JSON.**
5. **`resize()` (§F)** and **`destroy()` (§G).** Wire dimension dispatch from the
   handle; unmount + DOM cleanup.
6. **`update()` (§E).** Extract the `applyQuery(query)` thunk from
   `navigation.js`; wire `update(arg)` to full-state replace using cached `data`.
7. **Hygiene (§C) + styling audit.** Confirm no `<head>` mutation, idempotent
   i18n, no leaked global CSS, that `AnimationController` is not mounted, and the
   panel renders correctly without the global CSS.
8. **Example host + smoke test.** A no-build static page under `examples/` plus a
   Playwright smoke test: two `render()` calls with different `data`, drive one via
   `update()`/`resize()`, assert the other is unaffected, then `destroy()`.

**Deferred to a follow-up (post-MVP):** animation siloing (§H).

## Risks / open items

- **ESM build with bundled deps** — getting webpack/rollup to emit a clean,
  browser-loadable ESM module with React 16 + styled-components + d3 all inlined
  and no stray bare specifiers. This is Step 1 precisely because it's the newest
  ground. Bundle size is accepted (self-contained was chosen deliberately).
- **Styling isolation** — panels rendering correctly without the global CSS, and
  not leaking into the host (Step 8).
- **Animation (deferred, §H)** — not in this MVP; the follow-up must silo
  `window.NEXTSTRAIN` per instance. The MVP must not add any dependency on it.
- **`applyQuery` extraction** — ensuring the factored-out thunk reproduces
  narrative-slide semantics without `pushState`/narrative coupling.
- **Sidecar panels beyond tree** (`tip-frequencies`, measurements, map, entropy)
  — out of MVP; the `data`-keyed shape is designed to absorb them without an API
  change.
- **Non-React / multiple React hosts** — n/a: deps are bundled and Auspice mounts
  into its own container.
