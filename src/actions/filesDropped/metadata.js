import Papa from "papaparse";
import { errorNotification, successNotification, warningNotification } from "../notifications";
import { ADD_COLOR_BYS } from "../types";
import { csv_file_types, is_csv_or_tsv } from "./constants";


/**
 * A promise-ified version of Papa.parse()
 * A note on encoding here: It will be common that people drop CSVs from microsoft excel
 * in here annd, you guessed it, this causes all sorts of problems.
 * https://github.com/mholt/PapaParse/issues/169 suggests adding encoding: "ISO-8859-1"
 * to the config, which may work
 * @param {DataTransfer} file a DataTransfer object
 */
const parseCsv = (file) => new Promise((resolve, reject) => {
  if (!(is_csv_or_tsv(file))) {
    reject(new Error("Cannot parse this filetype"));
  }
  Papa.parse(file, {
    header: true,
    complete: (results) => {
      resolve(results);
    },
    error: (error) => {
      reject(error);
    },
    encoding: "UTF-8",
    comments: "#",
    delimiter: (csv_file_types.includes(file.type)) ? "," : "\t",
    skipEmptyLines: true,
    dynamicTyping: false
  });
});


const handleMetadata = async (dispatch, getState, file) => {
  let csvData, errors, csvMeta;
  try {
    ({data: csvData, errors, meta: csvMeta} = await parseCsv(file));
    if (errors.length) {
      console.error(errors);
      throw new Error(errors.map((e) => e.message).join(", "));
    }
  } catch (err) {
    return dispatch(errorNotification({
      message: `Parsing of ${file.name} failed`,
      details: err.message
    }));
  }

  const strainKey = csvMeta.fields[0];
  const {controls, tree} = getState();
  const newColorByNames = [];
  const colorBysIgnored = [];
  /* currently we cannot process metadata fields which are defined as properties on a node, rather than trait properties
  These could be included on a case-by-case basis */
  const fieldsToIgnore = new Set(["name", "div", "num_date", "vaccine", "labels", "hidden", "mutations", "url", "authors", "accession", "traits", "children"]);
  csvMeta.fields.slice(1).forEach((colorBy) => {
    if (controls.coloringsPresentOnTree.has(colorBy) || fieldsToIgnore.has(colorBy)) {
      colorBysIgnored.push(colorBy);
    } else {
      newColorByNames.push(colorBy);
    }
  });
  const strainsToProcess = new Set();
  const dataToProcess = {};
  const taxaInCsvButNotInTree = [];
  const allStrainNames = new Set(tree.nodes.map((n) => n.name)); // can be internal nodes
  csvData.forEach((d) => {
    const strain = d[strainKey];
    if (allStrainNames.has(strain)) {
      strainsToProcess.add(strain);
      dataToProcess[strain] = {};
      newColorByNames.forEach((colorBy) => {
        if (d[colorBy]) {
          dataToProcess[strain][colorBy] = {value: d[colorBy]};
        }
      });
    } else {
      taxaInCsvButNotInTree.push(strain);
    }
  });

  /* CHECK FOR ERRORS */
  if (strainsToProcess.size === 0 || newColorByNames.length === 0) {
    return dispatch(errorNotification({
      message: `${file.name} had no (relevent) information`,
      details: newColorByNames.length === 0 ? "No columns to add as colorings" : "No taxa which match those in the tree"
    }));
  }

  /* DISPATCH APPROPRIATE WARNINGS */
  if (taxaInCsvButNotInTree.length) {
    const n = taxaInCsvButNotInTree.length;
    dispatch(warningNotification({
      message: `Ignoring ${n} taxa which ${n > 1 ? "don't" : "doesn't"} appear in the tree!`,
      details: taxaInCsvButNotInTree.join(", ")
    }));
    console.warn("Ignoring these taxa from the CSV as they don't appear in the tree:", taxaInCsvButNotInTree);
  }
  if (colorBysIgnored.length) {
    dispatch(warningNotification({
      message: `Ignoring ${colorBysIgnored.length} CSV fields as they are already set as colorings or are "special" cases to be ignored`,
      details: colorBysIgnored.join(", ")
    }));
  }

  /* DISPATCH NEW COLORINGS & SUCCESS NOTIFICATION */
  const newColorings = {};
  newColorByNames.forEach((title) => {
    // TODO -- let the CSV define the type
    newColorings[title] = {title, type: "categorical"};
  });
  dispatch({type: ADD_COLOR_BYS, newColorings, strains: strainsToProcess, traits: dataToProcess});
  return dispatch(successNotification({
    message: "Adding metadata from " + file.name,
    details: `${newColorByNames.length} new field${newColorByNames.length > 1 ? "s" : ""} for ${strainsToProcess.size} node${strainsToProcess.size > 1 ? "s" : ""}`
  }));
};

export default handleMetadata;
