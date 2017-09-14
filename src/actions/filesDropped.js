import Papa from "papaparse";
import { errorNotification, successNotification, warningNotification } from "./notifications";
import { ADD_COLOR_BYS } from "./types";
import { turnAttrsIntoHeaderArray } from "../components/download/helperFunctions";

const csvCompleteCallback = (dispatch, getState, results, file) => {
  const { tree } = getState();
  const strainKey = results.meta.fields[0];
  const ignoreTheseFields = turnAttrsIntoHeaderArray(tree.attrs); /* these are in the downloaded strain metadata CSV */
  const newColorBys = results.meta.fields.slice(1).filter((x) => ignoreTheseFields.indexOf(x) === -1);
  const excludedColorBys = results.meta.fields.slice(1).filter((x) => ignoreTheseFields.indexOf(x) !== -1);
  const csvTaxa = results.data.map((o) => o[strainKey]);
  const treeTaxa = tree.nodes.filter((n) => !n.hasChildren).map((n) => n.strain);
  const taxaMatchingTree = csvTaxa.filter((x) => treeTaxa.indexOf(x) !== -1);
  const csvTaxaToIgnore = csvTaxa.filter((x) => taxaMatchingTree.indexOf(x) === -1);
  if (csvTaxaToIgnore.length) {
    console.warn("Ignoring these taxa from the CSV as they don't appear in the tree:", csvTaxaToIgnore);
  }
  /* data structure: obj with keys of strain names and values an array in correspondence with newColorBys */
  const data = {};
  for (const o of results.data.filter((r) => taxaMatchingTree.indexOf(r[strainKey]) !== -1)) {
    data[o[strainKey]] = newColorBys.map((x) => o[x].length ? o[x] : undefined);
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
  if (csvTaxaToIgnore.length) {
    dispatch(warningNotification({
      message: "Excluded " + csvTaxaToIgnore.length + " taxa from the CSV as they aren't in the tree",
      details: csvTaxaToIgnore.join(", ")
    }));
  }
};

const csvError = (dispatch, error, file) => {
  dispatch(errorNotification({message: "Error parsing " + file.name, details: error}));
};

/* a note on encoding here. It will be common that people drop CSVs from microsoft excel
in here annd, you guessed it, this causes all sorts of problems.
https://github.com/mholt/PapaParse/issues/169 suggests adding encoding: "ISO-8859-1" to the Papa config - which seems to work
*/

const filesDropped = (files) => {
  return (dispatch, getState) => {
    for (const file of files) {
      if (file.type !== "text/csv") {
        dispatch(warningNotification({message: "Non-CSV File dropped", details: file.type + file.name}));
      } else {
        // http://papaparse.com/docs#config
        Papa.parse(file, {
          header: true,
          complete: csvCompleteCallback.bind(this, dispatch, getState),
          error: csvError.bind(this, dispatch),
          encoding: "UTF-8",
          comments: "#",
          delimiter: ",",
          skipEmptyLines: true,
          dynamicTyping: false
        });
      }
    }
  };
};

export default filesDropped;
