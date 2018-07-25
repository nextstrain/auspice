/* eslint no-console: off */
const path = require("path");
const manifestHelpers = require("./manifestHelpers");

const setGlobals = ({localData=false} = {}) => {
  global.LOCAL_DATA = localData;
  global.LOCAL_DATA_PATH = path.resolve(__dirname, "..", "..", "data/");
  global.REMOTE_DATA_LIVE_BASEURL = "http://data.nextstrain.org";
  global.REMOTE_DATA_STAGING_BASEURL = "http://staging.nextstrain.org";
  global.REMOTE_STATIC_BASEURL = "http://cdn.rawgit.com/nextstrain/static/master";
  global.LIVE_MANIFEST = undefined;
  global.LOCAL_MANIFEST = undefined;
  global.STAGING_MANIFEST = undefined;
  manifestHelpers.buildManifest("local");
  manifestHelpers.buildManifest("live");
  manifestHelpers.buildManifest("staging");
};

module.exports = {
  setGlobals
};
