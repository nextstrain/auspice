import { MANIFEST_RECEIVED } from "../actions/types";
import { errorNotification } from "../actions/notifications";
import { charonAPIAddress } from "./globals";
import queryString from "query-string";

const processData = (data, dispatch) => {
  const datasets = JSON.parse(data);
  // console.log("SERVER API REQUEST RETURNED:", datasets);
  dispatch({
    type: MANIFEST_RECEIVED,
    splash: datasets.splash,
    pathogen: datasets.pathogen,
    reports: datasets.reports,
    user: "guest"
  });
};

export const getManifest = (router, dispatch) => {
  const charonErrorHandler = (e) => {
    dispatch(errorNotification({message: "Failed to get datasets from server"}));
    console.error(e);
  };

  /* who am i? */
  const query = queryString.parse(router.history.location.search);
  const user = Object.keys(query).indexOf("user") === -1 ? "guest" : query.user;

  const xmlHttp = new XMLHttpRequest();
  xmlHttp.onload = () => {
    if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
      processData(xmlHttp.responseText, dispatch);
      // window.setTimeout(() => processData(xmlHttp.responseText, dispatch), 5000) // mock slow API call
    } else {
      charonErrorHandler(xmlHttp);
    }
  };
  xmlHttp.onerror = charonErrorHandler;
  xmlHttp.open("get", charonAPIAddress + 'request=manifest&user=' + user, true); // true for asynchronous
  xmlHttp.send(null);
};

export const requestImage = (src) => {
  return charonAPIAddress + "request=image&src=" + src;
};
