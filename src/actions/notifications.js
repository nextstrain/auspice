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
    if (data.autoClose) {
      window.setTimeout(() => dispatch({
        type: types.REMOVE_NOTIFICATION,
        id
      }), notificationDuration);
    }
  };
};

export const infoNotification = ({message = "Info", details = "", autoClose = true} = {}) => {
  return triggerNotification({notificationType: "info", message, details, autoClose});
};
export const errorNotification = ({message = "Error", details = "", autoClose = false} = {}) => {
  return triggerNotification({notificationType: "error", message, details, autoClose});
};
export const successNotification = ({message = "Success!", details = "", autoClose = true} = {}) => {
  return triggerNotification({notificationType: "success", message, details, autoClose});
};
export const warningNotification = ({message = "Warning", details = "", autoClose = true} = {}) => {
  return triggerNotification({notificationType: "warning", message, details, autoClose});
};
