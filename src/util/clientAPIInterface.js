import queryString from "query-string";
import { MANIFEST_RECEIVED } from "../actions/types";
import { charonAPIAddress } from "./globals";
import { changePage } from "../actions/navigation";

export const getManifest = (dispatch, s3bucket = "live") => {
  const charonErrorHandler = () => {
    console.warn("Failed to get manifest JSON from server");
  };
  const processData = (data) => {
    const datasets = JSON.parse(data);
    // console.log("SERVER API REQUEST RETURNED:", datasets);
    dispatch({
      type: MANIFEST_RECEIVED,
      s3bucket,
      splash: datasets.splash,
      availableDatasets: {pathogen: datasets.pathogen},
      user: "guest"
    });
    /* it's at this point we can consider loading the <app> */
    /* i'm not sure calling changePage is the best approach here, but if we are showing the <app>
    already, this action will update the pathname of the dataset and cause loadJSONs to run */
    if (window.location.pathname !== "/") {
      dispatch(changePage({path: window.location.pathname, push: false}));
    }
  };

  /* who am i? */
  const query = queryString.parse(window.location.search);
  const user = Object.keys(query).indexOf("user") === -1 ? "guest" : query.user;

  const xmlHttp = new XMLHttpRequest();
  xmlHttp.onload = () => {
    if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
      processData(xmlHttp.responseText);
    } else {
      charonErrorHandler();
    }
  };
  xmlHttp.onerror = charonErrorHandler;
  xmlHttp.open("get", `${charonAPIAddress}request=manifest&user=${user}&s3=${s3bucket}`, true); // true for asynchronous
  xmlHttp.send(null);
};

export const requestImage = (src) => {
  return charonAPIAddress + "request=splashimage&src=" + src;
};
