/* eslint no-console: off */
const path = require("path");
const express = require("express");
const expressStaticGzip = require("express-static-gzip");
const dataFuncs = require('./src/server/data');
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
*/

/* parse args, set some as global to be available in bundle */
const devServer = process.argv.indexOf("dev") !== -1;
global.LOCAL_DATA = process.argv.indexOf("localData") !== -1;
// global.DATA_PREFIX = global.LOCAL_DATA ? path.join(__dirname, "/data/") : "http://data.nextstrain.org/";

/* dev-specific libraries & imports */
let webpack;
// let request;
let config;
let webpackDevMiddleware;
let webpackHotMiddleware;
if (devServer) {
  webpack = require("webpack");
  // request = require("request");
  config = require("./webpack.config.dev");
  webpackDevMiddleware = require("webpack-dev-middleware");
  webpackHotMiddleware = require("webpack-hot-middleware");
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

app.get("/favicon.png", (req, res) => {
  res.sendFile(path.join(__dirname, "favicon.png"));
});

app.get('/charon*', (req, res) => {
  const query = queryString.parse(req.url.split('?')[1]);
  console.log("API request: " + req.originalUrl);
  if (Object.keys(query).indexOf("want") === -1) {
    console.warn("Query rejected (nothing wanted) -- " + req.originalUrl);
    return; // 404
  }
  switch (query.want) {
    case "manifest": {
      dataFuncs.getManifest(query, res);
      break;
    } case "image": {
      dataFuncs.getImage(query, res);
      break;
    } case "json": {
      dataFuncs.getDatasetJson(query, res);
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
  console.log("-----------------------------------\n\n");
});
