var path = require("path");
var express = require("express");
var webpack = require("webpack");
var config = require("./webpack.config.dev");
var request = require("request");

var app = express();
var compiler = webpack(config);

app.use(require("webpack-dev-middleware")(compiler, {
  noInfo: true,
  publicPath: config.output.publicPath
}));

app.use(require("webpack-hot-middleware")(compiler));

app.get("/Zika_meta", function(req, res) {
  request("http://flu.tuebingen.mpg.de/data/H3N2_1985to2016_meta.json", function(err,r) {
    if (err) {console.log('error getting data', err)}
    // console.log(r.toJSON())
    res.send(r.toJSON());
  });
});

app.get("/Zika_tree", function(req, res) {
  request({
    method: "get",
    uri: "http://dev.nextflu.org/data/h3n2_6y_tree.json",
    gzip: true
  }, function(err,r) {
    if (err) {console.log('error getting data', err)}
    res.send(r.toJSON());
  });
});

app.get("/Zika_sequences", function(req, res) {
  request({
    method: "get",
    uri: "http://dev.nextflu.org/data/h3n2_6y_sequences.json",
    gzip: true
  }, function(err,r) {
    if (err) {console.log('error getting data', err)}
    res.send(r.toJSON());
  });
});

app.get("/Zika_frequencies", function(req, res) {
  request({
    method: "get",
    uri: "http://dev.nextflu.org/data/h3n2_6y_frequencies.json",
    gzip: true
  }, function(err,r) {
    if (err) {console.log('error getting data', err)}
    res.send(r.toJSON());
  });
});

app.get("/Zika_entropy", function(req, res) {
  request({
    method: "get",
    uri: "http://dev.nextflu.org/data/h3n2_6y_entropy.json",
    gzip: true
  }, function(err,r) {
    if (err) {console.log('error getting data', err)}
    res.send(r.toJSON());
  });
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
