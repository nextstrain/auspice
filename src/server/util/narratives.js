/* eslint no-console: off */
const React = require("react");
const ReactDOMServer = require('react-dom/server');
const ReactMarkdown = require('react-markdown'); /* https://github.com/rexxars/react-markdown */
const fs = require('fs');
const path = require("path");
const request = require('request');

const makeBlock = (url = false, title = "Untitled") => {
  return ({lines: [], url, title});
};

const parseMarkdownArray = (mdArr) => {
  const blocks = [];
  const nMax = mdArr.length;
  const reUrl = /url=([^\s`]+)/;
  const reTitle = /#\s+(.+$)/;
  let titleSet = false;
  let n = 0;
  let block = makeBlock(); /* initialise */
  while (n < nMax) {
    const line = mdArr[n];
    if (line.startsWith('`nextstrain')) {
      if (line.includes("newBlock")) {
        if (block.lines.length) {
          blocks.push(block); /* push the previous block onto the stack */
        }
        block = makeBlock();
        if (line.match(reUrl)) {
          block.url = line.match(reUrl)[1];
        }
        titleSet = false;
      } else {
        console.warn("Narrative: ignoring nextstrain line without newBlock");
      }
    } else if (!titleSet) {
      if (line.startsWith('#')) {
        titleSet = true;
        if (line.match(reTitle)) {
          block.title = line.match(reTitle)[1];
        } else {
          console.warn("Narrative: incorrectly parsed this title:", line);
        }
      }
    } else {
      /* title is set and it's not a instruction line */
      block.lines.push(line);
    }
    n++;
  }
  blocks.push(block); /* clean up, push the last block onto the stack */
  return blocks;
};

const convertBlocksToHTML = (blocks) => {
  for (const block of blocks) {
    // eslint-disable-next-line no-underscore-dangle
    block.__html = ReactDOMServer.renderToStaticMarkup(<ReactMarkdown source={block.lines.join("\n")} />);
    delete block.lines;
  }
};

const serveNarrative = (query, res) => {
  if (global.LOCAL_STATIC) {
    /* this code is syncronous, but that's ok since this is never used in production */
    const mdArr = fs.readFileSync(path.join(global.LOCAL_STATIC_PATH, "narratives", query.name + ".md"), 'utf8').split("\n");
    const blocks = parseMarkdownArray(mdArr);
    convertBlocksToHTML(blocks);
    res.send(JSON.stringify(blocks).replace(/</g, '\\u003c'));
  } else {
    request(global.REMOTE_STATIC_BASEURL + "narratives/" + query.name + ".md", (err, response, body) => {
      if (err || body.startsWith("404") || body.split("\n")[1].startsWith('<head><title>404')) {
        res.status(404).send('Post not found.');
        return;
      }
      const mdArr = body.split("\n");
      const blocks = parseMarkdownArray(mdArr);
      convertBlocksToHTML(blocks);
      res.send(JSON.stringify(blocks).replace(/</g, '\\u003c'));
    });
  }
};

module.exports = {
  serveNarrative
};
