import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import queryString from "query-string";
import { createAuspiceStore, AppStore } from "../store";
import { createStateFromQueryOrJSONs as createStateFromQueryOrJSONsUntyped } from "../actions/recomputeReduxState";
import { CLEAN_START, BROWSER_DIMENSIONS } from "../actions/types";
import { ensureI18n } from "./i18n";
import { applyUpdate, UpdateDelta } from "./update";
import { computeEmbedLayout } from "./layout";
import AuspiceContainer from "./AuspiceContainer";

/** Pre-parsed JSON data, keyed by sidecar name. `main` is the (v2) dataset JSON;
 * other keys (`measurements`, `tip-frequencies`, `root-sequence`, …) are
 * sidecars. The MVP renders only the tree, so only `main` is required. */
export interface RenderData {
  main: Record<string, unknown>
  [sidecar: string]: unknown
}

export interface RenderOptions {
  /** A URL query string (with or without a leading `?`) which sets initial state. */
  query?: string
  /** The panels to start with. Supported: `"tree"`, `"map"`, `"entropy"`. */
  panels?: string[]
  /** The starting width, in pixels. Defaults to the container's measured width
   * (falling back to 800). The height is *not* an option: the embed owns the
   * vertical space and derives it from the width and the panel layout (see
   * `computeEmbedLayout`), and the host container grows to fit. */
  width?: number
  /** Scales how tall the panels are drawn (default `1`). The embed normally
   * derives panel heights from the width alone; a value of `1.5`, say, makes the
   * panels ~50% taller (and grows the container to match) when you want the
   * visualisation to occupy more vertical space. Applies to the panels, not just
   * the container — see `computeEmbedLayout`. */
  heightMultiplier?: number
}

export interface RenderHandle {
  /** The `<div>` Auspice created inside `container` and mounted into. */
  element: HTMLElement
  /** Change the rendered width; the height is re-derived from the width and the
   * current panel layout. With no argument the container's current width is
   * re-measured. No observers are installed, so this is the only way dimensions
   * change. */
  resize(width?: number): void
  /** Apply an incremental update: each field of `delta` that is set is
   * dispatched to the store via the matching Auspice thunk/action. Fields that
   * are absent are left untouched (contrast with the wholesale initial load). */
  update(delta: UpdateDelta): void
  /** Unmount the React tree and remove the mount element from `container`. */
  destroy(): void
}

/* `recomputeReduxState` is untyped JS whose parameter defaults (`json = false`,
 * …) cause TS to infer `boolean` parameter types. Present it with the argument
 * shape we actually use, and an opaque (whole-store) result. */
interface StateArgs {
  /** Build fresh slices from dataset JSON (initial load / `CLEAN_START`). */
  json?: RenderData["main"]
  measurementsData?: unknown
  query: Record<string, unknown>
  dispatch: AppStore["dispatch"]
}
interface ComputedState {
  controls: { panelsToDisplay: string[] } & Record<string, unknown>
  [slice: string]: unknown
}
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const createStateFromQueryOrJSONs = createStateFromQueryOrJSONsUntyped as unknown as (args: StateArgs) => ComputedState;

const measure = (el: HTMLElement, fallback: number, dim: "clientWidth" | "clientHeight"): number => {
  const value = el[dim];
  return value && value > 0 ? value : fallback;
};

/** Filter the computed `panelsToDisplay` down to those requested, and to those
 * actually supported by the embed (tree, map, entropy). */
const restrictPanels = (computed: string[], requested?: string[]): string[] => {
  const supported = ["tree", "map", "entropy"];
  let panels = computed.filter((p) => supported.includes(p));
  if (requested && requested.length) {
    panels = panels.filter((p) => requested.includes(p));
  }
  return panels;
};

/**
 * Render Auspice into `container` from pre-parsed `data`. Auspice does no
 * fetching, installs no observers/listeners, and never touches the host page's
 * URL in this mode. Each call is fully isolated: its own store, its own React
 * root, in its own mount element.
 */
export function render(
  container: HTMLElement,
  data: RenderData,
  opts: RenderOptions = {}
): RenderHandle {
  ensureI18n();

  /* The parsed dataset, used to build the initial state. (`update()` recomputes
   * from the live store rather than from the JSON — see its note below.) */
  const cachedData = data;

  const store: AppStore = createAuspiceStore({ urlMiddleware: false });

  /* ---- initial state from data + query (§D) ---- */
  const initialQuery = queryString.parse(opts.query || "");
  const initialState = createStateFromQueryOrJSONs({
    json: cachedData.main,
    measurementsData: cachedData.measurements,
    query: initialQuery,
    dispatch: store.dispatch,
  });
  initialState.controls.panelsToDisplay = restrictPanels(
    initialState.controls.panelsToDisplay,
    opts.panels,
  );
  store.dispatch({ type: CLEAN_START, ...initialState });

  /* ---- mount element ---- */
  const mount = document.createElement("div");
  mount.style.position = "relative";
  container.appendChild(mount);

  /* ---- initial dimensions (§F) ---- */
  /* The host supplies the width; the height is always derived from it and the
   * live panel layout (the embed owns the vertical space — the container grows
   * to fit it). */
  const heightMultiplier = opts.heightMultiplier ?? 1;
  const setDimensions = (w: number): void => {
    const h = computeEmbedLayout(store.getState().controls.panelsToDisplay, w, heightMultiplier).height;
    mount.style.width = `${w}px`;
    mount.style.height = `${h}px`;
    store.dispatch({ type: BROWSER_DIMENSIONS, data: { width: w, height: h, docHeight: h } });
  };
  setDimensions(opts.width || measure(container, 800, "clientWidth"));

  ReactDOM.render(
    <Provider store={store}>
      <AuspiceContainer heightMultiplier={heightMultiplier} />
    </Provider>,
    mount,
  );

  return {
    element: mount,

    resize(w?: number): void {
      setDimensions(w ?? measure(container, mount.clientWidth, "clientWidth"));
    },

    update(delta: UpdateDelta): void {
      applyUpdate(store, delta);
    },

    destroy(): void {
      ReactDOM.unmountComponentAtNode(mount);
      if (mount.parentNode) {
        mount.parentNode.removeChild(mount);
      }
    },
  };
}
