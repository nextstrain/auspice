
// eslint-disable-next-line
export const changeURLMiddleware = (store) => (next) => (action) => {
  // do something. can get "old" state
  console.log("middleware seeing ", action.type, action);
  return next(action);
  // do some more stuff. can get "new" state
};
