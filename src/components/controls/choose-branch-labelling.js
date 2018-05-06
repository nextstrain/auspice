import React from "react";
import { connect } from "react-redux";
import Select from "react-select";
import { controlsWidth } from "../../util/globals";
import { CHANGE_BRANCH_LABEL } from "../../actions/types";
import { SelectLabel } from "../framework/select-label";

@connect((state) => ({
  selected: state.controls.selectedBranchLabel,
  available: state.tree.availableBranchLabels
}))
class ChooseBranchLabelling extends React.Component {
  constructor(props) {
    super(props);
  }
  getStyles() {
    return {
      base: {
        width: controlsWidth,
        fontSize: 14
      }
    };
  }
  change(value) {
    this.props.dispatch({type: CHANGE_BRANCH_LABEL, value: value.value});
  }
  render() {
    const styles = this.getStyles();
    return (
      <div style={styles.base}>
        <SelectLabel text="Branch Labels"/>
        <Select
          name="selectedBranchLabel"
          id="selectedBranchLabel"
          value={this.props.selected}
          options={this.props.available.map((x) => ({value: x, label: x}))}
          clearable={false}
          searchable={false}
          multi={false}
          onChange={(choice) => {this.change(choice);}}
        />
      </div>
    );
  }
}

export default ChooseBranchLabelling;
