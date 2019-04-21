import queryString from "query-string";
import { numericToCalendar, calendarToNumeric } from "../util/dateHelpers";
import { reallySmallNumber, twoColumnBreakpoint, defaultColorBy, defaultGeoResolution, defaultDateRange, nucleotide_gene } from "../util/globals";
import { calcBrowserDimensionsInitialState } from "../reducers/browserDimensions";
import { strainNameToIdx, cladeNameToIdx, calculateVisiblityAndBranchThickness } from "../util/treeVisibilityHelpers";
import { constructVisibleTipLookupBetweenTrees } from "../util/treeTangleHelpers";
import { calcTipRadii } from "../util/tipRadiusHelpers";
import { getDefaultControlsState } from "../reducers/controls";
import { countTraitsAcrossTree } from "../util/treeCountingHelpers";
import { calcEntropyInView } from "../util/entropy";
import { treeJsonToState } from "../util/treeJsonProcessing";
import { entropyCreateState } from "../util/entropyCreateStateFromJsons";
import { determineColorByGenotypeMutType, calcNodeColor } from "../util/colorHelpers";
import { calcColorScale } from "../util/colorScale";
import { computeMatrixFromRawData } from "../util/processFrequencies";
import { applyInViewNodesToTree } from "../actions/tree";
import { isColorByGenotype, decodeColorByGenotype } from "../util/getGenotype";

export const checkColorByConfidence = (attrs, colorBy) => {
  return colorBy !== "num_date" && attrs.indexOf(colorBy + "_confidence") > -1;
};

export const getMinCalDateViaTree = (nodes, state) => {
  /* slider should be earlier than actual day */
  /* if no date, use some default dates - slider will not be visible */
  const minNumDate = nodes[0].attr.num_date ? nodes[0].attr.num_date - 0.01 : state.dateMaxNumeric - defaultDateRange;
  return numericToCalendar(minNumDate);
};

export const getMaxCalDateViaTree = (nodes) => {
  let maxNumDate = reallySmallNumber;
  nodes.forEach((node) => {
    if (node.attr) {
      if (node.attr.num_date) {
        if (node.attr.num_date > maxNumDate) {
          maxNumDate = node.attr.num_date;
        }
      }
    }
  });
  maxNumDate += 0.01; /* slider should be later than actual day */
  return numericToCalendar(maxNumDate);
};

/* need a (better) way to keep the queryParams all in "sync" */
const modifyStateViaURLQuery = (state, query) => {
  // console.log("Query incoming: ", query);
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
  if (query.r) {
    state["geoResolution"] = query.r;
  }
  if (query.p && state.canTogglePanelLayout && (query.p === "full" || query.p === "grid")) {
    state["panelLayout"] = query.p;
  }
  if (query.d) {
    const proposed = query.d.split(",");
    state.panelsToDisplay = state.panelsAvailable.filter((n) => proposed.indexOf(n) !== -1);
    if (state.panelsToDisplay.indexOf("map") === -1 || state.panelsToDisplay.indexOf("tree") === -1) {
      state["panelLayout"] = "full";
    }
  }
  if (query.dmin) {
    state["dateMin"] = query.dmin;
    state["dateMinNumeric"] = calendarToNumeric(query.dmin);
  }
  if (query.dmax) {
    state["dateMax"] = query.dmax;
    state["dateMaxNumeric"] = calendarToNumeric(query.dmax);
  }
  for (const filterKey of Object.keys(query).filter((c) => c.startsWith('f_'))) {
    state.filters[filterKey.replace('f_', '')] = query[filterKey].split(',');
  }
  if (query.animate) {
    const params = query.animate.split(',');
    // console.log("start animation!", params);
    window.NEXTSTRAIN.animationStartPoint = calendarToNumeric(params[0]);
    window.NEXTSTRAIN.animationEndPoint = calendarToNumeric(params[1]);
    state.dateMin = params[0];
    state.dateMax = params[1];
    state.dateMinNumeric = calendarToNumeric(params[0]);
    state.dateMaxNumeric = calendarToNumeric(params[1]);
    state.mapAnimationShouldLoop = params[2] === "1";
    state.mapAnimationCumulative = params[3] === "1";
    state.mapAnimationDurationInMilliseconds = parseInt(params[4], 10);
    state.animationPlayPauseButton = "Pause";
  } else {
    state.animationPlayPauseButton = "Play";
  }
  return state;
};

