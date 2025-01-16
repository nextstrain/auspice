import queryString from "query-string";
import { cloneDeep, isEqualWith } from 'lodash';
import { numericToCalendar, calendarToNumeric } from "../util/dateHelpers";
import { reallySmallNumber, twoColumnBreakpoint, defaultColorBy, defaultGeoResolution, defaultDateRange, nucleotide_gene, strainSymbol, genotypeSymbol } from "../util/globals";
import { calcBrowserDimensionsInitialState } from "../reducers/browserDimensions";
import { getIdxMatchingLabel, calculateVisiblityAndBranchThickness } from "../util/treeVisibilityHelpers";
import { constructVisibleTipLookupBetweenTrees } from "../util/treeTangleHelpers";
import { getDefaultControlsState, shouldDisplayTemporalConfidence } from "../reducers/controls";
import { getDefaultFrequenciesState } from "../reducers/frequencies";
import { countTraitsAcrossTree, calcTotalTipsInTree, gatherTraitNames } from "../util/treeCountingHelpers";
import { calcEntropyInView } from "../util/entropy";
import { treeJsonToState } from "../util/treeJsonProcessing";
import { castIncorrectTypes } from "../util/castJsonTypes";
import { entropyCreateState, genomeMap as createGenomeMap } from "../util/entropyCreateStateFromJsons";
import { calcNodeColor } from "../util/colorHelpers";
import { calcColorScale, createVisibleLegendValues } from "../util/colorScale";
import { computeMatrixFromRawData, checkIfNormalizableFromRawData } from "../util/processFrequencies";
import { applyInViewNodesToTree } from "../actions/tree";
import { validateScatterVariables } from "../util/scatterplotHelpers";
import { isColorByGenotype, decodeColorByGenotype, encodeColorByGenotype, decodeGenotypeFilters, encodeGenotypeFilters, getCdsFromGenotype } from "../util/getGenotype";
import { getTraitFromNode, getDivFromNode, collectGenotypeStates, addNodeAttrs, removeNodeAttrs } from "../util/treeMiscHelpers";
import { collectAvailableTipLabelOptions } from "../components/controls/choose-tip-label";
import { hasMultipleGridPanels } from "./panelDisplay";
import { strainSymbolUrlString } from "../middleware/changeURL";
import { combineMeasurementsControlsAndQuery, encodeMeasurementColorBy, loadMeasurements } from "./measurements";

export const doesColorByHaveConfidence = (controlsState, colorBy) =>
  controlsState.coloringsPresentOnTreeWithConfidence.has(colorBy);

export const getMinCalDateViaTree = (nodes, state) => {
  /* slider should be earlier than actual day */
  /* if no date, use some default dates - slider will not be visible */
  const minNumDate = getTraitFromNode(nodes[0], "num_date");
  return (minNumDate === undefined) ?
    numericToCalendar(state.dateMaxNumeric - defaultDateRange) :
    numericToCalendar(minNumDate - 0.01);
};

export const getMaxCalDateViaTree = (nodes) => {
  let maxNumDate = reallySmallNumber;
  nodes.forEach((node) => {
    const numDate = getTraitFromNode(node, "num_date");
    if (numDate !== undefined && numDate > maxNumDate) {
      maxNumDate = numDate;
    }
  });
  maxNumDate += 0.01; /* slider should be later than actual day */
  return numericToCalendar(maxNumDate);
};

