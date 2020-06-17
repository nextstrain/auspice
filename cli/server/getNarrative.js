const queryString = require("query-string");
const parseNarrative = require('./parseNarrative').default;
const path = require("path");
const fs = require("fs");
const utils = require("../utils");

const setUpGetNarrativeHandler = ({narrativesPath}) => {
  return async (req, res) => {
    const query = queryString.parse(req.url.split('?')[1]);
    const prefix = query.prefix || "";
    const filename = prefix
      .replace(/.+narratives\//, "")  // remove the URL up to (& including) "narratives/"
      .replace(/\/$/, "")             // remove ending slash
      .replace(/\//g, "_")            // change slashes to underscores
      .concat(".md");                 // add .md suffix

    // the type-query string dictates whether to parse into JSON on the server or not
    // we default to JSON which was behavior before this argument existed
    const type = query.type ? query.type.toLowerCase() : "json";

    const pathName = path.join(narrativesPath, filename);
    utils.log("trying to access & parse local narrative file: " + pathName);
    try {
      const fileContents = fs.readFileSync(pathName, 'utf8');
      if (type === "md" || type === "markdown") {
        // we could stream the response (as we sometimes do for getDataset) but narrative files are small
        // so the expected time savings / server overhead is small.
        res.send(fileContents);
      } else if (type === "json") {
        const blocks = parseNarrative(fileContents);
        res.send(JSON.stringify(blocks).replace(/</g, '\\u003c'));
      } else {
        throw new Error(`Unknown format requested: ${type}`);
      }
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
