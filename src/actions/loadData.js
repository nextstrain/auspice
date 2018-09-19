import queryString from "query-string";
import * as types from "./types";
import { charonAPIAddress } from "../util/globals";
import { goTo404 } from "./navigation";
import { createStateFromQueryOrJSONs, createTreeTooState } from "./recomputeReduxState";
import { loadFrequencies } from "./frequencies";
import { fetchJSON } from "../util/serverInteraction";
import { warningNotification } from "./notifications";

const fetchDataAndDispatch = (dispatch, url, query, narrativeBlocks) => {
  let warning = false;
  let fetchExtras = "";
  /* currently we support backwards compatability with the old (deprecated) tt=... URL query
  syntax for defining the second tree. This is not guaranteed to stay around */
  if (query.tt) { /* deprecated form of adding a second tree */
    warning = {
      message: `Specifing a second tree via "tt=${query.tt}" is deprecated.`,
      details: "The URL has been updated to reflect the new syntax 🙂"
    };
    fetchExtras += `&deprecatedSecondTree=${query.tt}`;
  }

  fetchJSON(`${charonAPIAddress}request=mainJSON&url=${url}${fetchExtras}`)
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
  if (warning) {
    dispatch(warningNotification(warning));
  }
};

export const loadJSONs = ({url = window.location.pathname, search = window.location.search} = {}) => {
  return (dispatch, getState) => {
    const { tree } = getState();
    if (tree.loaded) {
      dispatch({type: types.DATA_INVALID});
    }
    const query = queryString.parse(search);

    if (url.indexOf("narratives") !== -1) {
      /* we want to have an additional fetch to get the narrative JSON, which in turn
      tells us which data JSON to fetch... */
      fetchJSON(`${charonAPIAddress}request=narrative&url=${url}`)
        .then((blocks) => {
          const firstURL = blocks[0].dataset;
          const firstQuery = queryString.parse(blocks[0].query);
          if (query.n) firstQuery.n = query.n;
          fetchDataAndDispatch(dispatch, firstURL, firstQuery, blocks);
        })
        .catch((err) => {
          console.error("Error obtaining narratives", err.message);
          dispatch(goTo404(`Couldn't load narrative for ${url}`));
        });
    } else {
      fetchDataAndDispatch(dispatch, url, query);
    }
  };
};

export const loadTreeToo = (name, fields) => (dispatch, getState) => {
  const oldState = getState();
  fetchJSON(`${charonAPIAddress}request=additionalJSON&source=${oldState.controls.source}&url=${fields.join("/")}&type=tree`)
    .then((json) => {
      const newState = createTreeTooState({treeTooJSON: json.tree, oldState, segment: name});
      dispatch({type: types.TREE_TOO_DATA, segment: name, ...newState});
    })
    .catch((err) => console.error("Failed to fetch additional tree", err.message));
};
