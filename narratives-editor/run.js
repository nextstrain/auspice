#!/usr/bin/env node

/* eslint no-console: off */
const path = require("path");
const argparse = require('argparse');
const express = require("express");
const webpack = require("webpack");
const fs = require("fs");
const chalk = require('chalk');
const queryString = require("query-string");
const webpackDevMiddleware = require("webpack-dev-middleware");
const webpackHotMiddleware = require("webpack-hot-middleware");
const utils = require("../cli/utils");
const { loadAndAddHandlers, serveRelativeFilepaths } = require("../cli/view");
const generateWebpackConfig = require("../webpack.config.js").default;
const version = require("./package.json").version;

global.AUSPICE_VERBOSE = true;

const parser = new argparse.ArgumentParser({
  version,
  addHelp: true,
  description: `Auspice Narratives Editor (in development)`,
  epilog: `
  In development (experimental) live editor for narratives
  `
});
parser.addArgument('--datasetDir', {metavar: "PATH", help: "Directory where datasets (JSONs) are sourced. This is ignored if you define custom handlers."});
parser.addArgument('--narrativeDir', {metavar: "PATH", help: "Directory where narratives (Markdown files) are sourced. This is ignored if you define custom handlers."});

run(parser.parseArgs());

/* largely a copy & paste from `auspice develop` */
function run(args) {
  /* Basic server set up */
  const app = express();
  app.set('port', process.env.PORT || 4000);
  app.set('host', process.env.HOST || "localhost");

  const baseDir = path.resolve(__dirname);
  utils.verbose(`Serving index / favicon etc from  "${baseDir}"`);
  app.get("/favicon.png", (req, res) => {res.sendFile(path.join(baseDir, "favicon.png"));});

  /* webpack set up */
  const webpackConfig = generateWebpackConfig({
    devMode: true,
    extraTransformDirs: [path.join(__dirname, 'src')],
    entryPath: "./narratives-editor/src/index.js"
  });
  const compiler = webpack(webpackConfig);

  /* variables available to babel (which is called by webpack) */
  process.env.BABEL_INCLUDE_TIMING_FUNCTIONS = args.includeTiming;
  process.env.BABEL_ENV = "development";

  app.use((webpackDevMiddleware)(
    compiler,
    {logLevel: 'warn', publicPath: webpackConfig.output.publicPath}
  ));
  app.use((webpackHotMiddleware)(
    compiler,
    {log: console.log, path: '/__webpack_hmr', heartbeat: 10 * 1000}
  ));

  /* add a handler to specifically get a markdown file */
  /* this API endpoint is temporary -- IT MAY CHANGE WITHOUT WARNING */
  app.get(
    "/charon/dev/getNarrativeMarkdown",
    setUpGetNarrativeHandlerReturningRawMarkdown(
      {narrativesPath: utils.resolveLocalDirectory(args.narrativeDir, true)}
    )
  );

  let handlerMsg = "";
  if (args.gh_pages) {
    handlerMsg = serveRelativeFilepaths({app, dir: path.resolve(args.gh_pages)});
  } else {
    handlerMsg = loadAndAddHandlers({app, handlersArg: args.handlers, datasetDir: args.datasetDir, narrativeDir: args.narrativeDir});
  }

  /* this must be the last "get" handler, else the "*" swallows all other requests */
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
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

}

function setUpGetNarrativeHandlerReturningRawMarkdown({narrativesPath}) {
  return async (req, res) => {
    const prefix = queryString.parse(req.url.split('?')[1]).prefix || "";
    const filename = prefix
      .replace(/.+narratives\//, "")  // remove the URL up to (& including) "narratives/"
      .replace(/\/$/, "")             // remove ending slash
      .replace(/\//g, "_")            // change slashes to underscores
      .concat(".md");                 // add .md suffix

    const pathName = path.join(narrativesPath, filename);
    utils.log("DEV API ENDPOINT sending local narrative file as markdown: " + pathName);
    try {
      const fileContents = fs.readFileSync(pathName, 'utf8');
      res.type("text/markdown");
      res.send(fileContents);
      utils.verbose("SUCCESS");
    } catch (err) {
      res.statusMessage = `Narratives couldn't be served -- ${err.message}`;
      utils.warn(res.statusMessage);
      res.status(500).end();
    }
  };
}
