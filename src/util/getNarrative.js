import { warningNotification } from "../actions/notifications";
import { charonAPIAddress } from "./globals";
import { NEW_NARRATIVE } from "../actions/types";

// eslint-disable-next-line
export const getNarrative = (dispatch, datasetPathName) => {
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
  const name = datasetPathName.replace(/^\//, '').replace(/\//, '_');
  xmlHttp.open("get", `${charonAPIAddress}request=narrative&name=${name}`, true);
  xmlHttp.send(null);
};
