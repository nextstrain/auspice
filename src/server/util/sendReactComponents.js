/* eslint no-console: off */
const React = require("react");
const ReactDOMServer = require('react-dom/server');
const ReactMarkdown = require('react-markdown'); /* https://github.com/rexxars/react-markdown */
const fs = require('fs');
const path = require("path");
const request = require('request');

const serveStaticPost = (query, res) => {
  if (Object.keys(query).indexOf("path") === -1) {
    res.status(404).send('No path found in query');
    return;
  }
  if (global.LOCAL_STATIC) {
    /* this code is syncronous, but that's ok since this is never used in production */
    const md = fs.readFileSync(path.join(global.LOCAL_STATIC_PATH, query.path), 'utf8');
    res.send(ReactDOMServer.renderToStaticMarkup(<ReactMarkdown source={md} />));
  } else {
    request(global.REMOTE_STATIC_BASEURL + query.path, (err, response, body) => {
      if (err || body.split("\n")[1] === '<head><title>404 Not Found</title></head>') {
        res.status(404).send('Post not found.');
        return;
      }
      res.send(ReactDOMServer.renderToStaticMarkup(<ReactMarkdown source={body} />));
    });
  }
};

module.exports = {
  serveStaticPost
};
