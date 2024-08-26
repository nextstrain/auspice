import React from "react";
import { connect } from "react-redux";
import { withTranslation } from 'react-i18next';
import { CHANGE_TIP_LABEL_KEY } from "../../actions/types";
import { SidebarSubtitle } from "./styles";
import { controlsWidth, strainSymbol } from "../../util/globals";
import CustomSelect from "./customSelect";

@connect((state) => ({
  selected: state.controls.tipLabelKey,
  options: collectAvailableTipLabelOptions(state.tree.nodeAttrKeys, state.metadata.colorings)
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
 * available tip labellings are all observed node_attrs as well as two special cases:
 * no tip labels / hide & the node name ("sample name"). If a node_attr is a coloring
 * then we display the coloring title.
 * 
 * Note that this only considers the main (LHS) tree. It is trivial for this function
 * to consider the RHS tree, however the logic in `recomputeReduxState.js` doesn't
 * make it straightforward to provide the RHS `nodeAttrKeys` when we construct these.
 * 
 * In the future we could add genotype, but it's not straightforward.
 */
export function collectAvailableTipLabelOptions(nodeAttrKeys, colorings) {
  return [
    /**
     * We should consider using a Symbol for the 'none' value so that it
     * can't clash with potential coloring values, but then it's not as
     * straightforward to specify this option via the URL query
     */
    {value: 'none', label: "none"},
    {value: strainSymbol, label: "Sample Name"},
    ...Array.from(nodeAttrKeys)
      .map((key) => ({value: key, label: (colorings[key]||{})?.title||key}))
  ];
}
