var path = require('path');
var webpack = require('webpack');

// let commitHash = require('child_process')
//   .execSync('git rev-parse --short HEAD')
//   .toString();

module.exports = {
  devtool: ['eval','sourcemap'],
  entry: [
    'webpack-hot-middleware/client',
    './src/index'
  ],
  output: {
    path: path.join(__dirname, 'devel'),
    filename: 'bundle.js',
    publicPath: '/dist/'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    // perf test on nodes - remove this line to get warnings back.
    new webpack.DefinePlugin({
      "process.env": {
        "NODE_ENV": JSON.stringify("dev")
      }
    }),
    // new webpack.DefinePlugin({
    //   __COMMIT_HASH__: JSON.stringify(commitHash)
    // }),
    new webpack.NoErrorsPlugin()
  ],
  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ['babel'],
        include: path.join(__dirname, 'src')
      },
      {
        test: /\.json$/, loader: "json-loader"
      },
      {
        test: /\.(gif|png|jpe?g|svg)$/i, loader: "file-loader",
        include: path.join(__dirname, "src")
      }
    ]
  }
};
