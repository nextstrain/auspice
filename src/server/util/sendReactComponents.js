/* eslint no-console: off */
const React = require("react");
const ReactDOMServer = require('react-dom/server');
const ReactMarkdown = require('react-markdown');
const fs = require('fs');
const path = require("path");

/* https://github.com/rexxars/react-markdown */

const serveStaticReport = (query, res) => {
  console.log("serveStaticReport()");
  if (Object.keys(query).indexOf("path") === -1) {
    res.status(404).send('No path found in query');
    return;
  }
  // THIS MUST BE TURNED INTO PROMISES!!!!!!
  /* 1: get and parse the markdown file */
  let md;
  if (global.LOCAL_DATA) {
    md = fs.readFileSync(path.join(global.LOCAL_DATA_PATH, query.path), 'utf8');
  } else {
    md = '# no puedo';
  }
  //
  // console.log("(1): get and parse the file " + query.path);
  // console.log("(2): construct the react component");
  // console.log("(3): send it down the wire");
  // res.send(ReactDOMServer.renderToStaticMarkup(<ReportBody path={query.path}/>));
  res.send(ReactDOMServer.renderToStaticMarkup(<ReactMarkdown source={md} />));
};

module.exports = {
  serveStaticReport
};