/* need a (better) way to keep the queryParams all in "sync" */
const modifyStateViaURLQuery = (state, query) => {
  // console.log("modify state via URL query", query)
  if (query.l) {
    state["layout"] = query.l;
  }
  if (query.gmin) {
    state["zoomMin"] = parseInt(query.gmin, 10);
  }
  if (query.gmax) {
    state["zoomMax"] = parseInt(query.gmax, 10);
  }
  if (query.m && state.branchLengthsToDisplay === "divAndDate") {
    state["distanceMeasure"] = query.m;
  }
  if (query.c) {
    state["colorBy"] = query.c;
  }
  if (query.ci === undefined) {
    state["temporalConfidence"]["on"] = false;
  } else {
    state["temporalConfidence"]["on"] = true;
  }
  if (query.r) {
    state["geoResolution"] = query.r;
  }
  /**
   * `query.d` should be processed before `query.p` since the panels to be
   * displayed affects the panel layout.
   */
  if (query.d) {
    const proposed = query.d.split(",");
    state.panelsToDisplay = state.panelsAvailable.filter((n) => proposed.indexOf(n) !== -1);
    state.canTogglePanelLayout = hasMultipleGridPanels(state.panelsToDisplay);
    if (!state.canTogglePanelLayout) {
      state["panelLayout"] = "full";
    }
  }
  if (query.p && state.canTogglePanelLayout && (query.p === "full" || query.p === "grid")) {
    state["panelLayout"] = query.p;
  }
  if (query.tl) {
    state["tipLabelKey"] = query.tl===strainSymbolUrlString ? strainSymbol : query.tl;
  }

  if (query.dmin) {
    const dateNum = calendarToNumeric(query.dmin);
    if (_validDate(dateNum, state.absoluteDateMinNumeric, state.absoluteDateMaxNumeric)) {
      state["dateMin"] = query.dmin;
      state["dateMinNumeric"] = dateNum;
    } else {
      console.error(`URL query "dmin=${query.dmin}" is invalid ${state.branchLengthsToDisplay==='divOnly'?'(the tree is not a timetree)':''}`);
      delete query.dmin;
    }
  }
  if (query.dmax) {
    const dateNum = calendarToNumeric(query.dmax);
    if (_validDate(dateNum, state.absoluteDateMinNumeric, state.absoluteDateMaxNumeric)) {
      if ((query.dmin && dateNum <= state.dateMinNumeric)) {
        console.error(`Requested "dmax=${query.dmax}" is earlier than "dmin=${query.dmin}", ignoring dmax.`);
        delete query.dmax;
      } else {
        state["dateMax"] = query.dmax;
        state["dateMaxNumeric"] = dateNum;
      }
    } else {
      console.error(`URL query "dmax=${query.dmax}" is invalid ${state.branchLengthsToDisplay==='divOnly'?'(the tree is not a timetree)':''}`);
      delete query.dmax;
    }
  }

  /** Queries 's', 'gt', and 'f_<name>' correspond to active filters */
  for (const filterKey of Object.keys(query).filter((c) => c.startsWith('f_'))) {
    const filterName = filterKey.replace('f_', '');
    const filterValues = query[filterKey] ? query[filterKey].split(',') : [];
    state.filters[filterName] = filterValues.map((value) => ({value, active: true}))
  }
  if (query.s) {
    const filterValues = query.s ? query.s.split(',') : [];
    state.filters[strainSymbol] = filterValues.map((value) => ({value, active: true}));
  }
  if (query.gt) {
    state.filters[genotypeSymbol] = decodeGenotypeFilters(query.gt||"");
  }

  state.animationPlayPauseButton = "Play";
  if (query.animate) {
    const params = query.animate.split(',');
    if (params.length!==5) {
      console.error("Invalid 'animate' URL query (not enough fields)");
      delete query.animate;
    } else if (state.branchLengthsToDisplay==='divOnly') {
      console.error("Invalid 'animate' URL query (tree is not a timetree)");
      delete query.animate;
    } else {
      const [_dmin, _dminNum] = [params[0], calendarToNumeric(params[0])];
      const [_dmax, _dmaxNum] = [params[1], calendarToNumeric(params[1])];
      if (
        !_validDate(_dminNum, state.absoluteDateMinNumeric, state.absoluteDateMaxNumeric) ||
        !_validDate(_dmaxNum, state.absoluteDateMinNumeric, state.absoluteDateMaxNumeric) ||
        _dminNum >= _dmaxNum
      ) {
        console.error("Invalid 'animate' URL query (invalid date range)")
        delete query.animate
      } else {
        window.NEXTSTRAIN.animationStartPoint = _dminNum;
        window.NEXTSTRAIN.animationEndPoint = _dmaxNum;
        state.dateMin = _dmin;
        state.dateMax = _dmax;
        state.dateMinNumeric = _dminNum;
        state.dateMaxNumeric = _dmaxNum;
        state.mapAnimationShouldLoop = params[2] === "1";
        state.mapAnimationCumulative = params[3] === "1";
        const duration = parseInt(params[4], 10);
        state.mapAnimationDurationInMilliseconds = isNaN(duration) ? 30_000 : duration;
        state.animationPlayPauseButton = "Pause";
      }
    }
  }
  if (query.branchLabel) {
    state.selectedBranchLabel = query.branchLabel;
    // do not modify the default (only the JSON can do this)
  }
  if (query.showBranchLabels === "all") {
    state.showAllBranchLabels = true;
  }
  if (query.sidebar) {
    if (query.sidebar === "open") {
      state.defaults.sidebarOpen = true;
      state.sidebarOpen = true;
    } else if (query.sidebar === "closed") {
      state.defaults.sidebarOpen = false;
      state.sidebarOpen = false;
    }
  }
  if (query.legend) {
    if (query.legend === "open") {
      state.legendOpen = true;
    } else if (query.legend === "closed") {
      state.legendOpen = false;
    }
  }
  if ("onlyPanels" in query) {
    state.showOnlyPanels = true;
  }
  if (query.transmissions) {
    if (query.transmissions === "show") {
      state.showTransmissionLines = true;
    } else if (query.transmissions === "hide") {
      state.showTransmissionLines = false;
    }
  }
  /* parse queries which may modify scatterplot-like views. These will be validated before dispatch. */
  if (query.branches==="hide") state.scatterVariables.showBranches = false;
  if (query.regression==="show") state.scatterVariables.showRegression = true;
  if (query.regression==="hide") state.scatterVariables.showRegression = false;
  if (query.scatterX) state.scatterVariables.x = query.scatterX;
  if (query.scatterY) state.scatterVariables.y = query.scatterY;

  return state;
  function _validDate(dateNum, absoluteDateMinNumeric, absoluteDateMaxNumeric) {
    return !(dateNum===undefined || dateNum > absoluteDateMaxNumeric || dateNum < absoluteDateMinNumeric);
  }
};

const restoreQueryableStateToDefaults = (state) => {
  for (const key of Object.keys(state.defaults)) {
    switch (typeof state.defaults[key]) {
      case "boolean": // fallthrough
      case "string": {
        state[key] = state.defaults[key];
        break;
      }
      case "object": { /* can't use Object.assign, must deep clone instead */
        state[key] = JSON.parse(JSON.stringify(state.defaults[key]));
        break;
      }
      default: {
        console.error("unknown typeof for default state of ", key, state.defaults[key]);
      }
    }
  }
  /* dateMin & dateMax get set to their bounds */
  state["dateMin"] = state["absoluteDateMin"];
  state["dateMax"] = state["absoluteDateMax"];
  state["dateMinNumeric"] = state["absoluteDateMinNumeric"];
  state["dateMaxNumeric"] = state["absoluteDateMaxNumeric"];
  state["zoomMax"] = undefined;
  state["zoomMin"] = undefined;

  state["panelLayout"] = calcBrowserDimensionsInitialState().width > twoColumnBreakpoint ? "grid" : "full";
  state.panelsToDisplay = state.panelsAvailable.slice();
  state.tipLabelKey = strainSymbol;
  state.scatterVariables = {};

  state.showAllBranchLabels = false;
  // console.log("state now", state);
  return state;
};

