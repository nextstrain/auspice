import React from "react";
import Select from "react-select";
import { connect } from "react-redux";
import { loadTreeToo } from "../../actions/loadData";
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
    if (!this.props.available || !this.props.available.datasets || !this.props.treeName) {
      return null;
    }
    const displayedDataset = window.location.pathname
      .replace(/^\//, '')
      .replace(/\/$/, '')
      .split("/");
    displayedDataset.forEach((part, idx) => {
      if (part.includes(":")) {
        displayedDataset[idx] = part.split(":")[0];
      }
    });
    const idxOfTree = displayedDataset.indexOf(this.props.treeName);

    const matches = this.props.available.datasets
      .map((datasetObj) => datasetObj.request.split("/"))
      .filter((dataset) => {
        if (dataset.length !== displayedDataset.length) return false;
        for (let i=0; i<dataset.length; i++) {
          if (i===idxOfTree) {
            if (dataset[i] === displayedDataset[i]) {
              return false; // don't match the same tree name
            }
          } else if (dataset[i] !== displayedDataset[i]) {
            return false; // everything apart from the tree much match
          }
        }
        return true;
      });

    const options = matches.map((m) => m[idxOfTree]);
    if (this.props.showTreeToo) options.unshift("REMOVE");

    return (
      <div>
        <SidebarSubtitle spaceAbove>
          Second Tree
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
                const dataPath = [...displayedDataset];
                dataPath.splice(idxOfTree, 1, opt.value);
                this.props.dispatch(loadTreeToo(opt.value, dataPath));
              }
            }}
          />
        </div>
      </div>
    );
  }
}

export default ChooseSecondTree;
