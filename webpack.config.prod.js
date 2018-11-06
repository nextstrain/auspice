/* eslint no-console: off */
const path = require("path");
const webpack = require("webpack");
const CompressionPlugin = require('compression-webpack-plugin');
const fs = require('fs');


const directoriesToTransform = [path.join(__dirname, 'src')];
const aliasesToResolve = {
  "@extensions": '.', /* must provide a default, else it won't compile */
  "@auspice": path.join(__dirname, 'src'),
  "@libraries": path.join(__dirname, 'node_modules')
};


let extensionData;
if (process.env.AUSPICE_EXTENSIONS) {
  console.log("BUILDING WITH EXTENSIONS");
  const dir = path.resolve(__dirname, path.dirname(process.env.AUSPICE_EXTENSIONS));
  aliasesToResolve["@extensions"] = dir;
  directoriesToTransform.push(dir);
  console.log("directoriesToTransform", directoriesToTransform);
  extensionData = JSON.parse(fs.readFileSync(process.env.AUSPICE_EXTENSIONS, {encoding: 'utf8'}));
  console.log("extensionData", extensionData);
}


module.exports = {
  mode: 'production',
  entry: [
    "babel-polyfill",
    "./src/index"
  ],
  output: {
    path: path.join(__dirname, "dist"),
    filename: "bundle.js",
    publicPath: "/dist/"
  },
  resolve: {
    alias: aliasesToResolve
  },
  node: {
    fs: 'empty'
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env": {
	NODE_ENV: JSON.stringify("production"),
	EXTENSION_DATA: JSON.stringify(extensionData)
      }
    }),
    new webpack.optimize.AggressiveMergingPlugin(), // merge chunks - https://github.com/webpack/docs/wiki/list-of-plugins#aggressivemergingplugin
    new CompressionPlugin({ // gzip everything - https://github.com/webpack-contrib/compression-webpack-plugin
      asset: "[path].gz[query]",
      algorithm: "gzip",
      test: /\.js$|\.css$|\.html$/,
      threshold: 10240,
      minRatio: 0.8
    })
  ],
  optimization: {
    minimize: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ["babel-loader"],
	include: directoriesToTransform
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.(gif|png|jpe?g|svg)$/i,
        use: "file-loader",
	include: directoriesToTransform
      }
    ]
  }
};
