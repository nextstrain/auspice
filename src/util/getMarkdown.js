import { warningNotification } from "../actions/notifications";
import { charonAPIAddress } from "./globals";
import { NEW_NARRATIVE, NEW_POST } from "../actions/types";

// eslint-disable-next-line
export const getNarrative = (dispatch, datapath) => {
  const errorHandler = (e) => {
    // dispatch(warningNotification({message: "Failed to get narrative from server"}));
    console.error("Failed to get narrative from server");
    console.error(e);
  };
  const xmlHttp = new XMLHttpRequest();
  xmlHttp.onload = () => {
    if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
      dispatch({
        type: NEW_NARRATIVE,
        blocks: JSON.parse(xmlHttp.responseText)
      });
    } else {
      errorHandler(xmlHttp);
    }
  };
  xmlHttp.onerror = errorHandler;
  const name = datapath.replace(/^\//, '').replace(/\//, '_');
  xmlHttp.open("get", `${charonAPIAddress}request=narrative&name=${name}`, true);
  xmlHttp.send(null);
};


export const getPost = (name) => (dispatch) => {
  console.log("fetching", name)
  const errorHandler = (e) => {
    dispatch(warningNotification({
      message: "Failed to get post from server",
      details: name
    }));
    console.error(e);
  };
  const xmlHttp = new XMLHttpRequest();
  xmlHttp.onload = () => {
    if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
      dispatch({
        type: NEW_POST,
        html: xmlHttp.responseText,
        name: name
      });
    } else {
      errorHandler(xmlHttp);
    }
  };
  xmlHttp.onerror = errorHandler;
  xmlHttp.open("get", `${charonAPIAddress}request=post&path=${name}`, true);
  xmlHttp.send(null);
}
