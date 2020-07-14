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
  subparser.addArgument('--datasetDir', {metavar: "PATH", help: "Directory where datasets (JSONs) are sourced. This is ignored if you define custom handlers."});
  subparser.addArgument('--narrativeDir', {metavar: "PATH", help: "Directory where narratives (Markdown files) are sourced. This is ignored if you define custom handlers."});
  /* there are some options which we deliberately do not document via `--help`. */
  subparser.addArgument('--customBuild', {action: "storeTrue", help: SUPPRESS}); /* see printed warning in the code below */
  subparser.addArgument('--gh-pages', {action: "store", help: SUPPRESS}); /* related to the "static-site-generation" or "github-pages" */
};

const serveRelativeFilepaths = ({app, dir}) => {
  app.get("*.json", (req, res) => {
    const filePath = path.join(dir, req.originalUrl);
    utils.log(`${req.originalUrl} -> ${filePath}`);
    res.sendFile(filePath);
  });
  return `JSON requests will be served relative to ${dir}.`;
};

const loadAndAddHandlers = ({app, handlersArg, datasetDir, narrativeDir}) => {
  /* load server handlers, either from provided path or the defaults */
  const handlers = {};
  let datasetsPath, narrativesPath;
  if (handlersArg) {
    const handlersPath = path.resolve(handlersArg);
    utils.verbose(`Loading handlers from ${handlersPath}`);
    const inject = require(handlersPath); // eslint-disable-line
    handlers.getAvailable = inject.getAvailable;
    handlers.getDataset = inject.getDataset;
    handlers.getNarrative = inject.getNarrative;
  } else {
    datasetsPath = utils.resolveLocalDirectory(datasetDir, false);
    narrativesPath = utils.resolveLocalDirectory(narrativeDir, true);
    handlers.getAvailable = require("./server/getAvailable")
      .setUpGetAvailableHandler({datasetsPath, narrativesPath});
    handlers.getDataset = require("./server/getDataset")
      .setUpGetDatasetHandler({datasetsPath});
    handlers.getNarrative = require("./server/getNarrative")
      .setUpGetNarrativeHandler({narrativesPath});
  }

  /* apply handlers */
  app.get("/charon/getAvailable", handlers.getAvailable);
  app.get("/charon/getDataset", handlers.getDataset);
  app.get("/charon/getNarrative", handlers.getNarrative);
  app.get("/charon*", (req, res) => {
    const errorMessage = "Query unhandled -- " + req.originalUrl;
    utils.warn(errorMessage);
    return res.status(500).type("text/plain").send(errorMessage);
  });

  return handlersArg ?
    `Custom server handlers provided.` :
    `Looking for datasets in ${datasetsPath}\nLooking for narratives in ${narrativesPath}`;
};

const getAuspiceBuild = () => {
  const cwd = path.resolve(process.cwd());
  const sourceDir = path.resolve(__dirname, "..");
  if (
    cwd !== sourceDir &&
    fs.existsSync(path.join(cwd, "index.html")) &&
    fs.existsSync(path.join(cwd, "dist")) &&
    fs.readdirSync(path.join(cwd, "dist")).filter((fn) => fn.match(/^auspice.bundle.[a-z0-9]+.js$/)).length === 1
  ) {
    return {
      message: "Serving the auspice build which exists in this directory.",
      baseDir: cwd,
      distDir: path.join(cwd, "dist")
    };
  }
  return {
    message: `Serving auspice version ${version}`,
    baseDir: sourceDir,
    distDir: path.join(sourceDir, "dist")
  };
};

const run = (args) => {
  /* Basic server set up */
  const app = express();
  app.set('port', process.env.PORT || 4000);
  app.set('host', process.env.HOST || "localhost");
  app.use(compression());
  app.use(nakedRedirect({reverse: true})); /* redirect www.name.org to name.org */

  if (args.customBuild) {
    utils.warn("--customBuild is no longer used and will be removed in a future version. We now serve a custom auspice build if one exists in the directory `auspice view` is run from");
  }

  const auspiceBuild = getAuspiceBuild();
  utils.verbose(`Serving index / favicon etc from  "${auspiceBuild.baseDir}"`);
  utils.verbose(`Serving built javascript from     "${auspiceBuild.distDir}"`);
  app.get("/favicon.png", (req, res) => {res.sendFile(path.join(auspiceBuild.baseDir, "favicon.png"));});
  app.use("/dist", expressStaticGzip(auspiceBuild.distDir, {maxAge: '30d'}));

  let handlerMsg = "";
  if (args.gh_pages) {
    handlerMsg = serveRelativeFilepaths({app, dir: path.resolve(args.gh_pages)});
  } else {
    handlerMsg = loadAndAddHandlers({app, handlersArg: args.handlers, datasetDir: args.datasetDir, narrativeDir: args.narrativeDir});
  }

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
  loadAndAddHandlers,
  serveRelativeFilepaths
};
