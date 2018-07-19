const path = require("path");
const webpack = require("webpack");
const fs = require("fs");

/*
http://jlongster.com/Backend-Apps-with-Webpack--Part-I
https://github.com/webpack/webpack/issues/1599
https://stackoverflow.com/questions/29096018/react-webpack-process-env-is-undefined
*/

const nodeModules = {};
fs.readdirSync('node_modules')
  .filter((x) => ['.bin'].indexOf(x) === -1)
  .forEach((mod) => {
    nodeModules[mod] = 'commonjs ' + mod;
  });

module.exports = {
  entry: [
    "./server"
  ],
  externals: nodeModules,
  target: "node",
  node: {
    __dirname: true,
    __filename: true
  },
  output: {
    path: path.join(__dirname, ""),
    filename: "server.dist.js"
  },
  plugins: [
    // new webpack.DefinePlugin({
    //   "process.env": {
    //     NODE_ENV: JSON.stringify("production")
    //   }
    // })
  ],
  module: {
    rules: [{
      test: /\.js$/,
      use: ["babel-loader"],
      include: path.join(__dirname, "src")
    }]
  }
};
