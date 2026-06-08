import { promisify } from 'util';
import path from "path";
import fs from 'fs';
import * as getAvailable from "./getAvailable.ts";
import * as helpers from "./getDatasetHelpers.ts";
import * as utils from "../utils.ts";

const readdir = promisify(fs.readdir);

/**
 * Returns a route handler which responds to requests by serving the relevant JSON file
 * from disk.
 */
export const setUpGetDatasetHandler = (dataPaths) => {
  return async (req, res) => {

    let requestInfo;
    try {
      requestInfo = helpers.interpretRequest(req);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return helpers.handleError(res, msg, msg, 400);
    }

    const matchResult = await matchDatasetFile(dataPaths, requestInfo);

    if (!Array.isArray(matchResult)) {
      return await helpers.sendJson(res, { ...requestInfo, address: matchResult });
    }

    /* No perfect match - attempt to find a close one iff type=dataset */
    if (requestInfo.dataType==='dataset') {
      const closeMatchRequest = helpers.closestMatch(requestInfo.parts, matchResult);
      if (closeMatchRequest) {
        utils.verbose(`Redirecting request to ${closeMatchRequest}`);
        return res.redirect(`./getDataset?prefix=/${closeMatchRequest}`);
      }
    }

    /* fallthrough to 404 error */
    const msg = `no matching file for ${requestInfo.dataType || 'unknown data type'}`;
    return helpers.handleError(res, msg, msg, 404);
  };
};


/** Charon sidecar type query -> filename suffix */
const SIDECARS = {
  'root-sequence': '_root-sequence.json',
  'tip-frequencies': '_tip-frequencies.json',
  measurements: '_measurements.json',
}

/** Walk through folders (dataPaths) looking for a file on disk which
 * exactly matches (in terms of dataset name & type). We return the
 * first exact match ("first match wins"), which mirrors `getAvailable`
 *
 * Return either:
 *  - string: the path to a v2 main dataset / sidecar JSON
 *  - object: the paths for (v1) meta/tree dataset JSONs
 *  - array:  no matching file found. The array represents all available datasets
 */
async function matchDatasetFile(dataPaths, requestInfo) {
  /**
   * Iterate through the dataPaths and return the first match we find
   * (this "first match wins" approach mirrors that of `getAvailable`)
   */
  const allAvailableDatasets = []
  for (const [dir, dataTypes] of Object.entries(dataPaths) as [string, Set<string>][]) {
    if (!dataTypes.has('datasets')) continue;
    let files: string[] = [];
    try {
      files = await readdir(dir);
    } catch (err) {
      utils.warn(`Error reading datasets from ${dir}: ${err instanceof Error ? err.message : err}`)
    }

    if (requestInfo.dataType==='dataset') {
      // list all available datasets -- includes v1 (meta+tree) & v2 ("main") dataset
      const availableDatasets = getAvailable.getAvailableDatasets(dir, files);
      allAvailableDatasets.push(...availableDatasets);
      for (const resource of availableDatasets) {
        if (resource.request === requestInfo.parts.join("/")) {
          const address = resource.v2 ?
            path.join(resource.dir, `${requestInfo.parts.join("_")}.json`) :
            ({
              meta: path.join(resource.dir, `${requestInfo.parts.join("_")}_meta.json`),
              tree: path.join(resource.dir, `${requestInfo.parts.join("_")}_tree.json`)
            });
          return address;
        }
      }
    } else if (Object.hasOwn(SIDECARS, requestInfo.dataType)) {
      const expectedFileName = requestInfo.parts.join("_") + SIDECARS[requestInfo.dataType];
      const matches = files.filter((f) => f === expectedFileName);
      if (matches.length) {
        return path.join(dir, matches[0]);
      }
    }
  }
  return allAvailableDatasets;
}
