const utils = require("./utils");
const queryString = require("query-string");
const fs = require('fs');
const fetch = require('node-fetch');
const sourceSelect = require("./sourceSelect");

const collectAvailableNarratives = (source) => new Promise((resolve, reject) => {
  const parseFiles = (files) => {
    const parsed = files
      .filter((file) => file.endsWith(".md") && file!=="README.md")
      .map((file) => file.replace(".md", ""))
      .map((file) => file.split("_"));
    parsed.forEach((partsOfPath) => {partsOfPath.splice(0, 0, "narratives");});
    return parsed;
  };

  if (source === "local") {
    let files;
    try {
      files = fs.readdirSync(global.LOCAL_NARRATIVES_PATH);
      resolve(parseFiles(files));
    } catch (err) {
      reject("local narratives readdirSync err" + err);
    }
    return;
  }

  if (source === "live") {
    fetch("https://api.github.com/repos/nextstrain/narratives/contents")
      .then((result) => result.json())
      .then((json) => {
	const data = parseFiles(json.map((b) => b.name));
	if (!data) {
	  reject(`No available narratives`);
	}
	resolve(data);
      })
      .catch(() => {
	reject(`Error fetching github narrative list`);
      });
    return;
  }
  reject("collectAndSendNarratives unavailable");
});

const collectDatasets = (source) => {
  if (source === "local" && global.LOCAL_MANIFEST) {
    return global.LOCAL_MANIFEST;
  } else if (source === "live" && global.LIVE_MANIFEST) {
    return global.LIVE_MANIFEST;
  } else if (source === "staging" && global.STAGING_MANIFEST) {
    return global.STAGING_MANIFEST;
  }
  throw new Error("Failed to collect datasets");
};

const getAvailable = async (req, res) => {
  const prefix = queryString.parse(req.url.split('?')[1]).prefix || "";
  const source = sourceSelect.getSource(prefix);
  utils.log(`Collecting available datasets & narratives for source ${source}`);

  let narratives = [];
  let datasets = [];
  try {
    datasets = collectDatasets(source);
  } catch (err) {
    utils.warn(err);
  }
  try {
    narratives = await collectAvailableNarratives(source);
  } catch (err) {
    utils.warn(err);
  }

  res.json({datasets, narratives, source});
};

module.exports = {
  default: getAvailable,
  getAvailable,
  collectDatasets
};
