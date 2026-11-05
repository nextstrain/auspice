# Embedding Auspice

Auspice can be embedded into any web page as a self-contained imperative rendering function.
This is useful when you want to show one or more Auspice panels
(the phylogenetic tree, the map, the entropy/diversity chart) inside a page you
control, e.g. a blog post.
Future work will expose Auspice as React components better suited for SPA integration.

The embed is distributed as a single ES module (`auspice.js`) with **all** of its
dependencies bundled in (React, Redux, styled-components, d3, …). A host page can
import it over a relative path with no bundler and no import map:

```js
import { render } from "./auspice.js";
```

> This is a different build from the standard Auspice application and from the
> [build-time client customisations](./api) described elsewhere in this section.
> The embed does no fetching, installs no global listeners, never touches the
> host page's URL, and does not read the customisation (`extensions`) mechanism.
> You hand it already-parsed JSON and it renders it.

## Contents

- [Building the bundle](#building-the-bundle)
- [Quick start](#quick-start)
- [`render(container, data, opts)`](#rendercontainer-data-opts)
  - [`data` — the dataset](#data--the-dataset)
  - [`opts` — render options](#opts--render-options)
- [The render handle](#the-render-handle)
  - [`handle.update(delta)`](#handleupdatedelta)
  - [`handle.resize(width?)`](#handleresizewidth)
  - [`handle.destroy()`](#handledestroy)
  - [`handle.element`](#handleelement)
- [Panels, layout and height](#panels-layout-and-height)
- [Multiple embeds on one page](#multiple-embeds-on-one-page)
- [Full example](#full-example)

## Building the bundle

The bundle is produced by a dedicated webpack config
(`webpack.embed.config.cjs`), separate from the main application build:

```bash
npm run build:embed
```

This writes the single bundle `embed-dist/auspice.js`.
Copy that file next to your host page and import it over a relative path.

By default the bundle is minified. For a readable build (helpful when debugging
the bundle itself) set the `EMBED_MINIFY` environment variable to `false`:

```bash
EMBED_MINIFY=false npm run build:embed
```

A worked example, including a script that builds an un-minified bundle and serves
a demo page, lives in [`examples/embed/`](https://github.com/nextstrain/auspice/tree/master/examples/embed).

## Quick start

```js
import { render } from "./auspice.js";

// The host fetches and parses all JSON itself, then hands it in.
const data = { main: await (await fetch("./ebola.json")).json() };

const container = document.getElementById("viz");

const viz = render(container, data, {
  panels: ["tree", "map", "entropy"],
  query: "c=country",
  width: container.clientWidth,
});

// later…
viz.update({ colorBy: "division" });   // recolour without a full re-render
viz.resize(container.clientWidth);      // after the container's width changes
viz.destroy();                          // tear the component down
```

## `render(container, data, opts)`

Render Auspice into `container` from pre-parsed `data`. Each call is fully
isolated: it creates its own Redux store and its own React root inside a new
`<div>` appended to `container`. It returns a [render handle](#the-render-handle)
for subsequent interaction.

```ts
function render(
  container: HTMLElement,
  data: RenderData,
  opts?: RenderOptions,
): RenderHandle
```

| Argument | Type | Description |
| --- | --- | --- |
| `container` | `HTMLElement` | The element to render into. Auspice appends a mount `<div>` to it; it does not clear the container's existing children. |
| `data` | `RenderData` | The pre-parsed dataset JSON (see below). |
| `opts` | `RenderOptions` | Optional render options (see below). |

### `data` — the dataset

```ts
interface RenderData {
  main: Record<string, unknown>;   // the v2 dataset JSON (required)
  [sidecar: string]: unknown;      // optional sidecars
}
```

`main` is the parsed [v2 dataset JSON](./api) — the same object the Auspice app typically fetches via the `/charon/getDataset` API.
For embedded usages you must fetch and parse it, and provide this object to the `render` function.

Additional keys are optional sidecars, parsed the same way:

- `measurements` — the measurements-panel JSON (note the measurements panel is
  not itself rendered by the embed yet, but the data may still be supplied).

> The embed currently renders the **tree**, **map** and **entropy** panels. Other
> dataset features are parsed into state where present but are not displayed.

### `opts` — render options

```ts
interface RenderOptions {
  query?: string;
  panels?: string[];
  width?: number;
  heightMultiplier?: number;
}
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `query` | `string` | `""` | A URL query string (with or without a leading `?`) that sets the initial state, using the same keys as an Auspice URL (e.g. `"c=country&l=clock"`). This is parsed once at load; use [`update()`](#handleupdatedelta) for subsequent changes. |
| `panels` | `string[]` | all supported, intersected with the dataset's own panels | The panels to show, a subset of `["tree", "map", "entropy"]`. The final set is the intersection of this list, the panels the dataset defines, and those the embed supports. |
| `width` | `number` | the container's measured `clientWidth` (falling back to `800`) | The starting width in pixels. **There is no `height` option** — the embed owns the vertical space and derives the height from the width and panel layout; the container grows to fit. See [Panels, layout and height](#panels-layout-and-height). |
| `heightMultiplier` | `number` | `1` | Scales how tall the panels are drawn. The height is normally derived from the width alone; a value of `1.5`, for example, makes the tree/map/entropy panels ~50% taller (and grows the container to match) when you want the visualisation to occupy more vertical space. It scales the panels' drawable area, not the fixed per-card chrome, so the total container height grows by slightly less than the multiplier. Must be a positive number; invalid values fall back to `1`. |

## The render handle

`render()` returns a handle for interacting with that instance:

```ts
interface RenderHandle {
  element: HTMLElement;
  update(delta: UpdateDelta): void;
  resize(width?: number): void;
  destroy(): void;
}
```

### `handle.update(delta)`

Apply an incremental update. Each field of `delta` that is set is dispatched
to the store via the same action the full app's sidebar controls use; fields that
are absent are left untouched. This is the counterpart to the wholesale initial
load — use it to nudge one control without resetting the rest.

```js
viz.update({ colorBy: "division" });            // change colouring only
viz.update({ layout: "clock" });                // change layout, keep colour-by
viz.update({ dateMin: "2015-01-01" });          // set a lower date cutoff
viz.update({ dateMin: null, dateMax: null });   // clear the date filter
```

The delta object (`UpdateDelta`) mirrors the query-settable controls. All fields
are optional:

#### Tree

| Field | Type | Query key | Description |
| --- | --- | --- | --- |
| `colorBy` | `string` | `c` | Colour the tree by this trait / genotype. |
| `layout` | `"rect" \| "radial" \| "unrooted" \| "clock" \| "scatter"` | `l` | Tree layout. |
| `distanceMeasure` | `"num_date" \| "div"` | `m` | Branch-length metric (only applies to a timetree). |
| `dateMin` | `string \| null` | `dmin` | Lower date cutoff, `YYYY-MM-DD`. Pass `null` to clear it (reset to the dataset's earliest date). |
| `dateMax` | `string \| null` | `dmax` | Upper date cutoff, `YYYY-MM-DD`. Pass `null` to clear it (reset to the dataset's latest date). |
| `filters` | `Record<string, string[]>` | `f_<trait>` | Trait filters: trait name → selected values. Each entry **replaces** that trait's selection; `[]` clears it. |
| `strainFilter` | `string[]` | `s` | Set the strain (tip-name) filter. |
| `genotypeFilter` | `string[]` | `gt` | Set the genotype filter to these already-decoded values. |
| `tipLabelKey` | `string` | `tl` | Key used for tip labels. |
| `branchLabel` | `string` | `branchLabel` | Key used for branch labels. |
| `showAllBranchLabels` | `boolean` | `showBranchLabels` | Show every branch label of the selected key. |
| `legendOpen` | `boolean` | `legend` | Legend open / closed. |
| `temporalConfidence` | `boolean` | `ci` | Show temporal confidence intervals. |
| `focus` | `boolean` | `focus` | Focus on the selected (filtered) tips. |

#### Scatter / clock layouts only

| Field | Type | Query key | Description |
| --- | --- | --- | --- |
| `showBranches` | `boolean` | `branches` | Show branches in the scatter/clock layouts. |
| `showRegression` | `boolean` | `regression` | Show the regression line. |
| `scatterX` | `string` | `scatterX` | Scatterplot x-axis trait. |
| `scatterY` | `string` | `scatterY` | Scatterplot y-axis trait. |

#### Streamtrees only

| Field | Type | Query key | Description |
| --- | --- | --- | --- |
| `streamLabel` | `string \| null` | `streamLabel` | Branch label defining stream trees, or `null` / `"none"` to disable. |

#### Map only

(no-op unless a map panel is mounted)

| Field | Type | Query key | Description |
| --- | --- | --- | --- |
| `geoResolution` | `string` | `r` | Geographic resolution. |
| `transmissionLines` | `boolean` | `transmissions` | Show transmission lines on the map. |

> To change the panel **set** (e.g. add the map), `update()` is not the path —
> [`destroy()`](#handledestroy) and call `render()` again with the new `panels`.
> `update()` preserves state; a fresh `render()` starts from the dataset + query.

### `handle.resize(width?)`

Change the rendered width; the height is re-derived from the new width and the
current panel layout. Called with no argument, it re-measures the container's
current `clientWidth`.

The embed installs **no** resize observers — this is the only way the dimensions
change, so call it yourself when the container's width changes (e.g. from a
window `resize` listener you own).

```js
window.addEventListener("resize", () => viz.resize());
```

### `handle.destroy()`

Unmount the React tree and remove the mount element from the container. Always
call this before discarding an embed (including before re-rendering with a
different panel set) so React and the map's Leaflet instance are torn down
cleanly.

### `handle.element`

The `<div>` that Auspice created inside `container` and mounted into. Useful if
you need to position or style the mount directly.

## Panels, layout and height

The embed inverts the full app's sizing model. The app is handed a fixed
browser-window height and divides it among panels; the embed is handed only a
**width** and **produces** a height, growing the host container to fit. This means:

- You never specify a height. The container has no fixed height; it expands to
  whatever the embed needs.
- Panels are laid out as cards that wrap by width, mirroring the full app. The
  **tree** and **map** sit side-by-side when the container is at least
  `1000px` wide and both are shown; below that width (or if only one is shown)
  they stack. The **entropy** chart is always a full-width row below.
- Each panel's height is derived from the width (a main panel is `0.6 ×` the
  width tall; the entropy chart is `0.25 ×` the width, floored at `300px`), and
  the container height is the sum of the rows. Every panel combination therefore
  fits exactly, with no internal scrollbar and no empty gap.
- To make the panels taller than this width-derived default, pass
  [`heightMultiplier`](#opts--render-options) — it scales each panel's drawable
  height (and grows the container to match).

If you change the container's width, call [`resize()`](#handleresizewidth) so the
height (and the side-by-side/stacked decision) is recomputed.

## Multiple embeds on one page

You can call `render()` any number of times on the same page, each into its own
container, each returning an independent handle. The instances share no state.

## Full example

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <style>
    /* The host owns the width; the embed owns its own height and grows this
       box to fit — so no fixed height here. */
    #viz { width: 100%; }
  </style>
</head>
<body>
  <div id="viz"></div>

  <script type="module">
    import { render } from "./auspice.js";

    // The caller fetches & parses all JSON itself and hands it in.
    const data = { main: await (await fetch("./ebola.json")).json() };
    const container = document.getElementById("viz");

    const viz = render(container, data, {
      query: "c=country",
      panels: ["tree", "map", "entropy"],
      width: container.clientWidth,   // the embed derives its own height
    });

    // Incremental updates preserve the rest of the state:
    document.querySelector("#by-division")
      .addEventListener("click", () => viz.update({ colorBy: "division" }));

    // Keep the width in sync with the container:
    window.addEventListener("resize", () => viz.resize());
  </script>
</body>
</html>
```