const modifyStateViaMetadata = (state, metadata, genomeMap) => {
  if (metadata.analysisSlider) {
    state["analysisSlider"] = {key: metadata.analysisSlider, valid: false};
  }
  if (metadata.filters) {
    /**
     * this spec previously defined both the footer-filters and the
     * sidebar-filters, however it now only defines the former as the sidebar
     * surfaces all available attributes.
     */
    state.filtersInFooter = [...metadata.filters];
  } else {
    console.warn("JSON did not include any filters");
    state.filtersInFooter = [];
  }
  if (metadata.displayDefaults) {
    const keysToCheckFor = ["geoResolution", "colorBy", "distanceMeasure", "layout", "mapTriplicate", "selectedBranchLabel", "tipLabelKey", 'sidebar', "showTransmissionLines", "normalizeFrequencies"];
    const expectedTypes =  ["string",        "string",  "string",          "string", "boolean",       "string",              'string',      'string',  "boolean"              , "boolean"];

    for (let i = 0; i < keysToCheckFor.length; i += 1) {
      if (Object.hasOwnProperty.call(metadata.displayDefaults, keysToCheckFor[i])) {
        if (typeof metadata.displayDefaults[keysToCheckFor[i]] === expectedTypes[i]) {
          if (keysToCheckFor[i] === "sidebar") {
            if (metadata.displayDefaults[keysToCheckFor[i]] === "open") {
              state.defaults.sidebarOpen = true;
              state.sidebarOpen = true;
            } else if (metadata.displayDefaults[keysToCheckFor[i]]=== "closed") {
              state.defaults.sidebarOpen = false;
              state.sidebarOpen = false;
            } else {
              console.error("Skipping 'display_default' for sidebar as it's not 'open' or 'closed'");
            }
          } else {
            /* most of the time if key=geoResolution, set both state.geoResolution and state.defaults.geoResolution */
            state[keysToCheckFor[i]] = metadata.displayDefaults[keysToCheckFor[i]];
            state.defaults[keysToCheckFor[i]] = metadata.displayDefaults[keysToCheckFor[i]];
          }
        } else {
          console.error("Skipping 'display_default' for ", keysToCheckFor[i], "as it is not of type ", expectedTypes[i]);
        }
      }
    }
  } else {
    metadata.displayDefaults = {}; // allows code to rely on `displayDefaults` existing
  }

  if (metadata.panels) {
    state.panelsAvailable = metadata.panels.slice();
    state.panelsToDisplay = metadata.panels.slice();
  } else {
    /* while `metadata.panels` is required by the schema, we provide a fallback
    Entropy will be removed below if it's not possible to display it. */
    state.panelsAvailable = ["tree", "entropy"];
    state.panelsToDisplay = ["tree", "entropy"];
  }

  /* if we lack geoResolutions, remove map from panels to display */
  if (!metadata.geoResolutions || !metadata.geoResolutions.length) {
    state.panelsAvailable = state.panelsAvailable.filter((item) => item !== "map");
    state.panelsToDisplay = state.panelsToDisplay.filter((item) => item !== "map");
  }

  /**
   * Entropy panel display is only possible if all three of the following are true:
   * (i) the genomeMap exists
   * (ii) mutations exist on the tree
   * (iii) the JSON specifies "entropy" as a panel _or_ doesn't specify panels at all (see above)
   * If (i && ii) then we can select genotype colorings. If this is not specified in the JSON
   * then we add it here as I think it's the best UX (otherwise we either have to disable
   * the entropy panel or disable the ability to select gt colorings from that panel)
   */
  if (!metadata.colorings) metadata.colorings = {};
  if (genomeMap && state.coloringsPresentOnTree.has("gt")) {
    if (!Object.keys(metadata.colorings).includes('gt')) {
      metadata.colorings.gt = {
        title: "Genotype",
        type: "categorical"
      }
    }
  } else {
    state.panelsAvailable = state.panelsAvailable.filter((item) => item !== "entropy");
    state.panelsToDisplay = state.panelsToDisplay.filter((item) => item !== "entropy");
    if (Object.keys(metadata.colorings).includes('gt')) {
      console.error("Genotype coloring ('gt') was specified as an option in the JSON, however the data does not support this: " +
      "check that 'metadata.genome_annotations' is correct and that mutations have been assigned to 'branch_attrs' on the tree.")
      delete metadata.colorings.gt;
    }
  }

  /* After calculating the available panels, we check this against the display default (if that was set)
  in order to determine which panels to display. Note that URL queries are parsed after this. */
  if (metadata.displayDefaults && metadata.displayDefaults.panels && Array.isArray(metadata.displayDefaults.panels)) {
    /* remove any display defaults asked for which don't exist */
    metadata.displayDefaults.panels = metadata.displayDefaults.panels.filter((p) => state.panelsAvailable.includes(p));
    /* only show those set via display defaults */
    state.panelsToDisplay = state.panelsToDisplay.filter((p) => metadata.displayDefaults.panels.includes(p));
    /* store the display defaults for use by URL middleware */
    state.defaults.panels = metadata.displayDefaults.panels;
  } else {
    /* define "default" panels to show as all those available if not explicitly set */
    state.defaults.panels = state.panelsAvailable.slice();
  }

  /* if only map or only tree, then panelLayout must be full */
  /* note - this will be overwritten by the URL query */
  if (!hasMultipleGridPanels(state.panelsToDisplay)) {
    state.panelLayout = "full";
    state.canTogglePanelLayout = false;
  }

  return state;
};

