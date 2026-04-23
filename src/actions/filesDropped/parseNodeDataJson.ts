import { NewMetadata, ColoringInfo } from "../updateMetadata/updateMetadata.types"

/** The node-data JSONs used by Augur are not well documented. Specifically:
 *
 * - The output from refine is a mess! we have `numdate` but `num_date_confidence`. We should ensure
 *   these are special cased here if we want to handle these JSONs, but I can't see where this would
 *   work because `augur refine` is needed for tree topology / node naming.
 */

export async function handleNodeDataJsonFile(file: File, nodeNames: Set<string>): Promise<NewMetadata> {
  const text = await file.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
    if (typeof json !== 'object' || json === null || Array.isArray(json)) {
      throw new Error(`${file.name} is not a JSON object `);
    }
    if (!('nodes' in json) || typeof json.nodes !== 'object' || json.nodes === null || Array.isArray(json.nodes)) {
      throw new Error(`${file.name} does not have a valid "nodes" key`);
    }
  } catch (e) {
    throw new Error(`Failed to parse ${file.name} as JSON: ${e instanceof Error ? e.message : String(e)}`);
  }

  const dataTypesPerAttr: Record<string, Set<string>> = {}

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- validated above: json is an object with a 'nodes' object value
  const nodes = json.nodes as Record<string, Record<string, unknown>>;
  let attributes: Record<string, ColoringInfo> = {};

  for (const [strain, data] of Object.entries(nodes)) {
    if (!nodeNames.has(strain)) continue;

    if (typeof data !== 'object' || data === null || Array.isArray(data)) continue;

    for (const [key, value] of Object.entries(data)) {
      if (key.endsWith('_confidence') || key.endsWith('_entropy')) continue;

      // explicit checking like this helps the type checker
      if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') continue;

      // track data types to help guess a scale later on
      if (!Object.hasOwn(dataTypesPerAttr, key)) dataTypesPerAttr[key] = new Set();
      dataTypesPerAttr[key].add(typeof value);

      if (!attributes[key]) {
        // default to a categorical scale, will be updated in postprocessing
        attributes[key] = { key, name: key, scaleType: 'categorical', strains: {}, colours: {}};
      }

      attributes[key].strains[strain] = { value };

      const confidence = data[`${key}_confidence`];
      if (confidence) {
        if (typeof value === 'string') { // then confidence must be Record<string, number>
          if (typeof confidence === 'object' && confidence !== null && !Array.isArray(confidence)) {
            if (Object.values(confidence).every((v) => typeof v === 'number')) {
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              attributes[key].strains[strain].confidence = confidence as Record<string, number>;
            }
          }
        } else if (typeof value === 'number') { // then confidence must be [number, number]
          if (Array.isArray(confidence) && confidence.length === 2 && confidence.every((v) => typeof v === 'number')) {
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            attributes[key].strains[strain].confidence = confidence as [number, number];
          }
        }
      }

      const entropy = data[`${key}_entropy`];
      if (typeof entropy === 'number') {
        attributes[key].strains[strain].entropy = entropy;
      }
    }
  }

  attributes = Object.fromEntries(
    Object.entries(attributes)
      .map(([key, coloring]) => _postprocess(key, coloring, dataTypesPerAttr[key]))
      .filter((el) => !!el)
  );

  return {
    attributes,
    info: { fileName: file.name },
  };
}


/**
 * Postprocess the data structures now that all nodes have been read.
 */
function _postprocess(attrKey: string, coloring: ColoringInfo, dataTypes: Set<string>): [string, ColoringInfo] | undefined {
  if (dataTypes.size > 1) {
    // coerce all values to a string to be safe rather than try to handle these
    console.warn(`Added coloring '${coloring.name}' has mixed data types - some information may be dropped. Please fix the JSON.`)
    for (const [name, node_attr] of Object.entries(coloring.strains)) {
      coloring.strains[name] = { value: String(node_attr.value) };
    }
  }
  if (dataTypes.size === 1 && dataTypes.has('number')) {
    coloring.scaleType = 'continuous';
  } else if (dataTypes.size === 1 && dataTypes.has('boolean')) {
    coloring.scaleType = 'boolean';
  }

  if (!Object.keys(coloring.strains).length) {
    return undefined;
  }

  return [attrKey, coloring];
}
