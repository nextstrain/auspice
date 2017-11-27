import { debounce } from 'lodash';
import { calcEntropyInView } from "../util/tree/traversals";
import * as types from "./types";

export const updateEntropyVisibility = debounce((dispatch, getState) => { // eslint-disable-line import/prefer-default-export
  const { entropy, controls, tree } = getState();
  dispatch({
    type: types.ENTROPY_DATA,
    data: calcEntropyInView(tree.nodes, tree.visibility, controls.mutType, entropy.geneMap)
  });
}, 1000, { leading: false, trailing: true });
