import { createStateFromQueryOrJSONs } from "@auspice/actions/recomputeReduxState";


export const handleDroppedFiles = (dispatch, files) => {
  const file = files[0];
  if (files.length !== 1) {
    console.error("Can only process a single dropped file");
    return;
  }

  const errorCB = (err) => {
    console.error(err);
  };

  const fileReader = new window.FileReader();

  fileReader.onload = () => {
    let jsonData;
    if (file.type === "application/json") {
      jsonData = JSON.parse(fileReader.result);
    } else if (file.name.endsWith(".new") || file.name.endsWith(".newick") || file.name.endsWith(".nwk")) {
      console.log("attempting to parse a newick tree");
    } else {
      return errorCB("Unknown filetype");
    }
    let state;
    try {
      state = createStateFromQueryOrJSONs({json: jsonData, query: {}});
    } catch (err) {
      return errorCB(err);
    }
    dispatch({type: "CLEAN_START", ...state});
    dispatch({type: "PAGE_CHANGE", displayComponent: "main"});

  };
  fileReader.onerror = errorCB;
  fileReader.readAsText(file);
};
