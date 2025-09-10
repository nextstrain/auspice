const queryString = require("query-string");
const { promisify } = require('util');
const fs = require("fs");
const utils = require("../utils");
const getAvailable = require("./getAvailable");

const readdir = promisify(fs.readdir);


const setUpGetNarrativeHandler = (dataPaths) => {
  return async (req, res) => {
    utils.log(`GET NARRATIVE request received: ${req.url}`);
    const query = queryString.parse(req.url.split('?')[1]);
    const type = query.type ? query.type.toLowerCase() : null;
    if (!(type === "md" || type === "markdown")) {
      return res.status(401).type("text/plain").send(`Unknown format requested: ${type}`);
    }
    if (!query.prefix || !(String(query.prefix).startsWith('narratives/') || String(query.prefix).startsWith('/narratives/'))) {
      return res.status(401).type("text/plain").send(`Query must include a prefix starting with [/]narratives/`);
    }

    const requestStr = query.prefix // we know this starts with [/]narratives/
      .replace(/^\//, "")  // remove leading slash
      .replace(/\/$/, "")  // remove ending slash

    for (const [p, dataTypes] of Object.entries(dataPaths)) {
      if (!dataTypes.has('narratives')) continue;
      try {
        const files = await readdir(p);
        const match = getAvailable.getAvailableNarratives(p, files)
          .filter((d) => d.request===requestStr)[0]
        if (match) {
          // we could stream the response (as we sometimes do for getDataset) but narrative files are small
          // so the expected time savings / server overhead is small.
          return res.send(fs.readFileSync(match.fullPath, 'utf8'));
        }
        // else go scan the next dataPaths (directory)
      } catch (err) {
        const errorMessage = `Narratives couldn't be served -- ${err.message}`;
        utils.warn(errorMessage);
        res.status(500).type("text/plain").send(errorMessage);
      }
    }
    const errorMessage = `No matching narrative found`;
    utils.warn(errorMessage);
    res.status(404).type("text/plain").send(errorMessage);
  }
};

module.exports = {
  setUpGetNarrativeHandler,
};
