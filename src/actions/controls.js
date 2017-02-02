export const TOGGLE_BRANCH_LABELS = "TOGGLE_BRANCH_LABELS";
export const LEGEND_ITEM_MOUSEENTER = "LEGEND_ITEM_MOUSEENTER";
export const LEGEND_ITEM_MOUSELEAVE = "LEGEND_ITEM_MOUSELEAVE";
export const BRANCH_MOUSEENTER = "BRANCH_MOUSEENTER";
export const BRANCH_MOUSELEAVE = "BRANCH_MOUSELEAVE";
export const NODE_MOUSEENTER = "NODE_MOUSEENTER";
export const NODE_MOUSELEAVE = "NODE_MOUSELEAVE";
export const SEARCH_INPUT_CHANGE = "SEARCH_INPUT_CHANGE";
export const CHANGE_LAYOUT = "CHANGE_LAYOUT";
export const CHANGE_DISTANCE_MEASURE = "CHANGE_DISTANCE_MEASURE";
export const CHANGE_DATE_MIN = "CHANGE_DATE_MIN";
export const CHANGE_DATE_MAX = "CHANGE_DATE_MAX";
export const CHANGE_ABSOLUTE_DATE_MIN = "CHANGE_ABSOLUTE_DATE_MIN";
export const CHANGE_ABSOLUTE_DATE_MAX = "CHANGE_ABSOLUTE_DATE_MAX";
export const CHANGE_COLOR_BY = "CHANGE_COLOR_BY";


/* an action to set the URL / react-router query bit when color By changes
   YES, this is syncronous, it's not a thunk
*/
export const changeColorBy = (colorBy, router = null) => {
  // ∆ react-router, only if router provided
  if (router) {
    const location = router.getCurrentLocation();
    const newQuery = Object.assign({}, location.query, {colorBy});
    router.push({
      pathname: location.pathname,
      query: newQuery
    });
  }
  // return an action to be dispatched
  return {
    type: CHANGE_COLOR_BY,
    data: colorBy
  };
};
