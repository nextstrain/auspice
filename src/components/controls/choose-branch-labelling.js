import React from "react";
import { connect } from "react-redux";
import { withTranslation } from 'react-i18next';

import { CHANGE_BRANCH_LABEL, TOGGLE_SHOW_ALL_BRANCH_LABELS } from "../../actions/types";
import { SidebarSubtitle } from "./styles";
import { controlsWidth } from "../../util/globals";
import CustomSelect from "./customSelect";
import Toggle from "./toggle";

@connect((state) => ({
  selected: state.controls.selectedBranchLabel,
  showAll: state.controls.showAllBranchLabels,
  available: Array.from(
    (new Set(state.tree.availableBranchLabels))
      .union(new Set(state.treeToo?.availableBranchLabels ?? []))
  ),
  canRenderBranchLabels: state.controls.canRenderBranchLabels
}))
class ChooseBranchLabelling extends React.Component {
  constructor(props) {
    super(props);
    this.change = (value) => {this.props.dispatch({type: CHANGE_BRANCH_LABEL, value: value.value});};
  }
  render() {
    if (!this.props.canRenderBranchLabels) return null;
    const { t } = this.props;
    const selectOptions = this.props.available.map((x) => ({value: x, label: x}));
    return (
      <div style={{paddingTop: 5}}>
        <SidebarSubtitle>
          {t("sidebar:Branch Labels")}
        </SidebarSubtitle>
        <div style={{width: controlsWidth, fontSize: 14}}>
          <CustomSelect
            value={selectOptions.filter(({value}) => value === this.props.selected)}
            options={selectOptions}
            isClearable={false}
            isSearchable={false}
            isMulti={false}
            onChange={this.change}
          />
        </div>

        {this.props.selected!=="none" && (
          <Toggle
            display
            on={this.props.showAll}
            callback={() => this.props.dispatch({type: TOGGLE_SHOW_ALL_BRANCH_LABELS, value: !this.props.showAll})}
            label={t("sidebar:Show all labels")}
            style={{paddingBottom: "5px", paddingTop: "10px"}}
          />
        )}
      </div>
    );
  }
}

const WithTranslation = withTranslation()(ChooseBranchLabelling);
export default WithTranslation;
