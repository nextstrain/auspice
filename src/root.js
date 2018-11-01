import React from "react";
import { connect } from "react-redux";
import { hot } from 'react-hot-loader';
// import { AppContainer } from 'react-hot-loader';
import Monitor from "./components/framework/monitor";
import App from "./components/app";
import Splash from "./components/splash";
import Status from "./components/status";
import Notifications from "./components/notifications/notifications";

@connect((state) => ({displayComponent: state.general.displayComponent}))
class MainComponentSwitch extends React.Component {
  render() {
    // console.log("MainComponentSwitch running (should be infrequent!)", this.props.displayComponent)
    switch (this.props.displayComponent) {
      case "splash": return (<Splash/>);
      case "app" : return (<App/>);
      case "status" : return (<Status/>);
      default:
        console.error(`reduxStore.general.displayComponent is invalid (${this.props.displayComponent})`);
        return (<Splash/>);
    }
  }
}

const Root = () => {
  return (
    <div>
      <Monitor/>
      <Notifications/>
      <MainComponentSwitch/>
    </div>
  );
};

export default hot(module)(Root);
