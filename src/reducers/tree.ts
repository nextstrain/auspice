import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { countTraitsAcrossTree } from "../util/treeCountingHelpers";
import { addNodeAttrs } from "../util/treeMiscHelpers";
import { TreeState } from "../components/tree/tree";


/* A version increase (i.e. props.version !== nextProps.version) necessarily implies
that the tree is loaded as they are set on the same action */

export const getDefaultTreeState = (): TreeState => {
  return {
    loaded: false,
    nodes: null,
    name: undefined,
    visibility: null,
    visibilityVersion: 0,
    nodeColors: null,
    nodeColorsVersion: 0,
    tipRadii: null,
    tipRadiiVersion: 0,
    branchThickness: null,
    branchThicknessVersion: 0,
    vaccines: false,
    version: 0,
    idxOfInViewRootNode: 0,
    totalStateCounts: {},
    observedMutations: {},
    availableBranchLabels: [],
    selectedClade: undefined
  };
};

const treeSlice = createSlice({
  name: 'tree',
  initialState: getDefaultTreeState(),
  reducers: {
    urlQueryChangeWithComputedState(state, action: PayloadAction<TreeState>) {
      return action.payload;
    },
    cleanStart(state, action: PayloadAction<TreeState>) {
      return action.payload;
    },
    dataInvalid(state) {
      state.loaded = false;
    },
    changeExplodeAttr(state, action: PayloadAction<Partial<TreeState>>) {
      Object.assign(state, action.payload);
    },
    changeDatesVisibilityThickness(state, action: PayloadAction<Partial<TreeState>>) {
      Object.assign(state, action.payload);
    },
    updateVisibilityAndBranchThickness(state, action: PayloadAction<Partial<TreeState>>) {
      Object.assign(state, action.payload);
    },
    updateTipRadii(state, action: PayloadAction<{ data: any, version: number }>) {
      state.tipRadii = action.payload.data;
      state.tipRadiiVersion = action.payload.version;
    },
    newColors(state, action: PayloadAction<{ nodeColors: string[], version: number }>) {
      state.nodeColors = action.payload.nodeColors;
      state.nodeColorsVersion = action.payload.version;
    },
    treeTooData(state, action: PayloadAction<TreeState>) {
      return action.payload;
    },
    addExtraMetadata(state, action: PayloadAction<{ newNodeAttrs: any, newColorings: Record<string, any> }>) {
      addNodeAttrs(state.nodes, action.payload.newNodeAttrs);
      const nodeAttrKeys = new Set(state.nodeAttrKeys);
      Object.keys(action.payload.newColorings).forEach((attr) => nodeAttrKeys.add(attr));
      state.totalStateCounts = {
        ...state.totalStateCounts,
        ...countTraitsAcrossTree(state.nodes, Object.keys(action.payload.newColorings), false, true)
      };
      state.nodeAttrKeys = nodeAttrKeys;
    }
  }
});

export const {
  urlQueryChangeWithComputedState,
  cleanStart,
  dataInvalid,
  changeExplodeAttr,
  changeDatesVisibilityThickness,
  updateVisibilityAndBranchThickness,
  updateTipRadii,
  newColors,
  treeTooData,
  addExtraMetadata
} = treeSlice.actions;

export default treeSlice.reducer;
