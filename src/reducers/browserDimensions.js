import * as types from "../actions/types";

export const calcBrowserDimensionsInitialState = () => ({
  width: window.innerWidth,
  height: window.innerHeight,
  docHeight: window.document.body.clientHeight
});

const BrowserDimensions = (state = {
  browserDimensions: calcBrowserDimensionsInitialState()
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
