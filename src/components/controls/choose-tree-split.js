import React from "react";
import Toggle from "./toggle";
import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import { TOGGLE_SPLIT_TREE } from "../../actions/types";
// todo: connect if needed

@connect((state) => {
    return {
        colorBy: state.controls.colorBy,
        splitByTrait: state.tree.splitByTrait
    };
})  
/* Implements a button which splits the tree into visual trees per strain. */
class ChooseTreeSplit extends React.Component {
    render() {
        const { t } = this.props;
        return (
            <div style={{margin: 5}}>
                <Toggle
                  display={true}
                  on={this.props.splitByTrait}
                  callback={() => 
                        this.props.dispatch({type: TOGGLE_SPLIT_TREE, 
                            // the presence of splitByTrait means it should be toggled off
                            splitByTrait: this.props.splitByTrait ? null : this.props.colorBy
                        })}
                  label={t("sidebar:Split tree by colored-by trait")}
                />
            </div>
        );
    }
}

const WithTranslation = withTranslation()(ChooseTreeSplit);
export default WithTranslation;