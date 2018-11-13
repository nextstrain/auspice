const utils = require("./utils");
const fs = require('fs');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);

const getAvailableDatasets = async () => {
  let datasets = [];
  try {
    /* currently only for version 1.0 JSONs... */
    datasets = await readdir(global.LOCAL_DATA_PATH);
    datasets = datasets
      .filter((file) => file.endsWith("_tree.json"))
      .map((file) => file
	.replace("_tree.json", "")
	.split("_")
	.join("/")
      )
      .map((filepath) => ({request: filepath}));
  } catch (err) {
    utils.warn('Error getting local files');
    utils.warn(err);
  }
  return datasets;
};

const getAvailableNarratives = async () => {
  let narratives = [];
  try {
    narratives = await readdir(global.LOCAL_NARRATIVES_PATH);
    narratives = narratives
      .filter((file) => file.endsWith(".md") && file!=="README.md")
      .map((file) => file.replace(".md", ""))
      .map((file) => file.split("_").join("/"))
      .map((filepath) => `narratives/${filepath}`)
      .map((filepath) => ({request: filepath}));
  } catch (err) {
    utils.warn('Error getting local narratives');
    utils.warn(err);
  }
  return narratives;
};

/* Auspice's handler for "/charon/getAvailable" requests.
 * Remember that auspice itself only serves local files.
 * It is the server (e.g. nextstrain.org) which changes this capability
 */
const getAvailable = async (req, res) => {
  utils.verbose("Returning locally available datasets & narratives");
  const datasets = await getAvailableDatasets();
  const narratives = await getAvailableNarratives();
  res.json({datasets, narratives});
};

module.exports = {
  default: getAvailable,
  getAvailable,
  getAvailableDatasets,
  getAvailableNarratives
};
