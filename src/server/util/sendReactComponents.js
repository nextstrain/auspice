/* eslint no-console: off */
const React = require("react");
const ReactDOMServer = require('react-dom/server');
const ReportBody = require('../components/reportBody').ReportBody;

const serveStaticReport = (query, res) => {
  console.log("serveStaticReport()");
  if (Object.keys(query).indexOf("path") === -1) {
    res.status(404).send('No path found');
    return;
  }
  console.log("(1): get and parse the file " + query.path);
  console.log("(2): construct the react component");
  console.log("(3): send it down the wire");
  res.send(ReactDOMServer.renderToStaticMarkup(<ReportBody path={query.path}/>));
};

module.exports = {
  serveStaticReport
};
