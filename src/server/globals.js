const path = require("path");

const setGlobals = ({localStatic=false, localData=false} = {}) => {
  global.LOCAL_DATA = localData;
  global.LOCAL_DATA_PATH = path.join(__dirname, "..", "..", "/data/");
  global.REMOTE_DATA_LIVE_BASEURL = "http://data.nextstrain.org/";
  global.REMOTE_DATA_STAGING_BASEURL = "http://staging.nextstrain.org/";
  global.LOCAL_STATIC = localStatic;
  global.LOCAL_STATIC_PATH = path.join(__dirname, "..", "..", "/static/");
  global.REMOTE_STATIC_BASEURL = "http://cdn.rawgit.com/nextstrain/nextstrain.org/master/";
};

module.exports = {
  setGlobals
};
