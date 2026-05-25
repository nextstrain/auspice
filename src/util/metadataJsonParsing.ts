import type { Metadata, LegendContinuous, LegendNonContinuous } from "../reducers/metadata.types";
import { PANEL_VALUES } from "../reducers/metadata.types";
import { entropyCreateState } from "./entropyCreateStateFromJsons";
import * as utils from "./typeUtils";
import { ScaleType, SCALE_TYPE_VALUES } from "../reducers/controls";


/**
 * Parse the `json.meta` property returning redux state for redux.metadata and redux.entropy
 */
export function parseJsonMetaBlock(json: unknown): { metadata: Metadata, entropy: unknown } {
  if (!validJson(json)) {
    throw new Error("Invalid JSON. Missing top-level .meta property")
  }

  const metadata: Partial<Metadata> = {};


  metadata.title = utils.isString(json.meta.title) ? json.meta.title : '';
  metadata.updated = utils.isString(json.meta.updated) ? json.meta.updated : '';
  metadata.colorings = convertColoringsListToDict(json.meta.colorings);

  if (utils.isString(json.meta.description)) {
    metadata.description = json.meta.description;
  }
  if (utils.isString(json.meta.warning)) {
    metadata.warning = json.meta.warning;
  }
  if (utils.isString(json.version)) {
    metadata.version = json.version;
  }
  if (utils.isObject(json.meta.extensions) && utils.isString(json.meta.extensions.original_version)) {
    metadata.originalVersion = json.meta.extensions.original_version;
  }
  if (Array.isArray(json.meta.maintainers)) {
    metadata.maintainers = json.meta.maintainers
      .map((m: unknown) => utils.validatedStringObject(m, ['name'], ['url']))
      .filter((m): m is NonNullable<typeof m> => m !== null);
  }
  if (utils.isString(json.meta.build_url)) {
    metadata.buildUrl = json.meta.build_url;
  }
  if (utils.isString(json.meta.build_avatar)) {
    metadata.buildAvatar = json.meta.build_avatar;
  }
  if (Array.isArray(json?.meta?.data_provenance)) {
    metadata.dataProvenance = json.meta.data_provenance.filter((el) => typeof el.name === 'string')
  }
  if (Array.isArray(json.meta.filters) && json.meta.filters.every((p) => utils.isString(p))) {
    metadata.filters = json.meta.filters;
  }
  if (Array.isArray(json.meta.panels)) {
    const panels = json.meta.panels.filter((p) => PANEL_VALUES.includes(p));
    if (panels.length) {
      metadata.panels = json.meta.panels;
    }
  }
  if (Array.isArray(json.meta.stream_labels) && json.meta.stream_labels.every((p) => utils.isString(p))) {
    metadata.streamLabels = json.meta.stream_labels;
  }
  if (json.root_sequence) {
    /* A dataset may set the root sequence inline (i.e. within the main dataset JSON), which
    we capture here. Alternatively it may be a sidecar JSON file */
    metadata.rootSequence = json.root_sequence;
  }

  if (utils.isObject(json.meta.display_defaults)) {
    const dd = json.meta.display_defaults;
    const validPanels = (Array.isArray(dd.panels) && dd.panels || []).filter((p) => utils.isOneOf(p, PANEL_VALUES));
    metadata.displayDefaults = {
      ...(utils.isBoolean(dd.map_triplicate) && {mapTriplicate: dd.map_triplicate}),
      ...(utils.isString(dd.geo_resolution) && { geoResolution: dd.geo_resolution }),
      ...(utils.isString(dd.color_by) && { colorBy: dd.color_by }),
      ...(utils.isOneOf(dd.distance_measure, ['num_date', 'div']) && { distanceMeasure: dd.distance_measure }),
      ...(utils.isOneOf(dd.layout, ["rect", "radial", "unrooted", "clock"]) && { layout: dd.layout }),
      ...(utils.isString(dd.branch_label) && { selectedBranchLabel: dd.branch_label }),
      // 'label' is the branch label that tree starts zoomed to, expressed as <key>:<value>
      ...(utils.isString(dd.label) && dd.label.split(':').length===2 && { label: dd.label }),
      ...(utils.isString(dd.tip_label) && { tipLabelKey: dd.tip_label }),
      ...(utils.isString(dd.stream_label) && { streamLabel: dd.stream_label }),
      ...(utils.isBoolean(dd.transmission_lines) && {showTransmissionLines: dd.transmission_lines}),
      ...(utils.isString(dd.language) && { language: dd.language }),
      ...(utils.isOneOf(dd.sidebar, ['open', 'closed']) && { sidebar: dd.sidebar }),
      ...(validPanels.length && { panels: validPanels }),
    }
  }

  if (Array.isArray(json.meta.geo_resolutions)) {
    metadata.geoResolutions = json.meta.geo_resolutions.filter((gr) => {
      if (
        !utils.isObject(gr) ||
        !utils.isString(gr.key) ||
        (Object.hasOwn(gr, 'title') && !utils.isString(gr.title)) ||
        !utils.isObject(gr.demes) ||
        !Object.values(gr.demes).every((d) => utils.isObject(d) && utils.isNumber(d.latitude) && utils.isNumber(d.longitude))
      ) {
        return false;
      }
      return true;
    });
  }

  metadata.sharing = computeMetadataSharing(metadata, json.meta?.sharing)

  if (Object.prototype.hasOwnProperty.call(metadata, "loaded")) {
    console.error("Metadata JSON must not contain the key \"loaded\". Ignoring.");
  }
  metadata.loaded = true;

  const genome_annotations = utils.isObject(json.meta.genome_annotations) ? json.meta.genome_annotations : {};
  const entropy = entropyCreateState(genome_annotations);

  assertMetadataComplete(metadata);
  return { metadata, entropy };

}

