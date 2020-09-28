import * as types from "../actions/types";
import { infoNotification } from "../actions/notifications";
import { fetchJSON } from "../util/serverInteraction";
import { changeColorBy } from "../actions/colors";

/**
 * EXPERIMENTAL ONLY -- NOT FOR PRODUCTION
 * This function is a proof-of-principle approach for spiking in metadata
 * via an API call, rather than storing it within the JSON.
 * It currently only works when changing to a new colorBy.
 * Cacheing is not implemented.
 */
export const extraMetadataMiddleware = (store) => (next) => async (action) => {

  if (action.type === types.NEW_COLORS) {
    const {metadata, tree} = store.getState();
    const coloringSpecifiesApiEndpoint = metadata.colorings && metadata.colorings[action.colorBy] && metadata.colorings[action.colorBy].EXPERIMENTAL_google_sheets_id;
    const colorScaleIsUndefined = action.colorScale.legendValues.length === 0; // stops unnecessary fetches
    if (coloringSpecifiesApiEndpoint && colorScaleIsUndefined) {
      store.dispatch(infoNotification({message: "Fetching colors, hold on!", details: "Should use spinner or similar UI"}));
      try {
        const colorByData = await getGoogleSheetData(metadata.colorings[action.colorBy].EXPERIMENTAL_google_sheets_id, action.colorBy);
        insertDataIntoTree(tree, action.colorBy, colorByData);
        store.dispatch(changeColorBy(action.colorBy)); // re-dispatch, the original one won't have gone through!
      } catch (error) {
        console.error(error);
      }
      return;
    }
  }
  next(action); // send action to other middleware / reducers
};


/** get & parse data from (public) google sheets.
 * Google is moving to v4 of their API, however that seems (?) to require API keys even to access public
 * data. Thus i'm using the v3 API, which will go offline on Sept 30, but allows anonymous API calls.
 * As such, the parsing function is rudimentary. We only parse the field `keyName`, but cacheing of the response
 * (within auspice?) will make this acceptable
 */
async function getGoogleSheetData(id, keyName) {
  const sheet = await fetchJSON(`https://spreadsheets.google.com/feeds/cells/${id}/1/public/full?alt=json`);
  const cells = sheet.feed.entry.map((e) => e["gs$cell"]);

  /* work out what column represents the keyName */
  let keyColumnId;
  try {
    keyColumnId = (cells.filter((c) => c.row==="1" && c.inputValue===keyName)[0]).col;
  } catch (e) {
    console.error(`Couldn't find a column name of ${keyName} in the google sheet`);
    throw e;
  }

  /* create a Map of strain -> keyValue out of the google sheets JSON */
  const rowToStrain = new Map();
  cells.filter((cell) => cell.row!=="1" && cell.col==="1") // assume strain is col 1
    .forEach((cell) => {rowToStrain.set(cell.row, cell.inputValue);});
  const strainMap = new Map();
  cells.filter((cell) => cell.row!=="1" && cell.col===keyColumnId)
    .filter((cell) => rowToStrain.has(cell.row))
    .forEach((cell) => {
      strainMap.set(rowToStrain.get(cell.row), cell.inputValue);
    });

  return strainMap;
}

/** this should be done in a reducer, but simply modifying the internal data within
 * the tree is a shortcut and is possible since it's an Object.
 */
function insertDataIntoTree(tree, key, data) {
  tree.nodes.forEach((n) => {
    if (data.has(n.name)) {
      n.node_attrs[key] = {value: data.get(n.name)};
    }
  });
}
