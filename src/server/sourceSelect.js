const manifestHelpers = require("./manifestHelpers");
// const path = require("path");

const urlToParts = (url, lower) => {
  if (lower) return url.toLowerCase().replace(/^\/+/, "").replace(/\/+$/, "").split("/");
  return url.replace(/^\/+/, "").replace(/\/+$/, "").split("/");
};


const getSource = (url) => {
  let parts = urlToParts(url, true);
  if (parts[0] === "status") {
    parts = parts.slice(1);
  }
  if (!parts.length || (parts.length === 1 && parts[0] === '')) {
    return "live";
  }
  if (parts[0] === "local") return "local";
  else if (parts[0] === "staging") return "staging";
  else if (parts[0] === "community") return "github";
  return "live";
};

const collectDatasets = (source) => {
  if (source === "local" && global.LOCAL_MANIFEST) {
    return {available: global.LOCAL_MANIFEST, source};
  } else if (source === "live" && global.LIVE_MANIFEST) {
    return {available: global.LIVE_MANIFEST, source};
  } else if (source === "staging" && global.STAGING_MANIFEST) {
    return {available: global.STAGING_MANIFEST, source};
  }
  return {available: undefined, source};
};


const guessTreeName = (parts) => {
  const guesses = ["HA", "NA", "PB1", "PB2", "PA", "NP", "NS", "MP", "L", "S"];
  for (const part of parts) {
    if (guesses.indexOf(part.toUpperCase()) !== -1) return part;
  }
  return undefined;
};

const constructPathToGet = (source, providedUrl) => {
  /* the path is lowercased _except for_ the github org & repo names */
  let auspiceURL; // the URL to be displayed in Auspice
  let fetchURL; // could be local path or http(s)://
  let secondTreeFetchURL;
  let datasetFields; // this _does not_ take into account the 2nd tree
  let treeName;

  const parts = providedUrl.replace(/^\//, '').replace(/\/$/, '').split("/");
  const makeLower = (arr) => arr.map((x) => x.toLowerCase());

  /* does the URL specify two trees? */
  let treeTwoName;
  for (let i=0; i<parts.length; i++) {
    if (parts[i].indexOf(":") !== -1) {
      [treeName, treeTwoName] = parts[i].split(":");
      parts[i] = treeName; // only use the first tree from now on
      break;
    }
  }

  if (source === "local") {
    if (parts[0].toLowerCase() !== "local") {
      parts.unshift("local");
    }
    auspiceURL = "local/";
    datasetFields = manifestHelpers.checkFieldsAgainstManifest(makeLower(parts).slice(1), source);
    fetchURL = global.LOCAL_DATA_PATH;
  } else if (source === "github") {
    if (parts.length < 3) {
      throw new Error("Community URLs must be of format community/githubOrgName/repoName/...");
    }
    fetchURL = `https://rawgit.com/${parts[1]}/${parts[2]}/master/auspice`;
    auspiceURL = `community/${parts[1]}/`;
    datasetFields = parts.slice(2); // case sensitive!
  } else if (source === "staging") {
    fetchURL = global.REMOTE_DATA_STAGING_BASEURL;
    auspiceURL = "staging/";
    datasetFields = manifestHelpers.checkFieldsAgainstManifest(makeLower(parts).slice(1), source);
  } else {
    /* default (for nextstrain.org, this is the data.nextstrain S3 bucket) */
    fetchURL = global.REMOTE_DATA_LIVE_BASEURL;
    auspiceURL = "";
    datasetFields = manifestHelpers.checkFieldsAgainstManifest(makeLower(parts), source);
  }

  if (!treeName) {
    treeName = guessTreeName(datasetFields);
  }
  if (treeTwoName) {
    const treeIdx = datasetFields.indexOf(treeName);
    const fieldsTT = datasetFields.slice();
    fieldsTT[treeIdx] = treeTwoName;
    secondTreeFetchURL = fetchURL + "/" + fieldsTT.join("_") + ".json";

    const fieldsAus = datasetFields.slice();
    fieldsAus[treeIdx] = `${treeName}:${treeTwoName}`;
    auspiceURL += fieldsAus.join("/");
  } else {
    auspiceURL += datasetFields.join("/");
  }

  fetchURL = fetchURL + "/" + datasetFields.join("_") + ".json";

  return {auspiceURL, fetchURL, secondTreeFetchURL, datasetFields, treeName, treeTwoName};
};


module.exports = {
  getSource,
  constructPathToGet,
  collectDatasets,
  guessTreeName
};
