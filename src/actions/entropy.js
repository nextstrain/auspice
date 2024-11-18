import { debounce, isEqual } from 'lodash';
import { calcEntropyInView } from "../util/entropy";
import { nucleotide_gene } from "../util/globals";
import * as types from "./types";
import { isColorByGenotype, decodeColorByGenotype, getCdsFromGenotype} from "../util/getGenotype";


/* debounce works better than throttle, as it _won't_ update while events are still coming in (e.g. dragging the date slider) */
export const updateEntropyVisibility = debounce((dispatch, getState) => {
  const { entropy, controls, tree } = getState();
  if (!tree.nodes ||
    !tree.visibility ||
    !entropy.genomeMap ||
    controls.animationPlayPauseButton !== "Play"
  ) {return;}

  if (!controls.panelsToDisplay.includes("entropy") || entropy.onScreen===false) {
    if (entropy.bars===undefined) {
      return; // no need to dispatch another action - the state's already been invalidated
    }
    // clear the entropy data so we don't keep an out-of-date copy
    return dispatch({type: types.ENTROPY_DATA, data: undefined, maxYVal: 1});
  }

  const [data, maxYVal] = calcEntropyInView(tree.nodes, tree.visibility, entropy.selectedCds, entropy.showCounts);
  dispatch({type: types.ENTROPY_DATA, data, maxYVal});
}, 500, { leading: true, trailing: true });

/**
 * Returns a thunk which makes zero or one dispatches to update the entropy reducer
 * if the selected CDS and/or positions need updating.
 *
 * The argument may vary:
 *   - It may be a colorBy string, which may or may not be a genotype coloring
 *   - It may be a CDS (Object)
 *   - It may be the constant `nucleotide_gene`
 *
 * The expected state updates to (selectedCds, selectedPositions) are as follows:
 * (nuc = nucleotide_gene, x,y,z are positions, [*] means any (or no) positions selected,
 * no-op means that no dispatches are made and thus the state is unchanged):
 *
 * -----------------------------------------------------------------------------------
 * PREVIOUS STATE  | EXAMPLE ARGUMENT      |  NEW STATE ($ = entropy bar recalc needed)
 * -----------------------------------------------------------------------------------
 * nuc, [x]        | "gt-nuc_x"            |  no-op
 * nuc, [*]        | "gt-nuc_x"            |  nuc, [x]
 * nuc, [*]        | "notGenotype"         |  nuc, []
 * nuc, [x]        | "gt-nuc_y"            |  nuc, [y]
 * nuc, [*]        | "gt-cdsA_x"           |  CdsA, [x] $
 * CdsA, [*]       | "gt-cdsA_y"           |  CdsA, [y]
 * CdsA, [*]       | "gt-cdsB_z"           |  CdsB, [z] $
 * CdsA, [*]       | "notGenotype"         |  CdsA, []
 * CdsA, [*]       | "gt-nuc-z"            |  nuc, [z] $
 * -----------------------------------------------------------------------------------
 * nuc, [*]        | nucleotide_gene       | no-op
 * nuc, [*]        | CdsA                  | CdsA, [] $
 * CdsA, [*]       | CdsA                  | no-op
 * CdsA, [*]       | CdsB                  | CdsB, [] $
 * CdsA, [*]       | nucleotide_gene       | nuc, [] $
 * -----------------------------------------------------------------------------------
 *
 * @returns {ReduxThunk}
 */
export const changeEntropyCdsSelection = (arg) => (dispatch, getState) => {
  const action = {type: types.CHANGE_ENTROPY_CDS_SELECTION}
  const entropy = getState().entropy;

  // no-op if the entropy data isn't present
  if (!entropy.loaded) return;

  if (arg === nucleotide_gene) {
    if (entropy.selectedCds === nucleotide_gene) {
      return
    }
    action.selectedCds = arg;
    action.selectedPositions = [];
  } else if (typeof arg === 'string') {
    if (!isColorByGenotype(arg)) {
      action.selectedCds = entropy.selectedCds;
      action.selectedPositions = [];
    } else {
      const gt = decodeColorByGenotype(arg)
      if (!gt) {
        console.error("Error decoding genotype colorBy for entropy recalc.")
        return;
      }
      const cds = getCdsFromGenotype(gt.gene, entropy.genomeMap);
      action.selectedCds = cds;
      action.selectedPositions = gt.positions;
    }
  } else if (typeof arg === 'object' && arg.name && arg.segments) {
    // arg: CDS - see type def in `entropyCreateStateFromJsons.ts`
    action.selectedCds = arg;
    action.selectedPositions = [];
  } else {
    console.error("Incorrect argument passed to changeEntropyCdsSelection:", arg);
    return;
  }

  /* is nothing's changed, then we can avoid dispatches */
  if (entropy.selectedCds !== action.selectedCds) {
    const state = getState();
    const [data, maxYVal] = calcEntropyInView(state.tree.nodes, state.tree.visibility, action.selectedCds, entropy.showCounts);
    action.bars = data;
    action.maxYVal = maxYVal;
  } else if (isEqual(action.selectedPositions, entropy.selectedPositions)) {
    return;
  }

  dispatch(action);
};

export const showCountsNotEntropy = (showCounts) => (dispatch, getState) => {
  dispatch({type: types.ENTROPY_COUNTS_TOGGLE, showCounts});
  updateEntropyVisibility(dispatch, getState);
};

export const changeZoom = (zoomc) => (dispatch) => {
  dispatch({type: types.CHANGE_ZOOM, zoomc});
};
