import * as types from "../actions/types";
import { controlsHiddenWidth } from "../util/globals";

export const calcBrowserDimensionsInitialState = () => ({
  width: window.innerWidth,
  height: window.innerHeight,
  docHeight: window.document.body.clientHeight,
  mobileDisplay: window.innerWidth < controlsHiddenWidth
});

const BrowserDimensions = (state = {
  browserDimensions: calcBrowserDimensionsInitialState()
}, action) => {
  switch (action.type) {
    case types.BROWSER_DIMENSIONS:
      return Object.assign({}, state, {
        browserDimensions: Object.assign({},
          action.data,
          { mobileDisplay: action.data.innerWidth < controlsHiddenWidth }
        )
      });
    default:
      return state;
  }
};

export default BrowserDimensions;
