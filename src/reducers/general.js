import queryString from "query-string";
import * as types from "../actions/types";
import { chooseDisplayComponentFromURL } from "../actions/navigation";
import { hasExtension, getExtension } from "../util/extensions";

/* the store for cross-cutting state -- that is, state
not limited to <App>
*/

const query = queryString.parse(window.location.search);

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
  language: query.lang ? query.lang : defaults.language
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
    case types.CLEAN_START:
      const defaultLanguage = action.metadata.displayDefaults["language"] || defaults.language;
      return Object.assign({}, state, {
        defaults: Object.assign({}, state.defaults, {language: defaultLanguage}),
        language: query.lang ? query.lang : defaultLanguage
      });
    default:
      return state;
  }
};

export default general;
