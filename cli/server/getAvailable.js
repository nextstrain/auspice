const utils = require("../utils");
const fs = require('fs');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);

const getAvailableDatasets = async (localDataPath) => {
  const datasets = [];
  try {
    const files = await readdir(localDataPath);
    /* v2 files -- match JSONs not ending with `_tree.json`, `_meta.json`,
    `_tip-frequencies.json`. This comes first so that for two datasets with
    the same name, the v2 JSONs will be preferentially fetched. */
    files
    .filter((file) => (file.endsWith(".json") && !file.includes("manifest")))
    .filter((file) => (!file.endsWith("_tree.json") && !file.endsWith("_meta.json") && !file.endsWith("_tip-frequencies.json")))
    .map((file) => file
      .replace(".json", "")
      .split("_")
      .join("/")
    )
    .forEach((filepath) => {
      datasets.push({request: filepath, v2: true});
    });
    /* v1 files -- match files ending with `_tree.json` */
    files
      .filter((file) => file.endsWith("_tree.json"))
      .map((file) => file
        .replace("_tree.json", "")
        .split("_")
        .join("/")
      )
      .forEach((filepath) => {
        datasets.push({request: filepath, v2: false});
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