const restoreQueryableStateToDefaults = (state) => {
  for (const key of Object.keys(state.defaults)) {
    switch (typeof state.defaults[key]) {
      case "string": {
        state[key] = state.defaults[key];
        break;
      }
      case "object": { /* can't use Object.assign, must deep clone instead */
        state[key] = JSON.parse(JSON.stringify(state.defaults[key]));
        break;
      }
      default: {
        console.error("unknown typeof for default state of ", key);
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
  // console.log("state now", state);
  return state;
};

const modifyStateViaMetadata = (state, metadata) => {
  if (metadata.date_range) {
    /* this may be useful if, e.g., one were to want to display an outbreak
    from 2000-2005 (the default is the present day) */
    if (metadata.date_range.date_min) {
      state["dateMin"] = metadata.date_range.date_min;
      state["dateMinNumeric"] = calendarToNumeric(state["dateMin"]);
      state["absoluteDateMin"] = metadata.date_range.date_min;
      state["absoluteDateMinNumeric"] = calendarToNumeric(state["absoluteDateMin"]);
      state["mapAnimationStartDate"] = metadata.date_range.date_min;
    }
    if (metadata.date_range.date_max) {
      state["dateMax"] = metadata.date_range.date_max;
      state["dateMaxNumeric"] = calendarToNumeric(state["dateMax"]);
      state["absoluteDateMax"] = metadata.date_range.date_max;
      state["absoluteDateMaxNumeric"] = calendarToNumeric(state["absoluteDateMax"]);
    }
  }
  if (metadata.analysisSlider) {
    state["analysisSlider"] = {key: metadata.analysisSlider, valid: false};
  }
  if (metadata.authorInfo) {
    // need authors in metadata.filters to include as filter
    // but metadata.authorInfo is generally required for app functioning
  } else {
    console.warn("JSON did not include author_info");
  }
  if (metadata.filters) {
    metadata.filters.forEach((v) => {
      state.filters[v] = [];
      state.defaults.filters[v] = [];
    });
  } else {
    console.warn("JSON did not include any filters");
  }
  if (metadata.displayDefaults) {
    const keysToCheckFor = ["geoResolution", "colorBy", "distanceMeasure", "layout"];
    const expectedTypes = ["string", "string", "string", "string"];

    for (let i = 0; i < keysToCheckFor.length; i += 1) {
      if (metadata.displayDefaults[keysToCheckFor[i]]) {
        if (typeof metadata.displayDefaults[keysToCheckFor[i]] === expectedTypes[i]) { // eslint-disable-line valid-typeof
          /* e.g. if key=geoResoltion, set both state.geoResolution and state.defaults.geoResolution */
          state[keysToCheckFor[i]] = metadata.displayDefaults[keysToCheckFor[i]];
          state.defaults[keysToCheckFor[i]] = metadata.displayDefaults[keysToCheckFor[i]];
        } else {
          console.error("Skipping (meta.json) default for ", keysToCheckFor[i], "as it is not of type ", expectedTypes[i]);
        }
      }
    }
    // TODO: why are these false / False
    if (metadata.displayDefaults.mapTriplicate) {
      // convert string to boolean; default is true; turned off with either false (js) or False (python)
      state["mapTriplicate"] = (metadata.displayDefaults.mapTriplicate === 'false' || metadata.displayDefaults.mapTriplicate === 'False') ? false : true;
    }
  }

  if (metadata.panels) {
    state.panelsAvailable = metadata.panels.slice();
    state.panelsToDisplay = metadata.panels.slice();
  } else {
    state.panelsAvailable = ["tree"];
    state.panelsToDisplay = ["tree"];
  }

  /* if metadata lacks geo, remove map from panels to display */
  if (!metadata.geo) {
    state.panelsAvailable = state.panelsAvailable.filter((item) => item !== "map");
    state.panelsToDisplay = state.panelsToDisplay.filter((item) => item !== "map");
  }

  /* if we lack genome annotations, remove entropy from panels to display */
  if (!metadata.genomeAnnotations) {
    state.panelsAvailable = state.panelsAvailable.filter((item) => item !== "entropy");
    state.panelsToDisplay = state.panelsToDisplay.filter((item) => item !== "entropy");
  }

  /* if only map or only tree, then panelLayout must be full */
  /* note - this will be overwritten by the URL query */
  if (state.panelsAvailable.indexOf("map") === -1 || state.panelsAvailable.indexOf("tree") === -1) {
    state.panelLayout = "full";
    state.canTogglePanelLayout = false;
  }
  /* genome annotations in metadata */
  if (metadata.genomeAnnotations) {
    for (const gene of Object.keys(metadata.genomeAnnotations)) {
      state.geneLength[gene] = metadata.genomeAnnotations[gene].end - metadata.genomeAnnotations[gene].start;
      if (gene !== nucleotide_gene) {
        state.geneLength[gene] /= 3;
      }
    }
  } else {
    console.warn("JSONs did not include `genome_annotations`");
  }

  return state;
};

const modifyStateViaTree = (state, tree, treeToo) => {
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

  /* collect all available tree attrs, and available mutations */
  const attrs = new Set();
  let [aaMuts, nucMuts] = [false, false];
  const examineNodes = function examineNodes(nodes) {
    nodes.forEach((node) => {
      Object.keys(node.attr).forEach((attr) => {
        attrs.add(attr);
      });
      if (node.aa_muts && Object.keys(node.aa_muts).length) aaMuts = true;
      if (node.muts && node.muts.length) nucMuts = true;
    });
  };
  examineNodes(tree.nodes);
  if (treeToo) {
    examineNodes(treeToo.nodes);
  }
  state.attrs = [...attrs]; /* convert to list */

  /* ensure specified mutType is indeed available */
  if (!aaMuts && !nucMuts) {
    state.mutType = null;
  } else if (state.mutType === "aa" && !aaMuts) {
    state.mutType = "nuc";
  } else if (state.mutType === "nuc" && !nucMuts) {
    state.mutType = "aa";
  }

  /* does the tree have date information? if not, disable controls, modify view */
  state.branchLengthsToDisplay = Object.keys(tree.nodes[0].attr).indexOf("num_date") === -1 ? "divOnly" :
    Object.keys(tree.nodes[0].attr).indexOf("div") === -1 ? "dateOnly" : "divAndDate";

  /* if branchLengthsToDisplay is "divOnly", force to display by divergence
   * if branchLengthsToDisplay is "dateOnly", force to display by date
   */
  state.distanceMeasure = state.branchLengthsToDisplay === "divOnly" ? "div" :
    state.branchLengthsToDisplay === "dateOnly" ? "num_date" : state.distanceMeasure;

  state.selectedBranchLabel = tree.availableBranchLabels.indexOf("clade") !== -1 ? "clade" : "none";
  state.temporalConfidence = Object.keys(tree.nodes[0].attr).indexOf("num_date_confidence") > -1 ?
    {exists: true, display: true, on: false} : {exists: false, display: false, on: false};
  return state;
};

const checkAndCorrectErrorsInState = (state, metadata, query, tree) => {
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
    /* Check that the genotype is valid with the current data */
    if (!decodeColorByGenotype(state.colorBy, state.geneLength)) {
      fallBackToDefaultColorBy();
    }
  } else if (Object.keys(metadata.colorings).indexOf(state.colorBy) === -1) {
    /* if it's a _non_ genotype colorBy AND it's not a valid option, fall back to the default */
    fallBackToDefaultColorBy();
  }

  /* zoom */
  if (state.zoomMax > state["absoluteZoomMax"]) { state.zoomMax = state["absoluteZoomMax"]; }
  if (state.zoomMin < state["absoluteZoomMin"]) { state.zoomMin = state["absoluteZoomMin"]; }
  if (state.zoomMin > state.zoomMax) {
    const tempMin = state.zoomMin;
    state.zoomMin = state.zoomMax;
    state.zoomMax = tempMin;
  }

  /* colorBy confidence */
  state["colorByConfidence"] = checkColorByConfidence(state["attrs"], state["colorBy"]);

  /* distanceMeasure */
  if (["div", "num_date"].indexOf(state["distanceMeasure"]) === -1) {
    state["distanceMeasure"] = "num_date";
    console.error("Error detected. Setting distanceMeasure to ", state["distanceMeasure"]);
  }

  /* geoResolution */
  if (metadata.geo) {
    const availableGeoResultions = Object.keys(metadata.geo);
    if (availableGeoResultions.indexOf(state["geoResolution"]) === -1) {
      /* fallbacks: JSON defined default, then hardocded default, then any available */
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
  } else {
    console.warn("JSONs did not include geo info.");
  }

  /* temporalConfidence */
  if (state.temporalConfidence.exists) {
    if (state.layout !== "rect") {
      state.temporalConfidence.display = false;
      state.temporalConfidence.on = false;
    } else if (state.distanceMeasure === "div") {
      state.temporalConfidence.display = false;
      state.temporalConfidence.on = false;
    }
  }

  /* if colorBy is a genotype then we need to set mutType */
  if (state.colorBy) {
    const maybeMutType = determineColorByGenotypeMutType(state.colorBy);
    if (maybeMutType) {
      state.mutType = maybeMutType;
    }
  }

  /* are filters valid? */
  const activeFilters = Object.keys(state.filters).filter((f) => f.length);
  const stateCounts = countTraitsAcrossTree(tree.nodes, activeFilters, false, true);
  for (const filterType of activeFilters) {
    const validValues = state.filters[filterType]
      .filter((filterValue) => filterValue in stateCounts[filterType]);
    state.filters[filterType] = validValues;
    if (!validValues.length) {
      delete query[`f_${filterType}`];
    } else {
      query[`f_${filterType}`] = validValues.join(",");
    }
  }

  /* can we display branch length by div or num_date? */
  if (query.m && state.branchLengthsToDisplay !== "divAndDate") {
    delete query.m;
  }

  return state;
};

const modifyTreeStateVisAndBranchThickness = (oldState, tipSelected, cladeSelected, controlsState) => {
  /* calculate new branch thicknesses & visibility */
  let tipSelectedIdx = 0;
  /* check if the query defines a strain to be selected */
  let newIdxRoot = oldState.idxOfInViewRootNode;
  if (tipSelected) {
    tipSelectedIdx = strainNameToIdx(oldState.nodes, tipSelected);
    oldState.selectedStrain = tipSelected;
  }
  if (cladeSelected) {
    const cladeSelectedIdx = cladeSelected === 'root' ? 0 : cladeNameToIdx(oldState.nodes, cladeSelected);
    oldState.selectedClade = cladeSelected;
    newIdxRoot = applyInViewNodesToTree(cladeSelectedIdx, oldState); // tipSelectedIdx, oldState);
  }
  const visAndThicknessData = calculateVisiblityAndBranchThickness(
    oldState,
    controlsState,
    {dateMinNumeric: controlsState.dateMinNumeric, dateMaxNumeric: controlsState.dateMaxNumeric},
    {tipSelectedIdx, validIdxRoot: newIdxRoot}
  );

  const newState = Object.assign({}, oldState, visAndThicknessData);
  newState.stateCountAttrs = Object.keys(controlsState.filters);
  newState.idxOfInViewRootNode = newIdxRoot;
  newState.visibleStateCounts = countTraitsAcrossTree(newState.nodes, newState.stateCountAttrs, newState.visibility, true);
  newState.totalStateCounts   = countTraitsAcrossTree(newState.nodes, newState.stateCountAttrs, false,               true); // eslint-disable-line

  if (tipSelectedIdx) { /* i.e. query.s was set */
    newState.tipRadii = calcTipRadii({tipSelectedIdx, colorScale: controlsState.colorScale, tree: newState});
    newState.tipRadiiVersion = 1;
  }
  return newState;
};

const removePanelIfPossible = (panels, name) => {
  const idx = panels.indexOf(name);
  if (idx !== -1) {
    panels.splice(idx, 1);
  }
};

const modifyControlsViaTreeToo = (controls, name) => {
  controls.showTreeToo = name;
  controls.showTangle = true;
  controls.layout = "rect"; /* must be rectangular for two trees */
  controls.panelsToDisplay = controls.panelsToDisplay.slice();
  removePanelIfPossible(controls.panelsToDisplay, "map");
  removePanelIfPossible(controls.panelsToDisplay, "entropy");
  removePanelIfPossible(controls.panelsToDisplay, "frequencies");
  controls.canTogglePanelLayout = false;
  controls.panelLayout = "full";
  return controls;
};

export const createStateFromQueryOrJSONs = ({
  json = false, /* raw json data - completely nuke existing redux state */
  oldState = false, /* existing redux state (instead of jsons) */
  narrativeBlocks = false,
  query
}) => {
  let tree, treeToo, entropy, controls, metadata, narrative, frequencies;
  /* first task is to create metadata, entropy, controls & tree partial state */
  if (json) {
    /* create metadata state */
    metadata = json.meta;
    console.log("Metadata JSONs still to do:", Object.keys(metadata));
    if (metadata === undefined) {
      metadata = {};
    }
    if (json.colorings) {
      metadata.colorings = json.colorings;
    }
    metadata.title = json.title;
    metadata.updated = json.updated;
    if (json.version) {
      metadata.version = json.version;
    }
    metadata.maintainers = json.maintainers;
    if (json.author_info) {
      metadata.authorInfo = json.author_info;
    }
    if (json.genome_annotations) {
      metadata.genomeAnnotations = json.genome_annotations;
    }
    if (json.filters) {
      metadata.filters = json.filters;
    }
    if (json.panels) {
      metadata.panels = json.panels;
    }
    if (json.display_defaults) {
      metadata.displayDefaults = json.display_defaults;
      /* rename to camelCase for use throughout auspice */
      if (metadata.displayDefaults.color_by) {
        metadata.displayDefaults.colorBy = metadata.displayDefaults.color_by;
        delete metadata.displayDefaults.color_by;
      }
      if (metadata.displayDefaults.geo_resolution) {
        metadata.displayDefaults.geoResolution = metadata.displayDefaults.geo_resolution;
        delete metadata.displayDefaults.geo_resolution;
      }
      if (metadata.displayDefaults.distance_measure) {
        metadata.displayDefaults.distanceMeasure = metadata.displayDefaults.distance_measure;
        delete metadata.displayDefaults.distance_measure;
      }
      if (metadata.displayDefaults.map_triplicate) {
        metadata.displayDefaults.mapTriplicate = metadata.displayDefaults.map_triplicate;
        delete metadata.displayDefaults.map_triplicate;
      }
    }


    if (Object.prototype.hasOwnProperty.call(metadata, "loaded")) {
      console.error("Metadata JSON must not contain the key \"loaded\". Ignoring.");
    }
    metadata.loaded = true;
    /* entropy state */
    entropy = entropyCreateState(metadata.genomeAnnotations);
    /* new tree state(s) */
    tree = treeJsonToState(json.tree, metadata.vaccine_choices);
    tree.debug = "LEFT";
    if (json.treeTwo) {
      treeToo = treeJsonToState(json.treeTwo, metadata.vaccine_choices);
      treeToo.debug = "RIGHT";
      treeToo.name = json._treeTwoName;
    }
    /* new controls state - don't apply query yet (or error check!) */
    controls = getDefaultControlsState();
    controls = modifyStateViaTree(controls, tree, treeToo);
    controls = modifyStateViaMetadata(controls, metadata);
    controls["absoluteZoomMin"] = 0;
    controls["absoluteZoomMax"] = entropy.lengthSequence;
    controls.source = json["_source"];
  } else if (oldState) {
    /* revisit this - but it helps prevent bugs */
    controls = {...oldState.controls};
    entropy = {...oldState.entropy};
    tree = {...oldState.tree};
    treeToo = {...oldState.treeToo};
    metadata = {...oldState.metadata};
    frequencies = {...oldState.frequencies};
    controls = restoreQueryableStateToDefaults(controls);
  }

  if (narrativeBlocks) {
    narrative = narrativeBlocks;
    const n = parseInt(query.n, 10) || 0;
    controls = modifyStateViaURLQuery(controls, queryString.parse(narrative[n].query));
    query = {n}; // eslint-disable-line
    console.log("redux state changed to relfect n of", n);
  } else {
    controls = modifyStateViaURLQuery(controls, query);
  }

  controls = checkAndCorrectErrorsInState(controls, metadata, query, tree); /* must run last */


  /* calculate colours if loading from JSONs or if the query demands change */
  if (json || controls.colorBy !== oldState.colorBy) {
    const colorScale = calcColorScale(controls.colorBy, controls, tree, treeToo, metadata);
    const nodeColors = calcNodeColor(tree, colorScale);
    controls.colorScale = colorScale;
    controls.colorByConfidence = checkColorByConfidence(controls.attrs, controls.colorBy);
    tree.nodeColorsVersion = colorScale.version;
    tree.nodeColors = nodeColors;
  }

  if (query.clade) {
    tree = modifyTreeStateVisAndBranchThickness(tree, undefined, query.clade, controls);
  } else { /* if not specifically given in URL, zoom to root */
    tree = modifyTreeStateVisAndBranchThickness(tree, undefined, 'root', controls);
  }
  tree = modifyTreeStateVisAndBranchThickness(tree, query.s, undefined, controls);
  if (treeToo && treeToo.loaded) {
    treeToo.nodeColorsVersion = tree.nodeColorsVersion;
    treeToo.nodeColors = calcNodeColor(treeToo, controls.colorScale);
    treeToo = modifyTreeStateVisAndBranchThickness(treeToo, query.s, undefined, controls);
    controls = modifyControlsViaTreeToo(controls, treeToo.name);
    treeToo.tangleTipLookup = constructVisibleTipLookupBetweenTrees(tree.nodes, treeToo.nodes, tree.visibility, treeToo.visibility);
  }

  /* calculate entropy in view */
  if (entropy.loaded) {
    const [entropyBars, entropyMaxYVal] = calcEntropyInView(tree.nodes, tree.visibility, controls.mutType, entropy.geneMap, entropy.showCounts);
    entropy.bars = entropyBars;
    entropy.maxYVal = entropyMaxYVal;
    entropy.zoomMax = controls["zoomMax"];
    entropy.zoomMin = controls["zoomMin"];
    entropy.zoomCoordinates = [controls["zoomMin"], controls["zoomMax"]];
  }

  /* update frequencies if they exist (not done for new JSONs) */
  if (frequencies && frequencies.loaded) {
    frequencies.version++;
    frequencies.matrix = computeMatrixFromRawData(
      frequencies.data,
      frequencies.pivots,
      tree.nodes,
      tree.visibility,
      controls.colorScale,
      controls.colorBy
    );
  }

  if (json["_treeName"]) {
    tree.name = json["_treeName"];
  }
  const url = json["_url"]; // injected by the server. Will be picked up by middleware.
  return {tree, treeToo, metadata, entropy, controls, narrative, frequencies, query, url};
};

export const createTreeTooState = ({
  treeTooJSON, /* raw json data */
  oldState,
  segment /* name of the treeToo segment */
}) => {
  /* TODO: reconsile choices (filters, colorBys etc) with this new tree */
  /* TODO: reconcile query with visibility etc */
  let controls = oldState.controls;
  const tree = Object.assign({}, oldState.tree);
  let treeToo = treeJsonToState(treeTooJSON);
  treeToo.debug = "RIGHT";
  controls = modifyStateViaTree(controls, tree, treeToo);
  controls = modifyControlsViaTreeToo(controls, segment);
  treeToo = modifyTreeStateVisAndBranchThickness(treeToo, tree.selectedStrain, undefined, controls);

  /* calculate colours if loading from JSONs or if the query demands change */
  const colorScale = calcColorScale(controls.colorBy, controls, tree, treeToo, oldState.metadata);
  const nodeColors = calcNodeColor(treeToo, colorScale);
  tree.nodeColors = calcNodeColor(tree, colorScale); // also update main tree's colours
  tree.nodeColorsVersion++;

  controls.colorScale = colorScale;
  controls.colorByConfidence = checkColorByConfidence(controls.attrs, controls.colorBy);
  treeToo.nodeColorsVersion = colorScale.version;
  treeToo.nodeColors = nodeColors;

  treeToo.tangleTipLookup = constructVisibleTipLookupBetweenTrees(
    tree.nodes, treeToo.nodes, tree.visibility, treeToo.visibility
  );

  // if (tipSelectedIdx) { /* i.e. query.s was set */
  //   tree.tipRadii = calcTipRadii({tipSelectedIdx, colorScale: controls.colorScale, tree});
  //   tree.tipRadiiVersion = 1;
  // }
  return {tree, treeToo, controls};
};
