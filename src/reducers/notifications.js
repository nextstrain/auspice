import * as types from "../actions/types";

const arrayObjectIndexOf = function (myArray, id) {
  for(let i = 0, len = myArray.length; i < len; i++) {
    if (myArray[i].id === id) {
      return i;
    }
  }
  return -1;
};

const makeNotification = function (action) {
  return {
    message: action.message || "Default Error Message",
    details: action.details || "Default Error Detail",
    notificationType: action.notificationType,
    classes: ["notification", action.notificationType],
    id: action.id
  };
};

const Metadata = (state = {
  stack: [],
  counter: 0
}, action) => {
  let stack;
  switch (action.type) {
  case types.ADD_NOTIFICATION:
    stack = state.stack.slice(); // shallow copy
    stack.push(makeNotification(action));
    return Object.assign({}, state, {counter: action.id, stack});
  case types.REMOVE_NOTIFICATION:
    stack = state.stack.slice(); // shallow copy
    stack.splice(arrayObjectIndexOf(stack, action.id), 1);
    return Object.assign({}, state, {stack});
  default:
    return state;
  }
};

export default Metadata;
