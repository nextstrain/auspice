import * as types from "./types";
import { charonAPIAddress } from "../util/globals";
import { goTo404 } from "./navigation";
import { fetchJSON } from "../util/serverInteraction";

export const getSource = () => {
  let parts = window.location.pathname.toLowerCase().replace(/^\//, "").split("/");
  if (parts[0] === "status") parts = parts.slice(1);
  switch (parts[0]) {
    case "local": return "local";
    case "staging": return "staging";
    case "community": {
      return undefined;
    } default: {
      return "/";
    }
  }
};

export const getAvailableDatasets = (source) => (dispatch) => {
  fetchJSON(`${charonAPIAddress}request=available&source=${source}`)
    .then((res) => {
      // console.log(res)
      dispatch({type: types.AVAILABLE_DATASETS, source, available: res});
    })
    .catch((err) => {
      console.error("Failed to get available datasets for", source, "Error type:", err.type);
      dispatch(goTo404(`Couldn't get available datasets from the server for source "${source}"`));
    });
};
