
/* L I B R A R I E S */
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
/* A U S P I C E   I M P O R T S */
import configureStore from "./store";
import Panels from "./components/panels";

const store = configureStore();

/* set up non-redux state storage for the animation - use this conservitavely! */
if (!window.NEXTSTRAIN) {window.NEXTSTRAIN = {};}

/* Using React Hot Loader 4 https://github.com/gaearon/react-hot-loader */

const renderApp = () => {
  ReactDOM.render(
    <Provider store={store}>
      <Panels />
    </Provider>,
    document.getElementById('root')
  );
};

renderApp();

