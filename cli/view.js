/* eslint no-console: off */
/* eslint global-require: off */

const path = require("path");
const fs = require("fs");
const express = require("express");
const expressStaticGzip = require("express-static-gzip");
const compression = require('compression');
const nakedRedirect = require('express-naked-redirect');
const utils = require("./utils");
const version = require('../src/version').version;
const chalk = require('chalk');
const SUPPRESS = require('argparse').Const.SUPPRESS;


const addParser = (parser) => {
  const description = `Launch a local server to view locally available datasets & narratives.
  The handlers for (auspice) client requests can be overridden here (see documentation for more details).
  If you want to serve a customised auspice client then you must have run "auspice build" in the same directory
  as you run "auspice view" from.
  `;
  const subparser = parser.addParser('view', {addHelp: true, description});
  subparser.addArgument('--verbose', {action: "storeTrue", help: "Print more verbose logging messages."});
  subparser.addArgument('--handlers', {action: "store", metavar: "JS", help: "Overwrite the provided server handlers for client requests. See documentation for more details."});
  addDatasetNarrativePathArgs(subparser)
  subparser.addArgument('--customBuildOnly', {action: "storeTrue", help: "Error if a custom build is not found."});
  /* there are some options which we deliberately do not document via `--help`. */
  subparser.addArgument('--gh-pages', {action: "store", help: SUPPRESS}); /* related to the "static-site-generation" or "github-pages" */
};

function addDatasetNarrativePathArgs(parser) {
  parser.addArgument('--datasetDir', {
    metavar: "PATH",
    help: "Directory where datasets (JSONs) are sourced. This cannot be used with <path> positional arg(s) or custom handlers."
  });
  parser.addArgument('--narrativeDir', {
    metavar: "PATH",
    help: "Directory where narratives (Markdown files) are sourced. This cannot be used with <path> positional arg(s) or custom handlers."
  });
  parser.addArgument('path', {action: "store", nargs: '*', help: "Directories where datasets and/or narratives are stored"});
}

const serveRelativeFilepaths = ({app, dir}) => {
  app.get("*.json", (req, res) => {
    const filePath = path.join(dir, req.originalUrl);
    utils.log(`${req.originalUrl} -> ${filePath}`);
    res.sendFile(filePath);
  });
  return `JSON requests will be served relative to ${dir}.`;
};

function customRouteHandlers(app, handlersPath) {
  utils.verbose(`Loading handlers from ${handlersPath}`);
  const customCode = require(handlersPath);
  app.get("/charon/getAvailable", customCode.getAvailable);
  app.get("/charon/getDataset", customCode.getDataset);
  app.get("/charon/getNarrative", customCode.getNarrative);
  return `Custom server handlers provided.`;
}

function defaultRouteHandlers({app, dataPaths}) {
  app.get("/charon/getAvailable", require("./server/getAvailable").setUpGetAvailableHandler(dataPaths));
  app.get("/charon/getDataset", require("./server/getDataset").setUpGetDatasetHandler(dataPaths));
  app.get("/charon/getNarrative", require("./server/getNarrative").setUpGetNarrativeHandler(dataPaths));
  const sep = "\n - "
  return 'Looking for datasets & narratives in the following paths,\n' +
    '(if there are multiple matches then the first one will be used)' + sep +
    Object.entries(dataPaths)
      .map(([p, dataTypes]) => `${p} (${Array.from(dataTypes).join(', ')})`)
      .join(sep);
}

const getAuspiceBuild = (customBuildOnly) => {
  const cwd = path.resolve(process.cwd());
  const sourceDir = path.resolve(__dirname, "..");

  // Default to current working directory.
  let baseDir = cwd;
  if (!hasAuspiceBuild(cwd)) {
    if (cwd === sourceDir || customBuildOnly) {
      utils.error(`Auspice build files not found under ${cwd}. Did you run \`auspice build\` in this directory?`);
      process.exit(1);
    }
    if (!hasAuspiceBuild(sourceDir)) {
      utils.error(`Auspice build files not found under ${cwd} or ${sourceDir}. Did you run \`auspice build\` in either directory?`);
      process.exit(1);
    }
    utils.log(`Auspice build files not found under ${cwd}. Using build files under ${sourceDir}.`)
    baseDir = sourceDir;
  }
  return {
    message: `Serving the Auspice build in ${baseDir} (version ${version}).`,
    baseDir,
    distDir: path.join(baseDir, "dist")
  };
};

function hasAuspiceBuild(directory) {
  return (
    fs.existsSync(path.join(directory, "dist")) &&
    fs.existsSync(path.join(directory, "dist/index.html")) &&
    fs.readdirSync(path.join(directory, "dist")).filter((fn) => fn.match(/^auspice\.main\.bundle\.[a-z0-9]+\.js$/)).length === 1
  )
}

