#!/usr/bin/env node

/* eslint no-console: off */
const path = require("path");
const express = require("express");
const expressStaticGzip = require("express-static-gzip");
const globals = require("./src/server/globals");
const compression = require('compression');
const fs = require('fs');
const argparse = require('argparse');
const version = require('./src/version').version;
const chalk = require('chalk');
const getDataset = require("./src/server/getDataset").default;
const getAvailable = require("./src/server/getAvailable").default;
const getNarrative = require("./src/server/getNarrative").default;

const parser = new argparse.ArgumentParser({
  version: version,
  addHelp: true,
  description: `Auspice version ${version}.`,
  epilog: `
  Auspice is an open-source interactive web app for visualising phylogenomic data.
  This command starts the server, which will make visualisations available in your browser.
  See nextstrain.org/docs/visualisation/introduction or github.com/nextstrain/auspice
  for more details.
  `
});
if (!globals.isNpmGlobalInstall()) {
  parser.addArgument('--dev', {action: "storeTrue", help: "Run (client) in development mode (hot reloading etc)"});
}
parser.addArgument('--data', {help: "Directory where local datasets are sourced"});
parser.addArgument('--extend', {help: "tmp / wip"});
parser.addArgument('--verbose', {action: "storeTrue", help: "verbose server logging"});
parser.addArgument('--narratives', {help: "Directory where local narratives are sourced"});
const args = parser.parseArgs();

/* documentation in the static site! */
globals.setGlobals(args);

/* This server can be supplied with extensions, which are parsed here.
 * They are available to webpack via process.env, which injects this into the client code
 */
const extensions = {loaded: false, server: {}};
if (args.extend) {
  extensions.config = JSON.parse(fs.readFileSync(args.extend, {encoding: 'utf8'}));
  extensions.path = path.dirname(args.extend);
  if (extensions.config.server) {
    extensions.server = require(path.join(extensions.path, extensions.config.server));
  }
  process.env.EXTENSION_PATH = extensions.path;
  process.env.EXTEND_AUSPICE_DATA = JSON.stringify(extensions.config);
  extensions.loaded = true;
}


/* Basic server set up */
const app = express();
app.set('port', process.env.PORT || 4000);
app.use(compression());
app.use(require('express-naked-redirect')({reverse: true})); /* redirect www.name.org to name.org */

app.get("/favicon.png", (req, res) => {
  res.sendFile(path.resolve(__dirname, "favicon.png"));
});


/* In dev mode, this server uses webpack to compile the client, and watch
 *    for file changes etc & use hot reloading.
 * If not dev mode, then the client has already been built, and we just
 *    serve the assets from the "/dist" directory
 */
if (args.dev) {
  const webpack = require("webpack"); // eslint-disable-line
  const webpackConfig = require(process.env.WEBPACK_CONFIG ? process.env.WEBPACK_CONFIG : './webpack.config.dev');  // eslint-disable-line
  const compiler = webpack(webpackConfig);
  app.use(require("webpack-dev-middleware")( // eslint-disable-line
    compiler,
    {logLevel: 'warn', publicPath: webpackConfig.output.publicPath}
  ));
  app.use(require("webpack-hot-middleware")( // eslint-disable-line
    compiler,
    {log: console.log, path: '/__webpack_hmr', heartbeat: 10 * 1000}
  ));
} else {
  app.use("/dist", expressStaticGzip(path.resolve(__dirname, "dist")));
  app.use(express.static(path.resolve(__dirname, "dist")));
}


/* we now supply the "get" handlers to handle the requests auspice will make
 *    (auspice uses 3 API endpoints, see docs for more information)
 * By default, these serve data for the locally installed auspice program
 *    however you can inject your own handlers here via auspice extensions.
 * If auspice is extended to use hardcoded data paths, then no requests to charon are made,
 *    however in local / dev mode a server is needed to return these (hardcoded) files
 *    as browsers can't access local files.
 */
if (extensions.loaded && extensions.config.hardcodedDataPaths) {
  app.get("*.json", (req, res) => {
    const hardcodedDataDir = path.resolve(path.dirname(args.extend), extensions.config.hardcodedDataPaths.directory);
    const filePath = path.join(hardcodedDataDir, req.originalUrl);
    console.log(chalk.yellow.bold(`${req.originalUrl} -> ${filePath}`));
    res.sendFile(filePath);
  });
} else {
  app.get("/charon/getAvailable", extensions.server.getAvailable || getAvailable);
  app.get("/charon/getDataset", extensions.server.getDataset || getDataset);
  app.get("/charon/getNarrative", extensions.server.getNarrative || getNarrative);
  app.get("/charon*", (req, res) => {
    res.statusMessage = "Query unhandled -- " + req.originalUrl;
    console.warn(chalk.red.bold(res.statusMessage));
    return res.status(500).end();
  });
}

/* this must be the last "get" handler, else the "*" swallows all other requests */
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "index.html"));
});

const server = app.listen(app.get('port'), () => {
  console.log(chalk.blue.bold("\n\n---------------------------------------------------"));
  console.log(chalk.blue.bold("Auspice server now running at ") + chalk.blue.underline.bold("http://localhost:" + server.address().port));
  if (args.dev) {
    console.log(chalk.red.bold(`*** DEVELOPMENT MODE - DO NOT USE IN PRODUCTION ***`));
  }
  console.log(chalk.blue.bold(`Local datasets at `) + chalk.blue.underline.bold(`http://localhost:${server.address().port}/local`) + chalk.blue.bold(` are sourced from ${global.LOCAL_DATA_PATH}`));
  console.log(chalk.blue.bold(`Local narratives at `) + chalk.blue.underline.bold(`http://localhost:${server.address().port}/local/narratives`) + chalk.blue.bold(` are sourced from ${global.LOCAL_NARRATIVES_PATH}`));
  console.log(chalk.blue.bold("---------------------------------------------------\n\n"));
});
