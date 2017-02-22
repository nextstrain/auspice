/*eslint-env browser*/
import * as types from "../actions/types";

const BrowserDimensions = (state = {
  browserDimensions: {
    width: window.innerWidth,
    height: window.innerHeight,
    docHeight: window.document.body.clientHeight
  }
}, action) => {
  switch (action.type) {
  case types.BROWSER_DIMENSIONS:
    return Object.assign({}, state, {
      browserDimensions: action.data
    });
  default:
    return state;
  }
};

export default BrowserDimensions;
