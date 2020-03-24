// import queryString from "query-string";
import * as types from "../actions/types";
import { chooseDisplayComponentFromURL } from "../actions/navigation";
import { hasExtension, getExtension } from "../util/extensions";

/* the store for cross-cutting state -- that is, state
not limited to <App>
*/

/* See comment below for why this line is commented out -- it should be added back
when a solution to https://github.com/nextstrain/nextstrain.org/issues/130 has been found */
// const query = queryString.parse(window.location.search);

const defaults = {
  language: "en"
};

const getFirstPageToDisplay = () => {
  if (hasExtension("entryPage")) {
    return getExtension("entryPage");
  }
  return chooseDisplayComponentFromURL(window.location.pathname);
};


const general = (state = {
  defaults,
  displayComponent: getFirstPageToDisplay(),
  errorMessage: undefined,
  pathname: window.location.pathname, // keep a copy of what the app "thinks" the pathname is
  language: defaults.language
  /* The following has been commented out to give us time to check whether a `lang` query is
  the appropriate way to set the language. This can be tracked via https://github.com/nextstrain/nextstrain.org/issues/130 */
  // language: query.lang ? query.lang : defaults.language
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
    case types.CHANGE_LANGUAGE:
      return Object.assign({}, state, {
        language: action.data
      });
    default:
      return state;
  }
};

export default general;
