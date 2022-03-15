import React from "react";
import { connect } from "react-redux";
import { withTranslation } from 'react-i18next';
import { CHANGE_TIP_LABEL_KEY } from "../../actions/types";
import { SidebarSubtitle } from "./styles";
import { controlsWidth, strainSymbol } from "../../util/globals";
import CustomSelect from "./customSelect";

@connect((state) => ({
  selected: state.controls.tipLabelKey,
  options: collectAvailableTipLabelOptions(state.metadata.colorings)
}))
class ChooseTipLabel extends React.Component {
  constructor(props) {
    super(props);
    this.change = (value) => {this.props.dispatch({type: CHANGE_TIP_LABEL_KEY, key: value.value});};
  }
  render() {
    const { t } = this.props;
    return (
      <div style={{paddingTop: 5}}>
        <SidebarSubtitle>
          {t("sidebar:Tip Labels")}
        </SidebarSubtitle>
        <div style={{width: controlsWidth, fontSize: 14}}>
          <CustomSelect
            value={this.props.options.filter(({value}) => value === this.props.selected)}
            // Select can't handle Symbols, so we have to convert to string for them
            getOptionValue={(option) => option.value.toString()}
            options={this.props.options}
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

const WithTranslation = withTranslation()(ChooseTipLabel);
export default WithTranslation;

/**
 * collect available tip labellings -- currently this is based on the available
 * colorings but we ignore genotype (this could be implemented in the future,
 * but it's not straightforward)
 */
export function collectAvailableTipLabelOptions(colorings) {
  return [
    {value: strainSymbol, label: "Sample Name"},
    ...Object.entries(colorings)
      .filter((keyValue) => keyValue[0] !== 'gt')
      .map(([key, value]) => {
        return {value: key, label: value.title};
      })
  ];
}
