const utils = require("../utils");
const queryString = require("query-string");
const getAvailable = require("./getAvailable");
const path = require("path");
const convertJsons = require("./convertJsonSchemas").convert;
/*
* Note that a lot of this code is replicated in the nextstrain.org repo
* and it could instead be exposed by "auspice" (and imported by the nextstrain.org repo)
* Note also https://github.com/nextstrain/auspice/issues/687 which proposes
* changing the server-client API
*/

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

const parseClientUrl = (clientUrl, otherQueries) => {
  let auspiceDisplayUrl = "";
  const fetchSuffixes = {};
  let treeName;
  const prefixParts = splitPrefixIntoParts(clientUrl);

  /* does the URL specify two trees? */
  let secondTreeName;
  for (let i=0; i<prefixParts.length; i++) {
    if (prefixParts[i].indexOf(":") !== -1) {
      [treeName, secondTreeName] = prefixParts[i].split(":");
      prefixParts[i] = treeName; // only use the first tree from now on
      break;
    }
  }
  if (!secondTreeName && otherQueries.deprecatedSecondTree) {
    secondTreeName = otherQueries.deprecatedSecondTree;
  }
  if (!treeName) {
    utils.verbose("Guessing tree name -- this should be improved");
    treeName = guessTreeName(prefixParts);
  }
  auspiceDisplayUrl += prefixParts.join("/");

  if (secondTreeName) {
    const idxOfTree = prefixParts.indexOf(treeName);
    const secondTreePrefixParts = prefixParts.slice();
    secondTreePrefixParts[idxOfTree] = secondTreeName;

    fetchSuffixes.secondTree = `${secondTreePrefixParts.join("_")}_tree.json`;
    const re = new RegExp(`\\/${treeName}(/|$)`); // note the double escape for special char
    auspiceDisplayUrl = auspiceDisplayUrl.replace(re, `/${treeName}:${secondTreeName}/`);
  }
  auspiceDisplayUrl = auspiceDisplayUrl.replace(/\/$/, ''); // remove any trailing slash

  fetchSuffixes.tree = `${prefixParts.join("_")}_tree.json`;
  fetchSuffixes.meta = `${prefixParts.join("_")}_meta.json`;

  const prefixToMatch = prefixParts.join("/");

  if (otherQueries.type) {
    fetchSuffixes.additional = `${prefixParts.join("_")}_${otherQueries.type}.json`;
  }

  return ({fetchSuffixes, prefixToMatch, auspiceDisplayUrl, treeName, secondTreeName});
};

const setUpGetDatasetHandler = ({datasetsPath}) => {

  return async (req, res) => {
    const rawQuery = req.url.split('?')[1];
    utils.log(`Getting datasets for: ${rawQuery}`);
    const query = queryString.parse(rawQuery);
    const availableDatasets = await getAvailable.getAvailableDatasets(datasetsPath);

    let datasetInfo;
    try {
      datasetInfo = parseClientUrl(query.prefix, query);
    } catch (err) {
      return handleError(res, `Couldn't parse the url "${query.prefix}"`, err.message);
    }

    /* there must be an exact match in the available datasets */
    if (!availableDatasets.map((d) => d.request).includes(datasetInfo.prefixToMatch)) {
      return handleError(res, `${datasetInfo.prefixToMatch} not in available datasets`);
    }

    /* Are we requesting a certain file type? */
    if (datasetInfo.fetchSuffixes.additional) {
      try {
        const jsonData = await utils.readFilePromise(path.join(datasetsPath, datasetInfo.fetchSuffixes.additional));
        utils.verbose(`Success fetching ${datasetInfo.fetchSuffixes.additional} JSON.`);
        if (query.type === "tree") {
          return res.json({tree: jsonData});
        }
        return res.json(jsonData);
      } catch (err) {
        return handleError(res, `Couldn't fetch JSON: ${datasetInfo.fetchSuffixes.additional}`, err.message);
      }
    }

    /* else combine the meta & tree(s) */
    let unifiedJson;
    try {
      const tree = await utils.readFilePromise(path.join(datasetsPath, datasetInfo.fetchSuffixes.tree));
      const meta = await utils.readFilePromise(path.join(datasetsPath, datasetInfo.fetchSuffixes.meta));
      unifiedJson = convertJsons({tree, meta, treeName: datasetInfo.treeName, displayUrl: datasetInfo.auspiceDisplayUrl});
      if (datasetInfo.fetchSuffixes.secondTree) {
        throw new Error("Second tree not supported in this fashion");
        // unifiedJson.treeTwo = await utils.readFilePromise(path.join(datasetsPath, datasetInfo.fetchSuffixes.secondTree));
        // unifiedJson._treeTwoName = datasetInfo.secondTreeName;
      }
    } catch (err) {
      return handleError(res, `Couldn't fetch JSONs`, err.message);
    }

    utils.verbose("Success fetching v1 JSONs. Sending as a single JSON.");
    res.json(unifiedJson);
  };
};

module.exports = {
  setUpGetDatasetHandler
};
