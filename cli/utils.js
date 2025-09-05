/* eslint no-console: off */
const fs = require('fs');
const chalk = require('chalk');
const path = require("path");

const verbose = (msg) => {
  if (global.AUSPICE_VERBOSE) {
    console.log(chalk.greenBright(`[verbose]\t${msg}`));
  }
};
const log = (msg) => {
  console.log(chalk.blueBright(msg));
};
const warn = (msg) => {
  console.warn(chalk.yellowBright(`[warning]\t${msg}`));
};
const error = (msg) => {
  console.error(chalk.redBright(`[error]\t${msg}`));
  process.exit(2);
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
    warn(`path ${pathOut} doesn't exist`)
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


const defaultDataPaths = ({narrative=false} = {}) => {
  return isNpmGlobalInstall() ?
    [getCurrentDirectoriesFor(narrative ? "narratives" : "data")] :
    [path.join(path.resolve(__dirname), "..", narrative ? "narratives" : "data")];
}

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

/* write an index.html file to the current working directory
 * Optionally set the hrefs for local files to relative links (needed for github pages)
 */
const exportIndexDotHtml = ({relative=false}) => {
  if (path.resolve(__dirname, "..") === process.cwd()) {
    warn("Cannot export index.html to the auspice source directory.");
    return;
  }
  const outputFilePath = path.join(process.cwd(), "index.html");
  let data = fs.readFileSync(path.join(process.cwd(), "dist/index.html"), {encoding: "utf8"});
  verbose(`Writing ${outputFilePath}`);
  if (relative) {
    data = data
      .replace(/\/favicon/g, "favicon")
      .replace(/\/dist\/auspice\.bundle\.([0-9a-f]{20})\.js/, "dist/auspice.bundle.$1.js");
  }
  fs.writeFileSync(outputFilePath, data);
};

module.exports = {
  verbose,
  log,
  warn,
  error,
  readFilePromise,
  exportIndexDotHtml,
  cleanUpPathname,
  defaultDataPaths
};
