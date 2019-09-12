/* eslint-disable import/first */

/* P O L Y F I L L S */
import "./util/polyfills"; // eslint-disable-line
/* L I B R A R I E S */
import React from "react";
import ReactDOM from "react-dom";
import ReactGA from "react-ga";
import { Provider } from "react-redux";
import configureStore from "./store";
/* S T Y L E S H E E T S */
import "./css/global.css";
import "./css/browserCompatability.css";
import "./css/bootstrapCustomized.css";
import "./css/static.css";
import "./css/notifications.css";
import "./css/boxed.css";
import "./css/select.css";

const store = configureStore();

/* set up non-redux state storage for the animation - use this conservitavely! */
if (!window.NEXTSTRAIN) {window.NEXTSTRAIN = {};}

/* google analytics */
ReactGA.initialize(process.env.NODE_ENV === "production" ? "UA-92687617-1" : "UA-92687617-2");

/* Using React Hot Loader 4 https://github.com/gaearon/react-hot-loader */

const renderApp = () => {
  const Root = require("./root").default; // eslint-disable-line global-require
  ReactDOM.render(
    <Provider store={store}>
      <Root />
    </Provider>,
    document.getElementById('root')
  );
};

renderApp();

