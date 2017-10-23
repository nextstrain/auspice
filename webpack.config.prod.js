const path = require("path");
const webpack = require("webpack");
const CompressionPlugin = require('compression-webpack-plugin');
const WebpackMonitor = require('webpack-monitor');

module.exports = {
  entry: [
    "./src/index"
  ],
  output: {
    path: path.join(__dirname, "dist"),
    filename: "bundle.js",
    publicPath: "/dist/"
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify("production")
      }
    }),
    new webpack.optimize.UglifyJsPlugin(), // minify everything - https://webpack.github.io/docs/list-of-plugins.html#uglifyjsplugin
    new webpack.optimize.AggressiveMergingPlugin(), // merge chunks - https://webpack.github.io/docs/list-of-plugins.html#aggressivemergingplugin
    new CompressionPlugin({ // gzip everything - https://github.com/webpack-contrib/compression-webpack-plugin
      asset: "[path].gz[query]",
      algorithm: "gzip",
      test: /\.js$|\.css$|\.html$/,
      threshold: 10240,
      minRatio: 0.8
    }),
    new WebpackMonitor({
      capture: true, // -> default 'true'
      target: 'monitorStats.json', // default -> '../monitor/stats.json'
      launch: true, // -> default 'false'
      port: 3030 // default -> 8081
    })
  ],
  module: {
    rules: [{
      test: /\.js$/,
      use: ["babel-loader"],
      include: path.join(__dirname, "src")
    },
    {
      test: /\.css$/,
      use: ["style-loader", "css-loader"]
    },
    {
      test: /\.(gif|png|jpe?g|svg)$/i,
      use: "file-loader",
      include: path.join(__dirname, "src")
    }]
  }
};
