const utils = require('./cli/utils');

/* What variables does this config depend on?
 * process.env.BABEL_EXTENSION_PATH -- a resolved path
 * api.env -- this is process.env.BABEL_ENV if it exists (it should)
 * process.env.BABEL_INCLUDE_TIMING_FUNCTIONS
 */

module.exports = function babelConfig(api) {
  utils.verbose(`Generating Babel Config`);
  const presets = [
    [
      "@babel/preset-env",
      {
        useBuiltIns: false, // use the full lib to make sure vendor bundle stays stable
        targets: !api.env('test') ? "cover 95%" : { node: 'current' },
        bugfixes: true
      }
    ],
    "@babel/preset-react"
  ];
  const plugins = [
    ["@babel/plugin-proposal-decorators", { legacy: true }],
    "@babel/plugin-proposal-class-properties",
    "babel-plugin-styled-components",
    "@babel/plugin-syntax-dynamic-import",
    "lodash"
  ];
  if (api.env("development")) {
    plugins.push("react-hot-loader/babel");
  }
  if (process.env.BABEL_INCLUDE_TIMING_FUNCTIONS === "false") {
    plugins.push(["strip-function-call", {strip: ["timerStart", "timerEnd"]}]);
  }
  api.cache(true);
  return {
    presets,
    plugins
  };
};
