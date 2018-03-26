import React from "react";
import { connect } from "react-redux";
import Toggle from "./toggle";
import { TOGGLE_TANGLE } from "../../actions/types";

@connect((state) => ({
  showTreeToo: state.controls.showTreeToo,
  showTangle: state.controls.showTangle
}))
class PanelToggles extends React.Component {
  render() {
    if (!this.props.showTreeToo) return null;
    return (
      <Toggle
        display
        on={this.props.showTangle}
        callback={() => this.props.dispatch({type: TOGGLE_TANGLE})}
        label={"Show Tanglegram"}
        style={{paddingTop: "10px"}}
      />
    );
  }
}

export default PanelToggles;
