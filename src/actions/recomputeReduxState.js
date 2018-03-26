import queryString from "query-string";
import { numericToCalendar, calendarToNumeric } from "../util/dateHelpers";
import { reallySmallNumber, twoColumnBreakpoint, genotypeColors } from "../util/globals";
import { calcBrowserDimensionsInitialState } from "../reducers/browserDimensions";
import { flattenTree, appendParentsToTree, processVaccines, processNodes, processBranchLabelsInPlace, strainNameToIdx, calcTipRadii } from "../components/tree/treeHelpers";
import { getDefaultControlsState } from "../reducers/controls";
import { getDefaultTreeState, getAttrsOnTerminalNodes } from "../reducers/tree";
import { calculateVisiblityAndBranchThickness } from "./treeProperties";
import { calcEntropyInView, getValuesAndCountsOfVisibleTraitsFromTree, getAllValuesAndCountsOfTraitsFromTree } from "../util/treeTraversals";
import { calcColorScaleAndNodeColors } from "./colors";
import { determineColorByGenotypeType } from "../util/colorHelpers";
import { processFrequenciesJSON, computeMatrixFromRawData } from "../util/processFrequencies";

const getAnnotations = (jsonData) => {
  const annotations = [];
  let aaCount = 0;
  for (const prot of Object.keys(jsonData)) {
    if (prot !== "nuc") {
      aaCount++;
      annotations.push({
        prot: prot,
        start: jsonData[prot].start,
        end: jsonData[prot].end,
        readingFrame: 1, // +tmpProt['pos'][0]%3,
        fill: genotypeColors[aaCount % 10]
      });
    }
  }
  return annotations;
};

const processAnnotations = (annotations) => {
  const m = {}; /* m === geneMap */
  annotations.forEach((d) => {
    m[d.prot] = d;
  });
  const sorted = Object.keys(m).sort((a, b) =>
    m[a].start < m[b].start ? -1 : m[a].start > m[b].start ? 1 : 0
  );
  for (const gene of Object.keys(m)) {
    m[gene].idx = sorted.indexOf(gene);
  }
  return m;
};

export const checkColorByConfidence = (attrs, colorBy) => {
  return colorBy !== "num_date" && attrs.indexOf(colorBy + "_confidence") > -1;
};

const getMinCalDateViaTree = (nodes) => {
  const minNumDate = nodes[0].attr.num_date - 0.01; /* slider should be earlier than actual day */
  return numericToCalendar(minNumDate);
};