const modifyControlsStateViaTree = (state, tree, treeToo, colorings) => {
  state["dateMin"] = getMinCalDateViaTree(tree.nodes, state);
  state["dateMax"] = getMaxCalDateViaTree(tree.nodes);
  state.dateMinNumeric = calendarToNumeric(state.dateMin);
  state.dateMaxNumeric = calendarToNumeric(state.dateMax);

  if (treeToo) {
    const min = getMinCalDateViaTree(treeToo.nodes, state);
    const max = getMaxCalDateViaTree(treeToo.nodes);
    const minNumeric = calendarToNumeric(min);
    const maxNumeric = calendarToNumeric(max);
    if (minNumeric < state.dateMinNumeric) {
      state.dateMinNumeric = minNumeric;
      state.dateMin = min;
    }
    if (maxNumeric > state.dateMaxNumeric) {
      state.dateMaxNumeric = maxNumeric;
      state.dateMax = max;
    }
  }

  /* set absolutes */
  state["absoluteDateMin"] = state["dateMin"];
  state["absoluteDateMax"] = state["dateMax"];
  state.absoluteDateMinNumeric = calendarToNumeric(state.absoluteDateMin);
  state.absoluteDateMaxNumeric = calendarToNumeric(state.absoluteDateMax);

  /**
   * The following section makes an (expensive) traversal through the tree, checking if
   * the provided colorings (via the JSON) are actually present on the tree. A
   * previous comment implied that any colorings not present in the tree would be removed,
   * but they are not! In fact, `coloringsPresentOnTreeWithConfidence` is never accessed,
   * and `coloringsPresentOnTree` was only accessed when metadata CSV/TSV is dropped on.
   * I'm now checking if "gt" is in `coloringsPresentOnTree` to decide whether to allow
   * a genotype colorBy and the entropy panel, but this approach could be improved as well.
   * We should either remove this completely, make it work as intended, or execute this
   * only when a file is dropped. (I've gone down too many rabbit holes in this PR to
   * do this now, unfortunately.)                                           james, 2023
   */

  let coloringsToCheck = [];
  if (colorings) {
    coloringsToCheck = Object.keys(colorings);
  }
  let [aaMuts, nucMuts] = [false, false];
  let num_date_confidence = false; /* flag. Is confidence defined anywhere on the tree? */
  const examineNodes = function examineNodes(nodes) {
    nodes.forEach((node) => {
      /* check colorBys */
      coloringsToCheck.forEach((colorBy) => {
        if (!state.coloringsPresentOnTreeWithConfidence.has(colorBy)) {
          if (getTraitFromNode(node, colorBy, {confidence: true})) {
            state.coloringsPresentOnTreeWithConfidence.add(colorBy);
            state.coloringsPresentOnTree.add(colorBy);
          } else if (getTraitFromNode(node, colorBy)) {
            state.coloringsPresentOnTree.add(colorBy);
          }
        }
      });
      /* check mutations */
      if (node.branch_attrs && node.branch_attrs.mutations) {
        const keys = Object.keys(node.branch_attrs.mutations);
        if (keys.length > 1 || (keys.length === 1 && keys[0]!=="nuc")) aaMuts = true;
        if (keys.includes("nuc")) nucMuts = true;
      }
      /* check num_date confidence */
      if (!num_date_confidence && getTraitFromNode(node, "num_date", {confidence: true})) {
        num_date_confidence = true;
      }
    });
  };
  examineNodes(tree.nodes);
  if (treeToo) examineNodes(treeToo.nodes);

  if (aaMuts || nucMuts) {
    state.coloringsPresentOnTree.add("gt");
  }

  /* does the tree have date information? if not, disable controls, modify view */
  const numDateAtRoot = getTraitFromNode(tree.nodes[0], "num_date") !== undefined;
  const divAtRoot = getDivFromNode(tree.nodes[0]) !== undefined;
  state.branchLengthsToDisplay = (numDateAtRoot && divAtRoot) ? "divAndDate" :
    numDateAtRoot ? "dateOnly" :
      "divOnly";

  /* if branchLengthsToDisplay is "divOnly", force to display by divergence
   * if branchLengthsToDisplay is "dateOnly", force to display by date
   */
  state.distanceMeasure = state.branchLengthsToDisplay === "divOnly" ? "div" :
    state.branchLengthsToDisplay === "dateOnly" ? "num_date" : state.distanceMeasure;

  /* if clade is available as a branch label, then set this as the "default". This
  is largely due to historical reasons. Note that it *can* and *will* be overridden
  by JSON display_defaults and URL query */
  if (tree.availableBranchLabels.indexOf("clade") !== -1) {
    state.defaults.selectedBranchLabel = "clade";
    state.selectedBranchLabel = "clade";
  }

  state.temporalConfidence = {exists: num_date_confidence, display: num_date_confidence, on: false};

  return state;
};

