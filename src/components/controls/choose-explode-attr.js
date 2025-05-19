import React from "react";
import { connect } from "react-redux";
import { withTranslation } from 'react-i18next';
import { FaInfoCircle } from "react-icons/fa";
import { explodeTree } from "../../actions/tree";
import { SidebarSubtitleFlex, StyledTooltip, SidebarIconContainer } from "./styles";
import { controlsWidth } from "../../util/globals";
import CustomSelect from "./customSelect";

/**
 * The available traits to split a tree on are taken as the non-continuous colorings.
 * We should further check that these are defined on (at least some) internal nodes.
 */
@connect((state) => ({
  selected: state.controls.explodeAttr,
  available: state.metadata.colorings,
  showThisUI: !state.controls.showTreeToo,
  mobileDisplay: state.general.mobileDisplay,
  showStreamTrees: state.controls.showStreamTrees,
}))
class ChooseExplodeAttr extends React.Component {
  constructor(props) {
    super(props);
    this.change = (value) => {this.props.dispatch(explodeTree(value.value));};
  }
  gatherAttrs() {
    const options = Object.entries(this.props.available)
      .filter(([_key, value]) => value.type !== "continuous")
      .filter(([key]) => key !== "gt")
      .map(([key, value]) => ({value: key, label: value.title || key}));
    if (this.props.selected) {
      options.unshift({value: undefined, label: "None"});
    }
    return options;
  }
  render() {
    if (!this.props.showThisUI) return null;
    // Don't display the sidebar UI if we're showing stream trees
    // (we could follow the UI example of the stream tree toggle & indicate _why_)
    if (this.props.showStreamTrees) return null;

    const { t, tooltip } = this.props;
    const selectOptions = this.gatherAttrs();
    return (
      <div style={{paddingTop: 10}}>
        <SidebarSubtitleFlex data-tip data-for="explode_tree">
          <span>
            {t("sidebar:Explode Tree By")}
          </span>
          {tooltip && !this.props.mobileDisplay && (
            <>
              <SidebarIconContainer data-tip data-for="select-explode">
                <FaInfoCircle/>
              </SidebarIconContainer>
              <StyledTooltip place="bottom" type="dark" effect="solid" id="select-explode">
                {tooltip}
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
    );
  }
}

const WithTranslation = withTranslation()(ChooseExplodeAttr);
export default WithTranslation;