const run = (args) => {
  const dataPaths = processPathArguments(args)

  /* Basic server set up */
  const app = express();
  app.set('port', process.env.PORT || 4000);
  app.set('host', process.env.HOST || "localhost");
  app.use(compression());
  app.use(nakedRedirect({reverse: true})); /* redirect www.name.org to name.org */

  const auspiceBuild = getAuspiceBuild(args.customBuildOnly);
  utils.verbose(`Serving favicon from  "${auspiceBuild.baseDir}"`);
  utils.verbose(`Serving index and built javascript from     "${auspiceBuild.distDir}"`);
  app.get("/favicon.png", (req, res) => {res.sendFile(path.join(auspiceBuild.baseDir, "favicon.png"));});
  app.use("/dist", expressStaticGzip(auspiceBuild.distDir, {
    maxAge: '30d',
    enableBrotli: true,
  }));

  let handlerMsg = "";
  if (args.gh_pages) {
    handlerMsg = serveRelativeFilepaths({app, dir: path.resolve(args.gh_pages)});
  } else if (args.handlers) {
    handlerMsg = customRouteHandlers(app, path.resolve(args.handlers));
  } else {
    handlerMsg = defaultRouteHandlers({app, dataPaths});
  }
  /* Handle unhandled API (charon) routes */
  app.get("/charon*", (req, res) => {
    const errorMessage = "Query unhandled -- " + req.originalUrl;
    utils.warn(errorMessage);
    return res.status(500).type("text/plain").send(errorMessage);
  });

  /* this must be the last "get" handler, else the "*" swallows all other requests */
  app.get("*", (req, res) => {
    res.sendFile(path.join(auspiceBuild.baseDir, "dist/index.html"), {headers: {"Cache-Control": "no-cache, no-store, must-revalidate"}});
  });

  const server = app.listen(app.get('port'), app.get('host'), () => {
    utils.log("\n\n---------------------------------------------------");
    const host = app.get('host');
    const {port} = server.address();
    console.log(chalk.blueBright("Auspice server now running at ") + chalk.blueBright.underline.bold(`http://${host}:${port}`));
    utils.log(auspiceBuild.message);
    utils.log(handlerMsg);
    utils.log("---------------------------------------------------\n\n");
  }).on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      utils.error(`Port ${app.get('port')} is currently in use by another program.
      You must either close that program or specify a different port by setting the shell variable "$PORT". Note that on MacOS / Linux ${chalk.yellow(`lsof -n -i :${app.get('port')} | grep LISTEN`)} should identify the process currently using the port.`);
    }

    if (error.code === 'ENOTFOUND') {
      utils.error(`Host ${app.get('host')} is not a valid address. The server could not be started. If you did not provide a HOST environment variable when starting the app you may have HOST already set in your system. You can either change that variable, or override HOST when starting the app.

      Example commands to fix:
        ${chalk.yellow('HOST="localhost" auspice view')}
        ${chalk.yellow('HOST="localhost" npm run view')}`);
    }

    utils.error(`Uncaught error in app.listen(). Code: ${error.code}`);
  });

};

module.exports = {
  addParser,
  run,
  addDatasetNarrativePathArgs,
  processPathArguments,
  defaultRouteHandlers,
  customRouteHandlers,
  serveRelativeFilepaths
};

/**
 * Returns an object linking (absolute) paths to a set whose members indicate whether
 * the path should be searched for dataset JSONs, narrative markdown files, or both.
 *
 * Historically the CLI took a single dataset path and a single narrative path, and
 * that behaviour is still allowed here in addition to the newer approach of supplying
 * any number of paths which can contain datasets and/or narratives. The two approaches
 * are mutually exclusive and enforcement of this happens here.
 *
 * If no paths are provided via arguments then we attempt to choose sensible defaults
 * (via `defaultDataPaths()`), however in my (james) experience it's never worked
 * well an I recommend providing paths via args.
 */
function processPathArguments(args) {

  if (args.handlers && (args.datasetDir || args.narrativeDir || args.path.length>0)) {
    utils.error("Can't provide data paths if you use custom handlers")
  }

  if (args.gh_pages && (args.handlers || args.datasetDir || args.narrativeDir || args.path.length>0)) {
    utils.error("Can't provide data paths or handlers if you use --gh-pages")
  }

  if ((args.datasetDir || args.narrativeDir) && args.path.length>0) {
    utils.error("Incompatible arguments defining paths for datasets and/or narratives: " +
      "You must either specify the paths as named arguments (--datasetDir and/or --narrativeDir) " +
      "_or_ specify one or more <path> positional arguments.");
  }

  if (args.handlers || args.gh_pages) {
    return {};
  }

  const dataPaths = Object.fromEntries(
    (args.path.length ?
      args.path.map(utils.cleanUpPathname) :
      args.datasetDir ?
        [utils.cleanUpPathname(args.datasetDir)] :
        utils.defaultDataPaths()
    ).map((p) => [p, new Set(['datasets'])])
  );

  for (const narrativePath of
    (args.path.length ?
      args.path.map(utils.cleanUpPathname) :
      args.narrativeDir ?
        [utils.cleanUpPathname(args.narrativeDir)] :
        utils.defaultDataPaths({narrative: true}))) {
    if (narrativePath in dataPaths) {
      dataPaths[narrativePath].add('narratives');
    } else {
      dataPaths[narrativePath] = new Set(['narratives']);
    }
  }

  if (undefined in dataPaths) {
    utils.error("One or more provided paths does not exist")
  }

  return dataPaths;
}