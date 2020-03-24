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
const SUPPRESS = require('argparse').Const.SUPPRESS;

const addParser = (parser) => {
  const description = `Launch auspice in development mode.
    This runs a local server and uses hot-reloading to allow automatic updating as you edit the code.
    NOTE: there is a speed penalty for this ability and this should never be used for production.
    `;

  const subparser = parser.addParser('develop', {addHelp: true, description});
  subparser.addArgument('--verbose', {action: "storeTrue", help: "Print more verbose progress messages in the terminal."});
  subparser.addArgument('--extend', {action: "store", metavar: "JSON", help: "Client customisations to be applied. See documentation for more details. Note that hot reloading does not currently work for these customisations."});
  subparser.addArgument('--handlers', {action: "store", metavar: "JS", help: "Overwrite the provided server handlers for client requests. See documentation for more details."});
  subparser.addArgument('--datasetDir', {metavar: "PATH", help: "Directory where datasets (JSONs) are sourced. This is ignored if you define custom handlers."});
  subparser.addArgument('--narrativeDir', {metavar: "PATH", help: "Directory where narratives (Markdown files) are sourced. This is ignored if you define custom handlers."});
  /* there are some options which we deliberately do not document via `--help`. See build.js for explanations. */
  subparser.addArgument('--includeTiming', {action: "storeTrue", help: SUPPRESS});
  subparser.addArgument('--gh-pages', {action: "store", help: SUPPRESS});
};


const run = (args) => {
  /* Basic server set up */
  const app = express();
  app.set('port', process.env.PORT || 4000);
  app.set('host', process.env.HOST || "localhost");

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

  const server = app.listen(app.get('port'), app.get('host'), () => {
    utils.log("\n\n---------------------------------------------------");
    utils.log("Auspice now running in development mode.");
    const host = app.get('host');
    const {port} = server.address();
    console.log(chalk.blueBright("Access the client at: ") + chalk.blueBright.underline.bold(`http://${host}:${port}`));
    utils.log(`Serving auspice version ${version}${args.extend ? " with extensions" : ""}.`);
    utils.log(handlerMsg);
    utils.log("---------------------------------------------------\n\n");
  });

};

module.exports = {
  addParser,
  run,
};
