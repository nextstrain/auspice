import { createStore, applyMiddleware, compose } from "redux";
import thunk from "redux-thunk";
import { changeURLMiddleware } from "../middleware/changeURL";
import rootReducer from "../reducers";

const middleware = [thunk, changeURLMiddleware];

let CreateStoreWithMiddleware;
if (process.env.NODE_ENV === 'production') {
  CreateStoreWithMiddleware = applyMiddleware(...middleware)(createStore);
} else {
  CreateStoreWithMiddleware = compose(
    applyMiddleware(...middleware),
    window.devToolsExtension ? window.devToolsExtension() : (f) => f
  )(createStore);
}

const configureStore = (initialState) => CreateStoreWithMiddleware(rootReducer, initialState);

export default configureStore;
