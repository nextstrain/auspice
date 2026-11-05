/**
 * The embed's delta-update surface.
 *
 * `UpdateDelta` is a structured, typed object of optional controls; `applyUpdate`
 * maps each present field to the same Auspice thunk / action the full app's
 * sidebar controls dispatch, applied to an already-populated render store.
 *
 * Unlike the initial load (`render()`, which rebuilds state wholesale from a
 * query string), this is *incremental*: fields that are absent are left
 * untouched, so callers can nudge one control without resetting the rest.
 *
 * The field set mirrors the query keys handled by `modifyStateViaURLQuery` in
 * `actions/recomputeReduxState.js` — if Auspice gains a new query-settable
 * control there, add the matching field here (and vice versa). This mapping is
 * deliberately kept self-contained within `src/embed/`.
 */
import { AppStore } from "../store";
import { strainSymbol, genotypeSymbol } from "../util/globals";
import { Layout } from "../reducers/controls";
import { changeColorBy } from "../actions/colors";
import { changeLayout } from "../actions/layout";
import {
  changeDistanceMeasure,
  changeDateFilter,
  applyFilter,
  toggleTemporalConfidence,
  setFocus,
} from "../actions/tree";
import { changeStreamTreeBranchLabel } from "../actions/treeStreams";
import {
  CHANGE_TIP_LABEL_KEY,
  CHANGE_BRANCH_LABEL,
  TOGGLE_SHOW_ALL_BRANCH_LABELS,
  TOGGLE_LEGEND,
  CHANGE_GEO_RESOLUTION,
  TOGGLE_TRANSMISSION_LINES,
} from "../actions/types";

/** Tree branch-length metric (time vs divergence). */
export type Distance = "num_date" | "div";

export interface UpdateDelta {
  /* ---- in scope for the tree-only embed ---- */

  /** Colour the tree by this trait / genotype (query `c`). */
  colorBy?: string
  /** Tree layout (query `l`). */
  layout?: Layout
  /** Branch-length metric; only applies when the tree is a timetree (query `m`). */
  distanceMeasure?: Distance
  /** Lower date cutoff, `YYYY-MM-DD` (query `dmin`). Pass `null` to clear it
   * (reset to the dataset's earliest date). */
  dateMin?: string | null
  /** Upper date cutoff, `YYYY-MM-DD` (query `dmax`). Pass `null` to clear it
   * (reset to the dataset's latest date). */
  dateMax?: string | null
  /** Trait filters: trait name → selected values. Each entry *sets* (replaces)
   * that trait's selection (query `f_<trait>`). */
  filters?: Record<string, string[]>
  /** Set the strain (tip-name) filter (query `s`). */
  strainFilter?: string[]
  /** Set the genotype filter to these already-decoded values (query `gt`). */
  genotypeFilter?: string[]
  /** Key used for tip labels (query `tl`). */
  tipLabelKey?: string
  /** Key used for branch labels (query `branchLabel`). */
  branchLabel?: string
  /** Show every branch label of the selected key (query `showBranchLabels`). */
  showAllBranchLabels?: boolean
  /** Legend open / closed (query `legend`). */
  legendOpen?: boolean
  /** Show temporal confidence intervals (query `ci`). */
  temporalConfidence?: boolean
  /** Focus on the selected (filtered) tips (query `focus`). */
  focus?: boolean

  /* ---- scatter / clock layouts only ---- */

  /** Show branches in the scatter/clock layouts (query `branches`). */
  showBranches?: boolean
  /** Show the regression line in the scatter/clock layouts (query `regression`). */
  showRegression?: boolean
  /** Scatterplot x-axis trait (query `scatterX`). */
  scatterX?: string
  /** Scatterplot y-axis trait (query `scatterY`). */
  scatterY?: string

  /* ---- streamtrees only ---- */

  /** Branch label defining stream trees, or `null`/`"none"` to disable (query `streamLabel`). */
  streamLabel?: string | null

  /* ---- map only (no-op unless a map panel is mounted) ---- */

