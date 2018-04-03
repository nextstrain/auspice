/* eslint no-console: off */
const path = require("path");
const express = require("express");
const expressStaticGzip = require("express-static-gzip");
const getFiles = require('./src/server/util/getFiles');
const serverReact = require('./src/server/util/sendReactComponents');
const serverNarratives = require('./src/server/util/narratives');
const queryString = require("query-string");

/*
an explanation of command line arguments and their effect.
Remember, Heroku runs this with no arguments.

By default, the API calls go to wherever you're running this server.
I.e. if this is via localhost, then it's localhost:4000/charon,
if this is deployed on heroku, it's nextstrain.org/charon...

"dev"
runs the dev server, with react hot loading etc. If this is not present then
the production server is run, which sources the bundle from dist/
(i.e. you have to run "npm run build" first).

"localData"
Sources the JSONs / splash images etc from /data/ rather than data.nextstrain.org.
This works even if you've built the bundle, as the API calls are handled by the same server.
You probably want this on for development, off for testing before deploying.

"localStatic"
Sources the Static posts (reports) from /static/ rather than github->themis.
This works even if you've built the bundle, as the API calls are handled by the same server.
You probably want this on for development, off for testing before deploying.
*/

/* parse args, set some as global to be available in utility scripts */
const devServer = process.argv.indexOf("dev") !== -1;
global.LOCAL_DATA = process.argv.indexOf("localData") !== -1;
global.LOCAL_DATA_PATH = path.join(__dirname, "/data/");
global.REMOTE_DATA_LIVE_BASEURL = "http://data.nextstrain.org/";
global.REMOTE_DATA_STAGING_BASEURL = "http://staging.nextstrain.org/";
global.LOCAL_STATIC = process.argv.indexOf("localStatic") !== -1;
global.LOCAL_STATIC_PATH = path.join(__dirname, "/static/");
global.REMOTE_STATIC_BASEURL = "http://cdn.rawgit.com/nextstrain/themis/master/files/";

/* dev-specific libraries & imports */
let webpack;
let config;
let webpackDevMiddleware;
let webpackHotMiddleware;
if (devServer) {
  webpack = require("webpack"); // eslint-disable-line
  config = require("./webpack.config.dev"); // eslint-disable-line
  webpackDevMiddleware = require("webpack-dev-middleware"); // eslint-disable-line
  webpackHotMiddleware = require("webpack-hot-middleware"); // eslint-disable-line
}

const app = express();
app.set('port', process.env.PORT || 4000);

if (devServer) {
  const compiler = webpack(config);
  app.use(webpackDevMiddleware(compiler, {
    noInfo: true,
    publicPath: config.output.publicPath
  }));
  app.use(webpackHotMiddleware(compiler));
} else {
  app.use("/dist", expressStaticGzip("dist"));
  app.use('/dist', express.static('dist')); // why is this line here?
}

/* redirect www.nextstrain.org to nextstrain.org */
app.use(require('express-naked-redirect')({
  reverse: true
}));

/* loader.io token (needed to run tests) */
app.get("/loaderio-b65b3d7f32a7febf80e8e05678347cb3.txt", (req, res) => {
  res.sendFile(path.join(__dirname, "loader.io-token.txt"));
});

app.get("/favicon.png", (req, res) => {
  res.sendFile(path.join(__dirname, "favicon.png"));
});

app.get('/charon*', (req, res) => {
  const query = queryString.parse(req.url.split('?')[1]);
  console.log("API request: " + req.originalUrl);
  if (Object.keys(query).indexOf("request") === -1) {
    console.warn("Query rejected (nothing requested) -- " + req.originalUrl);
    return; // 404
  }
  switch (query.request) {
    case "manifest": {
      getFiles.getManifest(query, res);
      break;
    } case "narrative": {
      serverNarratives.serveNarrative(query, res);
      break;
    } case "splashimage": {
      getFiles.getSplashImage(query, res);
      break;
    } case "image": {
      getFiles.getImage(query, res);
      break;
    } case "json": {
      getFiles.getDatasetJson(query, res);
      break;
    } default: {
      console.warn("Query rejected (unknown want) -- " + req.originalUrl);
    }
  }
});

app.get("*", (req, res) => {
  // console.log("Fallthrough request for " + req.originalUrl);
  res.sendFile(path.join(__dirname, "index.html"));
});

const server = app.listen(app.get('port'), () => {
  console.log("-----------------------------------");
  console.log("Auspice server started on port " + server.address().port);
  console.log(devServer ? "Serving dev bundle with hot-reloading enabled" : "Serving compiled bundle from /dist");
  console.log(global.LOCAL_DATA ? "Data is being sourced from /data" : "Data is being sourced from data.nextstrain.org (S3)");
  console.log(global.LOCAL_STATIC ? "Static content is being sourced from /static" : "Static content is being sourced from cdn.rawgit.com");
  console.log("-----------------------------------\n\n");
});
