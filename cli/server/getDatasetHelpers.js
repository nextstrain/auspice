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
const getAvailable = require("./getAvailable");
const path = require("path");
const convertFromV1 = require("./convertJsonSchemas").convertFromV1;


const handleError = (res, clientMsg, serverMsg="") => {
  res.statusMessage = clientMsg;
  utils.warn(`${clientMsg} -- ${serverMsg}`);
  return res.status(500).end();
};


const guessTreeName = (prefixParts) => {
  const guesses = ["HA", "NA", "PB1", "PB2", "PA", "NP", "NS", "MP", "L", "S", "SEGMENT1", "SEGMENT2", "SEGMENT3", "SEGMENT4", "SEGMENT5", "SEGMENT6", "SEGMENT7", "SEGMENT8", "SEGMENT9", "SEGMENT10"];
  for (const part of prefixParts) {
    if (guesses.indexOf(part.toUpperCase()) !== -1) return part;
  }
  return undefined;
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
 * Given a request, does the dataset exist?
 * In the future, if there is no exact match but a partial one we
 * should extend this. E.g. `["flu"]` -> `["flu", "h3n2", "ha", "3y"]`
 * In that case, we should utilise `res.redirect` as we do in the nextstrain.org server
 * @throws
 */
const extendDataPathsToMatchAvailiable = (info, availableDatasets) => {
  const requestStrToMatch = info.parts.join("/"); // TO DO
  /* TODO currently there must be an _exact_ match in the available datasets */
  if (!availableDatasets.map((d) => d.request).includes(requestStrToMatch)) {
    throw new Error(`${requestStrToMatch} not in available datasets`);
  }
  /* what we want to do is modify `info.parts` to match the available dataset, if possible */
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
      info.address
    }
  }
};

const sendJson = async (res, info) => {
  if (typeof info.address === "string") {
    const jsonData = await utils.readFilePromise(info.address);
    return res.json(jsonData);
  } else {
    const meta = await utils.readFilePromise(info.address.meta);
    const tree = await utils.readFilePromise(info.address.tree);
    /* v1 JSONs don't define a tree name, so we try to guess it here */
    const mainTreeName = guessTreeName(info.parts);
    const v2Json = convertFromV1({tree, meta, treeName: mainTreeName});
    return res.json(v2Json)
  }
}

module.exports = {
  interpretRequest,
  extendDataPathsToMatchAvailiable,
  makeFetchAddresses,
  handleError,
  sendJson
};
