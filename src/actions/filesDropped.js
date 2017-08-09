import { infoNotification, errorNotification, successNotification, warningNotification } from "./notifications";


export const filesDropped = (files) => {
  return function (dispatch, getState) {
    for (const file of files) {
      dispatch(infoNotification({message: "File dropped", details: file.name + "(" + file.type + ")"}));
    }
  };
};
