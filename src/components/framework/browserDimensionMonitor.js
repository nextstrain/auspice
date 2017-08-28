import React from "react";
import { connect } from "react-redux";
import _throttle from "lodash/throttle";
import { BROWSER_DIMENSIONS } from "../../actions/types";

@connect()
class BrowserDimensionMonitor extends React.Component {
  constructor(props) {
    super(props);
  }
  static propTypes = {
    dispatch: React.PropTypes.func.isRequired
  }

  componentDidMount() {
    /* don't need initial dimensions - they're in the redux store on load */
    window.addEventListener( // future resizes
      "resize",
      _throttle(this.handleResizeByDispatching.bind(this), 500, {
        leading: true,
        trailing: true
      })
    );
    /* lodash throttle invokes resize event at most twice per second
    to let redraws catch up.
    Could also use debounce for 'wait until resize stops'
    */
  }

  handleResizeByDispatching() {
    this.props.dispatch({
      type: BROWSER_DIMENSIONS,
      data: {
        width: window.innerWidth,
        height: window.innerHeight,
        docHeight: window.document.body.clientHeight
        /* background needs docHeight because sidebar creates
        absolutely positioned container and blocks height 100% */
      }
    });
  }

  render() {
    return null;
  }
}

export default BrowserDimensionMonitor;
