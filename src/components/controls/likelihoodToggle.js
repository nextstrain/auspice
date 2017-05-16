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
    if (this.props.colorByLikelihood === undefined) {
      return null;
    }
    const styles = this.getStyles();
    // should be a radio button...
    return (
      <div style={{}}>
        <SelectLabel text="Likelihood (opacity & tooltip)"/>
        <button
          key={1}
          style={this.props.colorByLikelihood === false ? materialButtonSelected : materialButton}
          onClick={() => this.props.dispatch(toggleColorByLikelihood())}
        >
          <span style={styles.switchTitle}> {"Off"} </span>
        </button>
        <button
          key={2}
          style={this.props.colorByLikelihood === true ? materialButtonSelected : materialButton}
          onClick={() => this.props.dispatch(toggleColorByLikelihood())}
        >
          <span style={styles.switchTitle}> {"On"} </span>
        </button>
      </div>
    );
  }
}
export default LikelihoodToggle;