/* control ability to share / download assets */
export function computeMetadataSharing(
  metadataState: Partial<Metadata>,
  userData: unknown,
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


function _parseJsonSharingData(data: unknown, validKeys: string[]): Partial<Metadata['sharing']> {
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



function assertMetadataComplete(m: Partial<Metadata>): asserts m is Metadata {
  const keys = ['sharing', 'title', 'updated', 'loaded'];
  if (!keys.every((key) => Object.hasOwn(m, key))) {
    throw new Error("[INTERNAL ERROR] Metadata is missing a required property");
  }
}


function validJson(json: unknown): json is Record<string, unknown> & { meta: Record<string, unknown> } {
  if (utils.isObject(json) && Object.hasOwn(json, 'meta')) {
    return true;
  }
  return false
}


export function convertColoringsListToDict(
  // JSON defined coloring list (array)
  coloringsList: unknown
): undefined | Metadata['colorings'] {
  if (!Array.isArray(coloringsList)) return undefined;
  // Array.isArray narrows to any[], but prefer unknown[]
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return Object.fromEntries((coloringsList as unknown[])
    .map((c) => {
      if (!utils.isObject(c)) return undefined;
      let { key, title, type, scale, legend } = c;
      if (!utils.isString(key)) return undefined;
      if (!utils.isString(title)) title = key; // title is required in schema but nicer to handle when missing
      if (!utils.isOneOf(type, SCALE_TYPE_VALUES)) {
        console.warn(`Scale for ${key} has unknown .type '${type}'. Must be one of ${SCALE_TYPE_VALUES.join(', ')}.`)
        return undefined;
      }
      // ensure array appeases current type def: [string | number, string][]
      // but we can use stronger typing & better validation here!
      if (
        !Array.isArray(scale) ||
        !scale.every((s) =>
          s.length === 2 &&
          ((type === 'continuous' && utils.isNumber(s[0])) || utils.isString(s[0])) &&
          utils.isString(s[1])
        )
      ) {
        scale = undefined;
      }
      if (!Array.isArray(legend) || !legend.every((el) => _validateLegendArray(type, el))) {
        legend = undefined;
      }
      return [key, { title, type, ...(scale && { scale }), ...(legend && {legend}) }]
    })
    .filter((x) => !!x));
}

function _validateLegendArray(
  scaleType: ScaleType,
  el: unknown
): el is LegendContinuous | LegendNonContinuous {
  if (!utils.isObject(el)) return false;
  if (
    scaleType === 'continuous' && (
      !utils.isNumber(el.value) ||
      !Array.isArray(el.bounds) ||
      el.bounds.length !== 2 ||
      !utils.isNumber(el.bounds[0]) ||
      !utils.isNumber(el.bounds[1])
    )
  ) return true;
  if (
    scaleType === 'continuous' &&
    !utils.isString(el.value)
  ) return true;
  return false;
}
