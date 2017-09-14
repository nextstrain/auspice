const path = require('path');
const webpack = require('webpack');

// let commitHash = require('child_process')
//   .execSync('git rev-parse --short HEAD')
//   .toString();

module.exports = {
  devtool: 'eval-source-map',
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
        NODE_ENV: JSON.stringify("dev")
      }
    }),
    // new webpack.DefinePlugin({
    //   __COMMIT_HASH__: JSON.stringify(commitHash)
    // }),
    new webpack.NoEmitOnErrorsPlugin()
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ['babel-loader'],
        include: path.join(__dirname, 'src')
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