const checkAndCorrectErrorsInState = (state, metadata, genomeMap, query, tree, viewingNarrative) => {
  /* want to check that the (currently set) colorBy (state.colorBy) is valid,
   * and fall-back to an available colorBy if not
   */
  if (!metadata.colorings) {
    metadata.colorings = {};
  }
  const fallBackToDefaultColorBy = () => {
    const availableNonGenotypeColorBys = Object.keys(metadata.colorings)
      .filter((colorKey) => colorKey !== "gt");
    if (metadata.displayDefaults && metadata.displayDefaults.colorBy && availableNonGenotypeColorBys.indexOf(metadata.displayDefaults.colorBy) !== -1) {
      console.warn("colorBy falling back to", metadata.displayDefaults.colorBy);
      state.colorBy = metadata.displayDefaults.colorBy;
      state.defaults.colorBy = metadata.displayDefaults.colorBy;
    } else if (availableNonGenotypeColorBys.length) {
      if (availableNonGenotypeColorBys.indexOf(defaultColorBy) !== -1) {
        state.colorBy = defaultColorBy;
        state.defaults.colorBy = defaultColorBy;
      } else {
        console.error("Error detected trying to set colorBy to", state.colorBy, "falling back to", availableNonGenotypeColorBys[0]);
        state.colorBy = availableNonGenotypeColorBys[0];
        state.defaults.colorBy = availableNonGenotypeColorBys[0];
      }
    } else {
      console.error("Error detected trying to set colorBy to", state.colorBy, " as there are no color options defined in the JSONs!");
      state.colorBy = "none";
      state.defaults.colorBy = "none";
    }
    delete query.c;
  };
  if (isColorByGenotype(state.colorBy)) {
    /* Check that the genotype is valid (and so are all positions) with the current data */
    if (!genomeMap) {
      fallBackToDefaultColorBy();
    } else {
      const decoded = decodeColorByGenotype(state.colorBy, genomeMap)
      if (!decoded) { // note that a console.error printed by decodeColorByGenotype in this case
        fallBackToDefaultColorBy();
      } else {
        const encoded = encodeColorByGenotype(decoded);
        if (state.colorBy!==encoded) {
          /* color-by is partially valid - i.e. some positions are invalid (note that position ordering is unchanged) */
          console.error(`Genotype color-by ${state.colorBy} contains at lease one invalid position. ` +
          `Color-by has been changed to ${encoded}.`)
          query.c = encoded;
          state.colorBy = encoded
        }
      }
    }
  } else if (Object.keys(metadata.colorings).indexOf(state.colorBy) === -1) {
    /* if it's a _non_ genotype colorBy AND it's not a valid option, fall back to the default */
    fallBackToDefaultColorBy();
  }

  /* Validate requested entropy zoom bounds (via URL) */
  const genomeBounds = genomeMap?.[0]?.range;
  if (!genomeBounds) {
    /* Annotations block missing / invalid, so it makes no sense to have entropy zoom bounds */
    [state.zoomMin, state.zoomMax] = [undefined, undefined];
    delete query.gmin;
    delete query.gmax;
  } else {
    if (state.zoomMin <= genomeBounds[0] || state.zoomMin >= genomeBounds[1]) {
      state.zoomMin = undefined;
      delete query.gmin;
    }
    if (state.zoomMax <= genomeBounds[0] || state.zoomMax >= genomeBounds[1]) {
      state.zoomMax = undefined;
      delete query.gmax;
    }
    if (state.zoomMin && state.zoomMax && state.zoomMin>state.zoomMax) {
      [state.zoomMin, state.zoomMax] = [state.zoomMax, state.zoomMin];
      [query.gmin, query.gmax] = [state.zoomMin, state.zoomMax];
    }
  }

  /* colorBy confidence */
  state["colorByConfidence"] = doesColorByHaveConfidence(state, state["colorBy"]);

  /* distanceMeasure */
  if (["div", "num_date"].indexOf(state["distanceMeasure"]) === -1) {
    state["distanceMeasure"] = "num_date";
    console.error("Error detected. Setting distanceMeasure to ", state["distanceMeasure"]);
  }

  /* geoResolutions */
  if (metadata.geoResolutions) {
    const availableGeoResultions = metadata.geoResolutions.map((i) => i.key);
    if (availableGeoResultions.indexOf(state["geoResolution"]) === -1) {
      /* fallbacks: JSON defined default, then hardcoded default, then any available */
      if (metadata.displayDefaults && metadata.displayDefaults.geoResolution && availableGeoResultions.indexOf(metadata.displayDefaults.geoResolution) !== -1) {
        state.geoResolution = metadata.displayDefaults.geoResolution;
      } else if (availableGeoResultions.indexOf(defaultGeoResolution) !== -1) {
        state.geoResolution = defaultGeoResolution;
      } else {
        state.geoResolution = availableGeoResultions[0];
      }
      console.error("Error detected. Setting geoResolution to ", state.geoResolution);
      delete query.r; // no-op if query.r doesn't exist
    }
  }

  /* show label */
  if (state.selectedBranchLabel && !tree.availableBranchLabels.includes(state.selectedBranchLabel)) {
    console.error("Can't set selected branch label to ", state.selectedBranchLabel);
    state.selectedBranchLabel = "none";
    state.defaults.selectedBranchLabel = "none";
  }

  /* check tip label is valid. We use the function which generates the options for the dropdown here.
   * state.defaults.tipLabelKey is set by the JSON's display_defaults (default: strainSymbol)
   * state.tipLabelKey is initially the same value and then overridden via the URL query (default: state.defaults.tipLabelKey)
   */
  const validTipLabels = collectAvailableTipLabelOptions(tree.nodeAttrKeys, metadata.colorings).map((o) => o.value);
  if (!validTipLabels.includes(state.defaults.tipLabelKey)) {
    console.error("Invalid JSON-defined tip label:", state.defaults.tipLabelKey);
    state.defaults.tipLabelKey = strainSymbol;
  }
  if (!validTipLabels.includes(state.tipLabelKey)) {
    if (query.tl) {
      console.error("Invalid URL-defined tip label:", state.tipLabelKey);
      delete query.tl;
    }
    state.tipLabelKey = state.defaults.tipLabelKey;
  }

  /* temporalConfidence */
  if (shouldDisplayTemporalConfidence(state.temporalConfidence.exists, state.distanceMeasure, state.layout)) {
    state.temporalConfidence.display = true;
  } else {
    state.temporalConfidence.display = false;
    state.temporalConfidence.on = false;
    delete query.ci; // rm ci from the query if it doesn't apply
  }

  /**
   * Any filters currently set are done so via the URL query, which we validate now
   * (and update the URL query accordingly)
   */
  const _queryKey = (traitName) => (traitName === strainSymbol) ? 's' :
    (traitName === genotypeSymbol) ? 'gt' :
      `f_${traitName}`;

  for (const traitName of Reflect.ownKeys(state.filters)) {
    /* delete empty filters, e.g. "?f_country" or "?f_country=" */
    if (!state.filters[traitName].length) {
      delete state.filters[traitName];
      delete query[_queryKey(traitName)];
      continue
    }
    /* delete filter names (e.g. country, region) which aren't observed on the tree */
    if (!Object.keys(tree.totalStateCounts).includes(traitName) && traitName!==strainSymbol && traitName!==genotypeSymbol) {
      delete state.filters[traitName];
      delete query[_queryKey(traitName)];
      continue
    }
    /* delete filter values (e.g. USA, Oceania) which aren't valid, i.e. observed on the tree */
    const traitValues = state.filters[traitName].map((f) => f.value);
    let validTraitValues;
    if (traitName === strainSymbol) {
      const nodeNames = new Set(tree.nodes.map((n) => n.name));
      validTraitValues = traitValues.filter((v) => nodeNames.has(v));
    } else if (traitName === genotypeSymbol) {
      const observedMutations = collectGenotypeStates(tree.nodes);
      validTraitValues = traitValues.filter((v) => observedMutations.has(v));
    } else {
      validTraitValues = traitValues.filter((value) => tree.totalStateCounts[traitName].has(value));
    }
    if (validTraitValues.length===0) {
      delete state.filters[traitName];
      delete query[_queryKey(traitName)];
    } else if (traitValues.length !== validTraitValues.length) {
      state.filters[traitName] = validTraitValues.map((value) => ({value, active: true}));
      query[_queryKey(traitName)] = traitName === genotypeSymbol ?
        encodeGenotypeFilters(state.filters[traitName]) :
        validTraitValues.join(",");
    }
  }
  /* Also remove any traitNames from the footer-displayed filters if they're not present on the tree */
  state.filtersInFooter = state.filtersInFooter.filter((traitName) => traitName in tree.totalStateCounts);

  /* can we display branch length by div or num_date? */
  if (query.m && state.branchLengthsToDisplay !== "divAndDate") {
    delete query.m;
  }

  if (!(query.sidebar === "open" || query.sidebar === "closed")) {
    delete query.sidebar; // invalid value
  }
  if (viewingNarrative) {
    // We must prevent a narrative closing the sidebar, either via a JSON display_default
    // or a URL query anywhere within the narrative.
    if ("sidebarOpen" in state.defaults) delete state.defaults.sidebarOpen;
    state.sidebarOpen=true;
  }

  /* if we are starting in a scatterplot-like layout, we need to ensure we have `scatterVariables`
  If not, we deliberately don't instantiate them, so that they are instantiated when first
  triggering a scatterplot, thus defaulting to the colorby in use at that time */
  // todo: these should be JSON definable (via display_defaults)
  if (state.layout==="scatter" || state.layout==="clock") {
    state.scatterVariables = validateScatterVariables(
      state, metadata, tree, state.layout==="clock"
    );
    if (query.scatterX && query.scatterX!==state.scatterVariables.x) delete query.scatterX;
    if (query.scatterY && query.scatterY!==state.scatterVariables.y) delete query.scatterY;
    if (state.layout==="clock") {
      delete query.scatterX;
      delete query.scatterY;
    }
  } else {
    state.scatterVariables = {};
    delete query.scatterX;
    delete query.scatterY;
    delete query.regression;
    delete query.branches;
  }

  return state;
};

