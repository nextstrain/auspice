# Embedding Auspice viz components — MVP plan

Status: exploration → plan. Branch: `stand-alone-components`.

Goal: let a React-based page (blog) import and render Auspice visualisation
components (starting with `<Tree>`) as stand-alone, instanceable components,
driveable from the host page, via a new public `auspice/embed` entrypoint.

## Scope (from decisions taken)

- **Entrypoint:** public `auspice/embed`. Blogs `import { ... } from "auspice/embed"`.
- **Actions:** expose *all* existing action creators, bound per-store.
- **URL sync:** none. The URL-sync middleware is left out of embedded stores.
- **Animation:** in scope. Must therefore be siloed per instance (see below).
- **Data source:** MVP points at `nextstrain.org` dataset URLs. No "blessed"
  data-in path required yet, but the loader is written so one can be added.
- **Sidebar:** out of MVP, but no decision may *preclude* adding it later.
- **Multi-instance model:** approach **5c — store registry/context keyed by id**.

## Target usage (the shape we're building toward)

```jsx
import { AuspiceRegistry, AuspiceDataset, Tree, useAuspiceStore, actions }
  from "auspice/embed";

<AuspiceRegistry>
  <AuspiceDataset id="zika" src="https://nextstrain.org/zika" />
  <AuspiceDataset id="flu"  src="https://nextstrain.org/flu/seasonal/h3n2/ha/2y" />

  <Tree datasetId="zika" width={600} height={400} />
  <Tree datasetId="flu"  width={600} height={400} />
</AuspiceRegistry>

// a host-built control:
function Btn() {
  const store = useAuspiceStore("zika");           // undefined until registered + loaded
  return <button onClick={() => store.dispatch(actions.changeColorBy("region"))}>…</button>;
}
```

- `<AuspiceDataset>` renders nothing: it creates a store, loads the dataset into
  it, and registers it under `id`.
- `datasetId` on a panel resolves `id → store` from context; the panel renders
  its existing `connect`ed self inside that store's `<Provider>`.
- Same `id` on two panels ⇒ shared store ⇒ auto-synced (Q4). Different `id`s ⇒
  siloed stores (Q5).

---

## Why this is non-trivial (the three facts driving the work)

1. **The store is a module-level singleton.** `src/store.ts` builds one store at
   import and `src/index.js` wraps the app in a single `<Provider>`. Multiple
   siloed datasets (Q5) require **multiple stores**, so the singleton must become
   a factory.
2. **`<Tree>` is a view onto ~6 slices, not a prop-driven leaf.**
   `src/components/tree/index.ts` maps from `tree`, `treeToo`, `controls`,
   `metadata`, `entropy`, `narrative`, and *throws* if `metadata.loaded` is false.
   So each panel needs a fully-populated store above it before it can mount.
3. **Loading data is a whole-store transform.**
   `createStateFromQueryOrJSONs()` (`src/actions/recomputeReduxState.js`) turns raw
   dataset JSON into all slices at once; `CLEAN_START` replaces the store with
   them. This is reusable as-is — the loader wrapper's job is to run it against a
   given instance store.

Consequence: we keep the Redux machinery intact and make it **embeddable and
instanceable** rather than rewriting `<Tree>` into a self-contained component.

---

## Implementation details, by concern

### A. Packaging: the `auspice/embed` entrypoint

Today auspice is a CLI/server app, not a component library: root `index.js`
exports only node server helpers, and the client is a webpack *app bundle*
(`webpack.config.cjs` entry `./src/indexAsync`). So this is a genuinely new
build target.

- New source entry, e.g. `src/embed/index.ts`, re-exporting the public surface:
  `AuspiceRegistry`, `AuspiceDataset`, `useAuspiceStore`, `Tree` (then other
  panels), and `actions` (a namespace re-export of `src/actions/*`).
- `package.json`: add an `exports` map, e.g.
  `"./embed": { "import": "./dist-embed/embed.js", "types": "./dist-embed/embed.d.ts" }`,
  and add `dist-embed` to `files`.
- A library build that **externalises** `react`, `react-dom`, `react-redux`,
  `styled-components` (host provides them — avoids duplicate React / context
  mismatch). Either a second webpack config with `output.library` + `externals`,
  or rollup/tsup. Emit ESM + `.d.ts`.
- Do **not** import the global CSS bundle (`src/index.js`'s `./css/*.css`,
  bootstrap, fonts) from the embed entry — that would restyle the host page.
  Auspice is mostly `styled-components` (scoped), so the embed should ship only
  what the panels genuinely need. (Styling-leak audit is a tracked risk below.)

### B. Store: singleton → factory

- Refactor `src/store.ts` into `createAuspiceStore(options)` returning a fresh
  store; keep a thin default-store export so the existing app is unchanged
  (app calls the factory once).
- `options` must allow **middleware selection**. Embedded stores:
  - **omit `changeURLMiddleware`** (`src/middleware/changeURL.js`) — it reads/writes
    `window.location` on nearly every action and would hijack the host URL and
    fight between instances. This is the "short-circuit the middleware layer"
    decision.
  - keep `keepScatterplotStateInSync` and `performanceFlags` (store-local, safe).
- Types: `RootState`/`AppDispatch` are currently inferred from the singleton.
  Re-derive them from the reducer (or a throwaway sample store) so the factory
  doesn't break the exported types that `src/components/tree/index.ts` etc. use.

### C. Siloing page-level globals (so N instances don't collide)

These module/`window` globals assume one app owns the page. Each must become
per-instance or guarded:

