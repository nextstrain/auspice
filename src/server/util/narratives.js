/* eslint no-console: off */
const React = require("react");
const ReactDOMServer = require('react-dom/server');
const ReactMarkdown = require('react-markdown'); /* https://github.com/rexxars/react-markdown */
const fs = require('fs');
const path = require("path");
const request = require('request');

const makeBlock = (url = "") => {
  return ({lines: [], url});
};

const parsePreamble = (blocks, lines) => {
  if (!lines[0].startsWith("---")) {
    return 0;
  }
  const block = makeBlock(); /* initialise */
  const contents = {title: false, author: false, date: false, category: false};
  let n = 1;
  while (n < lines.length) {
    if (lines[n].startsWith("---")) {
      break;
    }
    const parts = lines[n].split(': ');
    if (parts.length === 2 && contents[parts[0]] === false) {
      contents[parts[0]] = parts[1];
    }
    n++;
  }
  if (contents.title) block.lines.push(`# ${contents.title}`);
  if (contents.author) block.lines.push(`* _Written by:_ **${contents.author}**`);
  if (contents.date) block.lines.push(`* _Date:_ **${contents.date}**`);
  if (contents.category) block.lines.push(`* _Category:_ **${contents.category}**`);
  blocks.push(block);
  return ++n;
};


const parseMarkdownArray = (mdArr) => {
  const blocks = [];
  const nMax = mdArr.length;
  const reUrl = /url=[^\s]+\?([^\s`]*)/;
  let n = parsePreamble(blocks, mdArr); /* modifies blocks in-place */
  let block = makeBlock(); /* initialise */
  while (n < nMax) {
    const line = mdArr[n];
    if (line.startsWith('`nextstrain') && line.match(reUrl)) {
      if (block.lines.length && block.lines.filter((l) => l.length).length) {
        blocks.push(block); /* push the previous block onto the stack */
      }
      block = makeBlock(line.match(reUrl)[1]);
    } else {
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
