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
    datasetFields: state.controls.datasetFields,
    source: state.controls.source,
    treeName: state.tree.name,
    showTreeToo: state.controls.showTreeToo
  };
})
class ChooseSecondTree extends React.Component {
  render() {
    if (!this.props.available || !this.props.datasetFields || !this.props.source || !this.props.treeName) {
      return null;
    }

    const idxOfTree = this.props.datasetFields.indexOf(this.props.treeName);

    const matches = this.props.available.slice().filter((dataset) => {
      if (dataset.length !== this.props.datasetFields.length) return false;
      for (let i=0; i<dataset.length; i++) {
        if (i===idxOfTree) {
          if (dataset[i] === this.props.datasetFields[i]) {
            return false; // don't match the same tree name
          }
        } else if (dataset[i] !== this.props.datasetFields[i]) {
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
                const dataPath = [...this.props.datasetFields];
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
