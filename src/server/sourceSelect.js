/* eslint no-console: off */
const manifestHelpers = require("./manifestHelpers");
const fs = require('fs');
const fetch = require('node-fetch');

const urlToParts = (url) => {
  return url.replace(/^\/+/, "").replace(/\/+$/, "").split("/");
};


const getSource = (url) => {
  let parts = urlToParts(url);
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
  const datasets = {available: undefined, source};
  if (source === "local" && global.LOCAL_MANIFEST) {
    datasets.available = global.LOCAL_MANIFEST;
  } else if (source === "live" && global.LIVE_MANIFEST) {
    datasets.available = global.LIVE_MANIFEST;
  } else if (source === "staging" && global.STAGING_MANIFEST) {
    datasets.available = global.STAGING_MANIFEST;
  }
  return datasets;
};

const collectAndSendDatasets = (errorMessage, res, source) => {
  const dataToSend = collectDatasets(source);
  if (dataToSend.available) {
    res.json(dataToSend);
  } else {
    res.statusMessage = errorMessage;
    res.status(500).end();
  }
};

const collectAndSendNarratives = (errorMessage, res, source) => {
  const dataToSend = {available: undefined, source, narratives: true};
  const parseFiles = (files) => {
    const parsed = files
      .filter((file) => file.endsWith(".md") && file!=="README.md")
      .map((file) => file.replace(".md", ""))
      .map((file) => file.split("_"));
    parsed.forEach((partsOfPath) => {partsOfPath.splice(0, 0, "narratives");});
    return parsed;
  };

  if (source === "local") {
    let files;
    try {
      files = fs.readdirSync(global.LOCAL_NARRATIVES_PATH);
    } catch (err) {
      console.log("local narratives readdirSync err", err);
      res.statusMessage = errorMessage;
      res.status(500).end();
    }
    dataToSend.available = parseFiles(files);
    res.json(dataToSend);
  } else if (source === "live") {
    fetch("https://api.github.com/repos/nextstrain/narratives/contents")
      .then((result) => result.json())
      .then((json) => {
        dataToSend.available = parseFiles(json.map((b) => b.name));
        if (!dataToSend.available) throw new Error();
        res.json(dataToSend);
      })
      .catch(() => {
        console.log(`Error fetching github narrative list`);
        res.statusMessage = errorMessage;
        res.status(500).end();
      });


    console.log("TO DO LIVE");
  }
};


const guessTreeName = (parts) => {
  const guesses = ["HA", "NA", "PB1", "PB2", "PA", "NP", "NS", "MP", "L", "S"];
  for (const part of parts) {
    if (guesses.indexOf(part.toUpperCase()) !== -1) return part;
  }
  return undefined;
};

const splitUrlIntoParts = (url) => url
  .replace(/^\//, '')
  .replace(/\/$/, '')
  .replace(/^live\//, "")
  .split("/");

const constructPathToGet = (source, providedUrl, otherQueries) => {
  /* the path / URL is case sensitive */
  let auspiceURL; // the URL to be displayed in Auspice
  let fetchURL; // could be local path or http(s)://
  let secondTreeFetchURL;
  let datasetFields; // this _does not_ take into account the 2nd tree
  let treeName;

  const parts = splitUrlIntoParts(providedUrl);

  /* does the URL specify two trees? */
  let treeTwoName;
  for (let i=0; i<parts.length; i++) {
    if (parts[i].indexOf(":") !== -1) {
      [treeName, treeTwoName] = parts[i].split(":");
      parts[i] = treeName; // only use the first tree from now on
      break;
    }
  }
  if (!treeTwoName && otherQueries.deprecatedSecondTree) {
    treeTwoName = otherQueries.deprecatedSecondTree;
  }

  if (source === "local") {
    if (parts[0] !== "local") {
      parts.unshift("local");
    }
    auspiceURL = "local/";
    datasetFields = manifestHelpers.checkFieldsAgainstManifest(parts.slice(1), source);
    fetchURL = global.LOCAL_DATA_PATH;
  } else if (source === "github") {
    if (parts.length < 3) {
      throw new Error("Community URLs must be of format community/githubOrgName/repoName/...");
    }
    fetchURL = `https://rawgit.com/${parts[1]}/${parts[2]}/master/auspice`;
    auspiceURL = `community/${parts[1]}/`;
    datasetFields = parts.slice(2);
  } else if (source === "staging") {
    fetchURL = global.REMOTE_DATA_STAGING_BASEURL;
    auspiceURL = "staging/";
    datasetFields = manifestHelpers.checkFieldsAgainstManifest(parts.slice(1), source);
  } else {
    /* default (for nextstrain.org, this is the data.nextstrain S3 bucket) */
    fetchURL = global.REMOTE_DATA_LIVE_BASEURL;
    auspiceURL = "";
    datasetFields = manifestHelpers.checkFieldsAgainstManifest(parts, source);
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
  collectAndSendDatasets,
  collectDatasets,
  guessTreeName,
  collectAndSendNarratives,
  splitUrlIntoParts
};
