import { createStore, applyMiddleware, compose } from "redux";
import thunk from "redux-thunk";
import logger from "redux-logger";
import { changeURLMiddleware } from "../middleware/changeURL";
import rootReducer from "../reducers";
import { loggingMiddleware } from "../middleware/logActions"; // eslint-disable-line no-unused-vars

const isDevelopment = process.env.NODE_ENV !== 'production'

const configureStore = (initialState) => {
  const middleware = [
    thunk,
    changeURLMiddleware
  ];

  if (isDevelopment)
    middleware.push(logger)

  const composedEnhancers = compose(
    applyMiddleware(...middleware),
    window.__REDUX_DEVTOOLS_EXTENSION__ ? window.__REDUX_DEVTOOLS_EXTENSION__() : (f) => f
  );
  const store = createStore(rootReducer, initialState, composedEnhancers);
  if (isDevelopment && module.hot) {
    // console.log("hot reducer reload"); // eslint-disable-line
    module.hot.accept('../reducers', () => {
      const nextRootReducer = require('../reducers/index');  // eslint-disable-line global-require
      store.replaceReducer(nextRootReducer);
    });
  }
  return store;
};

export default configureStore;
