import * as types from "../actions/types";

/**
 * Performance flags (reduxState.controls.performanceFlags) represent flags
 * for which we enable/disable certain functionality in Auspice. These flags
 * shouldn't be depended on, i.e. Auspice should work just fine without them
 * (but may be a little slow).
 */


export const performanceFlags = (_store) => (next) => (action) => {
  let modifiedAction;
  switch (action.type) {
    case types.URL_QUERY_CHANGE_WITH_COMPUTED_STATE: /* fallthrough */
    case types.CLEAN_START: {
      modifiedAction = {...action};
      modifiedAction.controls.performanceFlags = calculate(action)
    }
  }
  return next(modifiedAction || action); // send action to other middleware / reducers
};

function calculate({tree}) {
  const flags = new Map();
  const totalTipCount = tree?.nodes?.[0]?.fullTipCount;
  flags.set("skipTreeAnimation", totalTipCount > 4000);
  return flags;
}