/*
* basically just the functions which will be improved when we move to the new server API
*
* Note that a lot of this code is replicated in the nextstrain.org repo
* and it could instead be exposed by "auspice" (and imported by the nextstrain.org repo)
* Note also https://github.com/nextstrain/auspice/issues/687 which proposes
* changing the server-client API
*/

const utils = require("../utils");
const queryString = require("query-string");
const getAvailable = require("./getAvailable");
const path = require("path");
const convertJsons = require("./convertJsonSchemas").convert;


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
 * given a "split" query (i.e. the "parts") -- check if 2 trees
 * are defined, e.g. `ha:na`. If so, then modify the split query
 * to only include the first (`ha`) and return the string of
 * the second `na`. Return `false` if no 2nd tree detected.
 */
const checkForSecondTree = (datanameParts, query) => {
  let secondTreeName = false;
  let treeName;
  for (let i=0; i<datanameParts.length; i++) {
    if (datanameParts[i].indexOf(":") !== -1) {
      [treeName, secondTreeName] = datanameParts[i].split(":");
      datanameParts[i] = treeName; // only use the first tree from now on
      break;
    }
  }
  if (!secondTreeName && query.deprecatedSecondTree) {
    secondTreeName = query.deprecatedSecondTree;
  }
  return [treeName, secondTreeName];
};

/* can throw */
const interpretRequest = (req) => {
  utils.log(`GET DATASET query received: ${req.url.split('?')[1]}`);
  const query = queryString.parse(req.url.split('?')[1]);
  if (!query.prefix) throw new Error("'prefix' not defined in request");
  const datanameParts = splitPrefixIntoParts(query.prefix);
  const [mainTreeName, secondTreeName] = checkForSecondTree(datanameParts, query);
  if (secondTreeName) {
    console.log("2nd tree NAME", secondTreeName);
    utils.warn("THE SECOND TREE WILL BE IGNORED -- TO DO");
  }
  const info = {parts: datanameParts, mainTreeName, secondTreeName};
  if (query.type) {
    info.dataType = query.type;
  } else {
    info.dataType = "dataset";
  }

  return info;
};

/* can throw */
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
 * if array then it's v1 [meta, tree] & we need to convert...
 * can throw
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
    /* TO DO we should guess the tree name here (only v1) */
    const v2Json = convertJsons({tree, meta, treeName: "treeNameToDo"});
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
