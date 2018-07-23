/* eslint no-console: off */
const queryString = require("query-string");
const getFiles = require('./getFiles');
const globals = require("./globals");
const serverNarratives = require('./narratives');
const fs = require('fs');
const fetch = require('node-fetch');
const sourceSelect = require("./sourceSelect");

const readFilePromise = (fileName) => {
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, 'utf8', (err, data) => {
      err ? reject(err) : resolve(data);
    });
  });
};


const applyCharonToApp = (app) => {
  app.get('/charon*', (req, res) => {
    const query = queryString.parse(req.url.split('?')[1]);
    console.log("Charon API request: " + req.originalUrl);
    if (Object.keys(query).indexOf("request") === -1) {
      console.warn("Query rejected (nothing requested) -- " + req.originalUrl);
      return; // 404
    }
    switch (query.request) {
      case "manifest": {
        getFiles.getManifest(query, res);
        break;
      } case "narrative": {
        serverNarratives.serveNarrative(query, res);
        break;
      } case "rebuildManifest": {
        globals.buildLiveManifest();
        break;
      } case "json": {
        let pathname, idealUrl, datasetFields;
        const source = sourceSelect.getSource(query.want);
        try {
          [idealUrl, datasetFields, pathname] = sourceSelect.constructPathToGet(source, query.want, query.type);
        } catch (e) {
          console.error("Problem parsing the query (didn't attempt to fetch)\n", e.message);
          res.status(500).send('FETCHING ERROR'); // Perhaps handle more globally...
          break;
        }
        console.log("-------pathname", pathname);
        const promise = source === "local" ? readFilePromise : fetch;

        promise(pathname)
          .then((result) => {
            return typeof result === "string" ? JSON.parse(result) : result.json();
          })
          .then((json) => {
            if (query.type === "meta") {
              const datasets = sourceSelect.collectDatasets(source);
              json["_available"] = datasets.available;
              json["_source"] = source;
              json["_treeName"] = sourceSelect.guessTreeName(idealUrl.split("/"));
              json["_url"] = idealUrl;
              json["_datasetFields"] = datasetFields;
              console.log("injected fields:", json["_source"], json["_treeName"], json["_url"], json["_datasetFields"]);
            }
            res.json(json);
          })
          .catch((err) => {
            console.log(`ERROR. ${pathname} --> ${err.type}`);
            console.log("\t", err.message);
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
        console.warn("Query rejected (unknown want) -- " + req.originalUrl);
        res.status(500).send('FETCHING ERROR'); // Perhaps handle more globally...
      }
    }
  });
};


module.exports = {
  applyCharonToApp
};
