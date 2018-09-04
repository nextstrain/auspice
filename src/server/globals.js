/* eslint no-console: off */
const path = require("path");
const fs = require('fs');
const manifestHelpers = require("./manifestHelpers");

const isNpmGlobalInstall = () => {
  return __dirname.indexOf("lib/node_modules/auspice") !== -1;
};

const processCmdLineArgs = (argv) => {
  const args = {};
  argv.filter((x) => x.indexOf(":") !== -1).forEach((argStr) => {
    const argPair = argStr.split(":");
    args[argPair[0]] = argPair[1];
  });
  return args;
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


const getLocalDataPath = (niceArgs) => {
  let localPath;
  if ("data" in niceArgs) {
    localPath = cleanUpPathname(niceArgs.data);
  } else if (isNpmGlobalInstall()) {
    localPath = getCurrentDirectoriesFor("data");
  }
  return localPath;
};

const getLocalNarrativesPath = (niceArgs) => {
  let localPath;
  if ("narratives" in niceArgs) {
    localPath = cleanUpPathname(niceArgs.narratives);
  } else if (isNpmGlobalInstall()) {
    localPath = getCurrentDirectoriesFor("narratives");
  }
  return localPath;
};

const setGlobals = (argv) => {
  const niceArgs = processCmdLineArgs(argv);
  global.LOCAL_DATA_PATH = getLocalDataPath(niceArgs) || path.resolve(__dirname, "..", "..", "data/");
  global.LOCAL_NARRATIVES_PATH = getLocalNarrativesPath(niceArgs) || path.resolve(__dirname, "..", "..", "local_narratives/");
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
