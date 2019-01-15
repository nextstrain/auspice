/* eslint no-console: off */
/* eslint global-require: off */

const path = require("path");
const express = require("express");
const expressStaticGzip = require("express-static-gzip");
const compression = require('compression');
const nakedRedirect = require('express-naked-redirect');
const utils = require("./utils");
const version = require('../src/version').version;
const chalk = require('chalk');


const addParser = (parser) => {
  const description = `Launch a local server to view datasets using auspice.
  Note that the handlers for requests from auspice can be provided here.
  (By default, the auspice handlers are used which access local data).
  This can be run as a persistent auspice server, serving a custom built version of auspice`;

  const subparser = parser.addParser('view', {addHelp: true, description});
  subparser.addArgument('--verbose', {action: "storeTrue", help: "verbose logging"});
  subparser.addArgument('--handlers', {action: "store", help: "server api handlers"});
  subparser.addArgument('--customBuild', {action: "storeTrue", help: "Look for bundle.js / index.html etc from this directory"});
  subparser.addArgument('--datasetDir', {help: "Directory where datasets are sourced"});
  subparser.addArgument('--narrativeDir', {help: "Directory where narratives are sourced"});
  subparser.addArgument('--gh-pages', {action: "store", help: "Allow hardcoded file requests. Provide the path to the JSON directory."});
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
    res.statusMessage = "Query unhandled -- " + req.originalUrl;
    utils.warn(res.statusMessage);
    return res.status(500).end();
  });

  return handlersArg ?
    `Custom server handlers provided.` :
    `Looking for datasets in ${datasetsPath}\nLooking for narratives in ${narrativesPath}`;
};

const run = (args) => {
  /* Basic server set up */
  const app = express();
  app.set('port', process.env.PORT || 4000);
  app.use(compression());
  app.use(nakedRedirect({reverse: true})); /* redirect www.name.org to name.org */

  const baseDir = args.customBuild ? path.resolve(process.cwd()) : path.resolve(__dirname, "..");
  const distDir = path.join(baseDir, "dist");
  utils.verbose(`Serving index / favicon etc from  "${baseDir}"`);
  utils.verbose(`Serving built javascript from     "${distDir}"`);
  app.get("/favicon.png", (req, res) => {res.sendFile(path.join(baseDir, "favicon.png"));});
  app.use("/dist", expressStaticGzip(distDir));
  app.use(express.static(distDir));

  let handlerMsg = "";
  if (args.gh_pages) {
    handlerMsg = serveRelativeFilepaths({app, dir: path.resolve(args.gh_pages)});
  } else {
    handlerMsg = loadAndAddHandlers({app, handlersArg: args.handlers, datasetDir: args.datasetDir, narrativeDir: args.narrativeDir});
  }

  /* this must be the last "get" handler, else the "*" swallows all other requests */
  app.get("*", (req, res) => {
    res.sendFile(path.join(baseDir, "index.html"));
  });

  const server = app.listen(app.get('port'), () => {
    utils.log("\n\n---------------------------------------------------");
    console.log(chalk.blueBright("Auspice server now running at ") + chalk.blueBright.underline.bold("http://localhost:" + server.address().port));
    if (args.customBuild) {
      utils.log(`Using a customised auspice build from this directory.`);
    } else {
      utils.log(`Serving auspice version ${version}.`);
    }
    utils.log(handlerMsg);
    utils.log("---------------------------------------------------\n\n");
  });

};

module.exports = {
  addParser,
  run,
  loadAndAddHandlers,
  serveRelativeFilepaths
};
