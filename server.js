/* eslint no-console: off */
const path = require("path");
const express = require("express");
const expressStaticGzip = require("express-static-gzip");
const dataFuncs = require('./src/server/data');
const queryString = require("query-string");

/*
an explanation of command line arguments and their effect.
Remember, Heroku runs this with no arguments.

"dev"
runs the dev server, with react hot loading etc. If this is not present then
the production server is run, which sources the bundle from dist/
(i.e. you have to run "npm run build" first).
Because this bundle has been (pre-)compiled, the API calls are hardcoded to go to
www.nextstrain.org.

"localAPI"
API calls are made to "localhost:4000/charon" rather than www.nextstrain.org/charon
You probably want this on.
(Only works for the dev server)

"localData"
Sources the JSONs / splash images etc from /data/ rather than data.nextstrain.org.
Only has an effect if running the dev server and if localAPI is set.
*/

/* parse args, set some as global to be available in bundle */
const devServer = process.argv.indexOf("dev") !== -1;
const localAPI = process.argv.indexOf("localAPI") !== -1;
const localData = process.argv.indexOf("localData") !== -1;
global.CHARON_LOCAL_API = localAPI; // must be in webpack.config.*.js files also if you want the front end to see
// global.LOCAL_DATA = localData;
global.DATA_PREFIX = localData ? path.join(__dirname, "/data/") : "http://data.nextstrain.org/";
// global.BASE_DIRNAME = __dirname;

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
app.set('port', 4000);

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
  if (!devServer) {
    console.log("Serving compiled bundle from /dist");
    console.log("API calls are being made to nextstrain.org/charon (and so data is being sourced from S3)");
  } else {
    console.log("Serving (hot-reloading) dev bundle");
    if (localAPI) {
      console.log("API calls are being made to localhost:" + server.address().port + "/charon");
      console.log(localData ? "Data is being sourced from /data" : "Data is being sourced from S3");
    } else {
      console.log("API calls are being made to www.nextstrain.org  (and so data is being sourced from S3)");
    }
  }
  console.log("-----------------------------------");
});
