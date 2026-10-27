/* eslint no-console: off */
/**
 * Webpack config for the self-contained, browser-importable ESM embed build.
 *
 * Output: `embed-dist/embed.js` — an ES module with *all* dependencies bundled
 * in (React, ReactDOM, react-redux, styled-components, d3, …) and explicit file
 * extensions on any emitted chunks, so it can be imported by a browser over a
 * relative path with no import map and no bundler on the host side.
 *
 *   import { render } from "./embed.js";
 *
 * See `EMBED_RENDER_PLAN.md` §A.
 */
const path = require("path");
const webpack = require("webpack");
const fs = require("fs");

/* Pin React / ReactDOM / styled-components to auspice's own node_modules so the
 * bundle contains a single instance of each (duplicate styled-components would
 * break theming/context). We deliberately use plain `react-dom` here (not the
 * hot-loader variant the app build aliases in). */
const coreDeps = ["react", "react-dom", "styled-components"];
let baseDir = __dirname;
let foundNodeModules = false;
const resolvedCoreDeps = {};
while (!foundNodeModules) {
  foundNodeModules = true;
  for (const coreDep of coreDeps) {
    if (!resolvedCoreDeps[coreDep]) {
      const modulePath = path.join(baseDir, "node_modules", coreDep);
      if (fs.existsSync(modulePath)) resolvedCoreDeps[coreDep] = modulePath;
      else foundNodeModules = false;
    }
  }
  baseDir = path.resolve(baseDir, "..");
}

const config = {
  mode: "production",
  context: __dirname,
  target: "web",
  entry: "./src/embed/index.ts",
  experiments: {
    outputModule: true,
  },
  output: {
    path: path.resolve(__dirname, "embed-dist"),
    filename: "embed.js",
    chunkFilename: "embed.[name].js",
    module: true,
    library: { type: "module" },
    /* "auto" resolves (any) dynamically-imported chunks relative to the module
     * URL via import.meta.url, so relative-path loading works in the browser. */
    publicPath: "auto",
    clean: true,
  },
  resolve: {
    alias: {
      "@extensions": path.join(__dirname, ".null"), /* must provide a default, else it won't compile */
      "@auspice": path.join(__dirname, "src"),
      ...resolvedCoreDeps,
    },
    extensions: [".ts", ".tsx", "..."],
    fullySpecified: false,
    fallback: {
      buffer: require.resolve("buffer/"),
      fs: false,
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify("production"),
        SKIP_REDUX_CHECKS: JSON.stringify(process.env.SKIP_REDUX_CHECKS),
        ENABLE_SERVICE_WORKER: JSON.stringify(false),
        EXTENSION_DATA: JSON.stringify(undefined),
      },
    }),
    /* Some transitive deps reference a Node `Buffer` global. */
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
    }),
  ],
  optimization: {
    minimize: true,
    /* Keep everything in one file where possible (self-contained was chosen
     * deliberately); any unavoidable dynamic-import chunks are emitted as
     * sibling `embed.<name>.js` ES modules. */
    runtimeChunk: false,
    splitChunks: false,
  },
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        type: "javascript/auto",
        resolve: { fullySpecified: false },
      },
      {
        test: /\.(ts|js)x?$/,
        loader: "babel-loader",
        exclude: [
          /node_modules\/(core-js|regenerator-runtime)/,
          /node_modules\/maplibre-gl/,
        ],
        options: {
          cwd: path.resolve(__dirname),
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(gif|png|jpe?g|svg|woff2?|eot|otf|ttf)$/i,
        type: "asset/inline", /* inline assets so the single ESM file is truly self-contained */
      },
      {
        // esprima is a (large) dependency of js-yaml which is unnecessary in a browser
        // see https://github.com/nodeca/js-yaml/issues/230
        test: /node_modules\/esprima/,
        use: "null-loader",
      },
    ],
  },
};

module.exports = config;
