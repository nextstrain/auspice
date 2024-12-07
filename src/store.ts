import { configureStore } from '@reduxjs/toolkit';
import { changeURLMiddleware } from "./middleware/changeURL";
import rootReducer from "./reducers";
// import { loggingMiddleware } from "./middleware/logActions";
import { keepScatterplotStateInSync } from "./middleware/scatterplot";
import { performanceFlags } from "./middleware/performanceFlags";

const middleware = [
  keepScatterplotStateInSync,
  changeURLMiddleware,
  performanceFlags,
  // loggingMiddleware
];

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    // This adds the thunk middleware, and for development builds, other useful checks.
    getDefaultMiddleware({
      // Immutability can't be checked in some parts of the state due to circular references.
      // Allow the option to disable this check through an environment variable.
      // Note that it is never enabled when NODE_ENV=production.
      immutableCheck: process.env.SKIP_REDUX_CHECKS
        ? false
        : {
          warnAfter: 100, // ms. Default is 32.
          ignoredPaths: [
            'tree.nodes',
            'tree.vaccines',
            'treeToo.nodes',
            'treeToo.vaccines',
          ],
        },

      // By design, the state contains many values that are non-serializable.
      // Instead of adding several ignoredPaths, disable this check entirely.
      // This means time-travel debugging is not possible, but it would not be
      // performant enough given the large size of the Redux state.
      serializableCheck: false,
    }).concat(middleware),
  devTools: process.env.NODE_ENV !== 'production',
})

if (process.env.NODE_ENV !== 'production' && module.hot) {
  // console.log("hot reducer reload");
  module.hot.accept('./reducers', () => {
    const nextRootReducer = require('./reducers/index');
    store.replaceReducer(nextRootReducer);
  });
}

// Infer types from the store.
// This is more clearly defined in src/reducers/index.ts but exported here.
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

/** A function to be handled by redux (thunk) */
export type ThunkFunction = (dispatch: AppDispatch, getState: () => RootState) => void

export default store;
