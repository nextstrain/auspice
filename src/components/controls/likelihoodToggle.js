import React from "react";
import Radium from "radium";
import { connect } from "react-redux";
import { toggleColorByLikelihood } from "../../actions/treeProperties";
import { materialButton, materialButtonSelected } from "../../globalStyles";
import SelectLabel from "../framework/select-label";

@connect((state) => ({
  colorByLikelihood: state.controls.colorByLikelihood
}))
@Radium
class LikelihoodToggle extends React.Component {
  constructor(props) {
    super(props);
  }
  getStyles() {
    return {
      switchTitle: {
        margin: 5,
        position: "relative",
        top: -1
      }
    };
  }
  render() {
    console.log("colorByLikelihood in toggle:", this.props.colorByLikelihood)
    if (this.props.colorByLikelihood === undefined) {
      return null;
    }
    const styles = this.getStyles();
    // should be a radio button...
    return (
      <div>
        <label className="switch">
          <input
            className="switch"
            type="checkbox"
            style={{marginLeft: "40px"}}
            value={this.props.colorByLikelihood ? "On" : "Off"}
            checked={this.props.colorByLikelihood}
            onChange={() => this.props.dispatch(toggleColorByLikelihood())}
          />
          <div className={"slider round"}></div>
          <SelectLabel
            text="Likelihood"
            extraStyles={{marginLeft: "40px", marginTop: "4px"}}
          />
        </label>
      </div>
    )
  }
}
export default LikelihoodToggle;
