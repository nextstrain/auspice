/*eslint-env browser*/
import * as types from "./types";
import { notificationDuration } from "../util/globals";

export const triggerInfoNotification = () => {
  return (dispatch, getState) => {
    const { notifications } = getState();
    const id = notifications.counter + 1;
    dispatch({
      type: types.ADD_NOTIFICATION,
      form: "info"
    });
    window.setTimeout(() => dispatch({
      type: types.REMOVE_NOTIFICATION,
      id
    }), notificationDuration);
  };
};
