/* eslint no-console: off */
const React = require("react");
const ReactDOMServer = require('react-dom/server');
const ReportBody = require('../components/reportBody').ReportBody;

const serveStaticReport = (query, res) => {
  console.log("sending static react");
  res.send(ReactDOMServer.renderToStaticMarkup(<ReportBody/>));
};

module.exports = {
  serveStaticReport
};
