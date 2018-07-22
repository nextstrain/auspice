/* eslint no-console: off */
const queryString = require("query-string");
const getFiles = require('./getFiles');
const globals = require("./globals");
const serverNarratives = require('./narratives');
const path = require("path");
const fs = require('fs');
const fetch = require('node-fetch');
const manifestHelpers = require("./manifestHelpers");


const readFilePromise = (fileName) => {
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, 'utf8', (err, data) => {
      err ? reject(err) : resolve(data);
    });
  });
};

const constructPathToGet = (url, jsonTypeWanted) => {
  const parts = url.replace(/^\//, '').replace(/\/$/, '').split("/");
  const lowerParts = parts.map((p) => p.toLowerCase());
  const ret = {local: false};
  if (lowerParts[0] === "local") {
    ret.local = true;
    ret.path = path.join(global.LOCAL_DATA_PATH, manifestHelpers.checkFieldsAgainstManifest(lowerParts.slice(1), ret.local));
  } else if (lowerParts[0] === "community") {
    if (parts.length < 3) {
      throw new Error("Community URLs must be of format community/githubOrgName/repoName/...");
    }
    ret.path = `https://rawgit.com/${parts[1]}/${parts[2]}/master/auspice/${manifestHelpers.checkFieldsAgainstManifest(lowerParts.slice(2), ret.local)}`;
  } else if (lowerParts[0] === "staging") {
    ret.path = global.REMOTE_DATA_STAGING_BASEURL + manifestHelpers.checkFieldsAgainstManifest(lowerParts.slice(1), ret.local);
  } else {
    /* default is via global.REMOTE_DATA_LIVE_BASEURL (for nextstrain.org, this is the data.nextstrain S3 bucket) */
    ret.path = global.REMOTE_DATA_LIVE_BASEURL + manifestHelpers.checkFieldsAgainstManifest(lowerParts, ret.local);
  }

  if (jsonTypeWanted) {
    ret.path += "_" + jsonTypeWanted;
  }
  ret.path += ".json";
  return ret;
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
        let pathData;
        try {
          pathData = constructPathToGet(query.want, query.type);
        } catch (e) {
          console.error("Problem parsing the query (didn't attempt to fetch)\n", e.message);
          res.status(500).send('FETCHING ERROR'); // Perhaps handle more globally...
          break;
        }

        const promise = pathData.local ? readFilePromise : fetch;

        promise(pathData.path)
          .then((result) => {
            return typeof result === "string" ? JSON.parse(result) : result.json();
          })
          .then((json) => {
            console.log("successful json decoding on server. Sending", pathData.path);
            res.json(json);
          })
          .catch((err) => {
            console.log(`ERROR. ${pathData.path} --> ${err.type}`);
            console.log("\t", err.message);
            res.status(500).send('FETCHING ERROR'); // Perhaps handle more globally...
          });

        break;
      } case "available": {
        if (query.source === "local") res.json(global.LOCAL_MANIFEST);
        else if (query.source === "/") res.json(global.LIVE_MANIFEST);
        else {
          console.log("AVAILABLE ERROR");
          res.status(500).send('AVAILABLE ERROR');
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
