const queryString = require("query-string");
const parseNarrative = require('./parseNarrative').default;
const path = require("path");
const fs = require("fs");
const utils = require("../utils");

const setUpGetNarrativeHandler = ({narrativesPath}) => {
  return async (req, res) => {
    const prefix = queryString.parse(req.url.split('?')[1]).prefix || "";
    const filename = prefix
      .replace(/.+narratives\//, "")  // remove the URL up to (& including) "narratives/"
      .replace(/\/$/, "")             // remove ending slash
      .replace(/\//g, "_")            // change slashes to underscores
      .concat(".md");                 // add .md suffix

    const pathName = path.join(narrativesPath, filename);
    utils.log("trying to access & parse local narrative file: " + pathName);
    try {
      const fileContents = fs.readFileSync(pathName, 'utf8');
      const blocks = parseNarrative(fileContents);
      res.send(JSON.stringify(blocks).replace(/</g, '\\u003c'));
      utils.verbose("SUCCESS");
    } catch (err) {
      const errorMessage = `Narratives couldn't be served -- ${err.message}`;
      utils.warn(errorMessage);
      res.status(500).type("text/plain").send(errorMessage);
    }
  };
};

module.exports = {
  setUpGetNarrativeHandler
};
