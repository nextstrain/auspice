import React from "react";
import { connect } from "react-redux";
import { withTranslation } from 'react-i18next';
import { FaInfoCircle } from "react-icons/fa";
import { ImLab } from "react-icons/im";
import { SidebarSubtitleFlex, StyledTooltip, SidebarIconContainer } from "./styles";
import { controlsWidth } from "../../util/globals";
import CustomSelect from "./customSelect";
import { changeStreamTreeBranchLabel } from "../../actions/streamTrees";


export function branchLabelsForStreamTrees(availableBranchLabels) {
  // TODO - support 2nd tree
  return availableBranchLabels.filter((l) => l!=='aa');
}
export function canShowStreamTrees(availableBranchLabels) {
  return branchLabelsForStreamTrees(availableBranchLabels).filter((x)=>x!=='none').length!==0
}

@connect((state) => ({
  selected: state.controls.streamTreeBranchLabel,
  available: branchLabelsForStreamTrees(state.tree.availableBranchLabels),
}))
class ChooseBranchLabellingForStreamTrees extends React.Component {
  constructor(props) {
    super(props);
    this.change = (value) => {
      this.props.dispatch(changeStreamTreeBranchLabel(value.value))
    };
  }
  render() {
    if (!canShowStreamTrees(this.props.available)) return null;
    const { t } = this.props;
    const selectOptions = this.props.available.map((x) => ({value: x, label: x}));
    return (
      <div style={{paddingTop: 10}}>
        <SidebarSubtitleFlex data-tip data-for="select-stream-branch-label">
          <span style={{ position: "relative" }}>
            <ImLab style={{ position: "absolute", left: "-14px", top: "2px", fontSize: "10px" }}/>
            {t("sidebar:Branch Label for Stream Trees")}
          </span>
          {!this.props.mobileDisplay && (
            <>
              <SidebarIconContainer data-tip data-for="select-stream-branch-label">
                <FaInfoCircle/>
              </SidebarIconContainer>
              <StyledTooltip place="bottom" type="dark" effect="solid" id="select-stream-branch-label">
                <>
                  Very experimental!
                </>
              </StyledTooltip>
            </>
          )}
        </SidebarSubtitleFlex>
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
      </div>
    )
  }
}

const WithTranslation = withTranslation()(ChooseBranchLabellingForStreamTrees);
export default WithTranslation;
