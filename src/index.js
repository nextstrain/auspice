import React from "react";
import ReactDOM from "react-dom";
import ReactGA from "react-ga";
import createHistory from 'history/createBrowserHistory'
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { Provider } from "react-redux";
import { AppContainer } from 'react-hot-loader';
import injectTapEventPlugin from "react-tap-event-plugin";
import { setUpPerf } from "./util/quantify-performance";
import { enableAnimationPerfTesting } from "./util/globals";
import Monitor from "./components/framework/monitor";
import PageSelect from "./components/framework/pageSelect";
import Notifications from "./components/notifications/notifications";
import configureStore from "./store";
import "./css/global.css";
import "./css/browserCompatability.css";
import "./css/bootstrapCustomized.css";
import "./css/static.css";
import "./css/notifications.css";
import "./css/boxed.css";
import "./css/select.css";
import "./css/posts.css";
import "./css/narrative.css";

const store = configureStore();

/* google analytics */
ReactGA.initialize(process.env.NODE_ENV === "production" ? "UA-92687617-1" : "UA-92687617-2");

/* npm history package - can we avoid window here? */
window.url = createHistory();

/* Performance measurement - DEV ONLY */
if (enableAnimationPerfTesting) {
  setUpPerf();
}

const Root = () => {
  return (
    <Provider store={store}>
      <div>
        <Monitor/>
        <Notifications/>
        <PageSelect/>
      </div>
    </Provider>
  );
};

/*
React Hot Loader 3  fixes some long-standing issues with both React Hot Loader and React Transform.
https://github.com/gaearon/react-hot-loader
*/
const render = (Component) => {
  ReactDOM.render(
    <AppContainer>
      <Component />
    </AppContainer>,
    document.getElementById('root')
  );
};
render(Root);
if (module.hot) {
  module.hot.accept();
}

/*  to fix iOS's dreaded 300ms tap delay, we need this plugin
NOTE Facebook is not planning on supporting tap events (#436) because browsers are fixing/removing
the click delay. Unfortunately it will take a lot of time before all mobile
browsers (including iOS' UIWebView) will and can be updated.
https://github.com/zilverline/react-tap-event-plugin

Following https://github.com/zilverline/react-tap-event-plugin/issues/61
we wrap this in a try-catch as hotloading triggers errors */
try {
  injectTapEventPlugin();
} catch (e) {
  // empty
}
