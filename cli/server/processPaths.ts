import * as utils from "../utils.ts";

/**
 * Returns an object linking (absolute) paths to a set whose members indicate whether
 * the path should be searched for dataset JSONs, narrative markdown files, or both.
 *
 * Historically the CLI took a single dataset path and a single narrative path, and
 * that behaviour is still allowed here in addition to the newer approach of supplying
 * any number of paths which can contain datasets and/or narratives. The two approaches
 * are mutually exclusive and enforcement of this happens here.
 *
 * If no paths are provided via arguments then we attempt to choose sensible defaults
 * (via `defaultDataPaths()`), however in my (james) experience it's never worked
 * well an I recommend providing paths via args.
 */
export function processPathArguments(args) {

  if (args.handlers) {
    if (args.datasetDir || args.narrativeDir || args.path.length>0) {
      utils.error("Can't provide data paths if you use custom handlers")
    }
    return {}
  }

  if (args.gh_pages) {
    if (args.handlers || args.datasetDir || args.narrativeDir || args.path.length > 0) {
      utils.error("Can't provide data paths or handlers if you use --gh-pages")
    }
    return {}
  }

  if ((args.datasetDir || args.narrativeDir) && args.path.length>0) {
    utils.error("Incompatible arguments defining paths for datasets and/or narratives: " +
      "You must either specify the paths as named arguments (--datasetDir and/or --narrativeDir) " +
      "_or_ specify one or more <path> positional arguments.");
  }

  if (args.datasetDir) {
    utils.warn(`[DEPRECATED] Instead of 'auspice ... --datasetDir ${args.datasetDir}' please use 'auspice ... ${args.datasetDir}' `)
  }
  if (args.narrativeDir) {
    utils.warn(`[DEPRECATED] Instead of 'auspice ... --narrativeDir ${args.narrativeDir}' please use 'auspice ... ${args.narrativeDir}' `)
  }

  const dataPaths = Object.fromEntries(
    (args.path.length ?
      args.path.map(utils.cleanUpPathname) :
      args.datasetDir ?
        [utils.cleanUpPathname(args.datasetDir)] :
        utils.defaultDataPaths()
    ).map((p) => [p, new Set(['datasets'])])
  );

  for (const narrativePath of
    (args.path.length ?
      args.path.map(utils.cleanUpPathname) :
      args.narrativeDir ?
        [utils.cleanUpPathname(args.narrativeDir)] :
        utils.defaultDataPaths({narrative: true}))) {
    if (narrativePath in dataPaths) {
      dataPaths[narrativePath].add('narratives');
    } else {
      dataPaths[narrativePath] = new Set(['narratives']);
    }
  }

  if ("undefined" in dataPaths) {
    utils.error("One or more provided paths does not exist")
  }

  return dataPaths;
}
