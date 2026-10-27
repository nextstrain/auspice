import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import queryString from "query-string";
import { createAuspiceStore, AppStore } from "../store";
import { createStateFromQueryOrJSONs as createStateFromQueryOrJSONsUntyped } from "../actions/recomputeReduxState";
import { CLEAN_START, BROWSER_DIMENSIONS, URL_QUERY_CHANGE_WITH_COMPUTED_STATE } from "../actions/types";
import { ensureI18n } from "./i18n";
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
  /** The panels to start with. MVP effectively forces this to `["tree"]`. */
  panels?: string[]
  /** The starting width, in pixels. */
  width?: number
  /** The starting height, in pixels. */
  height?: number
}

export interface RenderHandle {
  /** The `<div>` Auspice created inside `container` and mounted into. */
  element: HTMLElement
  /** Change the rendered dimensions. With no argument(s) the current size of the
   * mount element / container is re-measured. No observers are installed, so this
   * is the only way dimensions change. */
  resize(width?: number, height?: number): void
  /** Replace the state entirely from a URL query string (reuses the
   * narrative-slide recompute pathway). */
  update(arg: string): void
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
  /** Recompute from the existing store state (query-driven updates). Passing
   * this rather than `json` is essential: it preserves the live tree's version
   * counters (`nodeColorsVersion`, visibility/branch-thickness versions, …) so
   * that `<Tree>`'s prop-diffing actually fires the corresponding d3 redraws. A
   * rebuild from `json` resets those counters and the diffs never trigger. */
  oldState?: unknown
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

/** Filter the computed `panelsToDisplay` down to those requested, and (for the
 * MVP) to those actually supported by the embed (currently just the tree). */
const restrictPanels = (computed: string[], requested?: string[]): string[] => {
  const supported = ["tree"]; // MVP: tree only
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
  const width = opts.width || measure(container, 800, "clientWidth");
  const height = opts.height || measure(container, 600, "clientHeight");
  const setDimensions = (w: number, h: number): void => {
    mount.style.width = `${w}px`;
    mount.style.height = `${h}px`;
    store.dispatch({ type: BROWSER_DIMENSIONS, data: { width: w, height: h, docHeight: h } });
  };
  setDimensions(width, height);

  ReactDOM.render(
    <Provider store={store}>
      <AuspiceContainer />
    </Provider>,
    mount,
  );

  return {
    element: mount,

    resize(w?: number, h?: number): void {
      const newWidth = w ?? measure(container, mount.clientWidth, "clientWidth");
      const newHeight = h ?? measure(container, mount.clientHeight, "clientHeight");
      setDimensions(newWidth, newHeight);
    },

    update(arg: string): void {
      const query = queryString.parse(arg || "");
      /* Recompute from the *current* store state (not from `json`). This mirrors
       * the within-slide narrative query change (`changePage` Case 1): queryable
       * controls are reset to defaults and the query re-applied, while the tree
       * data and its version counters are carried over so the d3 diffs fire. */
      const newState = createStateFromQueryOrJSONs({
        oldState: store.getState(),
        query,
        dispatch: store.dispatch,
      });
      newState.controls.panelsToDisplay = restrictPanels(
        newState.controls.panelsToDisplay,
        opts.panels,
      );
      store.dispatch({ type: URL_QUERY_CHANGE_WITH_COMPUTED_STATE, ...newState, query });
    },

    destroy(): void {
      ReactDOM.unmountComponentAtNode(mount);
      if (mount.parentNode) {
        mount.parentNode.removeChild(mount);
      }
    },
  };
}
