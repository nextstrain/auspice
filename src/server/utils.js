/* eslint no-console: off */
const fetch = require('node-fetch');
const fs = require('fs');
const chalk = require('chalk');
const path = require("path");

const verbose = (msg) => {
  if (global.verbose) {
    console.log(chalk.greenBright(`[verbose]\t${msg}`));
  }
};
const log = (msg) => {
  console.log(chalk.blueBright(msg));
};
const warn = (msg) => {
  console.warn(chalk.redBright(`[warning]\t${msg}`));
};

const fetchJSON = (pathIn) => {
  const p = fetch(pathIn)
    .then((res) => {
      if (res.status !== 200) throw new Error(res.statusText);
      try {
	const header = res.headers[Object.getOwnPropertySymbols(res.headers)[0]] || res.headers._headers;
	verbose(`Got type ${header["content-type"]} with encoding ${header["content-encoding"] || "none"}`);
      } catch (e) {
	// potential errors here are inconsequential for the response
      }
      return res;
    })
    .then((res) => res.json());
  return p;
};

const readFilePromise = (fileName) => {
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, 'utf8', (err, data) => {
      if (err) {
	return reject(err);
      }
      try {
	return resolve(JSON.parse(data));
      } catch (parseErr) {
	return reject(parseErr);
      }
    });
  });
};

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

module.exports = {
  readFilePromise,
  fetchJSON,
  verbose,
  log,
  warn,
  getLocalDataPath,
  getLocalNarrativesPath,
  isNpmGlobalInstall
};
