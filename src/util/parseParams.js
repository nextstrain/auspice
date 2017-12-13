/*
 * utility function that takes a string (splat as in flu/h3n2/3y)
 * parses it, and compares it against the (hardcoded) available datasets
 * identifies whether that string specifies a valid and complete dataset
 * incomplete path are augmented with defaults
 *
 * The dataset structure = {Key1: [val1a, val2a], Key2: [val2a, val2b]...}
 *    the keys are applicable categories, e.g "pathogen" and "lineage"
 *    first value: idx of the category (pathogen is 0, lineage is 1 and so on)
 *    second value: the selected option, e.g. "ebola" or "H7N9", or "NA"
 */

const parseParams = (path, datasets) => {
  // console.log("parseParams. path in:", path, datasets)
  let params; // split path at '/', if path === "", set params to []
  if (path.length) {
    params = path.replace(/_/g, "/").split("/").filter((d) => d !== "");
  } else {
    params = [];
  }
  const config = {
    "valid": true, // the URL is incorrect and we don't know what to do!
    "incomplete": false, // the URL, as passed in, is incomplete
    "dataset": {}, // see above
    "fullsplat": "", // just the URL
    "search": "" // the URL search query
  };

  let elemType; // object whose keys are the available choices (e.g. "zika" and "ebola")
  let idx;      // the index of the current param (of params)
  let elem;     // the choice (e.g. "flu", "h7n9", "ebola")
  let datasetSlice = datasets; // This is usually an object, sometimes a string
  for (idx = 0; idx < params.length; idx++) {
    elem = params[idx];
    if (typeof datasetSlice !== "string" && Object.keys(datasetSlice).length) {
      elemType = Object.keys(datasetSlice)[0];
      // elemType will be "pathogen", "lineage" or "segment"
      if (typeof datasetSlice[elemType][elem] === "undefined") {
        // the elem (the param requested) is NOT available in the dataset. BAIL.
        console.warn("in manifest, ", elem, " not found at level of ", elemType);
        config.valid = false;
        return config;
      }
      // console.log("(from URL)", elemType, "=", elem);
      // yes, the param (at the current level) is valid...
      // assign valid path element and move datasetSlice down in the hierarchy
      config.dataset[elemType] = [idx, elem];
      config.fullsplat += "/" + elem;
      datasetSlice = datasetSlice[elemType][elem];
      // now dataset may be {}, {...} or "..."
      if (typeof datasetSlice === "string" && datasetSlice !== "") {
        config.search = datasetSlice;
        config.incomplete = true; // so the search gets put in!
      }
    } else {
      // so we've got a param, but we've run out of levels!
      // mark as "incomplete" so the URL will change
      config.incomplete = true;
    }

  }
  // parse any remaining levels of globals.datasets
  // this stops when we encounter 'xx: {}' as Object.keys({}).length==0
  // this both populates the dataset property, and sets defaults,
  // else the URL wouldn't be valid so the data request would 404
  while(typeof datasetSlice !== "string" && Object.keys(datasetSlice).length) {
    elemType = Object.keys(datasetSlice)[0];
    elem = datasetSlice[elemType]["default"];
    // console.log("filling default ", elemType," as ", elem);
    config.dataset[elemType] = [idx, elem];
    // double check specified default is actually valid
    if (typeof datasetSlice[elemType][elem] === "undefined") {
      config.valid = false;
      console.log("incorrect / no default set");
      return config;
    }
    config.incomplete = true; // i.e. the url, as specified, needs to be updated
    config.fullsplat += "/" + elem;
    config.dataset[elemType] = [idx, elem];
    // move to next level
    datasetSlice = datasetSlice[elemType][elem];
    // now dataset may be {}, {...} or "..."
    if (typeof datasetSlice === "string" && datasetSlice !== "") {
      config.search = datasetSlice;
      // already config.incomplete is true
    }
    idx++;
  }

  return config;
};

export default parseParams;
