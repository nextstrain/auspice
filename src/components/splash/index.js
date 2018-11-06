import React from "react";
import { connect } from "react-redux";
import DefaultSplashContent from "./splash";
import { hasExtension, getExtension } from "../../util/extensions";
import ErrorBoundary from "../../util/errorBoundry";
import { fetchJSON } from "../../util/serverInteraction";
import { charonAPIAddress, controlsHiddenWidth } from "../../util/globals";
import { changePage } from "../../actions/navigation";

const SplashContent = hasExtension("splashComponent") ?
  getExtension("splashComponent") :
  DefaultSplashContent;
/* TODO: check that when compiling DefaultSplashContent isn't included if extension is defined */


@connect((state) => ({
  errorMessage: state.general.errorMessage,
  browserDimensions: state.browserDimensions.browserDimensions,
  reduxPathname: state.general.pathname
}))
class Splash extends React.Component {
  constructor(props) {
    super(props);
    /* state is set via the returned JSON from the server (aka charon) in the fetch in CDM */
    this.state = {source: undefined, narratives: false, available: undefined, errorMessage: undefined};
  }
  componentDidMount() {
    fetchJSON(`${charonAPIAddress}/getAvailable?prefix=${this.props.reduxPathname}`)
      .then((json) => {this.setState(json);})
      .catch((err) => {
        this.setState({errorMessage: "Error in getting available datasets"});
        console.warn(err.message);
      });
  }
  render() {
    return (
      <ErrorBoundary>
	<SplashContent
	  isMobile={this.props.browserDimensions.width < controlsHiddenWidth}
	  source={this.state.source}
	  available={this.state.datasets}
	  narratives={this.state.narratives}
	  browserDimensions={this.props.browserDimensions}
	  dispatch={this.props.dispatch}
	  errorMessage={this.props.errorMessage || this.state.errorMessage}
	  changePage={changePage}
	/>
      </ErrorBoundary>
    );
  }
}

export default Splash;
