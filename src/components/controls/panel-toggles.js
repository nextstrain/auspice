import React from "react";
import { connect } from "react-redux";
import Toggle from "./toggle";
import { togglePanelDisplay } from "../../actions/misc";

@connect((state) => ({
  panelsAvailable: state.controls.panelsAvailable,
  panelsToDisplay: state.controls.panelsToDisplay
}))
class PanelToggles extends React.Component {
  render() {
    return this.props.panelsAvailable.map((n) => (
      <Toggle
        key={n}
        display
        on={this.props.panelsToDisplay.indexOf(n) !== -1}
        callback={() => this.props.dispatch(togglePanelDisplay(n))}
        label={n}
        style={{paddingBottom: "10px"}}
      />
    ));
  }
}

export default PanelToggles;
