import * as types from "../actions/types";
import { chooseDisplayComponentFromURL } from "../actions/navigation";

/* the store for cross-cutting state -- that is, state
not limited to <App>
*/

const general = (state = {
  displayComponent: chooseDisplayComponentFromURL(window.location.pathname),
  errorMessage: undefined,
  pathname: window.location.pathname // keep a copy of what the app "thinks" the pathname is
}, action) => {
  switch (action.type) {
    case types.PAGE_CHANGE:
      return Object.assign({}, state, {
        displayComponent: action.displayComponent,
        errorMessage: action.errorMessage
      });
    case types.UPDATE_PATHNAME:
      return Object.assign({}, state, {
        pathname: action.pathname
      });
    default:
      return state;
  }
};

export default general;
