import type { Metadata, LegendContinuous, LegendNonContinuous } from "../reducers/metadata.types";
import { PANEL_VALUES, DISTANCE_MEASURE_VALUES, LAYOUT_VALUES, SIDEBAR_VALUES, PANELS_WITH_LEGEND, LegendPlacements } from "../reducers/metadata.types";
import { entropyCreateState } from "./entropyCreateStateFromJsons";
import * as utils from "./typeUtils";
import { ScaleType, SCALE_TYPE_VALUES, getDefaultControlsState } from "../reducers/controls";
import type { RootState } from "../store";
import { genomeMapToGenomeAnnotations } from "./entropyCreateStateFromJsons";
import { urlQueryLabel } from "./treeVisibilityHelpers";
import { version } from "../version";


/**
 * Parse the `json.meta` property returning redux state for redux.metadata and redux.entropy.
 *
 * We don't check for the presence of unhandled keys, we just ignore them.
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
  if (json.root_sequence && utils.isObject(json.root_sequence)) {
    /* A dataset may set the root sequence inline (i.e. within the main dataset JSON), which
    we capture here. Alternatively it may be a sidecar JSON file (which is added to state later on) */
    const rs = Object.entries(json.root_sequence)
      .filter((entry): entry is [string, string] => utils.isString(entry[1]));
    if (rs.length) {
      metadata.rootSequence = Object.fromEntries(rs);
    }
  }

  if (utils.isObject(json.meta.display_defaults)) {
    const dd = json.meta.display_defaults;
    const validPanels = (Array.isArray(dd.panels) && dd.panels || []).filter((p) => utils.isOneOf(p, PANEL_VALUES));
    metadata.displayDefaults = {
      ...(utils.isBoolean(dd.map_triplicate) && {mapTriplicate: dd.map_triplicate}),
      ...(utils.isString(dd.geo_resolution) && { geoResolution: dd.geo_resolution }),
      ...(utils.isString(dd.color_by) && { colorBy: dd.color_by }),
      ...(utils.isOneOf(dd.distance_measure, DISTANCE_MEASURE_VALUES) && { distanceMeasure: dd.distance_measure }),
      ...(utils.isOneOf(dd.layout, LAYOUT_VALUES) && { layout: dd.layout }),
      ...(utils.isString(dd.branch_label) && { selectedBranchLabel: dd.branch_label }),
      // 'label' is the branch label that tree starts zoomed to, expressed as <key>:<value>
      ...(utils.isString(dd.label) && dd.label.split(':').length===2 && { label: dd.label }),
      ...(utils.isString(dd.tip_label) && { tipLabelKey: dd.tip_label }),
      ...(utils.isString(dd.stream_label) && { streamLabel: dd.stream_label }),
      ...(utils.isBoolean(dd.transmission_lines) && {showTransmissionLines: dd.transmission_lines}),
      ...(utils.isString(dd.language) && { language: dd.language }),
      ...(utils.isOneOf(dd.sidebar, SIDEBAR_VALUES) && { sidebar: dd.sidebar }),
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

  metadata.legendPlacements = computeLegendPlacements(metadata.panels || []);
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

function computeLegendPlacements(panels: Metadata["panels"]): Metadata["legendPlacements"] {
  return panels.reduce((acc, panel) => {
    if (!PANELS_WITH_LEGEND.includes(panel)) return acc;

    let panelPlacement: LegendPlacements = {};
    switch (panel) {
      case "tree":
        panelPlacement = {
          tree: {
            vertical: "top",
            horizontal: "left"
          }
        }
        break;
      case "map":
        panelPlacement = {
          map: {
            vertical: "top",
            horizontal: "right"
          }
        }
        break;
      case "measurements":
        panelPlacement = {
          measurements: {
            vertical: "top",
            horizontal: "right"
          }
        }
        break;
      default:
        throw new Error(`Unknown default legend placement for panel ${panel}`)
    }
    return {...acc, ...panelPlacement};
  }, {})
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



/**
 * Somewhat the inverse of parseJsonMetaBlock: reconstructs the `meta` JSON object
 * from the Redux metadata state, reversing structural transformations applied during ingestion.
 */
export function metadataStateToJson(reduxState: RootState): object {
  const { metadata, entropy } = reduxState;
  if (!metadata.loaded) {
    console.error("Internal error (metadata.loaded = false)")
    return {};
  }

  const meta: Record<string, unknown> = {};

  // Ordering of metadata props here matches the `parseJsonMetaBlock` function so
  // it's easier to compare code side-by-side

  if (metadata.title) meta.title = metadata.title;
  if (metadata.updated) meta.updated = metadata.updated;

  if (metadata.colorings) {
    const _colorings = Object.entries(metadata.colorings)
      .filter(([key]) => key !== 'gt') // 'gt' is dynamically generated in Auspice
      .map(([key, value]) => ({ key, ...value }));
    if (_colorings.length) meta.colorings = _colorings;
  }

  if (metadata.description) meta.description = metadata.description;
  if (metadata.warning) meta.warning = metadata.warning;
  // `metadata.version` is stored in JSON.version, not JSON.meta.version
  // Don't export 'originalVersion' (json.meta.extensions.original_version)
  if (metadata.maintainers) meta.maintainers = metadata.maintainers;
  if (metadata.buildUrl) meta.build_url = metadata.buildUrl;
  if (metadata.buildAvatar) meta.build_avatar = metadata.buildAvatar;
  if (metadata.dataProvenance) meta.data_provenance = metadata.dataProvenance;
  if (metadata.filters) meta.filters = metadata.filters;
  if (metadata.panels) meta.panels = metadata.panels;
  if (metadata.streamLabels) meta.stream_labels = metadata.streamLabels;

  // Note: metadata.rootSequence is assigned to json.root_sequence (or a sidecar), not json.meta

  const display_defaults = computedDisplayDefaults(reduxState);
  if (Object.keys(display_defaults).length) {
    meta.display_defaults = display_defaults;
  }

  if (metadata.geoResolutions) meta.geo_resolutions = metadata.geoResolutions;

  const sharing = _computeJsonSharing(metadata.sharing)
  if (Object.keys(sharing).length) meta.sharing = sharing;

  if (entropy.genomeMap?.length) {
    meta.genome_annotations = genomeMapToGenomeAnnotations(entropy.genomeMap);
  }

  /** We don't store any extensions data from the original JSON, so we can't re-export that.
   * For debugging purposes, detail where this JSON came from:
   */
  meta.extensions = {
    generated_by: `JSON created in Auspice (${version}) on ${_today()}`,
  }

  return meta;
}


function _computeJsonSharing(sharing: Metadata['sharing']): Record<string, false> {
  return Object.fromEntries(
    Object.entries(sharing)
      .filter(([key, _value]) => key!=='gisaid_acknowledgments')
      .filter(([_key, value]) => value===false)
  )
}

/**
 * Compute the display_defaults to (as best as we can) produce a JSON whose initial (default)
 * state represents the current state of Auspice.
 */
function computedDisplayDefaults(state: RootState): Record<string, unknown> {
  if (!state.metadata.loaded) {
    console.error("Internal error (metadata.loaded = false)")
    return {};
  }
  // Start by setting two base properties from the original display_defaults rather than
  // recreating them from the current UI state
  const dd = state.metadata.displayDefaults || {};
  const defaults: Record<string, unknown> = {
    //                     [auspice prop]      [json key name]  [auspice prop]
    ...(Object.hasOwn(dd, 'mapTriplicate') && { map_triplicate: dd.mapTriplicate }),
    ...(Object.hasOwn(dd, 'sidebar') && { sidebar: dd.sidebar }),
  }

  // Now inject specific data from redux state (i.e. UI-driven) if it doesn't match Auspice's defaults.
  // (If it matches the defaults Auspice would set, then don't export it)
  const defaultControls = getDefaultControlsState();
  const { controls } = state;
  if (controls.layout !== defaultControls.layout) defaults.layout = controls.layout;
  if (controls.colorBy !== defaultControls.colorBy) defaults.color_by = controls.colorBy;
  if (controls.distanceMeasure !== defaultControls.distanceMeasure) defaults.distance_measure = controls.distanceMeasure;
  if (controls.geoResolution !== defaultControls.geoResolution) defaults.geo_resolution = controls.geoResolution;
  if (controls.selectedBranchLabel !== defaultControls.selectedBranchLabel) defaults.branch_label = controls.selectedBranchLabel;
  if (controls.tipLabelKey !== defaultControls.tipLabelKey) defaults.tip_label = controls.tipLabelKey;
  if (controls.showTransmissionLines !== defaultControls.showTransmissionLines) defaults.transmission_lines = controls.showTransmissionLines;
  if (controls.showStreamTrees) defaults.stream_label = controls.streamTreeBranchLabel;
  if (controls.panelsToDisplay.length) defaults.panels = controls.panelsToDisplay;
  // Find out if the current zoom level has an available (branch) label
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const label = urlQueryLabel(state.tree.nodes![state.tree.idxOfInViewRootNode], state.tree.availableBranchLabels)
  if (label) defaults.label = label;
  // language is special-cased in the code
  if (state.general.language !== 'en') defaults.language = state.general.language;

  return defaults;
}

/** Return current YYYY-MM-DD in user's local timezone */
function _today(): string {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
