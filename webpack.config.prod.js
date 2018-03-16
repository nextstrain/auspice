const path = require("path");
const webpack = require("webpack");
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
  entry: [
    "babel-polyfill",
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
        /* we don't need to define env.PERF in production as babel strips out the function calls :) */
      }
    }),
    new webpack.optimize.UglifyJsPlugin(), // minify everything - https://webpack.js.org/plugins/uglifyjs-webpack-plugin/
    /* Note: console.log statements are not stripped out */
    new webpack.optimize.AggressiveMergingPlugin(), // merge chunks - https://github.com/webpack/docs/wiki/list-of-plugins#aggressivemergingplugin
    new CompressionPlugin({ // gzip everything - https://github.com/webpack-contrib/compression-webpack-plugin
      asset: "[path].gz[query]",
      algorithm: "gzip",
      test: /\.js$|\.css$|\.html$/,
      threshold: 10240,
      minRatio: 0.8
    })
  ],
  module: {
    rules: [
      {
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
      }
    ]
  }
};
