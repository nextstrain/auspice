/*
* basically just the functions which will be improved when we move to the new server API
*
* Note that a lot of this code is replicated in the nextstrain.org repo
* and it could instead be exposed by "auspice" (and imported by the nextstrain.org repo)
* Note also https://github.com/nextstrain/auspice/issues/687 which proposes
* changing the server-client API
*
*/


const utils = require("../utils");
const queryString = require("query-string");
const path = require("path");
const convertFromV1 = require("./convertJsonSchemas").convertFromV1;
const fs = require("fs");

const handleError = (res, clientMsg, serverMsg="", code=500) => {
  utils.warn(`${clientMsg} -- ${serverMsg}`);
  return res.status(code).type("text/plain").send(clientMsg);
};

const splitPrefixIntoParts = (url) => url
  .replace(/^\//, '')
  .replace(/\/$/, '')
  .split("/");


/**
 * Basic interpretation of an auspice request
 * @returns {Object} keys: `dataType`, `parts`
 */
const interpretRequest = (req) => {
  utils.log(`GET DATASET query received: ${req.url.split('?')[1]}`);
  const query = queryString.parse(req.url.split('?')[1]);
  if (!query.prefix) throw new Error("'prefix' not defined in request");
  const datanameParts = splitPrefixIntoParts(query.prefix);
  const info = {parts: datanameParts};
  if (query.type && query.type !== "tree") { // "tree" is deprecated
    info.dataType = query.type;
  } else {
    info.dataType = "dataset";
  }

  return info;
};

/**
 * Given a request, if the dataset does not exist then either
 * (a) redirect to an appropriate dataset if possible & return `true`
 * (b) throw.
 * If the dataset existed then return `false` as no redirect necessary.
 */
const redirectIfDatapathMatchFound = (res, info, availableDatasets) => {
  let matchingDatasets = availableDatasets;
  let i;
  const matchDatasetRequest = (d) => d.request.split("/")[i] === info.parts[i];
  // Filter gradually by path fragment, starting from the root
  for (i = 0; i < info.parts.length; i++) {
    const newMatchingDatasets = matchingDatasets.filter(matchDatasetRequest);
    if (!newMatchingDatasets.length) break;
    matchingDatasets = newMatchingDatasets;
  }
  // If root fragment does cannot be matched, throw
  if (!i) throw new Error(`${info.parts.join("/")} not in available datasets`);
  // If best match is not equal to path requested, redirect
  if (matchingDatasets[0].request !== info.parts.join("/")) {
    res.redirect(`./getDataset?prefix=/${matchingDatasets[0].request}`);
    return true;
  }
  return false;
};

/**
 * sets info.address.
 * if we need v1 datasets then `info.address` will be an object with `meta`
 * and `tree` keys. Otherwise `info.address` will be a string of the fetch
 * path.
 * @sideEffect sets `info.address` {Object | string}
 * @throws
 */
const makeFetchAddresses = (info, datasetsPath, availableDatasets) => {
  if (info.dataType !== "dataset") {
    info.address = path.join(
      datasetsPath,
      `${info.parts.join("_")}_${info.dataType}.json`
    );
  } else {
    const requestStr = info.parts.join("/"); // TO DO
    const availableInfo = availableDatasets.filter((d) => d.request === requestStr)[0];
    if (availableInfo.v2) {
      info.address = path.join(datasetsPath, `${info.parts.join("_")}.json`);
    } else {
      info.address = {
        meta: path.join(datasetsPath, `${info.parts.join("_")}_meta.json`),
        tree: path.join(datasetsPath, `${info.parts.join("_")}_tree.json`)
      };
    }
  }
};

const sendJson = async (res, info) => {
  if (typeof info.address === "string") {
    /* In general, JSONs are designed such that no server modifications
    are needed by the server. This allows us to read as a stream and
    stream the response */
    const readStream = fs.createReadStream(info.address);
    readStream.on('open', () => {
      res.set('Content-Type', 'application/json');
      readStream.pipe(res);
    });
    readStream.on('error', (err) => {
      utils.warn(`Failed to read ${info.address}`);
      utils.verbose(err);
      res.sendStatus(404);
    });
  } else {
    /* v1 JSONs require modification to the JSON data (i.e. conversion
    into a v2 JSON!). This requires us to read both (v1) JSONs
    into memory */
    const meta = await utils.readFilePromise(info.address.meta);
    const tree = await utils.readFilePromise(info.address.tree);
    const v2Json = convertFromV1({tree, meta});
    return res.json(v2Json);
  }
};

/**
 * Return a subset of `availableDatasetUrls` which we deem to be suitable
 * candidates to make a second tree.
 * The current logic is to include all datasets which
 * (a) contain the same first "part" of the URL -- interpreted here to represent the same pathogen
 * (b) have the same number of "parts" in the URL
 * (c) differ from the `currentDatasetUrl` by only 1 part
 * Note: the "parts" of the URL are formed by splitting it on `"/"`
 */
const findAvailableSecondTreeOptions = (currentDatasetUrl, availableDatasetUrls) => {
  const currentDatasetUrlArr = currentDatasetUrl.split('/');

  const availableTangleTreeOptions = availableDatasetUrls.filter((datasetUrl) => {
    const datasetUrlArr = datasetUrl.split('/');
    // Do not return the same dataset
    if (currentDatasetUrl === datasetUrl) return null;

    // Do not return dataset if the URLs have different number of parameters
    if (currentDatasetUrlArr.length !== datasetUrlArr.length) return null;

    // Do not return dataset if different pathogens
    if (currentDatasetUrlArr[0] !== datasetUrlArr[0]) return null;

    // Find differences between the two dataset URLs
    const urlDifferences = currentDatasetUrlArr.filter((param, index) => {
      if (datasetUrlArr[index] !== param) {
        return param;
      }
      return null;
    });

    // Do not return dataset if more than one parameter is different
    if (urlDifferences.length > 1) return null;

    return datasetUrl;
  });

  return availableTangleTreeOptions;
};

module.exports = {
  interpretRequest,
  redirectIfDatapathMatchFound,
  makeFetchAddresses,
  handleError,
  sendJson,
  findAvailableSecondTreeOptions
};
