var path = require("path");
var webpack = require("webpack");

// let commitHash = require('child_process')
//   .execSync('git rev-parse --short HEAD')
//   .toString();

module.exports = {
  // devtool: "source-map",
  entry: [
    "./src/index"
  ],
  output: {
    path: path.join(__dirname, "dist"),
    filename: "bundle.js",
    publicPath: "/dist/"
  },
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.DefinePlugin({
      "process.env": {
        "NODE_ENV": JSON.stringify("production")
      }
    }),
    // new webpack.DefinePlugin({
    //   __COMMIT_HASH__: JSON.stringify(commitHash)
    // }),
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false
      }
    })
  ],
  module: {

    preLoaders: [
      { test: /\.json$/, loader: "json"}
    ],
    loaders: [{
      test: /\.js$/,
      loaders: ["babel"],
      include: path.join(__dirname, "src")
    },
    {
      test: /\.(gif|png|jpe?g|svg)$/i, loader: "file-loader",
      include: path.join(__dirname, "src")
    }]
  }
};
