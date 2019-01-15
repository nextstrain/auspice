const webpack = require("webpack");
const path = require("path");
const generateWebpackConfig = require("../webpack.config.js").default;
const utils = require("./utils");

const addParser = (parser) => {
  const description = `Build the client source code for auspice.
  For development, you may want to use "auspice develop" which recompiles code on the fly as changes are made.
  You may provide customisations (e.g. code, options) to this step to modify the functionality and appearence of auspice.
  To serve the built code, run "auspice view".
  `;

  const subparser = parser.addParser('build', {addHelp: true, description});
  subparser.addArgument('--verbose', {action: "storeTrue", help: "verbose logging"});
  subparser.addArgument('--extend', {action: "store", help: "extension config"});
  subparser.addArgument('--includeTiming', {action: "storeTrue", help: "keep timing functions (default: false for speed reasons)"});
  subparser.addArgument('--serverless', {action: "storeTrue", help: "e.g gh-pages"});
};

const run = (args) => {

  /* webpack set up */
  const extensionPath = args.extend ? path.resolve(args.extend) : undefined;
  const customOutputPath = utils.customOutputPath(args.extend);
  const webpackConfig = generateWebpackConfig({extensionPath, devMode: false, customOutputPath});
  const compiler = webpack(webpackConfig);

  /* variables available to babel (which is called by webpack) */
  process.env.BABEL_INCLUDE_TIMING_FUNCTIONS = args.includeTiming;
  process.env.BABEL_ENV = "production";
  process.env.BABEL_EXTENSION_PATH = extensionPath;

  utils.log("Running webpack compiler");
  compiler.run((err, stats) => {
    if (err) {
      console.error(err);
      return;
    }
    if (stats.hasErrors()) {
      utils.warn("Webpack has errors!");
      console.log(stats.toString({colors: true}));
    } else {
      if (stats.hasWarnings()) {
        utils.warn("Webpack has warnings (run with '--verbose' to see them)");
      }
      if (global.AUSPICE_VERBOSE) {
        console.log(stats.toString({colors: true}));
      }
      if (customOutputPath) {
        utils.exportIndexDotHtml({relative: args.serverless});
      }
    }
  });

};

module.exports = {
  addParser,
  run
};
