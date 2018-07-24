/* eslint no-console: off */
const queryString = require("query-string");
const serverNarratives = require('./narratives');
const sourceSelect = require("./sourceSelect");
const manifestHelpers = require("./manifestHelpers");
const fetchV1JSONs = require("./fetchV1JSONs");
const promises = require("./promises");


const applyCharonToApp = (app) => {
  app.get('/charon*', (req, res) => {
    const query = queryString.parse(req.url.split('?')[1]);
    console.log("Charon API request: " + req.originalUrl);
    if (Object.keys(query).indexOf("request") === -1) {
      console.warn("Query rejected (nothing requested) -- " + req.originalUrl);
      return; // 404
    }
    switch (query.request) {
      case "narrative": {
        serverNarratives.serveNarrative(query, res);
        break;
      } case "rebuildManifest": {
        manifestHelpers.buildManifest("local");
        manifestHelpers.buildManifest("live");
        manifestHelpers.buildManifest("staging");
        break;
      } case "mainJSON": {
        const source = sourceSelect.getSource(query.url);
        let paths;
        try {
          paths = sourceSelect.constructPathToGet(source, query.url);
        } catch (e) {
          console.error("Problem parsing the URL (didn't attempt to fetch)\n", e.message);
          res.status(500).send('FETCHING ERROR'); // Perhaps handle more globally...
          break;
        }
        console.log(`\tfetches: ${paths.fetchURL} ${paths.secondTreeFetchURL}`);
        const datasets = sourceSelect.collectDatasets(source);

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
          console.log(`ERROR. ${paths.fetchURL} --> ${err.type}`);
          console.log("\t", err.message);
          res.status(500).send('FETCHING ERROR'); // Perhaps handle more globally...
        };
        console.log("constructPathToGet -->", paths);
        /* first attempt is to load the "unified" JSON */
        const p = source === "local" ? promises.readFilePromise : promises.fetchJSON;
        const pArr = [p(paths.fetchURL)];
        if (paths.secondTreeFetchURL) {
          pArr.push(p(paths.secondTreeFetchURL));
        }
        Promise.all(pArr)
          .then((jsons) => {
            const json = jsons[0]; // first is always the main JSON
            for (const field in toInject) { // eslint-disable-line
              json[field] = toInject[field];
            }
            if (paths.secondTreeFetchURL) {
              json.treeTwo = jsons[1].tree;
            }
            res.json(json);
          })
          .catch(() => {
            console.log("\tFailed to fetch unified JSON for", paths.fetchURL, "trying for v1...");
            fetchV1JSONs.fetchTreeAndMetaJSONs(res, source, paths.fetchURL, paths.secondTreeFetchURL, toInject, errorHandler);
          });
        break;
      } case "additionalJSON": {
        const promise = query.source === "local" ? promises.readFilePromise : promises.fetchJSON;
        let url = query.url;
        if (query.source !== "live") {
          /* this might need to be turned into a function // constructPathToGet improved */
          url = query.source + "/" + url;
        }
        const paths = sourceSelect.constructPathToGet(query.source, url, undefined);
        paths.fetchURL = paths.fetchURL.replace(".json", "_"+query.type+".json");

        promise(paths.fetchURL)
          .then((json) => {
            if (query.type === "tree") {
              return res.json({tree: json});
            }
            return res.json(json);
          })
          .catch(() => {
            console.log(`\tFailed to fetch ${query.type} JSON for ${url}`);
            res.status(500).send('FETCHING ERROR'); // Perhaps handle more globally...
          });
        break;
      } case "available": {
        const source = sourceSelect.getSource(query.url);
        const datasets = sourceSelect.collectDatasets(source);
        if (datasets) {
          res.json(datasets);
        } else {
          res.status(500).send(`ERROR: Couldn't send available datasets for source ${source}`);
        }
        break;
      } default: {
        console.warn("Query rejected (unknown) -- " + req.originalUrl);
        res.status(500).send('FETCHING ERROR'); // Perhaps handle more globally...
      }
    }
  });
};


module.exports = {
  applyCharonToApp
};
