const manifestHelpers = require("./manifestHelpers");
const path = require("path");

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
  return undefined;
};

const constructPathToGet = (source, url, jsonTypeWanted) => {
  const parts = url.replace(/^\//, '').replace(/\/$/, '').split("/");
  const lowerParts = parts.map((p) => p.toLowerCase());
  let pathPrefix, fields, urlPrefix;

  if (source === "local") {
    pathPrefix = global.LOCAL_DATA_PATH;
    urlPrefix = "local/";
    fields = manifestHelpers.checkFieldsAgainstManifest(lowerParts.slice(1), source);
  } else if (source === "github") {
    if (parts.length < 3) {
      throw new Error("Community URLs must be of format community/githubOrgName/repoName/...");
    }
    pathPrefix = `https://rawgit.com/${parts[1]}/${parts[2]}/master/auspice/`;
    urlPrefix = `community/${parts[1]}/${parts[2]}/`;
    fields = lowerParts.slice(2);
  } else if (source === "staging") {
    pathPrefix = global.REMOTE_DATA_STAGING_BASEURL;
    urlPrefix = "";
    fields = manifestHelpers.checkFieldsAgainstManifest(lowerParts.slice(1), source);
  } else {
    /* default is via global.REMOTE_DATA_LIVE_BASEURL (for nextstrain.org, this is the data.nextstrain S3 bucket) */
    pathPrefix = global.REMOTE_DATA_LIVE_BASEURL;
    urlPrefix = "";
    fields = manifestHelpers.checkFieldsAgainstManifest(lowerParts, source);
  }

  let suffix = "";
  if (jsonTypeWanted) {
    suffix += "_" + jsonTypeWanted;
  }
  suffix += ".json";

  const pathname = source === "local" ?
    path.join(pathPrefix, fields.join("_")+suffix) :
    pathPrefix + fields.join("_")+suffix;

  return [
    urlPrefix + fields.join("/"),
    fields,
    pathname
  ];
};

const guessTreeName = (parts) => {
  const guesses = ["HA", "NA", "PB1", "PB2", "PA", "NP", "NS", "MP", "L", "S"];
  for (const part of parts) {
    if (guesses.indexOf(part.toUpperCase()) !== -1) return part;
  }
  return undefined;
};

module.exports = {
  getSource,
  constructPathToGet,
  collectDatasets,
  guessTreeName
};
