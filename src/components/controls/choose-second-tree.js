import React from "react";
import { connect } from "react-redux";
import { withTranslation } from 'react-i18next';

import { loadSecondTree } from "../../actions/loadData";
import { REMOVE_TREE_TOO } from "../../actions/types";
import { controlsWidth } from "../../util/globals";
import { SidebarSubtitle } from "./styles";
import CustomSelect from "./customSelect";

@connect((state) => {
  return {
    available: state.controls.available,
    treeName: state.tree.name,
    showTreeToo: state.controls.showTreeToo /* this is the name of the second tree if one is selected */
  };
})
class ChooseSecondTree extends React.Component {
  render() {
    const { t } = this.props;
    if (!this.props.available || !this.props.available.datasets) {
      return null;
    }
    const displayedDataset = window.location.pathname
      .replace(/^\//, '')
      .replace(/\/$/, '')
      .split(':')[0];

    const options = [...new Set(
      this.props.available.datasets
        .filter((dataset) => dataset.request === displayedDataset)
        .flatMap((dataset) => dataset.secondTreeOptions)
        .filter((opt) => !!opt) // .secondTreeOptions is not required
    )]

    // Don't display the sidebar UI if we're just going to display an empty dropdown!
    if (!options.length) return null;

    if (this.props.showTreeToo) options.unshift("REMOVE");

    const selectOptions = options.map((opt) => ({value: opt, label: opt}));

    return (
      <div>
        <SidebarSubtitle spaceAbove>
          {t("sidebar:Second Tree")}
        </SidebarSubtitle>
        <div key={"treetooselect"} style={{width: controlsWidth, fontSize: 14}}>
          <CustomSelect
            name="selectTreeToo"
            id="selectTreeToo"
            value={selectOptions.filter(({value}) => value === this.props.showTreeToo)}
            options={selectOptions}
            isClearable={false}
            isSearchable={false}
            isMulti={false}
            onChange={(opt) => {
              if (opt.value === "REMOVE") {
                this.props.dispatch({type: REMOVE_TREE_TOO});
              } else {
                this.props.dispatch(loadSecondTree(opt.value, displayedDataset));
              }
            }}
          />
        </div>
      </div>
    );
  }
}

const WithTranslation = withTranslation()(ChooseSecondTree);
export default WithTranslation;
