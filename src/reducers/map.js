import * as types from "../actions";

const Map = (state = {
  animating: false,
  tick: null
}, action) => {
  switch (action.type) {
  // case types.ANIMATION_START:
  //   return Object.assign({}, state, {
  //     animating: true,
  //   });
  case types.MAP_ANIMATION_END:
    return Object.assign({}, state, {
      animating: false,
    });
  case types.MAP_ANIMATION_TICK:
    return Object.assign({}, state, {
      animating: true,
      progress: action.data.progress
    });
  default:
    return state;
  }
};

export default Map;
