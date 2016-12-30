import * as types from "../actions";

const BrowserDimensions = (state = {
  browserDimensions: null
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
