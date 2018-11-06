const path = require("path");
const fs = require('fs');
const manifestHelpers = require("./manifestHelpers");

const isNpmGlobalInstall = () => {
  return __dirname.indexOf("lib/node_modules/auspice") !== -1;
};

const cleanUpPathname = (pathIn) => {
  let pathOut = pathIn;
  if (!pathOut.endsWith("/")) pathOut += "/";
  if (pathOut.startsWith("~")) {
    pathOut = path.join(process.env.HOME, pathOut.slice(1));
  }
  pathOut = path.resolve(pathOut);
  if (!fs.existsSync(pathOut)) {
    return undefined;
  }
  return pathOut;
};

const getCurrentDirectoriesFor = (type) => {
  const cwd = process.cwd();
  const folderName = type === "data" ? "auspice" : "narratives";
  if (fs.existsSync(path.join(cwd, folderName))) {
    return cleanUpPathname(path.join(cwd, folderName));
  }
  return cleanUpPathname(cwd);
};


const getLocalDataPath = (args) => {
  let localPath;
  if (args.data) {
    localPath = cleanUpPathname(args.data);
  } else if (isNpmGlobalInstall()) {
    localPath = getCurrentDirectoriesFor("data");
  }
  return localPath;
};

const getLocalNarrativesPath = (args) => {
  let localPath;
  if (args.narratives) {
    localPath = cleanUpPathname(args.narratives);
  } else if (isNpmGlobalInstall()) {
    localPath = getCurrentDirectoriesFor("narratives");
  }
  return localPath;
};

const setGlobals = (args) => {
  global.LOCAL_DATA_PATH = getLocalDataPath(args) || path.resolve(__dirname, "..", "..", "data/");
  global.LOCAL_NARRATIVES_PATH = getLocalNarrativesPath(args) || path.resolve(__dirname, "..", "..", "local_narratives/");
  global.REMOTE_DATA_LIVE_BASEURL = "http://data.nextstrain.org";
  global.REMOTE_DATA_STAGING_BASEURL = "http://staging.nextstrain.org";
  global.REMOTE_NARRATIVES_BASEURL = "http://cdn.rawgit.com/nextstrain/narratives/master";
  global.LIVE_MANIFEST = undefined;
  global.LOCAL_MANIFEST = undefined;
  global.STAGING_MANIFEST = undefined;
  global.verbose = args.verbose;
  manifestHelpers.buildManifest("local");
  manifestHelpers.buildManifest("live");
  manifestHelpers.buildManifest("staging");
};

module.exports = {
  setGlobals,
  isNpmGlobalInstall
};
