/*eslint-env browser*/
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import injectTapEventPlugin from "react-tap-event-plugin";
import configureStore from "./store";
import App from "./components/app";
import About from "./static/about";
import Help from "./static/help";
import Methods from "./static/methods";
import Splash from "./static/splash";
import "./css/global.css";
// import "./css/browserCompatability.css";
import "./css/bootstrapCustomized.css"
import "./css/datePicker.css";
import "./css/static.css";

const store = configureStore();

class Root extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <BrowserRouter>
          <div>
            <Switch>
              <Route path="/methods" component={Methods}/>
              <Route path="/about" component={About}/>
              <Route path="/help" component={Help}/>
              <Route path="/zika" component={App}/>
              <Route path="/ebola" component={App}/>
              <Route exact path="/flu*" render={() => window.location.assign("http://nextflu.org/")}/>
              <Route path="*" component={Splash}/>
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
