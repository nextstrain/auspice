import React from 'react';
import ReactDOM from 'react-dom';
// import { BrowserRouter, Route, Match, Link, IndexRoute, browserHistory } from 'react-router';
import { Provider, connect } from 'react-redux';
import { BrowserRouter, Route } from 'react-router-dom';
import injectTapEventPlugin from "react-tap-event-plugin";
import configureStore from "./store";
import App from "./components/app";

const store = configureStore();

class Root extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <BrowserRouter>
          <div>
            <Route path="/" component={App}/>
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
