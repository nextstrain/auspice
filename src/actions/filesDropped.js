/*eslint max-len: 0*/
import { infoNotification, errorNotification, successNotification, warningNotification } from "./notifications";
import Papa from "papaparse";
import { ADD_COLOR_BYS } from "./types";

const csvComplete = (dispatch, getState, results, file) => {
  const { tree, metadata } = getState();
  const strainKey = results.meta.fields[0];
  const existingOpts = metadata.metadata.color_options;
  let existingColorBys = [];
  Object.keys(metadata.metadata.color_options).map((k) => {
    existingColorBys = existingColorBys.concat([existingOpts[k].key, existingOpts[k].menuItem, existingOpts[k].legendTitle]);
  });
  const newColorBys = results.meta.fields.slice(1).filter((x) => existingColorBys.indexOf(x) === -1);
  const excludedColorBys = results.meta.fields.slice(1).filter((x) => existingColorBys.indexOf(x) !== -1);
  const csvTaxa = results.data.map((o) => o[strainKey]);
  const treeTaxa = tree.nodes.filter((n) => !n.hasChildren).map((n) => n.strain);
  const taxaMatchingTree = csvTaxa.filter((x) => treeTaxa.indexOf(x) !== -1);
  const csvTaxaToIgnore = csvTaxa.filter((x) => taxaMatchingTree.indexOf(x) === -1);
  if (csvTaxaToIgnore.length) {
    console.log("Ignoring these taxa from the CSV as they don't appear in the tree:", csvTaxaToIgnore);
  }
  /* data structure: obj with keys of strain names and values an array in correspondence with newColorBys */
  const data = {};
  for (const o of results.data.filter((r) => taxaMatchingTree.indexOf(r.strain) !== -1)) {
    // console.log("adding data", o);
    data[o.strain] = newColorBys.map((x) => o[x]);
  }
  /* edge cases where the CSV has no "real" info */
  if (taxaMatchingTree.length === 0 || newColorBys.length === 0) {
    dispatch(errorNotification({
      message: file.name + " had no (relevent) information",
      details: newColorBys.length === 0 ? "No columns to add as traits" : "No taxa which match those in the tree"
    }));
    return;
  }
  dispatch({type: ADD_COLOR_BYS, newColorBys, data, taxa: taxaMatchingTree});
  dispatch(successNotification({
    message: "Adding metadata from " + file.name,
    details: newColorBys.length + " fields for " + taxaMatchingTree.length + " / " + treeTaxa.length + " taxa"
  }));
  if (excludedColorBys.length) {
    dispatch(warningNotification({
      message: "Excluded " + excludedColorBys.length + " fields as they already exist",
      details: excludedColorBys.join(", ")
    }));
  }
};

const csvError = (dispatch, error, file) => {
  dispatch(errorNotification({message: "Error parsing " + file.name, details: error}));
};

export const filesDropped = (files) => {
  return function (dispatch, getState) {
    for (const file of files) {
      if (file.type !== "text/csv") {
        dispatch(warningNotification({message: "Non-CSV File dropped", details: file.name}));
      } else {
        // http://papaparse.com/docs#config
        Papa.parse(file, {header: true, complete: csvComplete.bind(this, dispatch, getState), error: csvError.bind(this, dispatch), comments: "#", skipEmptyLines: true});
      }
    }
  };
};
