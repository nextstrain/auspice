const queryString = require("query-string");
const parseNarrative = require('./parseNarrative').default;
const path = require("path");
const utils = require("./utils");
const fs = require('fs');

const getNarrative = (req, res) => {
  const prefix = queryString.parse(req.url.split('?')[1]).prefix || "";
  const filename = prefix
    .replace(/.+narratives\//, "")  // remove the URL up to (& including) "narratives/"
    .replace(/\/$/, "")             // remove ending slash
    .replace(/\//g, "_")            // change slashes to underscores
    .concat(".md");                 // add .md suffix

  const pathName = path.join(global.LOCAL_NARRATIVES_PATH, filename);
  utils.log("trying to access & parse local narrative file: " + pathName);
  try {
    const fileContents = fs.readFileSync(pathName, 'utf8');
    const blocks = parseNarrative(fileContents);
    res.send(JSON.stringify(blocks).replace(/</g, '\\u003c'));
    utils.verbose("SUCCESS");
  } catch (err) {
    res.statusMessage = `Narratives couldn't be served -- ${err.message}`;
    utils.warn(res.statusMessage);
    res.status(500).end();
  }
};

module.exports = {
  getNarrative,
  default: getNarrative
};
