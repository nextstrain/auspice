/* eslint no-console: off */
const path = require("path");
const fs = require('fs');
const manifestHelpers = require("./manifestHelpers");

const setGlobals = (argv) => {
  /* do we have a custom local data(sets) directory? */
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
  /* do we have a custom local narratives directory? */
  global.LOCAL_NARRATIVES_PATH = path.resolve(__dirname, "..", "..", "local_narratives/"); /* default */
  const customLocalNarrativesDir = argv.filter((x) => x.startsWith("narratives"));
  if (customLocalNarrativesDir.length === 1 && customLocalNarrativesDir[0].indexOf(":") !== -1) {
    let ldp = customLocalNarrativesDir[0].split(":")[1];
    if (!ldp.endsWith("/")) ldp += "/";
    ldp = path.resolve(ldp);
    if (!fs.existsSync(ldp)) {
      console.log(`ERROR -- local narratives directory ${ldp} wasn't found. Falling back to default.`);
    } else {
      global.LOCAL_NARRATIVES_PATH = ldp;
    }
  }

  global.REMOTE_DATA_LIVE_BASEURL = "http://data.nextstrain.org";
  global.REMOTE_DATA_STAGING_BASEURL = "http://staging.nextstrain.org";
  global.REMOTE_NARRATIVES_BASEURL = "http://cdn.rawgit.com/nextstrain/narratives/master";
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
