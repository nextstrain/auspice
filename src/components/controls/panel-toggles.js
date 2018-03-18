import React from "react";
import { connect } from "react-redux";
import Toggle from "./toggle";
import { togglePanelDisplay } from "../../actions/misc";

@connect((state) => ({
  panelsAvailable: state.controls.panelsAvailable,
  panelsToDisplay: state.controls.panelsToDisplay,
  showTreeToo: state.controls.showTreeToo
}))
class PanelToggles extends React.Component {
  render() {
    const panels = this.props.panelsAvailable.slice();
    if (this.props.showTreeToo && panels.indexOf("map") !== -1) {
      panels.splice(panels.indexOf("map"), 1);
    }
    return panels.map((n) => (
      <Toggle
        key={n}
        display
        on={this.props.panelsToDisplay.indexOf(n) !== -1}
        callback={() => this.props.dispatch(togglePanelDisplay(n))}
        label={"Show " + n}
        style={{paddingBottom: "10px"}}
      />
    ));
  }
}

export default PanelToggles;
