import * as utils from "../utils.ts";
import fs from 'fs';
import path from "path";
import { promisify } from 'util';
import { findAvailableSecondTreeOptions } from './getDatasetHelpers.ts';

const readdir = promisify(fs.readdir);

export interface DatasetInfo {
  request: string;
  v2: boolean;
  secondTreeOptions: string[];
  fileType: string;
  dir: string;
  buildUrl?: string;
}

export interface NarrativeInfo {
  fullPath: string;
  request: string;
  fileType: string;
}

export const getAvailableDatasets = (dir, files): DatasetInfo[] => {
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

export const getAvailableNarratives = (dir, files): NarrativeInfo[] => {
  return files
    .filter((file) => file.endsWith(".md") && file!=="README.md")
    .map((file) => ({
      fullPath: path.join(dir, file),
      request: 'narratives/' + file.replace(".md", "").split("_").join("/"),
      fileType: 'narrative',
    }));
};

export const setUpGetAvailableHandler = (dataPaths) => {
  /* return Auspice's default handler for "/charon/getAvailable" requests.
   * Remember that auspice itself only serves local files.
   * Servers often use their own handler instead of this.
   */
  return async (_req, res): Promise<void> => {
    utils.log("GET AVAILABLE returning locally available datasets & narratives");
    let resources: (DatasetInfo | NarrativeInfo)[] = []
    /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
    for (const [p, dataTypes] of Object.entries(dataPaths) as [string, Set<string>][]) {
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

function availableResponseStructure(resources: (DatasetInfo | NarrativeInfo)[]): {datasets: {request: string, buildUrl?: string, secondTreeOptions?: string[]}[], narratives: {request: string}[]} {
  const datasets = resources.filter((r): r is DatasetInfo => r.fileType==='dataset')
    .map((r) => ({request: r.request, buildUrl: r.buildUrl, secondTreeOptions: r.secondTreeOptions}));
  const narratives = resources.filter((r): r is NarrativeInfo => r.fileType==='narrative')
    .map((r) => ({request: r.request}));
  return {datasets, narratives};
}

/**
 * First match wins
 */
function unique(resources: (DatasetInfo | NarrativeInfo)[]): (DatasetInfo | NarrativeInfo)[] {
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
