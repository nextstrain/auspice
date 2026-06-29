const utils = require("../utils");
const fs = require('fs');
const path = require("path");
const { promisify } = require('util');
const { findAvailableSecondTreeOptions } = require('./getDatasetHelpers');

const readdir = promisify(fs.readdir);

const getAvailableDatasets = (dir, files) => {
  const datasets = [];
  /* NOTE: if there are v1 & v2 files with the same name the v2 JSON is
   * preferentially fetched. E.g. if `zika.json`, `zika_meta.json` and
   * `zika_tree.json` exist then only `zika.json` is viewable in auspice.
   */

  /* v2 files -- match JSONs not ending with `_tree.json`, `_meta.json`,
  `_tip-frequencies.json`, `_seq.json` */
  const v2Files = files.filter((file) => (
    file.endsWith(".json") &&
    !file.includes("manifest") &&
    !file.endsWith("_tree.json") &&
    !file.endsWith("_meta.json") &&
    !file.endsWith("_tip-frequencies.json") &&
    !file.endsWith("_root-sequence.json") &&
    !file.endsWith("_seq.json") &&
    !file.endsWith("_measurements.json")
  ))
  .map((file) => file
    .replace(".json", "")
    .split("_")
    .join("/")
  );

  v2Files.forEach((filepath) => {
    datasets.push({
      request: filepath,
      v2: true,
      secondTreeOptions: findAvailableSecondTreeOptions(filepath, v2Files),
      fileType: 'dataset',
      dir,
    });
  });

  /* v1 files -- match files ending with `_tree.json` */
  const v1Files = files
    .filter((file) => file.endsWith("_tree.json"))
    .map((file) => file
      .replace("_tree.json", "")
      .split("_")
      .join("/")
    );

  v1Files.forEach((filepath) => {
    datasets.push({
      request: filepath,
      v2: false,
      secondTreeOptions: findAvailableSecondTreeOptions(filepath, v1Files),
      fileType: 'dataset',
      dir,
    });
  });
  return datasets;
};

const getAvailableNarratives = (dir, files) => {
  return files
    .filter((file) => file.endsWith(".md") && file!=="README.md")
    .map((file) => ({
      fullPath: path.join(dir, file),
      request: 'narratives/' + file.replace(".md", "").split("_").join("/"),
      fileType: 'narrative',
    }));
};

const setUpGetAvailableHandler = (dataPaths) => {
  /* return Auspice's default handler for "/charon/getAvailable" requests.
   * Remember that auspice itself only serves local files.
   * Servers often use their own handler instead of this.
   */
  return async (req, res) => {
    utils.log("GET AVAILABLE returning locally available datasets & narratives");
    let resources = []
    for (const [p, dataTypes] of Object.entries(dataPaths)) {
      try {
        // FUTURE TODO - recurse into subfolders (readdir can do this natively)
        const files = await readdir(p);
        if (dataTypes.has('datasets')) {
          resources.push(...getAvailableDatasets(p, files))
        }
        if (dataTypes.has('narratives')) {
          resources.push(...getAvailableNarratives(p, files))
        }
      } catch (err) {
        utils.warn(`Couldn't collect files (path searched: ${p})`);
        utils.verbose(err);
      }
    }
    resources = unique(resources)

    /* convert to the expected API response structure */
    res.json(availableResponseStructure(resources));
  };

};


module.exports = {
  setUpGetAvailableHandler,
  getAvailableDatasets,
  getAvailableNarratives,
};

function availableResponseStructure(resources) {
  const datasets = resources.filter((r) => r.fileType==='dataset')
    .map((r) => ({request: r.request, buildUrl: r.buildUrl, secondTreeOptions: r.secondTreeOptions}));
  const narratives = resources.filter((r) => r.fileType==='narrative')
    .map((r) => ({request: r.request}));
  return {datasets, narratives};
}

/**
 * First match wins
 */
function unique(resources) {
  const seen = {dataset: new Set(), narrative: new Set()};
  return resources.filter((r) => {
    if (seen[r.fileType].has(r.request)) {
      // utils.verbose(`Dropping duplicate ${r.request} from available`); // Too verbose!
      return false;
    }
    seen[r.fileType].add(r.request);
    return true;
  })
}