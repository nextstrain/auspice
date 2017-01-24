var path = require("path");
var webpack = require("webpack");

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
    // new webpack.optimize.OccurenceOrderPlugin(), // spelling mistake?
    // as of webpack 2 OccurrenceOrderPlugin is on by default
    new webpack.DefinePlugin({
      "process.env": {
        "NODE_ENV": JSON.stringify("production")
      }
    }),
    // NODE_ENV=production must also be set in the npm script
    // https://github.com/gaearon/react-transform-boilerplate/issues/54
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false
      }
    })
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        loaders: ['babel-loader'],
        include: path.join(__dirname, "src")
      }
    ]
  }
};
