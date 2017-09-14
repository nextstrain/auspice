import React from "react";
import ReactDOM from "react-dom";
import ReactGA from "react-ga";
import { Provider } from "react-redux";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import injectTapEventPlugin from "react-tap-event-plugin";
import configureStore from "./store";
import App from "./components/app";
import About from "./static/about";
import Methods from "./static/methods";
import Splash from "./static/splash";
import Monitor from "./components/framework/monitor";
import Notifications from "./components/notifications/notifications";
import { setUpPerf } from "./util/quantify-performance";
import { enableAnimationPerfTesting } from "./util/globals";
import "./css/global.css";
import "./css/browserCompatability.css";
import "./css/bootstrapCustomized.css";
import "./css/static.css";
import "./css/notifications.css";

/* google analytics */
ReactGA.initialize(process.env.NODE_ENV === "production" ? "UA-92687617-1" : "UA-92687617-2");

/* Performance measurement - DEV ONLY */
if (enableAnimationPerfTesting) {
  setUpPerf();
}

const store = configureStore();

/* if ever you want to redirect an entered URL somewhere use this:
<Route path="/flu*" render={() => {window.location.assign("http://nextflu.org/"); return null;}}/>
*/

class Root extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <BrowserRouter>
          <div>
            <Monitor/>
            <Notifications/>
            <Switch>
              <Route exact path="/" component={Splash}/>
              <Route path="/methods" component={Methods}/>
              <Route path="/about" component={About}/>
              <Route path="/*" component={App}/>
            </Switch>
          </div>
        </BrowserRouter>
      </Provider>
    );
  }
}

/*  to fix iOS's dreaded 300ms tap delay, we need this plugin
NOTE Facebook is not planning on supporting tap events (#436)
because browsers are fixing/removing the click delay.
Unfortunately it will take a lot of time before all mobile
browsers (including iOS' UIWebView) will and can be updated.
https://github.com/zilverline/react-tap-event-plugin
*/
injectTapEventPlugin();

ReactDOM.render(<Root/>, document.getElementById("root"));
