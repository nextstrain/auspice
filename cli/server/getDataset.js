const { promisify } = require('util');
const path = require("path");
const fs = require('fs');
const getAvailable = require("./getAvailable");
const helpers = require("./getDatasetHelpers");
const utils = require("../utils");

const readdir = promisify(fs.readdir);

const setUpGetDatasetHandler = (dataPaths) => {
  return async (req, res) => {
    const allAvailable = []

    let requestInfo;
    try {
      requestInfo = helpers.interpretRequest(req);
    } catch (err) {
      return helpers.handleError(res, err.message, err.message, 400);
    }

    /**
     * Iterate through the dataPaths and return the first match we find
     * (this "first match wins" approach mirrors that of `getAvailable`)
     */
    for (const [p, dataTypes] of Object.entries(dataPaths)) {
      if (!dataTypes.has('datasets')) continue;
      try {
        const files = await readdir(p);
        const available = getAvailable.getAvailableDatasets(p, files);
        const dataset = match(available, requestInfo);
        if (dataset) {
          requestInfo.address = dataset.v2 ? 
            path.join(dataset.dir, `${requestInfo.parts.join("_")}.json`) :
            ({
              meta: path.join(dataset.dir, `${requestInfo.parts.join("_")}_meta.json`),
              tree: path.join(dataset.dir, `${requestInfo.parts.join("_")}_tree.json`)
            });
          return await helpers.sendJson(res, requestInfo);
        }
        allAvailable.push(...available);
      } catch (err) {
        utils.warn(`Error reading datasets from ${p}: ${err.message}`)
      }
    }

    /* No perfect match - attempt to find a close one... */
    const closeMatchRequest = helpers.closestMatch(requestInfo.parts, allAvailable);
    if (closeMatchRequest) {
      utils.verbose(`Redirecting request to ${closeMatchRequest}`);
      return res.redirect(`./getDataset?prefix=/${closeMatchRequest}`);
    }

    return helpers.handleError(res, `no matching dataset`, `no matching dataset`, 404);
  };
};

function match(resources, requestInfo) {
  for (const resource of resources) {
    if (
      (resource.fileType === requestInfo.dataType) &&
      (resource.request === requestInfo.parts.join("/"))
    ) return resource;
  }
  return false;
}


module.exports = {
  setUpGetDatasetHandler
};
