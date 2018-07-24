import queryString from "query-string";
import * as types from "./types";
import { charonAPIAddress } from "../util/globals";
import { goTo404 } from "./navigation";
import { createStateFromQueryOrJSONs, createTreeTooState } from "./recomputeReduxState";
import { loadFrequencies } from "./frequencies";
import { fetchJSON } from "../util/serverInteraction";

const fetchDataAndDispatch = (dispatch, url, query) => {
  const apiPath = (jsonType) => `${charonAPIAddress}request=json&url=${url}&type=${jsonType}`;


  // const treeName = getSegmentName(datasets.datapath, datasets.availableDatasets);
  if (query.tt) { /* SECOND TREE */
    console.warn("SECOND TREE TODO -- SERVER SHOULD ADD IT TO THE TREE/UNIFIED JSON");
  }
  Promise.all([fetchJSON(apiPath("meta")), fetchJSON(apiPath("tree"))])
    .then((values) => {
      const data = {JSONs: {meta: values[0], tree: values[1]}, query};
      // if (narrativeJSON) {
      //   data.JSONs.narrative = narrativeJSON;
      // }
      dispatch({
        type: types.CLEAN_START,
        ...createStateFromQueryOrJSONs(data)
      });
      return {frequencies: (data.JSONs.meta.panels && data.JSONs.meta.panels.indexOf("frequencies") !== -1)};
    })
    .then((result) => {
      if (result.frequencies === true) {
        fetch(apiPath("tip-frequencies"))
          .then((res) => res.json())
          .then((res) => dispatch(loadFrequencies(res)))
          .catch((err) => console.error("Frequencies failed to fetch", err.message));
      }
      return false;
    })
    .catch((err) => {
      console.error(err.message);
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
    const query = queryString.parse(search);
    fetchDataAndDispatch(dispatch, url, query);

    // if (datasets.datapath.startsWith("narrative")) {
    //   fetchNarrativesAndDispatch(dispatch, datasets, query);
    // } else {
    //   fetchDataAndDispatch(dispatch, datasets, query, false);
    // }
  };
};

export const loadTreeToo = (name, path) => (dispatch, getState) => {
  console.log("loadTreeToo not yet implemented");
  // const { datasets } = getState();
  // const apiCall = `${charonAPIAddress}request=json&path=${path}_tree.json`;
  // fetch(apiCall)
  //   .then((res) => res.json())
  //   .then((res) => {
  //     const newState = createTreeTooState(
  //       {treeTooJSON: res, oldState: getState(), segment: name}
  //     );
  //     dispatch({ type: types.TREE_TOO_DATA, treeToo: newState.treeToo, controls: newState.controls, segment: name});
  //   })
  //   .catch((err) => {
  //     console.error("Error while loading second tree", err);
  //   });
};
