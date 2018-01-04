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

const getAnnotations = (jsonData) => {
  const annotations = [];
  let aaCount = 0;
  for (const prot of Object.keys(jsonData)) {
    if (prot !== "nuc") {
      const tmpProt = jsonData[prot];
      aaCount += 1;
      annotations.push({
        prot: prot,
        start: tmpProt["pos"][0],
        end: tmpProt["pos"][tmpProt["pos"].length - 1],
        readingFrame: 1, // +tmpProt['pos'][0]%3,
        fill: genotypeColors[aaCount % 10]
      });
    }
  }
  return annotations;
};

const processAnnotations = (annotations) => {
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
    case types.RECEIVE_ENTROPY:
      const annotations = getAnnotations(action.data);
      const geneMap = processAnnotations(annotations);
      return Object.assign({}, state, {
        loaded: false,
        // jsonData: action.data,
        maxNt: Math.max(...action.data.nuc.pos),
        annotations,
        geneMap
      });
    case types.ENTROPY_DATA:
      return Object.assign({}, state, {
        loaded: true,
        bars: action.data,
        maxYVal: action.maxYVal
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