const modifyTreeStateVisAndBranchThickness = (oldState, zoomSelected, controlsState, dispatch) => {
  /* calculate the index of the (in-view) root note, which depends on any selected zoom */
  let newIdxRoot = oldState.idxOfInViewRootNode;
  if (zoomSelected) {
    const [labelName, labelValue] = zoomSelected.split(":");
    const cladeSelectedIdx = getIdxMatchingLabel(oldState.nodes, labelName, labelValue, dispatch);
    oldState.selectedClade = zoomSelected;
    newIdxRoot = applyInViewNodesToTree(cladeSelectedIdx, oldState);
  } else {
    oldState.selectedClade = undefined;
    newIdxRoot = applyInViewNodesToTree(0, oldState);
  }

  /* calculate new branch thicknesses & visibility, as this depends on the root note */
  const visAndThicknessData = calculateVisiblityAndBranchThickness(
    oldState,
    controlsState,
    {dateMinNumeric: controlsState.dateMinNumeric, dateMaxNumeric: controlsState.dateMaxNumeric}
  );

  const newState = Object.assign({}, oldState, visAndThicknessData);
  newState.idxOfInViewRootNode = newIdxRoot;
  return newState;
};

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

/**
 *
 * A lot of this is simply changing augur's snake_case to auspice's camelCase
 */
