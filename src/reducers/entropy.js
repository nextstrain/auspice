import * as types from "../actions/types";

const Entropy = (state = {
  loaded: false,
  entropy: null
}, action) => {
  switch (action.type) {
    case types.DATA_INVALID:
      return {
        loaded: false,
        entropy: null
      };
    case types.RECEIVE_ENTROPY:
      return Object.assign({}, state, {
        loaded: true,
        entropy: action.data
      });
    case types.ENTROPY_DATA:
      console.log("new entropy data in reducer:", action.data);
      return state;
    default:
      return state;
  }
};

export default Entropy;
