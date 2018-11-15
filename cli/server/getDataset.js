const utils = require("../utils");
const queryString = require("query-string");
const getAvailable = require("./getAvailable");
const path = require("path");


/* TO DO -- this is too complicated & can be simplified */
// const constructPathToGet = (availableDatasets, providedUrl, otherQueries) => {
//   /* the path / URL is case sensitive */
//   let auspiceURL = ""; // the URL to be displayed in Auspice
//   let fetchURL = global.LOCAL_DATA_PATH;
//   let secondTreeFetchURL;
//   let datasetFields; // this _does not_ take into account the 2nd tree
//   let treeName;

//   const urlParts = providedUrl
//     .replace(/^\//, '')
//     .replace(/\/$/, '')
//     .split("/");

//   /* does the URL specify two trees? */
//   let treeTwoName;
//   for (let i=0; i<urlParts.length; i++) {
//     if (urlParts[i].indexOf(":") !== -1) {
//       [treeName, treeTwoName] = urlParts[i].split(":");
//       urlParts[i] = treeName; // only use the first tree from now on
//       break;
//     }
//   }

//   /* Match urlParts against available datasets */
//   {
//     /* attempt 1: is there an exact match in the available datasets? */
//     const matchString = urlParts.join("/");
//     availableDatasets.forEach((n) => {
//       if (matchString === n.request) datasetFields = urlParts;
//     });

//     if (!datasetFields) {
//       /* attempt 2: is there a partial match in the available datasets? If so, use this to return the correct path */
//       let applicable = availableDatasets.map((d) => d.request.split("/"));
//       urlParts.forEach((field, idx) => {
//         applicable = applicable.filter((entry) => entry[idx] === field);
//         // console.log("after idx", idx, "(", field, "), num applicable:", applicable.length);
//       });
//       if (applicable.length) {
//         datasetFields = applicable[0];
//       }
//     }

//     if (!datasetFields) {
//       throw new Error("Didn't match available datasets");
//     }
//   }

//   if (!treeName) {
//     /* TO DO */
//     const guesses = ["HA", "NA", "PB1", "PB2", "PA", "NP", "NS", "MP", "L", "S"];
//     for (const part of datasetFields) {
//       if (guesses.indexOf(part.toUpperCase()) !== -1) {
//         treeName = part;
//       }
//     }
//   }
//   if (treeTwoName) {
//     const treeIdx = datasetFields.indexOf(treeName);
//     const fieldsTT = datasetFields.slice();
//     fieldsTT[treeIdx] = treeTwoName;
//     secondTreeFetchURL = fetchURL + "/" + fieldsTT.join("_") + ".json";

//     const fieldsAus = datasetFields.slice();
//     fieldsAus[treeIdx] = `${treeName}:${treeTwoName}`;
//     auspiceURL += fieldsAus.join("/");
//   } else {
//     auspiceURL += datasetFields.join("/");
//   }

//   fetchURL += `/${datasetFields.join("_")}`;
//   if (otherQueries.type) {
//     fetchURL += `_${otherQueries.type}`;
//   }
//   fetchURL += ".json";

//   return {auspiceURL, fetchURL, secondTreeFetchURL, datasetFields, treeName, treeTwoName};
// };


