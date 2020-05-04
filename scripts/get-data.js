const rimraf = require("rimraf");
const path = require("path");
const { promisify } = require("util");
const request = require("request");
const fs = require("fs");

const pGet = promisify(request.get).bind(request);

const root = path.resolve(__dirname, "..");
const dataDir = path.join(root, "data");
const narrativeDir = path.join(root, "narratives");

(async () => {
  await promisify(rimraf)(dataDir);
  await promisify(rimraf)(narrativeDir);
  fs.mkdirSync(dataDir);
  fs.mkdirSync(narrativeDir);

  const available = (await pGet({ url: "https://nextstrain.org/charon/getAvailable?prefix=narratives", gzip: true, json: true })).body;

  const { datasets, narratives } = available;

  const downloadedDatasets = {};

  const allPromises = [];

  const downloadDataset = async prefix => {
    if (downloadedDatasets[prefix]) return;
    console.log("Downloading dataset...", prefix);
    downloadedDatasets[prefix] = true;
    const jsonData = (await pGet({ url: `https://nextstrain.org/charon/getDataset?prefix=${prefix}`, gzip: true, json: true })).body;
    if (!jsonData) return;
    await promisify(fs.writeFile).bind(fs)(path.join(dataDir, prefix.replace(/\//g, "_") + ".json"), JSON.stringify(jsonData, null, 1));
  }

  allPromises.push(downloadDataset("ncov"));
  for (const dataset of datasets.filter(ds => ds.request.startsWith("ncov"))) allPromises.push(downloadDataset(dataset.request));

  for (const narrative of narratives)
    allPromises.push(
      (async () => {
        console.log("Downloading narrative...", narrative.request);
        const jsonData = (await pGet({ url: `https://nextstrain.org/charon/getNarrative?prefix=${narrative.request}`, gzip: true, json: true })).body;
        promisify(fs.writeFile).bind(fs)(path.join(narrativeDir, narrative.request.replace("narratives/", "").replace(/\//g, "_") + ".json"), JSON.stringify(jsonData, null, 1));
        for (const block of jsonData) {
          const narrativeDataset = block.dataset;
          allPromises.push(downloadDataset(narrativeDataset));
          if (narrativeDataset.includes("global"))
            for (const region of ["africa", "asia", "europe", "north-america", "oceania", "south-america"])
              allPromises.push(downloadDataset(narrativeDataset.replace("global", region)));
        }
      })()
    )

  await Promise.all(allPromises);
})();
