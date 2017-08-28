import React from "react";
import { connect } from "react-redux";
import { TOGGLE_BRANCH_LABELS } from "../../actions/types";
import { dataFont, darkGrey } from "../../globalStyles";
import Flex from "../framework/flex";
import { analyticsControlsEvent } from "../../util/googleAnalytics";

@connect()
class ToggleBranchLabels extends React.Component {
  getStyles() {
    return {
      base: {
        marginBottom: 10,
        fontFamily: dataFont,
        marginTop: 0,
        color: darkGrey,
        fontSize: 12
      }
    };
  }
  handleCheckboxClick() {
    analyticsControlsEvent(`toggle-branch-labels`);
    this.props.dispatch({type: TOGGLE_BRANCH_LABELS});
  }
  render() {
    const styles = this.getStyles();
    return (
      <Flex style={styles.base}>
        <input onChange={this.handleCheckboxClick.bind(this)} type="checkbox"/>
        <div style={{marginLeft: "5px"}}>show branch labels</div>
      </Flex>
    );
  }
}

export default ToggleBranchLabels;
