import { warningNotification } from "../actions/notifications";
import { charonAPIAddress } from "./globals";
import { NEW_POST } from "../actions/types";

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
        name: name,
        pushState: true
      });
    } else {
      errorHandler(xmlHttp);
    }
  };
  xmlHttp.onerror = errorHandler;
  xmlHttp.open("get", `${charonAPIAddress}request=post&path=${name}`, true);
  xmlHttp.send(null);
}
