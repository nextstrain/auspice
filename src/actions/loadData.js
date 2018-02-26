import queryString from "query-string";
import * as types from "./types";
import { calcColorScaleAndNodeColors } from "./colors";
import { calculateVisiblityAndBranchThickness } from "./treeProperties";
import { charonAPIAddress, enableNarratives } from "../util/globals";
import { errorNotification } from "./notifications";
import { getManifest } from "../util/clientAPIInterface";
import { getNarrative } from "../util/getMarkdown";
import { changePage } from "./navigation";
import { processFrequenciesJSON } from "./frequencies";
import { getAnnotations, processAnnotations } from "../reducers/entropy";
import { getDefaultTreeState, getAttrsOnTerminalNodes } from "../reducers/tree";
import { flattenTree, appendParentsToTree, processVaccines, processNodes, processBranchLabelsInPlace } from "../components/tree/treeHelpers";
import { getDefaultControlsState } from "../reducers/controls";
import { calcEntropyInView, getValuesAndCountsOfVisibleTraitsFromTree, getAllValuesAndCountsOfTraitsFromTree } from "../util/treeTraversals";
import { modifyStateViaTree, modifyStateViaMetadata, modifyStateViaURLQuery, checkAndCorrectErrorsInState, checkColorByConfidence } from "./modifyControlState";

export const loadJSONs = (s3override = undefined) => { // eslint-disable-line import/prefer-default-export
  return (dispatch, getState) => {
    const { datasets } = getState();
    if (!datasets.availableDatasets) {
      console.error("Attempted to fetch JSONs before Charon returned initial data.");
      return;
    }
    dispatch({type: types.DATA_INVALID});
    const s3bucket = s3override ? s3override : datasets.s3bucket;
    const metaJSONpromise = fetch(charonAPIAddress + "request=json&path=" + datasets.datapath + "_meta.json&s3=" + s3bucket)
      .then((res) => res.json());
    const treeJSONpromise = fetch(charonAPIAddress + "request=json&path=" + datasets.datapath + "_tree.json&s3=" + s3bucket)
      .then((res) => res.json());
    Promise.all([metaJSONpromise, treeJSONpromise])
      .then((values) => {
        /* we do expensive stuff here not reducers. Allows fewer dispatches. */
        const [metaJSON, treeJSON] = values;
        const query = queryString.parse(window.location.search);

        /* metadata NEW_DATASET */
        const metaState = metaJSON;
        if (Object.prototype.hasOwnProperty.call(metaState, "loaded")) {
          console.error("Metadata JSON must not contain the key \"loaded\". Ignoring.");
        }
        metaState.colorOptions = metaState.color_options;
        delete metaState.color_options;
        metaState.loaded = true;

        /* entropy NEW_DATASET */
        /* TODO check that metadata defines the entropy panel */
        const annotations = getAnnotations(metaJSON.annotations);
        const entropyState = {
          showCounts: false,
          loaded: true,
          annotations,
          geneMap: processAnnotations(annotations)
        };

        /* tree NEW_DATASET */
        appendParentsToTree(treeJSON);
        const nodesArray = flattenTree(treeJSON);
        const nodes = processNodes(nodesArray);
        const vaccines = processVaccines(nodes, metaJSON.vaccine_choices);
        const availableBranchLabels = processBranchLabelsInPlace(nodesArray);
        let treeState = Object.assign({}, getDefaultTreeState(), {
          nodes,
          vaccines,
          availableBranchLabels,
          attrs: getAttrsOnTerminalNodes(nodes),
          loaded: true
        });
        /* controls NEW_DATASET */
        let controlsState = getDefaultControlsState();
        controlsState = modifyStateViaTree(controlsState, treeState);
        controlsState = modifyStateViaMetadata(controlsState, metaState);
        controlsState = modifyStateViaURLQuery(controlsState, query);
        controlsState = checkAndCorrectErrorsInState(controlsState, metaState); /* must run last */

        /* a lot of this is duplicated in changePageQuery */
        /* 2 - calculate new branch thicknesses & visibility */
        let tipSelectedIdx = 0;
        if (query.s) {
          for (let i = 0; i < treeState.nodes.length; i++) {
            if (treeState.nodes[i].strain === query.s) {
              tipSelectedIdx = i;
              break;
            }
          }
        }
        const visAndThicknessData = calculateVisiblityAndBranchThickness(
          treeState,
          controlsState,
          {dateMinNumeric: controlsState.dateMinNumeric, dateMaxNumeric: controlsState.dateMaxNumeric},
          {tipSelectedIdx, validIdxRoot: treeState.idxOfInViewRootNode}
        );
        visAndThicknessData.stateCountAttrs = Object.keys(controlsState.filters);
        treeState = Object.assign({}, treeState, visAndThicknessData);
        treeState.visibleStateCounts = getValuesAndCountsOfVisibleTraitsFromTree(treeState.nodes, treeState.visibility, treeState.stateCountAttrs);
        treeState.totalStateCounts = getAllValuesAndCountsOfTraitsFromTree(treeState.nodes, treeState.stateCountAttrs);

        /* 3 - calculate colours */
        const {nodeColors, colorScale, version} = calcColorScaleAndNodeColors(controlsState.colorBy, controlsState, treeState, metaState);
        controlsState.colorScale = colorScale;
        controlsState.colorByConfidence = checkColorByConfidence(controlsState.attrs, controlsState.colorBy);
        treeState.nodeColorsVersion = version;
        treeState.nodeColors = nodeColors;

        /* 4 - calculate entropy in view */
        const [entropyBars, entropyMaxYVal] = calcEntropyInView(treeState.nodes, treeState.visibility, controlsState.mutType, entropyState.geneMap, entropyState.showCounts);
        entropyState.bars = entropyBars;
        entropyState.maxYVal = entropyMaxYVal;

        dispatch({
          type: types.CLEAN_START,
          treeState,
          metaState,
          entropyState,
          controlsState
        });

        /* F R E Q U E N C I E S */
        if (values[0].panels.indexOf("frequencies") !== -1) {
          fetch(charonAPIAddress + "request=json&path=" + datasets.datapath + "_tip-frequencies.json&s3=" + s3bucket)
            .then((res) => res.json())
            .then((rawJSON) => {
              const freqData = processFrequenciesJSON(rawJSON, treeState, controlsState);
              dispatch({ type: types.INITIALISE_FREQUENCIES, ...freqData });
            })
            .catch((err) => {
              console.warn("Problem fetching / processing frequencies JSON:", err);
            });
        }

        /* N A R R A T I V E S */
        if (enableNarratives) {
          getNarrative(dispatch, datasets.datapath);
        }

      })
      .catch((err) => {
        /* note that this catches both 404 type errors AND
        any error from the reducers AND, confusingly,
        errors from the lifecycle methods of components
        that run while in the middle of this thunk */
        dispatch(errorNotification({
          message: "Couldn't load dataset " + datasets.datapath
        }));
        console.error("loadMetaAndTreeJSONs error:", err);
        dispatch(changePage({path: "/", push: false}));
      });
  };
};

export const changeS3Bucket = () => {
  return (dispatch, getState) => {
    const {datasets} = getState();
    const newBucket = datasets.s3bucket === "live" ? "staging" : "live";
    // 1. re-fetch the manifest
    getManifest(dispatch, newBucket);
    // 2. this can *only* be toggled through the app, so we must reload data
    dispatch(loadJSONs(newBucket));
  };
};
