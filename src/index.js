// React Core
import React from 'react';
import ReactDOM from 'react-dom';
// React Router
import { Router, Route, Link, IndexRoute, browserHistory } from 'react-router';
// React Redux
import { Provider, connect } from 'react-redux';
// Redux Devtools
import { DevTools, DebugPanel, LogMonitor } from 'redux-devtools/lib/react';

import configureStore from "./store";

// controller view
import App from "./components/app";

const store = configureStore();

class Root extends React.Component {
  render() {
    return (
      <div>
        <Provider store={store}>
          <Router history={browserHistory}>
            <Route path="/" component={App}/>
          </Router>
        </Provider>
        <DebugPanel top right bottom>
          <DevTools store={store} visibleOnLoad={false} monitor={LogMonitor} />
        </DebugPanel>
      </div>
    );
  }
}

// for material ui
import injectTapEventPlugin from "react-tap-event-plugin";

//Needed for onTouchTap
//Can go away when react 1.0 release
//Check this repo:
//https://github.com/zilverline/react-tap-event-plugin
injectTapEventPlugin();

ReactDOM.render(<Root/>, document.getElementById("root"));
