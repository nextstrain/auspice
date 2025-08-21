import React, { lazy, Suspense } from 'react';
import { connect } from "react-redux";
import { hot } from 'react-hot-loader/root';
import Monitor from "./components/framework/monitor";
import DatasetLoader from "./components/datasetLoader";
import { FullPageSpinner } from "./components/framework/spinner";
import Head from "./components/framework/head";
import Notifications from "./components/notifications/notifications";

const Main = lazy(() => import(/* webpackChunkName: "mainComponent" */ "./components/main"));
const Splash = lazy(() => import("./components/splash"));
const Status = lazy(() => import("./components/status"));
const DebugNarrative = lazy(() => import("./components/narrativeEditor/narrativeEditor"));

/** Hot Reload is happening but components are not getting rerendered.
 * This triggers a window resize which in turn triggers a general
 * rerender. A bit ham-fisted but gets the job done for the time being
 * */
if (module.hot) {
  setTimeout(() => window.dispatchEvent(new Event('resize')), 500);
}


const worker = new Worker(new URL('./workers/deepThought.js', import.meta.url));
worker.postMessage({ question: "What's the answer?" });
console.log("[root.js sending worker a question]")
worker.onmessage = ({ data: { answer } }) => {
  console.log(answer);
};

@connect((state) => ({displayComponent: state.general.displayComponent}))
class MainComponentSwitch extends React.Component {
  render() {
    // console.log("MainComponentSwitch running (should be infrequent!)", this.props.displayComponent)
    switch (this.props.displayComponent) {
      case "main":
        return (
          <Suspense fallback={<FullPageSpinner/>}>
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
          <Suspense fallback={<FullPageSpinner/>}>
            <Status/>
          </Suspense>
        );
      case "debugNarrative":
        return (
          <Suspense fallback={<FullPageSpinner/>}>
            <DebugNarrative/>
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
