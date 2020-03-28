const utils = require('./cli/utils');

/* What variables does this config depend on?
 * process.env.BABEL_EXTENSION_PATH -- a resolved path
 * api.env -- this is process.env.BABEL_ENV if it exists (it should)
 * process.env.BABEL_INCLUDE_TIMING_FUNCTIONS
 */

module.exports = function babelConfig(api) {
  utils.verbose(`Generating Babel Config`);
  const presets = [
    "@babel/env",
    "@babel/preset-react"
  ];
  const plugins = [
    ["@babel/plugin-proposal-decorators", { legacy: true }],
    "@babel/plugin-proposal-class-properties",
    "babel-plugin-styled-components",
    "babel-plugin-syntax-dynamic-import",
    "@babel/plugin-transform-runtime",
    "lodash"
  ];
  if (api.env("development")) {
    if (process.env.BABEL_EXTENSION_PATH && !process.env.BABEL_EXTENSION_PATH.includes(__dirname)) {
      utils.verbose("Not using react-hot-loader/babel plugin with auspice extensions as this produces an error. TO FIX.");
      /* with extensions from a dir not within the main auspice directory we get the error:
       * Module not found: Error: Can't resolve 'react-hot-loader' in ...extension directory...
       * Which I can't fix. Tried:
       * require.resolve("react-hot-loader/babel")
       * setting babelrcRoots
       * but google seems to have failed me.
       * It may be a bug with "react-hot-loader/babel" as the other plugins work just fine!
       */
    } else {
      plugins.push("react-hot-loader/babel");
    }
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
