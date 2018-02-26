// import _filter from "lodash/filter";
import * as types from "../actions/types";
import { genotypeColors } from "../util/globals";

export const intersectGenes = function intersectGenes(geneMap, pos) {
  for (const gene of Object.keys(geneMap)) {
    if (pos >= geneMap[gene].start && pos <= geneMap[gene].end) {
      return gene;
    }
  }
  return false;
};

export const getAnnotations = (jsonData) => {
  const annotations = [];
  let aaCount = 0;
  for (const prot of Object.keys(jsonData)) {
    if (prot !== "nuc") {
      aaCount++;
      annotations.push({
        prot: prot,
        start: jsonData[prot].start,
        end: jsonData[prot].end,
        readingFrame: 1, // +tmpProt['pos'][0]%3,
        fill: genotypeColors[aaCount % 10]
      });
    }
  }
  return annotations;
};

export const processAnnotations = (annotations) => {
  const m = {}; /* m === geneMap */
  annotations.forEach((d) => {
    m[d.prot] = d;
  });
  const sorted = Object.keys(m).sort((a, b) =>
    m[a].start < m[b].start ? -1 : m[a].start > m[b].start ? 1 : 0
  );
  for (const gene of Object.keys(m)) {
    m[gene].idx = sorted.indexOf(gene);
  }
  return m;
};

const Entropy = (state = {loaded: false, showCounts: false}, action) => {
  switch (action.type) {
    case types.DATA_INVALID:
      return {loaded: false, showCounts: false};
    case types.CLEAN_START:
      return action.entropyState;
    case types.ENTROPY_DATA:
      return Object.assign({}, state, {
        loaded: true,
        bars: action.data,
        maxYVal: action.maxYVal
      });
    case types.URL_QUERY_CHANGE_WITH_COMPUTED_STATE:
      return Object.assign({}, state, {
        loaded: true,
        bars: action.entropyBars,
        maxYVal: action.entropyMaxYVal
      });
    case types.ENTROPY_COUNTS_TOGGLE:
      return Object.assign({}, state, {
        showCounts: action.showCounts
      });
    default:
      return state;
  }
};

export default Entropy;
