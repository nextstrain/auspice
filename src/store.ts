import { configureStore } from '@reduxjs/toolkit';
import { changeURLMiddleware } from "./middleware/changeURL";
import rootReducer from "./reducers";
// import { loggingMiddleware } from "./middleware/logActions";
import { keepScatterplotStateInSync } from "./middleware/scatterplot";

const middleware = [
  keepScatterplotStateInSync,
  changeURLMiddleware,
  // loggingMiddleware
];

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    // This adds the thunk middleware, and for development builds, other useful checks.
    getDefaultMiddleware({
      immutableCheck: {
        // Immutability can't be checked in the following due to circular references.
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
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export default store;
