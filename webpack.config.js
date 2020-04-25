/* eslint no-console: off */
const path = require('path');
const webpack = require('webpack');
const CompressionPlugin = require('compression-webpack-plugin');
const fs = require('fs');
const utils = require('./cli/utils');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

/* Webpack config generator */

const generateConfig = ({ extensionPath, devMode = false, customOutputPath, analyzeBundle = false }) => {
  utils.verbose(`Generating webpack config. Extensions? ${!!extensionPath}. devMode: ${devMode}`);

  /* which directories should be parsed by babel and other loaders? */
  const directoriesToTransform = [path.join(__dirname, 'src')];

  /* webpack alias' used in code import / require statements */
  const aliasesToResolve = {
    '@extensions': '.' /* must provide a default, else it won't compile */,
    '@auspice': path.join(__dirname, 'src'),
    '@libraries': path.join(__dirname, 'node_modules')
  };

  let extensionData;
  if (extensionPath) {
    // console.log("BUILDING WITH EXTENSIONS");
    const dir = path.resolve(__dirname, path.dirname(extensionPath));
    aliasesToResolve['@extensions'] = dir;
    directoriesToTransform.push(dir);
    // console.log("directoriesToTransform", directoriesToTransform);
    extensionData = JSON.parse(fs.readFileSync(extensionPath, { encoding: 'utf8' }));
    // console.log("extensionData", extensionData);
  }

  /* plugins */
  /* inject strings into the client-accessible process.env */
  const pluginProcessEnvData = new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: devMode ? JSON.stringify('development') : JSON.stringify('production'),
      EXTENSION_DATA: JSON.stringify(extensionData)
    }
  });
  /* gzip everything - https://github.com/webpack-contrib/compression-webpack-plugin */
  const pluginCompress = new CompressionPlugin({
    filename: '[path].gz[query]',
    algorithm: 'gzip',
    test: /\.js$|\.css$|\.html$/,
    threshold: 10240,
    minRatio: 0.8
  });

  const plugins = devMode
    ? [new webpack.HotModuleReplacementPlugin(), pluginProcessEnvData, new webpack.NoEmitOnErrorsPlugin()]
    : [
      pluginProcessEnvData,
      new webpack.optimize.AggressiveMergingPlugin(), // merge chunks - https://github.com/webpack/docs/wiki/list-of-plugins#aggressivemergingplugin
      pluginCompress,
      new CleanWebpackPlugin(), // remove duplicte hash files (created during changes)
      /* Cache busting; plugin to automatically insert the script tag of content hashed JS file(auspice.bundle.js) dynamically into HTML files */
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: './index.html'
      })
    ];

  if (analyzeBundle) {
		const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin; // eslint-disable-line
    plugins.push(new BundleAnalyzerPlugin());
  }

  const entry = ['babel-polyfill', './src/index'];
  if (devMode) {
    entry.splice(1, 0, 'webpack-hot-middleware/client');
  }

  /* Where do we want the output to be saved?
   * For development we use the (virtual) "devel" directory
   * Else we must choose to save it in the CWD or the source
   */
  const outputPath = devMode
    ? path.resolve(__dirname, 'devel') // development: use the (virtual) "devel" directory
    : customOutputPath ? path.resolve(customOutputPath, 'dist') : path.resolve(__dirname, 'dist');
  utils.verbose(`Webpack writing output to: ${outputPath}`);

  const config = {
    mode: devMode ? 'development' : 'production',
    context: __dirname,
    entry,
    output: {
      path: outputPath,
      filename: 'auspice.[hash].bundle.js',
      chunkFilename: 'auspice.[hash].chunk.[name].bundle.js',
      publicPath: '/dist/'
    },
    resolve: {
      alias: aliasesToResolve
    },
    node: {
      fs: 'empty'
    },
    plugins,
    optimization: {
      minimize: !devMode,
      moduleIds: 'hashed',
      runtimeChunk: 'single',
      splitChunks: {
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all'
          }
        }
      }
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'babel-loader',
          include: directoriesToTransform,
          options: {
            cwd: path.resolve(__dirname)
          }
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.(gif|png|jpe?g|svg|woff2?|eot|otf|ttf)$/i,
          use: 'file-loader'
        }
      ]
    }
  };

  config.devtool = 'cheap-module-source-map';

  return config;
};

module.exports = { default: generateConfig };