const createMetadataStateFromJSON = (json) => {
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
  if (json.meta.maintainers) {
    metadata.maintainers = json.meta.maintainers;
  }
  if (json.meta.build_url) {
    metadata.buildUrl = json.meta.build_url;
  }
  if (json.meta.data_provenance) {
    metadata.dataProvenance = json.meta.data_provenance;
  }
  if (json.meta.filters) {
    metadata.filters = json.meta.filters;
  }
  if (json.meta.panels) {
    metadata.panels = json.meta.panels;
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
      transmission_lines: "showTransmissionLines"
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


  if (Object.prototype.hasOwnProperty.call(metadata, "loaded")) {
    console.error("Metadata JSON must not contain the key \"loaded\". Ignoring.");
  }
  metadata.loaded = true;
  return metadata;
};

/**
 * Conceptually similar to `createMetadataStateFromJSON` but here looking at metadata from
 * the (optional) second tree and only considers certain properties at the moment.
 */
function updateMetadataStateViaSecondTree(metadata, json, genomeMap) {

  // For genotype colourings across multiple trees we need to know if the genome
  // maps are identical¹ across both trees
  //
  // ¹ This could be relaxed in the future - currently we enforce that the order
  //   of genes matches. We could also make this more fine grained and allow the
  //   2nd tree to have a subset of CDSs (wrt the main tree), with genotypes
  //   only working for the shared CDSs.
  if (genomeMap && json.meta.genome_annotations) {
    try {
      metadata.identicalGenomeMapAcrossBothTrees = isEqualWith(
        genomeMap,
        createGenomeMap(json.meta.genome_annotations),
        (objValue, othValue, indexOrKey) => {
          if (indexOrKey==='color') return true; // don't compare CDS colors!
          // don't compare metadata section as there may be Infinities here
          // (and if everything else is equal then the metadata will be the same too)
          if (indexOrKey==='metadata') return true;
          return undefined; // use lodash's default comparison
        }
      )
    } catch (e) {
      if (e instanceof Error) console.error(e.message);
    }
    if (!metadata.identicalGenomeMapAcrossBothTrees) {
      console.warn("Heads up! The two trees have different genome_annotations and thus genotype colorings will only be applied to the LHS tree")
    }
  }

  if (metadata.identicalGenomeMapAcrossBothTrees && json.root_sequence) {
    /* in-line root sequence (not sidecar) */
    metadata.rootSequenceSecondTree = json.root_sequence;
  }

}

export const getNarrativePageFromQuery = (query, narrative) => {
  let n = parseInt(query.n, 10) || 0;
  /* If the query has defined a block which doesn't exist then default to n=0 */
  if (n >= narrative.length) {
    console.warn(`Attempted to go to narrative page ${n} which doesn't exist`);
    n=0;
  }
  return n;
};

export const createStateFromQueryOrJSONs = ({
  json = false, /* raw json data - completely nuke existing redux state */
  measurementsData = false, /* raw measurements json data or error, only used when main json is provided */
  secondTreeDataset = false,
  oldState = false, /* existing redux state (instead of jsons) */
  narrativeBlocks = false, /* if in a narrative this argument is set */
  mainTreeName = false,
  secondTreeName = false,
  query,
  dispatch
}) => {
  let tree, treeToo, entropy, controls, metadata, narrative, frequencies, measurements;
  /* first task is to create metadata, entropy, controls & tree partial state */
  if (json) {
    /* create metadata state */
    metadata = createMetadataStateFromJSON(json);
    /* entropy state */
    entropy = entropyCreateState(json.meta.genome_annotations);
    /* ensure default frequencies state */
    frequencies = getDefaultFrequenciesState();
    /* Load measurements if available, otherwise ensure default measurements state */
    measurements = loadMeasurements(measurementsData, dispatch);
    /* new tree state(s) */
    tree = treeJsonToState(json.tree);
    castIncorrectTypes(metadata, tree);
    tree.debug = "LEFT";
    tree.name = mainTreeName;
    metadata.mainTreeNumTips = calcTotalTipsInTree(tree.nodes);
    if (secondTreeDataset) {
      ({treeToo, metadata} = instantiateSecondTree(secondTreeDataset, metadata, entropy?.genomeMap, secondTreeName));
    }

    /* new controls state - don't apply query yet (or error check!) */
    controls = getDefaultControlsState();
    controls = modifyControlsStateViaTree(controls, tree, treeToo, metadata.colorings);
    controls = modifyStateViaMetadata(controls, metadata, entropy.genomeMap);
  } else if (oldState) {
    /* creating deep copies avoids references to (nested) objects remaining the same which
    can affect props comparisons. Due to the size of some of the state, we only do this selectively */
    controls = cloneDeep(oldState.controls);
    entropy = {...oldState.entropy};
    tree = {...oldState.tree};
    treeToo = {...oldState.treeToo};
    metadata = {...oldState.metadata};
    frequencies = {...oldState.frequencies};
    measurements = {...oldState.measurements};
    controls = restoreQueryableStateToDefaults(controls);
    controls = modifyStateViaMetadata(controls, metadata, entropy.genomeMap);
  }

  /* For the creation of state, we want to parse out URL query parameters
  (e.g. ?c=country means we want to color-by country) and modify the state
  accordingly. For narratives, we _don't_ display these in the URL, instead
  only displaying the page number (e.g. ?n=3), but we can look up what (hidden)
  URL query this page defines via this information */
  let narrativeSlideIdx;
  if (narrativeBlocks) {
    narrative = narrativeBlocks;
    narrativeSlideIdx = getNarrativePageFromQuery(query, narrative);
    /* replace the query with the information which can guide the view */
    query = queryString.parse(narrative[narrativeSlideIdx].query);
  }

  controls = modifyStateViaURLQuery(controls, query);

  /* Special handling of measurements controls and query params */
  let newMeasurementsColoringData = false;
  if (measurements.loaded) {
    const {
      collectionToDisplay,
      collectionControls,
      updatedQuery,
      newColoringData,
    } = combineMeasurementsControlsAndQuery(measurements, query);
    measurements.collectionToDisplay = collectionToDisplay;
    controls = {...controls, ...collectionControls};
    query = updatedQuery;

    /**
     * Similar to state changes applied for `REMOVE_METADATA`
     * Remove the old measurements coloring data before adding the new data,
     * which is necessary for changing measurements coloring in narratives
     */
    if (oldState?.controls?.measurementsColorGrouping !== undefined) {
      const colorByToRemove = encodeMeasurementColorBy(oldState.controls.measurementsColorGrouping);
      // Update controls
      controls.coloringsPresentOnTree.delete(colorByToRemove);
      // Update metadata
      if (colorByToRemove in metadata.colorings) {
        delete metadata.colorings[colorByToRemove];
      }
      // Update tree
      removeNodeAttrs(tree.nodes, [colorByToRemove]);
      tree.nodeAttrKeys.delete(colorByToRemove);
      if (colorByToRemove in tree.totalStateCounts) {
        delete tree.totalStateCounts[colorByToRemove];
      }
      // Update treeToo if exists
      if (treeToo && treeToo.loaded) {
        removeNodeAttrs(treeToo.nodes, [colorByToRemove]);
      }
    }

    // Similar to the state changes applied for `ADD_EXTRA_METADATA`
    if (newColoringData !== undefined) {
      newMeasurementsColoringData = true;
      // Update controls
      newColoringData.coloringsPresentOnTree.forEach((coloring) => controls.coloringsPresentOnTree.add(coloring));
      // Update metadata
      metadata.colorings = {...metadata.colorings, ...newColoringData.colorings};
      // Update tree
      addNodeAttrs(tree.nodes, newColoringData.nodeAttrs);
      Object.keys(newColoringData.colorings).forEach((attr) => tree.nodeAttrKeys.add(attr));
      const nonContinuousColorings = Object.keys(newColoringData.colorings).filter((coloring) => {
        return newColoringData.colorings[coloring].type !== "continuous"
      });
      tree.totalStateCounts = {
        ...tree.totalStateCounts,
        ...countTraitsAcrossTree(tree.nodes, nonContinuousColorings, false, true)
      };
      // Update treeToo if exists
      if (treeToo && treeToo.loaded) {
        addNodeAttrs(treeToo.nodes, newColoringData.nodeAttrs);
      }
    }
  } else {
    // Hide measurements panel if loading failed
    controls.panelsToDisplay = controls.panelsToDisplay.filter((panel) => panel !== "measurements");
    controls.canTogglePanelLayout = hasMultipleGridPanels(controls.panelsToDisplay);
    controls.panelLayout = controls.canTogglePanelLayout ? controls.panelLayout : "full";
    // Remove all measurements query params which start with `m_` or `mf_`
    query = Object.fromEntries(
      Object.entries(query)
        .filter(([key, _]) => !(key.startsWith("m_") || key.startsWith("mf_")))
    );
  }

  /* certain narrative slides prescribe the main panel to simply render narrative-provided markdown content */
  if (narrativeBlocks && narrative[narrativeSlideIdx].mainDisplayMarkdown) {
    controls.panelsToDisplay = ["MainDisplayMarkdown"];
  }

  const viewingNarrative = (narrativeBlocks || (oldState && oldState.narrative.display));

  const stateCountAttrs = gatherTraitNames(tree.nodes, metadata.colorings);
  tree.totalStateCounts = countTraitsAcrossTree(tree.nodes, stateCountAttrs, false, true);

  controls = checkAndCorrectErrorsInState(controls, metadata, entropy.genomeMap, query, tree, viewingNarrative); /* must run last */


  /* calculate colours if loading from JSONs or if the query demands change */
  if (json || controls.colorBy !== oldState.controls.colorBy || newMeasurementsColoringData) {
    const colorScale = calcColorScale(controls.colorBy, controls, tree, treeToo, metadata);
    const nodeColors = calcNodeColor(tree, colorScale);
    controls.colorScale = colorScale;
    controls.colorByConfidence = doesColorByHaveConfidence(controls, controls.colorBy);
    tree.nodeColorsVersion = colorScale.version;
    tree.nodeColors = nodeColors;
  }

  /* parse the query.label / query.clade */
  if (query.clade) {
    if (!query.label && query.clade !== "root") {
      query.label = `clade:${query.clade}`;
    }
    delete query.clade;
  }
  if (query.label) {
    if (!query.label.includes(":")) {
      console.error("Defined a label without ':' separator.");
      delete query.label;
    }
    if (!tree.availableBranchLabels.includes(query.label.split(":")[0])) {
      console.error(`Label name ${query.label.split(":")[0]} doesn't exist`);
      delete query.label;
    }
  }

  /* if query.label is undefined then we intend to zoom to the root */
  tree = modifyTreeStateVisAndBranchThickness(tree, query.label, controls, dispatch);

  if (treeToo && treeToo.loaded) {
    treeToo = updateSecondTree(tree, treeToo, controls, dispatch)
  }

  /* we can only calculate which legend items we wish to display _after_ the visibility has been calculated */
  controls.colorScale.visibleLegendValues = createVisibleLegendValues({
    colorBy: controls.colorBy,
    scaleType: controls.colorScale.scaleType,
    genotype: controls.colorScale.genotype,
    legendValues: controls.colorScale.legendValues,
    treeNodes: tree.nodes,
    treeTooNodes: treeToo ? treeToo.nodes : undefined,
    visibility: tree.visibility,
    visibilityToo: treeToo?.visibility,
  });

  /* calculate entropy in view */
  if (entropy.loaded) {
    /* The selected CDS + positions are only known if a genotype color-by has been set (display defaults | url) */
    entropy.selectedCds = nucleotide_gene;
    entropy.selectedPositions = [];
    if (isColorByGenotype(controls.colorBy)) {
      const gt = decodeColorByGenotype(controls.colorBy);
      const cds = getCdsFromGenotype(gt?.gene, entropy.genomeMap);
      if (cds) {
        entropy.selectedCds = cds;
        entropy.selectedPositions = gt?.positions || []
      }
    }
    const [entropyBars, entropyMaxYVal] = calcEntropyInView(tree.nodes, tree.visibility, entropy.selectedCds, entropy.showCounts);
    entropy.bars = entropyBars;
    entropy.maxYVal = entropyMaxYVal;
    entropy.onScreen = true;
  }

  /* update frequencies if they exist (not done for new JSONs) */
  if (frequencies && frequencies.loaded) {
    frequencies.version++;

    const allowNormalization = checkIfNormalizableFromRawData(
      frequencies.data,
      frequencies.pivots,
      tree.nodes,
      tree.visibility
    );

    if (!allowNormalization) {
      controls.normalizeFrequencies = false;
    }

    frequencies.matrix = computeMatrixFromRawData(
      frequencies.data,
      frequencies.pivots,
      tree.nodes,
      tree.visibility,
      controls.colorScale,
      controls.colorBy,
      controls.normalizeFrequencies
    );
  }

  /* if narratives then switch the query back to ?n=<SLIDE> for display */
  if (narrativeBlocks) query = {n: narrativeSlideIdx};

  return {tree, treeToo, metadata, entropy, controls, narrative, frequencies, measurements, query};
};

export const createTreeTooState = ({
  json, /* raw json data */
  oldState,
  originalTreeUrl,
  secondTreeUrl, /* treeToo URL */
  dispatch
}) => {
  /* TODO: reconcile choices (filters, colorBys etc) with this new tree */
  /* TODO: reconcile query with visibility etc */

  const tree = Object.assign({}, oldState.tree);
  tree.name = originalTreeUrl;
  let {treeToo, metadata} = instantiateSecondTree(json, oldState.metadata, oldState.entropy?.genomeMap, secondTreeUrl)

  /* recompute the controls state now that we have new data */
  const controls = modifyControlsStateViaTree({...oldState.controls}, tree, treeToo, oldState.metadata.colorings);
  /* recalculate the color scale with updated tree data */
  controls.colorScale = calcColorScale(controls.colorBy, controls, tree, treeToo, metadata);
  controls.colorByConfidence = doesColorByHaveConfidence(controls, controls.colorBy);
  /* and update the color scale as applied to the LHS tree */
  tree.nodeColors = calcNodeColor(tree, controls.colorScale);
  tree.nodeColorsVersion++;

  treeToo = updateSecondTree(tree, treeToo, controls, dispatch);

  return {tree, treeToo, controls, metadata};
};


/**
 * Code which is common to both loading a second tree within `createStateFromQueryOrJSONs` and
 * `createTreeTooState`.
 */
function instantiateSecondTree(secondTreeDataset, metadata, genomeMap, secondTreeName) {
  const treeToo = treeJsonToState(secondTreeDataset.tree);
  castIncorrectTypes(metadata, treeToo);
  treeToo.debug = "RIGHT";
  treeToo.name = secondTreeName;
  updateMetadataStateViaSecondTree({...metadata}, secondTreeDataset, genomeMap)

  const secondTreeColorings = convertColoringsListToDict(secondTreeDataset.meta?.colorings || []);
  const stateCountAttrs = gatherTraitNames(treeToo.nodes, secondTreeColorings);
  treeToo.totalStateCounts = countTraitsAcrossTree(treeToo.nodes, stateCountAttrs, false, true);

  /* TODO: calc & display num tips in 2nd tree */
  // metadata.secondTreeNumTips = calcTotalTipsInTree(treeToo.nodes);

  return {treeToo, metadata}
}

/**
 * Update colours and control state options. This function requires that the controls state
 * has been instantiated (e.g. the colorScale has been computed)
 */
function updateSecondTree(tree, treeToo, controls, dispatch) {
  treeToo.nodeColorsVersion = tree.nodeColorsVersion;
  treeToo.nodeColors = calcNodeColor(treeToo, controls.colorScale);
  treeToo = modifyTreeStateVisAndBranchThickness(treeToo, undefined, controls, dispatch);
  treeToo.tangleTipLookup = constructVisibleTipLookupBetweenTrees(tree.nodes, treeToo.nodes, tree.visibility, treeToo.visibility);

  /* modify controls */
  controls.showTreeToo = treeToo.name;
  controls.showTangle = true;
  controls.layout = "rect"; /* must be rectangular for two trees */
  controls.panelsToDisplay = controls.panelsToDisplay
    .filter((name) => !["map", "entropy", "frequencies"].includes(name));
  controls.canTogglePanelLayout = false;
  controls.panelLayout = "full";

  return treeToo;
}
