const path = require("path");

const setGlobals = ({localData=false} = {}) => {
  global.LOCAL_DATA = localData;
  global.LOCAL_DATA_PATH = path.join(__dirname, "..", "..", "/data/");
  global.REMOTE_DATA_LIVE_BASEURL = "http://data.nextstrain.org/";
  global.REMOTE_DATA_STAGING_BASEURL = "http://staging.nextstrain.org/";
  global.REMOTE_STATIC_BASEURL = "http://cdn.rawgit.com/nextstrain/static/master/";
};

module.exports = {
  setGlobals
};
