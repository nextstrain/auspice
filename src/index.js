// React Core
import React from 'react';
import ReactDOM from 'react-dom';
// React Router
import { Router, Route, Link, IndexRoute, browserHistory } from 'react-router';
// React Redux
import { Provider, connect } from 'react-redux';
// Redux Devtools

import configureStore from "./store";

// controller view
import App from "./components/app";

const store = configureStore();

// const pathParser(path){
//   var elements = path.split('/');
//   var confLevel= util.config;
//   var config={};
//   var ii;
//   for (ii=0; ii<elements.length; ii++){
//     if (typeof confLevel==='Object'){
//       var elemType = Object.keys(confLevel)[0];
//       config[elemType] = elements[ii];
//       confLevel = confLevel[elemType];
//     }else{
//       config['item'] = elements[ii];
//       if (ii!=elements.length-1){
//         console.log("can't parse elements "+ii+"+ from "+path);
//       }
//       return config;
//     }
//   }
//   while(typeof confLevel=== 'Object'){
//     var elemType = Object.keys(confLevel)[0];
//     config[elemType] = Object.keys(confLevel[elements])[0];
//     confLevel = confLevel[elemType];
//   }
//   return config;
// }

class Root extends React.Component {
  render() {
    // config = pathParser();
    // if (!config.valid){
    //   404
    // }else if ('item' in config){
    //   itempage
    // }else{
    //
    // }
    return (
      <div>
        <Provider store={store}>
          <Router history={browserHistory}>
            <Route path="/*" component={App}/>

          </Router>
        </Provider>
      </div>
    );
  }
}
// <Route path="/:l1" component={App}/>
// <Route path="/:l1/:l2" component={App}/>
// <Route path="/:l1/:l2/:l3" component={App}/>
// <Route path="/:l1/s/:item" component={App}/>
// <Route path="/:l1/:l2/s/:item" component={App}/>
// <Route path="/:l1/:l2/:l3/s/:item" component={App}/>

// for material ui
import injectTapEventPlugin from "react-tap-event-plugin";

//Needed for onTouchTap
//Can go away when react 1.0 release
//Check this repo:
//https://github.com/zilverline/react-tap-event-plugin
injectTapEventPlugin();

ReactDOM.render(<Root/>, document.getElementById("root"));
