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
        let pathname, idealUrl, datasetFields;
        const source = sourceSelect.getSource(query.url);
        try {
          [idealUrl, datasetFields, pathname] = sourceSelect.constructPathToGet(source, query.url, undefined);
        } catch (e) {
          console.error("Problem parsing the query (didn't attempt to fetch)\n", e.message);
          res.status(500).send('FETCHING ERROR'); // Perhaps handle more globally...
          break;
        }
        console.log(`\tpathname ${pathname}`);
        const datasets = sourceSelect.collectDatasets(source);

        const toInject = {
          _available: datasets.available,
          _source: source,
          _treeName: sourceSelect.guessTreeName(idealUrl.split("/")),
          _url: idealUrl,
          _datasetFields: datasetFields
        };

        const errorHandler = (err) => {
          console.log(`ERROR. ${pathname} --> ${err.type}`);
          console.log("\t", err.message);
          res.status(500).send('FETCHING ERROR'); // Perhaps handle more globally...
        };

        /* first attempt is to load the "unified" JSON */
        const promise = source === "local" ? promises.readFilePromise : promises.fetchJSON;
        promise(pathname)
          .then((json) => {
            for (const field in toInject) { // eslint-disable-line
              json[field] = toInject[field];
            }
            res.json(json);
          })
          .catch(() => {
            console.log("\tFailed to fetch unified JSON for", pathname, "trying for v1...");
            fetchV1JSONs.fetchTreeAndMetaJSONs(res, source, pathname, toInject, errorHandler);
          });
        break;
      } case "additionalJSON": {
        const promise = query.source === "local" ? promises.readFilePromise : promises.fetchJSON;
        let url = query.url;
        if (query.source !== "live") {
          /* this might need to be turned into a function // constructPathToGet improved */
          url = query.source + "/" + url;
        }
        let [idealUrl, datasetFields, pathname] = sourceSelect.constructPathToGet(query.source, url, undefined);
        pathname = pathname.replace(".json", "_"+query.type+".json");

        promise(pathname)
          .then((json) => {
            res.json(json);
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
