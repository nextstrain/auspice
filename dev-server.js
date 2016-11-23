var path = require("path");
var express = require("express");
var webpack = require("webpack");
var config = require("./webpack.config.dev");
var request = require("request");

var Zika_meta = require("./data/zika_meta.json");
var Zika_tree = require("./data/zika_tree.json");
var Zika_entropy = require("./data/zika_entropy.json");
var Zika_sequences = require("./data/zika_sequences.json");

var app = express();
var compiler = webpack(config);

app.use(require("webpack-dev-middleware")(compiler, {
  noInfo: true,
  publicPath: config.output.publicPath
}));

app.use(require("webpack-hot-middleware")(compiler));

app.get("/meta", function(req, res) {
  res.send(Zika_meta);
});

app.get("/tree", function(req, res) {
  res.send(Zika_tree);
});

app.get("/sequences", function(req, res) {
  res.send(Zika_entropy);
});

app.get("/frequencies", function(req, res) {
  res.send({});
});

app.get("/entropy", function(req, res) {
  res.send(Zika_entropy);
});


// app.get("/:virus/:strain/:timeperiod/:resource", function(req, res) {
//   request(
//     "http://nextstrain.org/data/" +
//     req.params.virus +
//     req.params.strain +
//     req.params.timeperiod || "" +
//     req.params.resource +
//     ".json",
//     (err,r) => {
//       if (err) {console.log('error getting data', err)}
//       res.send(r.toJSON());
//   });
// });

app.get("*", function(req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});

var port = 4000;

app.listen(port, "localhost", function(err) {
  if (err) {
    console.log("error", err);
    return;
  }

  console.log("Listening at http://localhost:" + port);
});
