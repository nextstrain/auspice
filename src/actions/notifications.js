import * as types from "./types";
import { notificationDuration } from "../util/globals";

const triggerNotification = (data) => {
  return (dispatch, getState) => {
    const { notifications } = getState();
    const id = notifications.counter + 1;
    dispatch(Object.assign({}, data, {
      type: types.ADD_NOTIFICATION,
      id
    }));
    if (data.notificationType !== "error") {
      window.setTimeout(() => dispatch({
        type: types.REMOVE_NOTIFICATION,
        id
      }), notificationDuration);
    }
  };
};

export const infoNotification = ({message = "Info", details = ""} = {}) => {
  return triggerNotification({notificationType: "info", message, details});
};
export const errorNotification = ({message = "Error", details = ""} = {}) => {
  return triggerNotification({notificationType: "error", message, details});
};
export const successNotification = ({message = "Success!", details = ""} = {}) => {
  return triggerNotification({notificationType: "success", message, details});
};
export const warningNotification = ({message = "Warning", details = ""} = {}) => {
  return triggerNotification({notificationType: "warning", message, details});
};
