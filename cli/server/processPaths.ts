import * as utils from "../utils.ts";

type AvailableResourceTypes = Set<'datasets' | 'narratives'>;

/**
 * Returns an object linking (absolute) paths to a set whose members indicate whether
 * the path should be searched for dataset JSONs, narrative markdown files, or both.
 *
 * Historically the CLI took a single dataset path and a single narrative path, and
 * that behaviour is still allowed here in addition to the newer approach of supplying
 * any number of paths which can contain datasets and/or narratives. The two approaches
 * are mutually exclusive and enforcement of this happens here.
 */
export function processPathArguments(args): Record<string, AvailableResourceTypes> {

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

  if (args.path.length === 0) {
    if (!args.datasetDir && !args.narrativeDir) {
      utils.error("Please provide paths to search for datasets and narratives: 'auspice ... PATH [PATH ...]'");
    } else if (!args.datasetDir) { // i.e. we do have --narrativeDir
      utils.error("Please provide a '--datasetDir <PATH>' with datasets, or alternatively use the new positional-args invocation: 'auspice ... PATH [PATH ...]'");
    }
    // loud deprecation warnings!
    if (args.datasetDir) {
      utils.warn(`[DEPRECATED] Instead of 'auspice ... --datasetDir ${args.datasetDir}' please use 'auspice ... ${args.datasetDir}' `)
    }
    if (args.narrativeDir) {
      utils.warn(`[DEPRECATED] Instead of 'auspice ... --narrativeDir ${args.narrativeDir}' please use 'auspice ... ${args.narrativeDir}' `)
    }
  } else { // else: we do have positional path arguments
    if (args.datasetDir || args.narrativeDir) {
      utils.error("Incompatible arguments defining paths for datasets and/or narratives: " +
        "You must either specify the paths as named arguments ('--datasetDir' and optionally '--narrativeDir') " +
        "or specify one or more <path> positional arguments.");
    }
  }


  const dataPaths: Record<string,AvailableResourceTypes> = Object.fromEntries(
    (args.path.length ?
      args.path.map(utils.cleanUpPathname) :
      [utils.cleanUpPathname(args.datasetDir)]
    ).map((p: string) => [p, new Set(['datasets'])])
  );

  const narrativePaths = args.path.length ?
    args.path.map(utils.cleanUpPathname) :
    args.narrativeDir ?
      [utils.cleanUpPathname(args.narrativeDir)] :
      []; // if no '--narrativeDir' then use auspice without narratives

  for (const narrativePath of narrativePaths) {
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
