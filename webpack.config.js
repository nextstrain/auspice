/* eslint no-console: off */
const path = require("path");
const webpack = require("webpack");
const CompressionPlugin = require('compression-webpack-plugin');
const fs = require('fs');
const utils = require('./cli/utils');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');

/* Webpack config generator */

const generateConfig = ({extensionPath, devMode=false, customOutputPath, analyzeBundle=false}) => {
  utils.verbose(`Generating webpack config. Extensions? ${!!extensionPath}. devMode: ${devMode}`);

  /* which directories should be parsed by babel and other loaders? */
  const directoriesToTransform = [path.join(__dirname, 'src')];

  // Pins all react stuff, and uses hot loader's dom (can be used safely in production)
  // Format is either "libName" or "libName:libPath"
  const coreDeps = [
    "react",
    "react-hot-loader",
    "react-dom:@hot-loader/react-dom",
    "regenerator-runtime",
    "core-js",
    "styled-components"
  ];

  // Actively searches for the "good" root starting from auspice dir and going backwards
  // In 99.9% of practical cases these should all resolve wrt the node_modules in the root project,
  // but if there are conflict they will preferentially resolve to auspice's node_modules
  let baseDir = __dirname;
  let foundNodeModules = false;
  const resolvedCoreDeps = {};
  while (!foundNodeModules) {
    foundNodeModules = true;
    for (const coreDep of coreDeps) {
      const coreDepParts = coreDep.split(":");
      if (!resolvedCoreDeps[coreDepParts[0] || coreDep]) {
        const modulePath = path.join(baseDir, "node_modules", coreDepParts[1] || coreDep);
        if (fs.existsSync(modulePath)) resolvedCoreDeps[coreDepParts[0] || coreDep] = modulePath;
        else foundNodeModules = false;
      }
    }
    baseDir = path.resolve(baseDir, "..");
  }

  /* webpack alias' used in code import / require statements */
  const aliasesToResolve = {
    "@extensions": path.join(__dirname, '.null'), /* must provide a default, else it won't compile */
    "@auspice": path.join(__dirname, 'src'),
    ...resolvedCoreDeps
  };

  let extensionData;
  if (extensionPath) {
    // console.log("BUILDING WITH EXTENSIONS");
    const dir = path.resolve(__dirname, path.dirname(extensionPath));
    aliasesToResolve["@extensions"] = dir;
    directoriesToTransform.push(dir);
    // console.log("directoriesToTransform", directoriesToTransform);
    extensionData = JSON.parse(fs.readFileSync(extensionPath, {encoding: 'utf8'}));
    // console.log("extensionData", extensionData);
  }

  /* plugins */
  /* inject strings into the client-accessible process.env */
  const pluginProcessEnvData = new webpack.DefinePlugin({
    "process.env": {
      NODE_ENV: devMode ? JSON.stringify("development") : JSON.stringify("production"),
      EXTENSION_DATA: JSON.stringify(extensionData)
    }
  });
  /* gzip everything - https://github.com/webpack-contrib/compression-webpack-plugin */
  const pluginCompress = new CompressionPlugin({
    filename: "[path].gz[query]",
    algorithm: "gzip",
    test: /\.(js|css|html)$/,
    threshold: 4096
  });
  const pluginHtml = new HtmlWebpackPlugin({
    filename: 'index.html',
    template: './src/index.html'
  });
  const cleanWebpackPlugin = new CleanWebpackPlugin({
    cleanStaleWebpackAssets: true
  });
  const plugins = devMode ? [
    new LodashModuleReplacementPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    pluginProcessEnvData,
    new webpack.NoEmitOnErrorsPlugin(),
    pluginHtml,
    cleanWebpackPlugin
  ] : [
    new LodashModuleReplacementPlugin(),
    pluginProcessEnvData,
    pluginCompress,
    pluginHtml,
    cleanWebpackPlugin
  ];

  if (analyzeBundle) {
    const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin; // eslint-disable-line
    plugins.push(new BundleAnalyzerPlugin());
  }

  const entry = devMode ? ["webpack-hot-middleware/client", "./src/indexAsync"] : ["core-js/es/promise", "./src/indexAsync"];

  /* Where do we want the output to be saved?
   * For development we use the (virtual) "devel" directory
   * Else we must choose to save it in the CWD or the source
   */
  const outputPath = devMode ?
    path.resolve(__dirname, "devel") : // development: use the (virtual) "devel" directory
    customOutputPath ?
      path.resolve(customOutputPath, "dist") :
      path.resolve(__dirname, "dist");
  utils.verbose(`Webpack writing output to: ${outputPath}`);

  /**
   * Here we put the libraries that are unlikely to change for a long time.
   * Every change or update of any of these libraries will change the hash
   * of the big vendor bundle, so we must be sure they're stable both internally
   * and with respect to the implementation.
   * The hashes of the bundles are hardcoded in bundlesize so it will trigger
   * a check error if it is unadvertently changed.
   */
  const coreVendors = [
    "@babel/runtime",
    "core-js",
    "regenerator-runtime",
    "whatwg-fetch",
    "style-loader",
    "@hot-loader/react-dom",
    "react(-(redux|select|helmet|i18next))?",
    "leaflet",
    "redux",
    "leaflet(-gesture-handling)?",
    "i18next",
    "styled-components",
    "stylis",
    "@emotion"
  ]; // <= needs some review from somebody with more knowledge of the whole codebase to decide what goes in

  /**
   * Here we put the (big) libraries that are more prone to change/update.
   * For example d3-.* is here even if it's a core library, because if we
   * include some new d3 feature, the whole bundle will change.
   * The hashes of the bundles are hardcoded in bundlesize so it will trigger
   * a check error if it is unadvertently changed.
   */
  const bigVendors = [
    "d3-.*", // d3 is imported selectively, new usages may change the bundle
    "lodash", // lodash is imported selectively using the lodash plugin, new usages may change the bundle
    "react-transition-group",
    "react-icons",
    "react-tooltip",
    "create-react-class",
    "mousetrap",
    "react-input-autosize",
    "typeface-lato",
    // "papaparse", <= This is only for the drag-and-drop of files and can be separated
    "dom-to-image",
    // marked + dompurify are used for MD display of the footer in (most) datasets
    "marked",
    "dompurify",
    // `yaml-front-matter` only used for narrative parsing, but included here to simplify the import code
    // and avoid it being bundled with most of the Auspice code. It imports "js-yaml".
    "yaml-front-matter",
    "js-yaml"
  ];

  /**
   * It's better to keep small libraries out of the vendor bundles because
   * the more libraries we include, the more small changes or updates
   * of a single small library will cause the hash to change.
   */

  const config = {
    mode: devMode ? 'development' : 'production',
    context: __dirname,
    // Better to get a proper full source map in dev mode, this one is pretty fast on rebuild
    devtool: !devMode ? undefined : "eval-source-map",
    entry,
    output: {
      path: outputPath,
      filename: `auspice.bundle${!devMode ? ".[contenthash]" : ""}.js`,
      chunkFilename: `auspice.chunk.[name].bundle${!devMode ? ".[chunkhash]" : ""}.js`,
      publicPath: "/dist/"
    },
    resolve: {
      alias: aliasesToResolve
    },
    node: {
      fs: 'empty'
    },
    plugins,
    optimization: {
      minimize: !devMode,
      splitChunks: {
        minChunks: 3,
        minSize: 8192,
        cacheGroups: {
          coreVendors: {
            test: new RegExp("[\\\\/]node_modules[\\\\/](" + coreVendors.join("|") + ")[\\\\/]"),
            name: "core-vendors",
            enforce: true,
            chunks: "all"
          },
          otherVendors: {
            test: new RegExp("[\\\\/]node_modules[\\\\/](" + bigVendors.join("|") + ")[\\\\/]"),
            name: "other-vendors",
            enforce: true,
            chunks: "all"
          },
          /**
           * ATM the package size is <15kB and so not worth splitting,
           * but it can be split further if it becomes huge
           */
          locales: {
            test: /[\\/]src[\\/]locales[\\/](?!en)/,
            name: "locales",
            enforce: true,
            chunks: "all"
          },
          default: {
            minChunks: 3,
            minSize: 8192,
            reuseExistingChunk: false
          },
          defaultVendors: false
        }
      }
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: [
            /node_modules\/(core-js|regenerator-runtime)/
          ],
          options: {
            cwd: path.resolve(__dirname)
          }
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"]
        },
        {
          test: /\.(gif|png|jpe?g|svg|woff2?|eot|otf|ttf)$/i,
          use: "file-loader"
        },
        {
          // esprima is a (large) dependency of js-yaml which is unnecessary in a browser
          // see https://github.com/nodeca/js-yaml/issues/230
          test: /node_modules\/esprima/,
          use: 'null-loader'
        }
      ]
    }
  };

  return config;
};

module.exports = {default: generateConfig};
