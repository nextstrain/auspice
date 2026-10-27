import { configureStore } from '@reduxjs/toolkit';
import { changeURLMiddleware } from "./middleware/changeURL";
import rootReducer from "./reducers";
// import { loggingMiddleware } from "./middleware/logActions";
import { keepScatterplotStateInSync } from "./middleware/scatterplot";
import { performanceFlags } from "./middleware/performanceFlags";

interface CreateStoreOptions {
  /** Include the `changeURLMiddleware` which reads/writes `window.location`.
   * This must be `false` for embedded ("render") instances which must never
   * touch the host page's URL. Defaults to `true` for the standard app. */
  urlMiddleware?: boolean
}

/**
 * Create a fresh Auspice redux store. Historically the store was a module-level
 * singleton (and a default one is still exported below for the standard app),
 * but embedding Auspice via `render()` requires an independent store per call,
 * hence this factory.
 */
export const createAuspiceStore = ({ urlMiddleware = true }: CreateStoreOptions = {}) => {
  const middleware = [
    keepScatterplotStateInSync,
    ...(urlMiddleware ? [changeURLMiddleware] : []),
    performanceFlags,
    // loggingMiddleware
  ];

  return configureStore({
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
  });
};

const store = createAuspiceStore();

if (process.env.NODE_ENV !== 'production' && import.meta.webpackHot) {
  import.meta.webpackHot.accept('./reducers', async () => {
    const nextRootReducer = (await import('./reducers/index')).default;
    store.replaceReducer(nextRootReducer);
  });
}

// Infer types from the reducer (rather than the singleton store) so that they
// are valid for every store produced by `createAuspiceStore`.
// This is more clearly defined in src/reducers/index.ts but exported here.
export type RootState = ReturnType<typeof rootReducer>
export type AppStore = ReturnType<typeof createAuspiceStore>
export type AppDispatch = AppStore['dispatch']

/** A function to be handled by redux (thunk) */
export type ThunkFunction = (dispatch: AppDispatch, getState: () => RootState) => void

export default store;
