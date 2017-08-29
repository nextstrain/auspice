var path = require("path");
var webpack = require("webpack");
var CompressionPlugin = require('compression-webpack-plugin');

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
  target: "electron-renderer",
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.DefinePlugin({
      "process.env": {
        "NODE_ENV": JSON.stringify("production"),
        "DATA_LOCAL": JSON.stringify(true)
      },
	  'global': {}
    }),

    new webpack.optimize.UglifyJsPlugin({ // minify everything
      compressor: {
        warnings: false
      }
    }),
    new webpack.optimize.DedupePlugin(), // dedupe similar code
    new webpack.optimize.AggressiveMergingPlugin(), // merge chunks
    new CompressionPlugin({ // gzip everything
       asset: "[path].gz[query]",
       algorithm: "gzip",
       test: /\.js$|\.css$|\.html$/,
       threshold: 10240,
       minRatio: 0.8
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
      test: /\.css$/,
      loaders: [ "style-loader", "css-loader" ]
    },
    {
      test: /\.(gif|png|jpe?g|svg)$/i, loader: "file-loader",
      include: path.join(__dirname, "src")
    }]
  }
};
