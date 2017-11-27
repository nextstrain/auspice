import _filter from "lodash/filter";
import * as types from "../actions/types";
import { genotypeColors } from "../util/globals";

const intersectGenes = function intersectGenes(geneMap, pos) {
  for (const gene of Object.keys(geneMap)) {
    if (pos >= geneMap[gene].start && pos <= geneMap[gene].end) {
      return gene;
    }
  }
  return false;
};

const getBars = (jsonData, geneMap, mutType) => {
  console.log("getting ", mutType, " bars")
  if (mutType === "nuc") {
    const entropyNt = jsonData["nuc"]["val"].map((s, i) => ({x: jsonData["nuc"]["pos"][i], y: s}));
    const entropyNtWithoutZeros = _filter(entropyNt, (e) => { return e.y !== 0; }); // formerly entropyNtWithoutZeros
    for (const nt of entropyNtWithoutZeros) {
      nt.prot = intersectGenes(geneMap, nt.x);
    }
    return entropyNtWithoutZeros;
  }
  // TO DO - improve the code here...
  let aminoAcidEntropyWithoutZeros = [];
  let aaCount = 0;
  for (const prot of Object.keys(jsonData)) {
    if (prot !== "nuc") {
      const tmpProt = jsonData[prot];
      aaCount += 1;
      const tmpEntropy = tmpProt["val"].map((s, i) => ({ // eslint-disable-line no-loop-func
        x: tmpProt["pos"][i],
        y: s,
        codon: tmpProt["codon"][i],
        fill: genotypeColors[aaCount % 10],
        prot: prot
      }));
      aminoAcidEntropyWithoutZeros = aminoAcidEntropyWithoutZeros.concat(
        tmpEntropy.filter((e) => e.y !== 0)
      );
    }
  }
  return aminoAcidEntropyWithoutZeros;
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


const Entropy = (state = {
  loaded: false,
  entropy: null,
  bars: undefined
}, action) => {
  switch (action.type) {
    case types.DATA_INVALID:
      return {
        loaded: false,
        entropy: null
      };
    case types.RECEIVE_ENTROPY:
      const annotations = getAnnotations(action.data);
      const geneMap = processAnnotations(annotations);
      return Object.assign({}, state, {
        loaded: true,
        jsonData: action.data,
        bars: getBars(action.data, geneMap, action.mutType),
        entropy: action.data,
        maxNt: Math.max(...action.data.nuc.pos),
        annotations,
        geneMap
      });
    case types.ENTROPY_DATA:
      // console.log("TO DO. new entropy data in reducer.");
      return state;
    case types.NEW_COLORS:
      if (action.newMutType) {
        return Object.assign({}, state, {
          bars: getBars(state.jsonData, state.geneMap, action.newMutType)
        });
      }
      return state;
    case types.TOGGLE_MUT_TYPE:
      return Object.assign({}, state, {
        bars: getBars(state.jsonData, state.geneMap, action.data)
      });
    default:
      return state;
  }
};

export default Entropy;
