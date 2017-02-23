var path = require("path");
var express = require("express");
var expressStaticGzip = require("express-static-gzip");

var app = express();
app.set('port', process.env.PORT || 8080);
app.use("/dist", expressStaticGzip("dist"));
app.use('/dist', express.static('dist'))

app.get("/favicon.png", function(req, res) {
  res.sendFile(path.join(__dirname, "favicon.png")); 
});

app.get("*", function(req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Listen for requests
var server = app.listen(app.get('port'), function() {
  var port = server.address().port;
  console.log('Listening on port ' + port);
});
