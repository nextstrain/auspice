import React from "react";
import ReactDOM from "react-dom";
import ReactGA from "react-ga";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { Provider } from "react-redux";
import { AppContainer } from 'react-hot-loader';
import injectTapEventPlugin from "react-tap-event-plugin";
import { setUpPerf } from "./util/quantify-performance";
import { enableAnimationPerfTesting } from "./util/globals";
import App from "./components/app";
import About from "./static/about";
import Methods from "./static/methods";
import Reports from "./static/reports";
import Splash from "./static/splash";
import Monitor from "./components/framework/monitor";
import Notifications from "./components/notifications/notifications";
import configureStore from "./store";
import "./css/global.css";
import "./css/browserCompatability.css";
import "./css/bootstrapCustomized.css";
import "./css/static.css";
import "./css/notifications.css";
import "./css/reports.css";

const store = configureStore();

/* google analytics */
ReactGA.initialize(process.env.NODE_ENV === "production" ? "UA-92687617-1" : "UA-92687617-2");

/* Performance measurement - DEV ONLY */
if (enableAnimationPerfTesting) {
  setUpPerf();
}

const Root = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <div>
          <Monitor/>
          <Notifications/>
          <Switch>
            <Route exact path="/" component={Splash}/>
            <Route path="/methods" component={Methods}/>
            <Route path="/reports" component={Reports}/>
            <Route path="/about" component={About}/>
            <Route path="/*" component={App}/>
          </Switch>
        </div>
      </BrowserRouter>
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