  /** Geographic resolution (query `r`). */
  geoResolution?: string
  /** Show transmission lines on the map (query `transmissions`). */
  transmissionLines?: boolean
}

/**
 * Apply an `UpdateDelta` to `store` by dispatching the relevant thunks/actions.
 * Only fields that are `!== undefined` result in a dispatch.
 */
export function applyUpdate(store: AppStore, delta: UpdateDelta): void {
  const { dispatch } = store;

  if (delta.colorBy !== undefined) dispatch(changeColorBy(delta.colorBy));

  if (delta.distanceMeasure !== undefined) dispatch(changeDistanceMeasure(delta.distanceMeasure));

  /* `layout` and the scatter/clock variables all funnel through the single
   * `changeLayout` thunk (that is how the app mutates them too). We pass the
   * scatter axis key as its own label — the embed has no label metadata to draw
   * on, and this matches the key-as-label fallback used elsewhere. */
  if (
    delta.layout !== undefined ||
    delta.showBranches !== undefined ||
    delta.showRegression !== undefined ||
    delta.scatterX !== undefined ||
    delta.scatterY !== undefined
  ) {
    dispatch(changeLayout({
      layout: delta.layout,
      showBranches: delta.showBranches,
      showRegression: delta.showRegression,
      x: delta.scatterX,
      xLabel: delta.scatterX,
      y: delta.scatterY,
      yLabel: delta.scatterY,
    }));
  }

  if (delta.dateMin !== undefined || delta.dateMax !== undefined) {
    /* `changeDateFilter` treats `false` as "leave this bound unchanged" and has
     * no clear path of its own, so a reset means snapping back to the dataset's
     * absolute bound (this is what the app's animation reset does too). Hence
     * three states per bound: `undefined` → leave unchanged (`false`); `null` →
     * clear (reset to the absolute bound); a string → set to that date. */
    const { absoluteDateMin, absoluteDateMax } = store.getState().controls;
    dispatch(changeDateFilter({
      newMin: delta.dateMin === undefined ? false : (delta.dateMin ?? absoluteDateMin),
      newMax: delta.dateMax === undefined ? false : (delta.dateMax ?? absoluteDateMax),
    }));
  }

  if (delta.filters !== undefined) {
    for (const [trait, values] of Object.entries(delta.filters)) {
      dispatch(applyFilter("set", trait, values));
    }
  }
  if (delta.strainFilter !== undefined) dispatch(applyFilter("set", strainSymbol, delta.strainFilter));
  if (delta.genotypeFilter !== undefined) dispatch(applyFilter("set", genotypeSymbol, delta.genotypeFilter));

  if (delta.tipLabelKey !== undefined) dispatch({ type: CHANGE_TIP_LABEL_KEY, key: delta.tipLabelKey });
  if (delta.branchLabel !== undefined) dispatch({ type: CHANGE_BRANCH_LABEL, value: delta.branchLabel });
  if (delta.showAllBranchLabels !== undefined) dispatch({ type: TOGGLE_SHOW_ALL_BRANCH_LABELS, value: delta.showAllBranchLabels });
  if (delta.legendOpen !== undefined) dispatch({ type: TOGGLE_LEGEND, value: delta.legendOpen });

  /* `toggleTemporalConfidence` is a pure toggle (no value arg), so only dispatch
   * it when the desired state differs from the current one — this keeps the
   * delta idempotent. */
  if (delta.temporalConfidence !== undefined &&
      store.getState().controls.temporalConfidence.on !== delta.temporalConfidence) {
    dispatch(toggleTemporalConfidence());
  }

  if (delta.focus !== undefined) dispatch(setFocus(delta.focus ? "selected" : null));

  if (delta.streamLabel !== undefined) dispatch(changeStreamTreeBranchLabel(delta.streamLabel));

  if (delta.geoResolution !== undefined) dispatch({ type: CHANGE_GEO_RESOLUTION, data: delta.geoResolution });
  if (delta.transmissionLines !== undefined) dispatch({ type: TOGGLE_TRANSMISSION_LINES, data: delta.transmissionLines });
}