const setUpGetDatasetHandler = ({datasetsPath}) => {


  return async (req, res) => {
    const rawQuery = req.url.split('?')[1];
    utils.log(`Getting datasets for: ${rawQuery}`);
    const query = queryString.parse(rawQuery);
    const availableDatasets = await getAvailable.getAvailableDatasets(datasetsPath);
    /* There must be an exact match in the available datasets */
    const request = query.prefix
      .replace(/^\//, '')
      .replace(/\/$/, '');
    /* to do -- second tree */
    if (!availableDatasets.map((d) => d.request).includes(request)) {
      res.statusMessage = `${request} not in available datasets`;
      utils.warn(`${res.statusMessage}`);
      return res.status(500).end();
    }
    const filepath = path.join(datasetsPath, `${request.split("/").join("_")}.json`);
    console.log("GETTING", filepath);

    // if (query.type) {
    //   utils.verbose("fetching:" + paths.fetchURL);
    //   try {
    //     let data = await utils.readFilePromise(paths.fetchURL);
    //     if (query.type === "tree") {
    //       data = {tree: data};
    //     }
    //     return res.json(data);
    //   } catch (err) {
    //     res.statusMessage = `Couldn't fetch JSONs for ${paths.fetchURL}`;
    //     utils.warn(`${res.statusMessage} -- ${err.message}`);
    //     res.status(500).end();
    //   }
    // }

    const unifiedJson = {
      _source: "local",
      _url: request
    };
    const v1Paths = [
      filepath.replace(".json", "_meta.json"),
      filepath.replace(".json", "_tree.json")
    ];

    try {
      const v1Data = await Promise.all(v1Paths.map((p) => utils.readFilePromise(p)));
      unifiedJson.meta = v1Data[0];
      unifiedJson.tree = v1Data[1];
      // if (paths.secondTreeFetchURL) {
      //   unifiedJson.treeTwo = v1Data[2];
      // }
    } catch (err) {
      // if (paths.treeTwoName) {
      //   res.statusMessage = `Couldn't fetch JSONs for ${paths.fetchURL} and/or ${paths.secondTreeFetchURL}`;
      // } else {
      //   res.statusMessage = `Couldn't fetch JSONs for ${paths.fetchURL}`;
      // }
      res.statusMessage = `Couldn't fetch JSONs for ${filepath}`;
      utils.warn(`${res.statusMessage} -- ${err.message}`);
      return res.status(500).end();
    }

    utils.verbose("Success fetching v1 JSONs. Sending as a single JSON.");
    res.json(unifiedJson);

  };

};

// const getDataset = async (req, res) => {
//   const rawQuery = req.url.split('?')[1];
//   utils.log(`Getting datasets for: ${rawQuery}`);
//   const query = queryString.parse(rawQuery);
//   const availableDatasets = await getAvailable.getAvailableDatasets();

//   /* match the query against the available datasets */
//   let paths;
//   try {
//     paths = constructPathToGet(availableDatasets, query.prefix, query);
//   } catch (err) {
//     res.statusMessage = `Couldn't parse the url "${query.prefix}"`;
//     utils.warn(`${res.statusMessage} -- ${err}`);
//     return res.status(500).end();
//   }

//   if (query.type) {
//     utils.verbose("fetching:" + paths.fetchURL);
//     try {
//       let data = await utils.readFilePromise(paths.fetchURL);
//       if (query.type === "tree") {
//         data = {tree: data};
//       }
//       return res.json(data);
//     } catch (err) {
//       res.statusMessage = `Couldn't fetch JSONs for ${paths.fetchURL}`;
//       utils.warn(`${res.statusMessage} -- ${err.message}`);
//       res.status(500).end();
//     }
//   } else {
//     const unifiedJson = {
//       _available: availableDatasets,
//       _source: "local",
//       _treeName: paths.treeName,
//       _url: paths.auspiceURL,
//       _datasetFields: paths.datasetFields
//     };
//     if (paths.treeTwoName) {
//       unifiedJson._treeTwoName = paths.treeTwoName;
//     }

//     const v1Paths = [
//       paths.fetchURL.replace(".json", "_meta.json"),
//       paths.fetchURL.replace(".json", "_tree.json")
//     ];
//     if (paths.secondTreeFetchURL) {
//       v1Paths.push(paths.secondTreeFetchURL.replace(".json", "_tree.json"));
//     }

//     try {
//       const v1Data = await Promise.all(v1Paths.map((p) => utils.readFilePromise(p)));
//       unifiedJson.meta = v1Data[0];
//       unifiedJson.tree = v1Data[1];
//       if (paths.secondTreeFetchURL) {
//         unifiedJson.treeTwo = v1Data[2];
//       }
//     } catch (err) {
//       if (paths.treeTwoName) {
//         res.statusMessage = `Couldn't fetch JSONs for ${paths.fetchURL} and/or ${paths.secondTreeFetchURL}`;
//       } else {
//         res.statusMessage = `Couldn't fetch JSONs for ${paths.fetchURL}`;
//       }
//       utils.warn(`${res.statusMessage} -- ${err.message}`);
//       return res.status(500).end();
//     }

//     utils.verbose("Success fetching v1 JSONs. Sending as a single JSON.");
//     res.json(unifiedJson);
//   }
// };

module.exports = {
  setUpGetDatasetHandler
};
