#!/usr/bin/env node
/* eslint no-console: off */
/**
 * Build the self-contained ESM embed bundle using the webpack Node API.
 * (The repo does not depend on webpack-cli; the main app build likewise drives
 * webpack programmatically — see `cli/build.ts`.)
 */

/* These must be set before webpack (and thus babel-loader) runs.
 * - Build as "production" so babel.config.cjs matches the app's production
 *   transforms (e.g. it does not add the react-hot-loader babel plugin).
 * - Strip the `timerStart`/`timerEnd` timing calls, exactly as the production
 *   app build does via BABEL_INCLUDE_TIMING_FUNCTIONS (see babel.config.cjs). */
process.env.BABEL_ENV = process.env.BABEL_ENV || "production";
process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.env.BABEL_INCLUDE_TIMING_FUNCTIONS = "false";

const webpack = require("webpack");
const config = require("../webpack.embed.config.cjs");

webpack(config, (err, stats) => {
  if (err) {
    console.error(err.stack || err);
    if (err.details) console.error(err.details);
    process.exit(1);
  }
  console.log(stats.toString({ colors: true, chunks: false, modules: false }));
  if (stats.hasErrors()) {
    process.exit(1);
  }
});
