import React from "react";
import Select from "react-select/lib/Select";
import { connect } from "react-redux";
import { withTranslation } from 'react-i18next';

import { loadSecondTree } from "../../actions/loadData";
import { REMOVE_TREE_TOO } from "../../actions/types";
import { controlsWidth } from "../../util/globals";
import { SidebarSubtitle } from "./styles";


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

    let options = [];
    this.props.available.datasets
    .filter((dataset) => {
      if (dataset.request === displayedDataset) {
        options = [...dataset.secondTreeOptions];
      }
      return null;
    });

    if (this.props.showTreeToo) options.unshift("REMOVE");

    return (
      <div>
        <SidebarSubtitle spaceAbove>
          {t("sidebar:Second Tree")}
        </SidebarSubtitle>
        <div key={"treetooselect"} style={{width: controlsWidth, fontSize: 14}}>
          <Select
            name="selectTreeToo"
            id="selectTreeToo"
            value={this.props.showTreeToo}
            options={options.map((opt) => ({value: opt, label: opt}))}
            clearable={false}
            searchable={false}
            multi={false}
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
