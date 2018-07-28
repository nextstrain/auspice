/* eslint no-console: off */
const queryString = require("query-string");
const narratives = require('./narratives');
const sourceSelect = require("./sourceSelect");
const manifestHelpers = require("./manifestHelpers");
const fetchV1JSONs = require("./fetchV1JSONs");
const promises = require("./promises");


const applyCharonToApp = (app) => {
  app.get('/charon*', (req, res) => {
    const query = queryString.parse(req.url.split('?')[1]);
    console.log("Charon API request: " + req.originalUrl);
    if (Object.keys(query).indexOf("request") === -1) {
      res.statusMessage = "Query rejected (nothing requested) -- " + req.originalUrl;
      console.warn(res.statusMessage);
      return res.status(500).end();
    }
    switch (query.request) {
      case "narrative": {
        const source = sourceSelect.getSource(query.url);
        narratives.serveNarrative(source, query.url, res);
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
          paths = sourceSelect.constructPathToGet(source, query.url, query);
        } catch (err) {
          res.statusMessage = `Couldn't parse the url "${query.url}" for source "${source}"`;
          console.warn(res.statusMessage, err);
          return res.status(500).end();
        }

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
          if (paths.treeTwoName) {
            res.statusMessage = `Couldn't fetch JSONs for ${paths.fetchURL} and/or ${paths.secondTreeFetchURL}`;
          } else {
            res.statusMessage = `Couldn't fetch JSONs for ${paths.fetchURL}`;
          }
          console.warn(res.statusMessage, err.message);
          return res.status(500).end();
        };

        /* replace the following fetch with the commented out code once auspice can handle v2.0 JSONs */
        fetchV1JSONs.fetchTreeAndMetaJSONs(res, source, paths.fetchURL, paths.secondTreeFetchURL, toInject, errorHandler);
        /* This block is deliberately commented out. Once auspice can process v2.0 JSONs,
        this block should be re-added. Right now a "valid" 2.0 schema will actually crash auspice. */
        // const p = source === "local" ? promises.readFilePromise : promises.fetchJSON;
        // const pArr = [p(paths.fetchURL)];
        // if (paths.secondTreeFetchURL) {
        //   pArr.push(p(paths.secondTreeFetchURL));
        // }
        // Promise.all(pArr)
        //   .then((jsons) => {
        //     const json = jsons[0]; // first is always the main JSON
        //     for (const field in toInject) { // eslint-disable-line
        //       json[field] = toInject[field];
        //     }
        //     if (paths.secondTreeFetchURL) {
        //       json.treeTwo = jsons[1].tree;
        //     }
        //     res.json(json);
        //   })
        //   .catch(() => {
        //     console.log("\tFailed to fetch unified JSON for", paths.fetchURL, "trying for v1...");
        //     fetchV1JSONs.fetchTreeAndMetaJSONs(res, source, paths.fetchURL, paths.secondTreeFetchURL, toInject, errorHandler);
        //   });
        break;
      } case "additionalJSON": {
        const promise = query.source === "local" ? promises.readFilePromise : promises.fetchJSON;
        let url = query.url;
        if (query.source !== "live") {
          /* this might need to be turned into a function // constructPathToGet improved */
          url = query.source + "/" + url;
        }
        const paths = sourceSelect.constructPathToGet(query.source, url, {});
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
          res.statusMessage = `Server doesn't have the available datasets for source "${source}""`;
          res.status(500).end();
        }
        break;
      } default: {
        res.statusMessage = `Server doesn't know how to handle the request "${req.originalURL}"`;
        console.warn(res.statusMessage);
        return res.status(500).end();
      }
    }
  });
};


module.exports = {
  applyCharonToApp
};
