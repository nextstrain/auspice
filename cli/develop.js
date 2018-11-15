/* eslint no-console: off */
const path = require("path");
const express = require("express");
const webpack = require("webpack");
const webpackDevMiddleware = require("webpack-dev-middleware");
const webpackHotMiddleware = require("webpack-hot-middleware");
const utils = require("./utils");
const { loadAndAddHandlers, serveRelativeFilepaths } = require("./view");
const version = require('../src/version').version;
const chalk = require('chalk');
const generateWebpackConfig = require("../webpack.config.js").default;

const addParser = (parser) => {
  const description = `Launch the development server for auspice.
  This uses hot-reloading to allow automatic updating as you edit the code, but there is a speed penalty for this.
  This should never be used for production.`;

  const subparser = parser.addParser('develop', {addHelp: true, description});
  subparser.addArgument('--verbose', {action: "storeTrue", help: "verbose logging"});
  subparser.addArgument('--extend', {action: "store", help: "(client) extension config"});
  subparser.addArgument('--handlers', {action: "store", help: "(server) API handlers"});
  subparser.addArgument('--datasetDir', {help: "Directory where datasets are sourced"});
  subparser.addArgument('--narrativeDir', {help: "Directory where narratives are sourced"});
  subparser.addArgument('--includeTiming', {action: "storeTrue", help: "keep timing functions (default: false for speed reasons)"});
  subparser.addArgument('--gh-pages', {action: "store", help: "Allow hardcoded file requests. Provide the path to the JSON directory."});
};


const run = (args) => {
  /* Basic server set up */
  const app = express();
  app.set('port', process.env.PORT || 4000);

  const baseDir = path.resolve(__dirname, "..");
  utils.verbose(`Serving index / favicon etc from  "${baseDir}"`);
  app.get("/favicon.png", (req, res) => {res.sendFile(path.join(baseDir, "favicon.png"));});

  /* webpack set up */
  const extensionPath = args.extend ? path.resolve(args.extend) : undefined;
  const webpackConfig = generateWebpackConfig({extensionPath, devMode: true});
  const compiler = webpack(webpackConfig);

  /* variables available to babel (which is called by webpack) */
  process.env.BABEL_INCLUDE_TIMING_FUNCTIONS = args.includeTiming;
  process.env.BABEL_ENV = "development";
  process.env.BABEL_EXTENSION_PATH = extensionPath;

  app.use((webpackDevMiddleware)(
    compiler,
    {logLevel: 'warn', publicPath: webpackConfig.output.publicPath}
  ));
  app.use((webpackHotMiddleware)(
    compiler,
    {log: console.log, path: '/__webpack_hmr', heartbeat: 10 * 1000}
  ));

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
    utils.log("Auspice now running in development mode.");
    console.log(chalk.blueBright("Access the client at: ") + chalk.blueBright.underline.bold("http://localhost:" + server.address().port));
    utils.log(`Serving auspice version ${version}${args.extend ? " with extensions" : ""}.`);
    utils.log(handlerMsg);
    utils.log("---------------------------------------------------\n\n");
  });

};

module.exports = {
  addParser,
  run
};
