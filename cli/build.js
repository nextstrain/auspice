const webpack = require("webpack");
const path = require("path");
const generateWebpackConfig = require("../webpack.config.js").default;
const utils = require("./utils");
const SUPPRESS = require('argparse').Const.SUPPRESS;

const addParser = (parser) => {
  const description = `Build the client source code bundle.
  For development, you may want to use "auspice develop" which recompiles code on the fly as changes are made.
  You may provide customisations (e.g. code, options) to this step to modify the functionality and appearance of auspice.
  To serve the bundle you will need a server such as "auspice view". 
  `;

  const subparser = parser.addParser('build', {addHelp: true, description});
  subparser.addArgument('--verbose', {action: "storeTrue", help: "Print more verbose progress messages."});
  subparser.addArgument('--extend', {action: "store", metavar: "JSON", help: "Build-time customisations to be applied. See documentation for more details."});
  const testing = subparser.addArgumentGroup({title: "Testing options"});
  testing.addArgument('--analyzeBundle', {action: "storeTrue", help: "Load an interactive bundle analyzer tool to investigate the composition of produced bundles / chunks."});
  testing.addArgument('--includeTiming', {action: "storeTrue", help: "Do not strip timing functions. With these included the browser console will print timing measurements for a number of functions."});

  /* there are some options which we deliberately do not document via `--help` */
  /* timing options can be left in -- these are hardcoded in the source code and (normally) removed at build-time. Keeping these is useful for profiling performance. */
  /* serverless or "static site production" functionality is for a future release (auspice v3 ?!?) */
  subparser.addArgument('--serverless', {action: "storeTrue", help: SUPPRESS});
};

const run = (args) => {

  /* webpack set up */
  const extensionPath = args.extend ? path.resolve(args.extend) : undefined;
  const customOutputPath = utils.customOutputPath(args.extend);
  const webpackConfig = generateWebpackConfig({extensionPath, devMode: false, customOutputPath, analyzeBundle: args.analyzeBundle});
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
      console.log(stats.toString({colors: true}));
      utils.error("Webpack built with errors. Exiting.");
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
