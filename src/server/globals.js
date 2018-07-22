/* eslint no-console: off */
const path = require("path");
const fetch = require('node-fetch');
const fs = require('fs');
const manifestHelpers = require("./manifestHelpers");


/* We need to get lists of files available...
Option 1: crawl the directories (S3? local?)
Option 2: fetch pre-generated files
For option 2, we'd have to periodically update this... or have a API trigger
*/

const buildLocalManifest = () => {
  /* currently only for version 1.0 JSONs... */
  fs.readdir(global.LOCAL_DATA_PATH, (err, files) => {
    if (err) {
      console.log("ERROR. Failed to build local manifest.", err);
      return;
    }
    const manifest = files
      .filter((file) => file.endsWith("_tree.json"))
      .map((file) => file.replace("_tree.json", "").split("_"));
    global.LOCAL_MANIFEST = manifest;
    console.log("Successfully created local manifest");
  });
};

const buildLiveManifest = () => {
  fetch(global.REMOTE_DATA_LIVE_BASEURL + "manifest_guest.json")
    .then((result) => result.json())
    .then((json) => {
      const manifest = manifestHelpers.oldToNew(json);
      global.LIVE_MANIFEST = manifest;
      console.log("Successfully created live manifest");
    })
    .catch((err) => {
      console.log("ERROR. Failed to build live manifest.");
    });
};

const setGlobals = ({localData=false} = {}) => {
  global.LOCAL_DATA = localData;
  global.LOCAL_DATA_PATH = path.resolve(__dirname, "..", "..", "data/");
  global.REMOTE_DATA_LIVE_BASEURL = "http://data.nextstrain.org/";
  global.REMOTE_DATA_STAGING_BASEURL = "http://staging.nextstrain.org/";
  global.REMOTE_STATIC_BASEURL = "http://cdn.rawgit.com/nextstrain/static/master/";
  global.LIVE_MANIFEST = undefined;
  global.LOCAL_MANIFEST = undefined;
  buildLocalManifest();
  buildLiveManifest();
};

module.exports = {
  setGlobals,
  buildLiveManifest
};
