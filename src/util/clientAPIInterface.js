import queryString from "query-string";
import { MANIFEST_RECEIVED, POSTS_MANIFEST_RECEIVED } from "../actions/types";
import { errorNotification } from "../actions/notifications";
import { charonAPIAddress } from "./globals";
import { changePage } from "../actions/navigation";

export const getManifest = (dispatch, s3bucket = "live") => {
  const charonErrorHandler = (e) => {
    dispatch(errorNotification({message: "Failed to get datasets from server"}));
    console.error(e);
  };
  const processData = (data) => {
    const datasets = JSON.parse(data);
    console.log("SERVER API REQUEST RETURNED:", datasets);
    dispatch({
      type: MANIFEST_RECEIVED,
      s3bucket,
      splash: datasets.splash,
      pathogen: datasets.pathogen,
      user: "guest"
    });
    /* it's at this point we can consider loading the <app> */
    dispatch(changePage(window.url.location.pathname));
  };

  /* who am i? */
  const query = queryString.parse(window.url.location.search);
  const user = Object.keys(query).indexOf("user") === -1 ? "guest" : query.user;

  const xmlHttp = new XMLHttpRequest();
  xmlHttp.onload = () => {
    if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
      processData(xmlHttp.responseText);
    } else {
      charonErrorHandler(xmlHttp);
    }
  };
  xmlHttp.onerror = charonErrorHandler;
  xmlHttp.open("get", `${charonAPIAddress}request=manifest&user=${user}&s3=${s3bucket}`, true); // true for asynchronous
  xmlHttp.send(null);
};

export const getPostsManifest = (dispatch) => {
  const charonErrorHandler = (e) => {
    dispatch(errorNotification({message: "Failed to get list of posts from server"}));
    console.error(e);
  };
  const processData = (data) => {
    const datasets = JSON.parse(data);
    // console.log("SERVER POSTS MANIFEST API REQUEST RETURNED:", datasets);
    dispatch({
      type: POSTS_MANIFEST_RECEIVED,
      data: datasets
    });
  };
  const xmlHttp = new XMLHttpRequest();
  xmlHttp.onload = () => {
    if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
      processData(xmlHttp.responseText);
    } else {
      charonErrorHandler(xmlHttp);
    }
  };
  xmlHttp.onerror = charonErrorHandler;
  xmlHttp.open("get", charonAPIAddress + 'request=posts_manifest', true); // true for asynchronous
  xmlHttp.send(null);
};

export const requestImage = (src) => {
  return charonAPIAddress + "request=splashimage&src=" + src;
};
