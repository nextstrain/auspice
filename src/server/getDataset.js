const utils = require("./utils");
const chalk = require('chalk');
const queryString = require("query-string");
const sourceSelect = require("./sourceSelect");
const getAvailable = require("./getAvailable");

/* fetch JSONS from schema v1 (i.e. separate meta & tree jsons) */
const fetchTreeAndMetaJSONs = (serverRes, source, path, pathTreeTwo, toInject, errorHandler) => {
  const paths = [
    path.replace(".json", "_meta.json"),
    path.replace(".json", "_tree.json")
  ];
  if (pathTreeTwo) paths.push(pathTreeTwo.replace(".json", "_tree.json"));
  const promise = source === "local" ? utils.readFilePromise : utils.fetchJSON;

  Promise.all(paths.map((p) => promise(p)))
    .then((jsons) => {
      const json = {
	meta: jsons[0],
	tree: jsons[1]
      };
      if (jsons.length === 3) json.treeTwo = jsons[2];
      for (const field in toInject) { // eslint-disable-line
	json[field] = toInject[field];
      }
      utils.verbose("Success fetching v1 JSONs. Sending as a single JSON.");
      serverRes.json(json);
    })
    .catch(errorHandler);
};

/* Function to fetch unified JSON (meta+tree combined), and fallback to v1 jsons if this isn't found */
/* Currently not implemented as we don't have any v2 JSONs, but we will... */
// const fetchUnifiedJSON = (serverRes, source, path, pathTreeTwo, toInject, errorHandler) => {
//   const p = source === "local" ? utils.readFilePromise : utils.fetchJSON;
//   const pArr = [p(paths.fetchURL)];
//   if (paths.secondTreeFetchURL) {
//     pArr.push(p(paths.secondTreeFetchURL));
//   }
//   Promise.all(pArr)
//     .then((jsons) => {
//       const json = jsons[0]; // first is always the main JSON
//       for (const field in toInject) { // eslint-disable-line
//         json[field] = toInject[field];
//       }
//       if (paths.secondTreeFetchURL) {
//         json.treeTwo = jsons[1].tree;
//       }
//       res.json(json);
//     })
//     .catch(() => {
//       console.log("\tFailed to fetch unified JSON for", paths.fetchURL, "trying for v1...");
//       fetchV1JSONs.fetchTreeAndMetaJSONs(res, source, paths.fetchURL, paths.secondTreeFetchURL, toInject, errorHandler);
//     });
// }

const getDataset = (req, res) => {
  const query = queryString.parse(req.url.split('?')[1]);
  const source = sourceSelect.getSource(query.prefix);
  let paths;
  utils.log(`Getting datasets for: ${req.url.split('?')[1]}`);
  try {
    paths = sourceSelect.constructPathToGet(source, query.prefix, query);
  } catch (err) {
    res.statusMessage = `Couldn't parse the url "${query.prefix}" for source "${source}"`;
    console.warn(chalk.red.bold("\t", res.statusMessage, "--", err));
    return res.status(500).end();
  }

  if (query.type) {
    utils.verbose("fetching:" + paths.fetchURL);
    const promise = source === "local" ? utils.readFilePromise : utils.fetchJSON;
    promise(paths.fetchURL)
      .then((json) => {
	if (query.type === "tree") {
	  return res.json({tree: json});
	}
	return res.json(json);
      })
      .catch((err) => {
	res.statusMessage = `Couldn't fetch JSONs for ${paths.fetchURL}`;
	utils.warn(`${res.statusMessage} -- ${err.message}`);
	res.status(500).end();
      });
    return undefined;
  }


  const datasets = getAvailable.collectDatasets(source);

  /* what fields should be added to the JSON */
  const toInject = {
    _available: datasets.available,
    _source: source,
    _treeName: paths.treeName,
    _url: paths.auspiceURL,
    _datasetFields: paths.datasetFields
  };
  if (paths.treeTwoName) {
    toInject._treeTwoName = paths.treeTwoName;
  }

  const errorHandler = (err) => {
    if (paths.treeTwoName) {
      res.statusMessage = `Couldn't fetch JSONs for ${paths.fetchURL} and/or ${paths.secondTreeFetchURL}`;
    } else {
      res.statusMessage = `Couldn't fetch JSONs for ${paths.fetchURL}`;
    }
    utils.warn(`${res.statusMessage} -- ${err.message}`);
    return res.status(500).end();
  };

  fetchTreeAndMetaJSONs(res, source, paths.fetchURL, paths.secondTreeFetchURL, toInject, errorHandler);
  return undefined;
};

module.exports = {
  getDataset,
  default: getDataset
};
