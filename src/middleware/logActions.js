/* What is this middleware?
This middleware is for debugging only. It simply logs all of the action types that it sees!
Disable / Enable via apply middleware in src/store/index.js
*/

// eslint-disable-next-line
export const loggingMiddleware = (store) => (next) => (action) => {
  // const state = store.getState(); // this is "old" state, i.e. before the reducers have updated by this action
  console.log("Action: ", action.type); // eslint-disable-line
  const result = next(action); // send action to other middleware / reducers
  return result;
};
