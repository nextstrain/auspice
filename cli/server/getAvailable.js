const utils = require("../utils");
const fs = require('fs');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);

const getAvailableDatasets = async (localDataPath) => {
  let datasets = [];
  try {
    /* currently only for version 1.0 JSONs... */
    datasets = await readdir(localDataPath);
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
    utils.warn('Error getting local narratives');
    utils.warn(err);
  }
  return narratives;
};

const setUpGetAvailableHandler = ({datasetsPath, narrativesPath}) => {
  /* return Auspice's default handler for "/charon/getAvailable" requests.
   * Remember that auspice itself only serves local files.
   * Servers often use their own handler instead of this.
   */
  return async (req, res) => {
    utils.verbose("Returning locally available datasets & narratives");
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
