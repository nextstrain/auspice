/* eslint no-console: off */
import fs from 'fs';
import _chalk from 'chalk';
// chalk 2.x types aren't compatible with nodenext module resolution
/* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
const chalk = _chalk as any as import('chalk').Chalk;
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const verbose = (msg): void => {
  if (global.AUSPICE_VERBOSE) {
    console.log(chalk.greenBright(`[verbose]\t${msg}`));
  }
};
export const log = (msg): void => {
  console.log(chalk.blueBright(msg));
};
export const warn = (msg): void => {
  console.warn(chalk.yellowBright(`[warning]\t${msg}`));
};
export const error = (msg): void => {
  console.error(chalk.redBright(`[error]\t${msg}`));
  process.exit(2);
};

const isNpmGlobalInstall = (): boolean => {
  return __dirname.indexOf("lib/node_modules/auspice") !== -1;
};

export const cleanUpPathname = (pathIn) => {
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


export const defaultDataPaths = ({narrative=false} = {}) => {
  return isNpmGlobalInstall() ?
    [getCurrentDirectoriesFor(narrative ? "narratives" : "data")] :
    [path.join(path.resolve(__dirname), "..", narrative ? "narratives" : "data")];
}

export const readFilePromise = (fileName) => {
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
export const exportIndexDotHtml = ({relative=false}): void => {
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
