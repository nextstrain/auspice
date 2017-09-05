import { CHARON_INIT } from "../actions/types";
import { errorNotification } from "../actions/notifications";
import { charonAPIAddress } from "./globals";

const processData = (data, dispatch) => {
  const datasets = JSON.parse(data);
  console.log("CHARON RETURNED:", datasets);
  dispatch({
    type: CHARON_INIT,
    splash: datasets.splash,
    pathogen: datasets.pathogen,
    user: "guest"
  });
};

export const getManifest = (user, dispatch) => {
  const charonErrorHandler = (e) => {
    process.env.DATA_LOCAL ?
      dispatch(errorNotification({message: "Charon is not running locally", details: "cd nextstrain/charon; node server.js"})) :
      dispatch(errorNotification({message: "Failed to get datasets from server"}));
    console.error(e);
  };

  const xmlHttp = new XMLHttpRequest();
  xmlHttp.onload = () => {
    if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
      processData(xmlHttp.responseText, dispatch);
      // window.setTimeout(() => processData(xmlHttp.responseText, dispatch, router), 5000) // mock slow API call
    } else {
      charonErrorHandler(xmlHttp);
    }
  };
  xmlHttp.onerror = charonErrorHandler;
  xmlHttp.open("get", charonAPIAddress + 'want=manifest&user=' + user, true); // true for asynchronous
  xmlHttp.send(null);
};

export const requestImage = (src) => {
  return charonAPIAddress + "want=image&src=" + src;
};
