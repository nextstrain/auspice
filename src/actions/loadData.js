import queryString from "query-string";

import * as types from "./types";
import { charonAPIAddress } from "../util/globals";
import { goTo404 } from "./navigation";
import { createStateFromQueryOrJSONs, createTreeTooState } from "./recomputeReduxState";
import { loadFrequencies } from "./frequencies";
import { fetchJSON } from "../util/serverInteraction";

const fetchDataAndDispatch = (dispatch, url, query, narrativeBlocks) => {
  if (query.tt) { /* SECOND TREE */
    console.warn("DEPRECATED SECOND TREE VIA tt= -- ADD NOTIFICATION");
  }
  fetchJSON(`${charonAPIAddress}request=mainJSON&url=${url}`)
    .then((json) => {
      dispatch({
        type: types.CLEAN_START,
        ...createStateFromQueryOrJSONs({json, query, narrativeBlocks})
      });
      return {
        frequencies: (json.meta.panels && json.meta.panels.indexOf("frequencies") !== -1),
        datasetFields: json["_datasetFields"],
        source: json["_source"]
      };
    })
    .then((result) => {
      if (result.frequencies === true) {
        fetchJSON(`${charonAPIAddress}request=additionalJSON&source=${result.source}&url=${result.datasetFields.join("/")}&type=tip-frequencies`)
          .then((res) => dispatch(loadFrequencies(res)))
          .catch((err) => console.error("Frequencies failed to fetch", err.message));
      }
      return false;
    })
    .catch((err) => {
      console.warn(err, err.message);
      dispatch(goTo404(`Couldn't load JSONs for ${url}`));
    });
};

// const fetchNarrativesAndDispatch = (dispatch, datasets, query) => {
//   fetch(`${charonAPIAddress}request=narrative&name=${datasets.datapath.replace(/^\//, '').replace(/\//, '_').replace(/narratives_/, '')}`)
//     .then((res) => res.json())
//     .then((blocks) => {
//       const newDatasets = {...datasets};
//       newDatasets.datapath = getDatapath(blocks[0].dataset, datasets.availableDatasets);
//       fetchDataAndDispatch(dispatch, newDatasets, query, blocks);
//     })
//     .catch((err) => {
//       // some coding error in handling happened. This is not the rejection of the promise you think it is!
//       // syntax error is akin to a 404
//       console.error("Error in fetchNarrativesAndDispatch", err);
//     });
//
// };

export const loadJSONs = ({url = window.location.pathname, search = window.location.search} = {}) => {
  return (dispatch, getState) => {
    const { tree } = getState();
    if (tree.loaded) {
      dispatch({type: types.DATA_INVALID});
    }

    if (url.indexOf("narratives") !== -1) {
      /* we want to have an additional fetch to get the narrative JSON, which in turn
      tells us which data JSON to fetch... */
      fetchJSON(`${charonAPIAddress}request=narrative&url=${url}`)
        .then((blocks) => {
          const firstURL = blocks[0].dataset;
          const firstQuery = blocks[0].query;
          fetchDataAndDispatch(dispatch, firstURL, firstQuery, blocks);
        })
        .catch((err) => {
          console.error("Error obtaining narratives", err.message);
          dispatch(goTo404(`Couldn't load narrative for ${url}`));
        });
    } else {
      const query = queryString.parse(search);
      fetchDataAndDispatch(dispatch, url, query);
    }
  };
};

export const loadTreeToo = (name, fields) => (dispatch, getState) => {
  const oldState = getState();
  fetchJSON(`${charonAPIAddress}request=additionalJSON&source=${oldState.controls.source}&url=${fields.join("/")}&type=tree`)
    .then((json) => {
      const newState = createTreeTooState({treeTooJSON: json.tree, oldState, segment: name});
      dispatch({type: types.TREE_TOO_DATA, treeToo: newState.treeToo, controls: newState.controls, segment: name});
    })
    .catch((err) => console.error("Failed to fetch additional tree", err.message));
};