const getMaxCalDateViaTree = (nodes) => {
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
  if (query.m) {
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
  if (metadata.author_info) {
    // need authors in metadata.filters to include as filter
    // but metadata.author_info is generally required for app functioning
  } else {
    console.error("the meta.json must include author_info");
  }
  if (metadata.filters) {
    metadata.filters.forEach((v) => {
      state.filters[v] = [];
      state.defaults.filters[v] = [];
    });
  } else {
    console.warn("the meta.json did not include any filters");
  }
  if (metadata.defaults) {
    const keysToCheckFor = ["geoResolution", "colorBy", "distanceMeasure", "layout"];
    const expectedTypes = ["string", "string", "string", "string"];

    for (let i = 0; i < keysToCheckFor.length; i += 1) {
      if (metadata.defaults[keysToCheckFor[i]]) {
        if (typeof metadata.defaults[keysToCheckFor[i]] === expectedTypes[i]) { // eslint-disable-line valid-typeof
          /* e.g. if key=geoResoltion, set both state.geoResolution and state.defaults.geoResolution */
          state[keysToCheckFor[i]] = metadata.defaults[keysToCheckFor[i]];
          state.defaults[keysToCheckFor[i]] = metadata.defaults[keysToCheckFor[i]];
        } else {
          console.error("Skipping (meta.json) default for ", keysToCheckFor[i], "as it is not of type ", expectedTypes[i]);
        }
      }
    }
    // TODO: why are these false / False
    if (metadata.defaults.mapTriplicate) {
      // convert string to boolean; default is true; turned off with either false (js) or False (python)
      state["mapTriplicate"] = (metadata.defaults.mapTriplicate === 'false' || metadata.defaults.mapTriplicate === 'False') ? false : true;
    }
  }

  state.panelsAvailable = metadata.panels.slice();
  state.panelsToDisplay = metadata.panels.slice();

  /* if only map or only tree, then panelLayout must be full */
  /* note - this will be overwritten by the URL query */
  if (state.panelsAvailable.indexOf("map") === -1 || state.panelsAvailable.indexOf("tree") === -1) {
    state.panelLayout = "full";
    state.canTogglePanelLayout = false;
  }
  /* annotations in metadata */
  if (!metadata.annotations) {console.error("Metadata needs updating with annotations field. Rerun augur. FATAL.");}
  for (const gene of Object.keys(metadata.annotations)) {
    state.geneLength[gene] = metadata.annotations[gene].end - metadata.annotations[gene].start;
    if (gene !== "nuc") {
      state.geneLength[gene] /= 3;
    }
  }
  return state;
};

const modifyStateViaTree = (state, tree) => {
  state["dateMin"] = getMinCalDateViaTree(tree.nodes);
  state["absoluteDateMin"] = getMinCalDateViaTree(tree.nodes);
  state["dateMax"] = getMaxCalDateViaTree(tree.nodes);
  state["absoluteDateMax"] = getMaxCalDateViaTree(tree.nodes);
  /* and their numeric conversions */
  state.dateMinNumeric = calendarToNumeric(state.dateMin);
  state.absoluteDateMinNumeric = calendarToNumeric(state.absoluteDateMin);
  state.dateMaxNumeric = calendarToNumeric(state.dateMax);
  state.absoluteDateMaxNumeric = calendarToNumeric(state.absoluteDateMax);
  state.selectedBranchLabel = tree.availableBranchLabels.indexOf("clade") !== -1 ? "clade" : "none";

  /* available tree attrs - based upon the root node */
  state["attrs"] = Object.keys(tree.nodes[0].attr);
  state["temporalConfidence"] = Object.keys(tree.nodes[0].attr).indexOf("num_date_confidence") > -1 ?
    {exists: true, display: true, on: false} : {exists: false, display: false, on: false};
  return state;
};

const checkAndCorrectErrorsInState = (state, metadata) => {
  /* The one (bigish) problem with this being in the reducer is that
  we can't have any side effects. So if we detect and error introduced by
  a URL QUERY (and correct it in state), we can't correct the URL */

  /* colorBy */
  if (Object.keys(metadata.colorOptions).indexOf(state.colorBy) === -1 && !state["colorBy"].startsWith("gt-")) {
    const availableNonGenotypeColorBys = Object.keys(metadata.colorOptions);
    if (availableNonGenotypeColorBys.indexOf("gt") > -1) {
      availableNonGenotypeColorBys.splice(availableNonGenotypeColorBys.indexOf("gt"), 1);
    }
    console.error("Error detected trying to set colorBy to", state.colorBy, "(valid options are", Object.keys(metadata.colorOptions).join(", "), "). Setting to", availableNonGenotypeColorBys[0]);
    state.colorBy = availableNonGenotypeColorBys[0];
    state.defaults.colorBy = availableNonGenotypeColorBys[0];
  }

  /* colorBy confidence */
  state["colorByConfidence"] = checkColorByConfidence(state["attrs"], state["colorBy"]);

  /* distanceMeasure */
  if (["div", "num_date"].indexOf(state["distanceMeasure"]) === -1) {
    state["distanceMeasure"] = "num_date";
    console.error("Error detected. Setting distanceMeasure to ", state["distanceMeasure"]);
  }

  /* geoResolution */
  const availableGeoResultions = Object.keys(metadata.geo);
  if (availableGeoResultions.indexOf(state["geoResolution"]) === -1) {
    state["geoResolution"] = availableGeoResultions[0];
    console.error("Error detected. Setting geoResolution to ", state["geoResolution"]);
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
  const maybeMutType = determineColorByGenotypeType(state.colorBy);
  if (maybeMutType) state.mutType = maybeMutType;

  return state;
};

export const createStateFromQueryOrJSONs = ({
  JSONs = false, /* raw json data - completely nuke existing redux state */
  oldState = false, /* existing redux state (instead of jsons) */
  query
}) => {
  /* first task is to create metadata, entropy, controls & tree partial state */
  let tree, entropy, controls, metadata, frequencies, narrative;
  if (JSONs) {
    if (JSONs.narrative) narrative = JSONs.narrative;

    /* ceate metadata state */
    metadata = JSONs.meta;
    if (Object.prototype.hasOwnProperty.call(metadata, "loaded")) {
      console.error("Metadata JSON must not contain the key \"loaded\". Ignoring.");
    }
    metadata.colorOptions = metadata.color_options;
    delete metadata.color_options;
    metadata.loaded = true;

    /* entropy state */
    /* TODO check that metadata defines the entropy panel */
    const annotations = getAnnotations(JSONs.meta.annotations);
    entropy = {
      showCounts: false,
      loaded: true,
      annotations,
      geneMap: processAnnotations(annotations)
    };

    /* new tree state */
    appendParentsToTree(JSONs.tree);
    const nodesArray = flattenTree(JSONs.tree);
    const nodes = processNodes(nodesArray);
    const vaccines = processVaccines(nodes, JSONs.meta.vaccine_choices);
    const availableBranchLabels = processBranchLabelsInPlace(nodesArray);
    tree = Object.assign({}, getDefaultTreeState(), {
      nodes,
      vaccines,
      availableBranchLabels,
      attrs: getAttrsOnTerminalNodes(nodes),
      loaded: true
    });

    /* new controls state - don't apply query yet (or error check!) */
    controls = getDefaultControlsState();
    controls = modifyStateViaTree(controls, tree);
    controls = modifyStateViaMetadata(controls, metadata);
  }

  if (oldState) {
    ({controls, entropy, tree, metadata, frequencies} = oldState);
    controls = restoreQueryableStateToDefaults(controls);
  }

  if (narrative) {
    const n = parseInt(query.n, 10) || 1;
    controls = modifyStateViaURLQuery(controls, queryString.parse(narrative[n].url));
    query = {n}; // eslint-disable-line
  } else {
    controls = modifyStateViaURLQuery(controls, query);
  }

  controls = checkAndCorrectErrorsInState(controls, metadata); /* must run last */

  /* calculate new branch thicknesses & visibility */
  let tipSelectedIdx = 0;
  /* check if the query defines a strain to be selected */
  if (query.s) {
    tipSelectedIdx = strainNameToIdx(tree.nodes, query.s);
    tree.selectedStrain = query.s;
  }
  const visAndThicknessData = calculateVisiblityAndBranchThickness(
    tree,
    controls,
    {dateMinNumeric: controls.dateMinNumeric, dateMaxNumeric: controls.dateMaxNumeric},
    {tipSelectedIdx, validIdxRoot: tree.idxOfInViewRootNode}
  );
  visAndThicknessData.stateCountAttrs = Object.keys(controls.filters);
  tree = Object.assign({}, tree, visAndThicknessData);
  tree.visibleStateCounts = getValuesAndCountsOfVisibleTraitsFromTree(tree.nodes, tree.visibility, tree.stateCountAttrs);
  /* potentially VVVV only needs to run if using JSONs */
  tree.totalStateCounts = getAllValuesAndCountsOfTraitsFromTree(tree.nodes, tree.stateCountAttrs);

  /* calculate colours if loading from JSONs or if the query demands change */
  if (JSONs || controls.colorBy !== oldState.colorBy) {
    const {nodeColors, colorScale, version} = calcColorScaleAndNodeColors(controls.colorBy, controls, tree, metadata);
    controls.colorScale = colorScale;
    controls.colorByConfidence = checkColorByConfidence(controls.attrs, controls.colorBy);
    tree.nodeColorsVersion = version;
    tree.nodeColors = nodeColors;
  }

  if (tipSelectedIdx) { /* i.e. query.s was set */
    tree.tipRadii = calcTipRadii({tipSelectedIdx, colorScale: controls.colorScale, tree});
    tree.tipRadiiVersion = 1;
  }

  /* calculate entropy in view */
  const [entropyBars, entropyMaxYVal] = calcEntropyInView(tree.nodes, tree.visibility, controls.mutType, entropy.geneMap, entropy.showCounts);
  entropy.bars = entropyBars;
  entropy.maxYVal = entropyMaxYVal;

  /* potentially calculate frequency (or update it!)
  this needs to come after the colorscale & tree is set */
  if (JSONs && JSONs.frequencies) {
    frequencies = {loaded: true, version: 1, ...processFrequenciesJSON(JSONs.frequencies, tree, controls)};
  } else if (frequencies && frequencies.loaded) { /* oldState */
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
  return {tree, metadata, entropy, controls, frequencies, narrative, query};
};
