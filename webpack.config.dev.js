const path = require('path');
const webpack = require('webpack');

const directoriesToTransform = [path.join(__dirname, 'src')];
const aliasesToResolve = {
  "@extensions": '.', /* must provide an (unused) default, else it won't compile */
  "@auspice": path.join(__dirname, 'src'),
  "@libraries": path.join(__dirname, 'node_modules')
};

if (process.env.EXTENSION_PATH) {
  const dir = path.resolve(__dirname, process.env.EXTENSION_PATH);
  directoriesToTransform.push(dir);
  aliasesToResolve["@extensions"] = dir;
}


module.exports = {
  mode: 'development',
  context: __dirname,
  devtool: 'cheap-module-source-map',
  entry: [
    "babel-polyfill",
    'webpack-hot-middleware/client',
    './src/index'
  ],
  output: {
    path: path.join(__dirname, 'devel'),
    filename: 'bundle.js',
    publicPath: '/dist/'
  },
  resolve: {
    alias: aliasesToResolve
  },
  node: {
    fs: 'empty'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      "process.env": {
	NODE_ENV: JSON.stringify("dev"),
	EXTENSION_DATA: JSON.stringify(process.env.EXTEND_AUSPICE_DATA)
      }
    }),
    new webpack.NoEmitOnErrorsPlugin()
  ],
  optimization: {
    minimize: false
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ['babel-loader'],
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
