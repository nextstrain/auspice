import React, { lazy, Suspense } from 'react';
import { connect } from "react-redux";
import { hot } from 'react-hot-loader/root';
import styled from 'styled-components';
import Monitor from "./components/framework/monitor";
import DatasetLoader from "./components/datasetLoader";
import Spinner from "./components/framework/spinner";
import Head from "./components/framework/head";
import NavBar from "./components/navBar";

const Main = lazy(() => import("./components/main"));
const Contact = lazy(() => import("./components/contact"));
const Splash = lazy(() => import("./components/splash"));
const Status = lazy(() => import("./components/status"));
const Notifications = lazy(() => import("./components/notifications/notifications"));

const MainComponentSwitchContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`

const ContentContainer = styled.div`
  flex: 1;
  overflow: auto;
`


@connect((state) => ({
  displayComponent: state.general.displayComponent,
  displayNarrative: state.narrative.display,
  narrativeTitle: state.narrative.title,
  browserWidth: state.browserDimensions.browserDimensions.width,
  mobileDisplay: state.browserDimensions.browserDimensions.mobileDisplay,
}))
class MainComponentSwitch extends React.Component {
  renderContent() {
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
      case "contact":
        return (
          <Suspense fallback={<Spinner/>}>
            <Contact/>
          </Suspense>
        );
      case "datasetLoader":
        return (<DatasetLoader/>);
      default:
        console.error(`reduxStore.general.displayComponent is invalid (${this.props.displayComponent})`);
        return (<Splash/>);
    }
  }

  render() {
    return (
      <MainComponentSwitchContainer>
        <NavBar
          mobileDisplay={this.props.mobileDisplay}
          narrativeTitle={this.props.displayNarrative ? this.props.narrativeTitle : false}
        />
        <ContentContainer>
          {this.renderContent()}
        </ContentContainer>
      </MainComponentSwitchContainer>
    )

  }
}

const Root = () => {
  return (
    <>
      <Head/>
      <Monitor/>
      <Suspense fallback={null}>
        <Notifications/>
      </Suspense>
      <MainComponentSwitch/>
    </>
  );
};

export default hot(Root);
