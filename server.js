#!/usr/bin/env node

/* eslint no-console: off */
const path = require("path");
const express = require("express");
const expressStaticGzip = require("express-static-gzip");
const charon = require("./src/server/charon");
const globals = require("./src/server/globals");
const compression = require('compression');

/* documentation in the static site! */
const devServer = process.argv.indexOf("dev") !== -1;
globals.setGlobals(process.argv);

/* if we are in dev-mode, we need to import specific libraries & set flags */
let webpack, config, webpackDevMiddleware, webpackHotMiddleware;
if (devServer) {
  webpack = require("webpack"); // eslint-disable-line
  config = require("./webpack.config.dev"); // eslint-disable-line
  webpackDevMiddleware = require("webpack-dev-middleware"); // eslint-disable-line
  webpackHotMiddleware = require("webpack-hot-middleware"); // eslint-disable-line
}

const app = express();
app.set('port', process.env.PORT || 4000);
app.use(compression());

if (devServer) {
  const compiler = webpack(config);
  app.use(webpackDevMiddleware(compiler, {
    noInfo: true,
    publicPath: config.output.publicPath
  }));
  app.use(webpackHotMiddleware(compiler));
} else {
  app.use("/dist", expressStaticGzip(path.resolve(__dirname, "dist")));
  app.use(express.static(path.resolve(__dirname, "dist")));
}

/* redirect www.nextstrain.org to nextstrain.org */
app.use(require('express-naked-redirect')({reverse: true}));

app.get("/favicon.png", (req, res) => {
  res.sendFile(path.resolve(__dirname, "favicon.png"));
});

charon.applyCharonToApp(app);

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "index.html"));
});

const server = app.listen(app.get('port'), () => {
  console.log("-----------------------------------");
  console.log("Auspice server started on port " + server.address().port);
  console.log(devServer ? "Serving dev bundle with hot-reloading enabled" : "Serving compiled bundle from /dist");
  console.log(`Local datasets sourced from ${global.LOCAL_DATA_PATH} can be accessed via "/local/..." URLs`);
  console.log(`Local narratives sourced from ${global.LOCAL_NARRATIVES_PATH} can be accessed via "/local/narratives/..." URLs`);
  console.log("-----------------------------------\n\n");
});
