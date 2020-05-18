import React from "react";
import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import Toggle from "./toggle";
import { TOGGLE_SPLIT_TREE } from "../../actions/types";
// todo: connect if needed

@connect((state) => {
  return {
    colorBy: state.controls.colorBy,
    splitTreeByTrait: state.tree.splitTreeByTrait
  };
})
/* Implements a button which splits the tree into visual trees per strain. */
class ChooseTreeSplit extends React.Component {
  render() {
    const { t } = this.props;
    return (
      <div style={{margin: 5}}>
        <Toggle
          display
          on={this.props.splitTreeByTrait !== null}
          callback={() =>
            this.props.dispatch({type: TOGGLE_SPLIT_TREE,
              // the presence of splitByTrait means it should be toggled off
              splitTreeByTrait: this.props.splitTreeByTrait !== null ? null : this.props.colorBy
            })}
          label={t("sidebar:Split tree by colored-by trait")}
        />
      </div>
    );
  }
}

const WithTranslation = withTranslation()(ChooseTreeSplit);
export default WithTranslation;
