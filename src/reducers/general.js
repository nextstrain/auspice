import * as types from "../actions/types";
import { chooseDisplayComponentFromURL } from "../actions/navigation";
import { hasExtension, getExtension } from "../util/extensions";

/* the store for cross-cutting state -- that is, state
not limited to <App>
*/

const getFirstPageToDisplay = () => {
  if (hasExtension("entryPage")) {
    return getExtension("entryPage");
  }
  return chooseDisplayComponentFromURL(window.location.pathname);
};

const general = (state = {
  displayComponent: getFirstPageToDisplay(),
  errorMessage: undefined,
  pathname: window.location.pathname // keep a copy of what the app "thinks" the pathname is
}, action) => {
  switch (action.type) {
    case types.PAGE_CHANGE:
      const stateUpdate = {
        displayComponent: action.displayComponent,
        errorMessage: action.errorMessage
      };
      if (action.path) {
        stateUpdate.pathname = action.path;
      }
      return Object.assign({}, state, stateUpdate);
    case types.UPDATE_PATHNAME:
      return Object.assign({}, state, {
        pathname: action.pathname
      });
    default:
      return state;
  }
};

export default general;
