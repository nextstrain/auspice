import type { Metadata } from "../reducers/metadata.types";
import { entropyCreateState } from "./entropyCreateStateFromJsons";


/**
 * Parse the `json.meta` property returning redux state for redux.metadata and redux.entropy
 */
export function parseJsonMetaBlock(json) {
  const metadata = {};
  if (json.meta.colorings) {
    metadata.colorings = convertColoringsListToDict(json.meta.colorings);
  }
  metadata.title = json.meta.title;
  metadata.updated = json.meta.updated;
  if (json.meta.description) {
    metadata.description = json.meta.description;
  }
  if (json.meta.warning) {
    metadata.warning = json.meta.warning;
  }
  if (json.version) {
    metadata.version = json.version;
  }
  if (json.meta.extensions?.original_version) {
    metadata.originalVersion = json.meta.extensions.original_version;
  }
  if (json.meta.maintainers) {
    metadata.maintainers = json.meta.maintainers;
  }
  if (json.meta.build_url) {
    metadata.buildUrl = json.meta.build_url;
  }
  if (json.meta.build_avatar) {
    metadata.buildAvatar = json.meta.build_avatar;
  }
  if (Array.isArray(json?.meta?.data_provenance)) {
    metadata.dataProvenance = json.meta.data_provenance.filter((el) => typeof el.name === 'string')
  }
  if (json.meta.filters) {
    metadata.filters = json.meta.filters;
  }
  if (json.meta.panels) {
    metadata.panels = json.meta.panels;
  }
  if (json.meta.stream_labels) {
    metadata.streamLabels = json.meta.stream_labels;
  }
  if (json.root_sequence) {
    /* A dataset may set the root sequence inline (i.e. within the main dataset JSON), which
    we capture here. Alternatively it may be a sidecar JSON file */
    metadata.rootSequence = json.root_sequence;
  }
  if (json.meta.display_defaults) {
    metadata.displayDefaults = {};
    const jsonKeyToAuspiceKey = {
      color_by: "colorBy",
      geo_resolution: "geoResolution",
      distance_measure: "distanceMeasure",
      branch_label: "selectedBranchLabel",
      tip_label: "tipLabelKey",
      map_triplicate: "mapTriplicate",
      layout: "layout",
      language: "language",
      sidebar: "sidebar",
      panels: "panels",
      stream_label: "streamLabel",
      transmission_lines: "showTransmissionLines",
      label: "label",
    };
    for (const [jsonKey, auspiceKey] of Object.entries(jsonKeyToAuspiceKey)) {
      if (Object.prototype.hasOwnProperty.call(json.meta.display_defaults, jsonKey)) {
        metadata.displayDefaults[auspiceKey] = json.meta.display_defaults[jsonKey];
      }
    }
  }
  if (json.meta.geo_resolutions) {
    metadata.geoResolutions = json.meta.geo_resolutions;
  }

  metadata.sharing = computeMetadataSharing(metadata, json.meta?.sharing)

  if (Object.prototype.hasOwnProperty.call(metadata, "loaded")) {
    console.error("Metadata JSON must not contain the key \"loaded\". Ignoring.");
  }
  metadata.loaded = true;

  const entropy = entropyCreateState(json.meta.genome_annotations);

  return { metadata, entropy };

}

/* control ability to share / download assets */
export function computeMetadataSharing(
  metadataState: Partial<Metadata>,
  userData: any,
): Metadata['sharing'] {

  /** begin with defaults */
  const sharing: Metadata['sharing'] = {
    dataset_json: true,
    metadata_tsv: true,
    authors: true,
    trees: true,
    entropy: true,
    screenshot: true
  }

  for (const [key, value] of Object.entries(_parseJsonSharingData(userData, Object.keys(sharing)))) {
    sharing[key] = value;
  }

  /* Hardcode overrides for GISAID datasets */
  const gisaid = (metadataState?.dataProvenance || []).filter((el) => el.name.toUpperCase() === 'GISAID').length > 0;
  if (gisaid) {
    sharing.dataset_json = false;
    sharing.metadata_tsv = false;
    sharing.gisaid_acknowledgments = true;
  }

  return sharing;
}


function _parseJsonSharingData(data: any, validKeys: string[]): Partial<Metadata['sharing']> {
  if (data === undefined) return {};
  if (!(typeof data === 'object' && !Array.isArray(data) && data !== null)) {
    console.warn(`JSON.metadata.sharing must be an object (dict)`);
    return {};
  }
  return Object.fromEntries(
    Object.entries(data)
      .map(([key, value]): [string,boolean]|null => {
        if (!validKeys.includes(key)) {
          console.warn(`JSON.metadata.sharing.${key} is not a valid key`);
          return null;
        }
        if (value !== false && value !== true) {
          console.warn(`JSON.metadata.sharing.${key} must be a boolean value, not ${value}`);
          return null;
        }
        return [key, value]
      })
      .filter((x) => !!x)
  )
}


/**
 * The v2 JSON spec defines colorings as a list, so that order is guaranteed.
 * Prior to this, we used a dict, where key insertion order is (guaranteed? essentially always?)
 * to be respected. By simply converting it back to a dict, all the auspice
 * code may continue to work. This should be attended to in the future.
 * @param {obj} coloringsList list of objects
 * @returns {obj} a dictionary representation, where the "key" property of each element
 * in the list has become a property of the object
 */
const convertColoringsListToDict = (coloringsList) => {
  const colorings = {};
  coloringsList.forEach((coloring) => {
    colorings[coloring.key] = { ...coloring };
    delete colorings[coloring.key].key;
  });
  return colorings;
};
