const utils = require("../utils");
const fs = require('fs');
const { promisify } = require('util');
const { findAvailableSecondTreeOptions } = require('./getDatasetHelpers');

const readdir = promisify(fs.readdir);

const getAvailableDatasets = async (localDataPath) => {
  const datasets = [];
  /* NOTE: if there are v1 & v2 files with the same name the v2 JSON is
   * preferentially fetched. E.g. if `zika.json`, `zika_meta.json` and
   * `zika_tree.json` exist then only `zika.json` is viewable in auspice.
   */
  try {
    const files = await readdir(localDataPath);
    /* v2 files -- match JSONs not ending with `_tree.json`, `_meta.json`,
    `_tip-frequencies.json`, `_seq.json` */
    const v2Files = files.filter((file) => (
      file.endsWith(".json") &&
      !file.includes("manifest") &&
      !file.endsWith("_tree.json") &&
      !file.endsWith("_meta.json") &&
      !file.endsWith("_tip-frequencies.json") &&
      !file.endsWith("_root-sequence.json") &&
      !file.endsWith("_seq.json")
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
        secondTreeOptions: findAvailableSecondTreeOptions(filepath, v2Files)
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
        secondTreeOptions: findAvailableSecondTreeOptions(filepath, v1Files)
      });
    });
  } catch (err) {
    utils.warn(`Couldn't collect available dataset files (path searched: ${localDataPath})`);
    utils.verbose(err);
  }
  return datasets;
};

const getAvailableNarratives = async (localNarrativesPath) => {
  let narratives = [];
  try {
    narratives = await readdir(localNarrativesPath);
    narratives = narratives
      .filter((file) => file.endsWith(".md") && file!=="README.md")
      .map((file) => file.replace(".md", ""))
      .map((file) => file.split("_").join("/"))
      .map((filepath) => `narratives/${filepath}`)
      .map((filepath) => ({request: filepath}));
  } catch (err) {
    utils.warn(`Couldn't collect available narratives (path searched: ${localNarrativesPath})`);
    utils.verbose(err);
  }
  return narratives;
};

const setUpGetAvailableHandler = ({datasetsPath, narrativesPath}) => {
  /* return Auspice's default handler for "/charon/getAvailable" requests.
   * Remember that auspice itself only serves local files.
   * Servers often use their own handler instead of this.
   */
  return async (req, res) => {
    utils.log("GET AVAILABLE returning locally available datasets & narratives");
    const datasets = await getAvailableDatasets(datasetsPath);
    const narratives = await getAvailableNarratives(narrativesPath);
    res.json({datasets, narratives});
  };

};


module.exports = {
  setUpGetAvailableHandler,
  getAvailableDatasets,
  getAvailableNarratives
};
