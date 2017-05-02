import * as types from "../actions/types";

const arrayObjectIndexOf = function (myArray, id) {
  for(let i = 0, len = myArray.length; i < len; i++) {
    if (myArray[i].id === id) {
      return i;
    }
  }
  return -1;
};

const makeNotification = function (action, id) {
  return {
    form: action.form || "info",
    message: action.message || "no msg provided",
    id
  };
};

const Metadata = (state = {
  stack: [],
  counter: 0
}, action) => {
  switch (action.type) {
  case types.ADD_NOTIFICATION:
    const stack = state.stack.slice(); // shallow copy
    const counter = state.counter + 1;
    stack.push(makeNotification(action, counter));
    return Object.assign({}, state, {counter, stack});
  case types.REMOVE_NOTIFICATION:
    const tmp = state.stack.slice(); // shallow copy
    tmp.splice(arrayObjectIndexOf(state.stack, action.id), 1);
    return Object.assign({}, state, {
      stack: tmp
    });
  default:
    return state;
  }
};

export default Metadata;
