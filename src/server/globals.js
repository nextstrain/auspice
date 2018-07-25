/* eslint no-console: off */
const path = require("path");
const fs = require('fs');
const manifestHelpers = require("./manifestHelpers");

const setGlobals = (argv) => {
  /* do we have a custom local data directory? */
  global.LOCAL_DATA_PATH = path.resolve(__dirname, "..", "..", "data/"); /* default */
  const customLocalDir = argv.filter((x) => x.startsWith("local"));
  if (customLocalDir.length === 1 && customLocalDir[0].indexOf(":") !== -1) {
    let ldp = customLocalDir[0].split(":")[1];
    if (!ldp.endsWith("/")) ldp += "/";
    ldp = path.resolve(ldp);
    if (!fs.existsSync(ldp)) {
      console.log(`ERROR -- local directory ${ldp} wasn't found. Falling back to default.`);
    } else {
      global.LOCAL_DATA_PATH = ldp;
    }
  }

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
