import React, { lazy, Suspense } from 'react';
import { connect } from "react-redux";
import { hot } from 'react-hot-loader/root';
import Monitor from "./components/framework/monitor";
import DatasetLoader from "./components/datasetLoader";
import Spinner from "./components/framework/spinner";
import Head from "./components/framework/head";
import Notifications from "./components/notifications/notifications";

const Main = lazy(() => import("./components/main"));
const Splash = lazy(() => import("./components/splash"));
const Status = lazy(() => import("./components/status"));

/** Hot Reload is happening but components are not getting rerendered.
 * This triggers a window resize which in turn triggers a general
 * rerender. A bit ham-fisted but gets the job done for the time being
 * */
if (module.hot) {
  setTimeout(() => window.dispatchEvent(new Event('resize')), 500);
}

@connect((state) => ({displayComponent: state.general.displayComponent}))
class MainComponentSwitch extends React.Component {
  render() {
    // console.log("MainComponentSwitch running (should be infrequent!)", this.props.displayComponent)
    switch (this.props.displayComponent) {
      case "main":
        return (
          <Suspense fallback={<Spinner/>}>
            <Main/>
          </Suspense>
        );
      case "splash":
        return (
          <Suspense fallback={null}>
            <Splash/>
          </Suspense>
        );
      case "status":
        return (
          <Suspense fallback={<Spinner/>}>
            <Status/>
          </Suspense>
        );
      case "datasetLoader":
        return (<DatasetLoader/>);
      default:
        console.error(`reduxStore.general.displayComponent is invalid (${this.props.displayComponent})`);
        return (<Splash/>);
    }
  }
}

const Root = () => {
  return (
    <div>
      <Head/>
      <Monitor/>
      <Notifications/>
      <MainComponentSwitch/>
    </div>
  );
};

export default hot(Root);
