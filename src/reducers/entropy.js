import _filter from "lodash/filter";
import * as types from "../actions/types";
import { genotypeColors } from "../util/globals";

const getBars = (jsonData, mutType) => {
  console.log("getting ", mutType, " bars")
  if (mutType === "nuc") {
    const entropyNt = jsonData["nuc"]["val"].map((s, i) => ({x: jsonData["nuc"]["pos"][i], y: s}));
    return _filter(entropyNt, (e) => { return e.y !== 0; }); // formerly entropyNtWithoutZeros
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
      return Object.assign({}, state, {
        loaded: true,
        jsonData: action.data,
        bars: getBars(action.data, action.mutType),
        entropy: action.data
      });
    case types.ENTROPY_DATA:
      // console.log("TO DO. new entropy data in reducer.");
      return state;
    case types.NEW_COLORS:
      if (action.newMutType) {
        return Object.assign({}, state, {
          bars: getBars(state.jsonData, action.newMutType)
        });
      }
      return state;
    case types.TOGGLE_MUT_TYPE:
      return Object.assign({}, state, {
        bars: getBars(state.jsonData, action.data)
      });
    default:
      return state;
  }
};

export default Entropy;