- **Animation state (in scope).** `window.NEXTSTRAIN.{animationStartPoint,
  animationEndPoint,animationTickReference}` is a single global bag
  (`src/index.js`, `src/components/framework/animationController.js`,
  `src/middleware/changeURL.js`). Two animating trees would clobber each other.
  Move this state **into the instance** — cleanest is onto the store (new
  controls/animation fields) or a per-store side-channel owned by the registry —
  and update `animationController` to read it from props/store rather than the
  global. This is the most involved decoupling in the MVP; it is the price of
  "animation in scope".
- **`<Head>` / document title** (`src/root.js`): embed must not mutate the host
  `<head>` — simply don't render it in the embed tree.
- **i18n** is initialised globally in `src/index.js`. Provide an idempotent
  `ensureI18n()` the embed entry calls once; never assume the host ran it.
- **`window.location` defaults** in `src/actions/loadData.js` (`loadJSONs`
  defaults `url`/`search` from `window.location`): the embed loader always passes
  an explicit URL, so these defaults are never hit.

### D. Registry, context, hook (5c)

- `AuspiceRegistry`: provides a React context holding a `Map<id, { store,
  status }>` plus `register(id, store)` / `get(id)`. Lives for the subtree.
- `useAuspiceStore(id)`: context lookup. Contract: returns `undefined` until the
  id is registered **and** its dataset is `loaded` (so host controls that fire
  early are safe — see the timing caveat from the pseudocode discussion).
- No nesting required between loaders and panels — the `id` string is the only
  coupling, which is exactly what enables a tree and a (future) map for one
  dataset to live in different parts of the page.

### E. Dataset loader (`<AuspiceDataset id src>`)

- On mount: `createAuspiceStore()` → register under `id` with `status:"loading"`
  → fetch + load.
- Reuse the existing pipeline against this store: the `loadData.js` fetch of a
  `nextstrain.org` URL (main JSON + sidecars) →
  `createStateFromQueryOrJSONs({json, ...})` → `dispatch(CLEAN_START, ...)`. Set
  `status:"loaded"` when `metadata.loaded && tree.loaded`.
- Renders `null`. On `src` change: reload into the same store (or re-register).
- MVP uses `getServerAddress`/nextstrain.org conventions as-is; a future data-in
  path swaps only this component's internals.

### F. Panels (`<Tree datasetId>`), and exposing actions

- A small wrapper: `<Tree datasetId>` resolves the store via `useAuspiceStore`,
  renders a spinner/null until ready, else wraps the **existing connected**
  `src/components/tree` in `<Provider store={store}>`. No change to
  `mapStateToProps`. Same wrapper pattern later serves Map/Entropy/etc.
- `actions`: re-export all of `src/actions/*` from the embed entry. Host drives a
  store with `store.dispatch(actions.changeColorBy(...))`. All the meaningful
  changes are thunks (e.g. `changeColorBy` recomputes colour scale before
  dispatching `NEW_COLORS`), so exposing the creators — not raw action objects —
  is correct.

### G. Sidebar future-proofing (not built, not precluded)

- Keep `controls` state authoritative for everything the sidebar would drive
  (`showOnlyPanels` already exists). Don't bake "panels only" anywhere except the
  embed's default composition. A future `<AuspiceSidebar datasetId>` is then just
  another panel resolving the same store by id — no architectural change needed.

---

## Ordered plan to MVP

Each step is independently reviewable; earlier steps unblock later ones.

1. **Packaging skeleton.** Add `src/embed/index.ts` exporting a trivial symbol;
   add the `exports` map + library build config (externalise React et al.);
   prove a sibling React host app can `import` from `auspice/embed`. *(De-risks
   the build/externals question before any refactor.)*
2. **Store factory.** Refactor `src/store.ts` → `createAuspiceStore(options)` with
   selectable middleware; keep the app working through it; fix `RootState`/
   `AppDispatch` typing. *(No behaviour change to the app.)*
3. **Registry + context + hook.** `AuspiceRegistry`, `useAuspiceStore(id)`,
   registration API with `loading`/`loaded` status.
4. **Dataset loader.** `<AuspiceDataset id src>` creating a store (URL middleware
   omitted), loading a nextstrain.org dataset via the existing
   `loadData`/`createStateFromQueryOrJSONs` pipeline, flipping status to loaded.
5. **`<Tree datasetId>` panel wrapper.** Resolve store by id, gate on loaded,
   wrap the existing connected `<Tree>` in a `<Provider>`. End-to-end: two
   datasets, two trees, siloed. *(First visible milestone.)*
6. **Expose actions + drive from host.** Re-export all action creators; wire the
   clickable-element example (`store.dispatch(actions.changeColorBy(...))`),
   including the "undefined until ready" hook contract.
7. **Silo animation.** Move `window.NEXTSTRAIN` animation state per-instance;
   verify two trees animate independently. *(Deferred to here so the core embed
   lands first; it's the heaviest decoupling.)*
8. **Head/i18n/CSS hygiene.** Ensure the embed never mutates host `<head>`,
   provides idempotent i18n init, and ships no page-level CSS. Styling-leak audit.
9. **Example host + smoke test.** A minimal React blog page under `examples/`
   plus a Playwright smoke test (two datasets, drive one, assert the other is
   unaffected).

## Risks / open items to watch

- **Styling isolation** — confirming the panels render correctly without the
  global CSS, and don't leak styles into the host (Step 8). Biggest unknown after
  animation.
- **Animation decoupling surface** — how many places read `window.NEXTSTRAIN`;
  whether the state lands on the store or a registry side-channel.
- **Bundle size / externals** — making sure React and `styled-components` are
  single-instance (duplicate `styled-components` = broken theming/context).
- **Second trees / tangle, measurements/frequencies sidecars** — not required for
  MVP; the loader already tolerates their absence, but confirm `<Tree>` renders
  with only the main tree + metadata.
- **Non-React hosts** — explicitly out of scope for MVP (host must provide React).
