import React from "react";
import Select from "react-select";
import { connect } from "react-redux";
import { SelectLabel } from "../framework/select-label";
import { loadTreeToo } from "../../actions/loadData";
import { REMOVE_TREE_TOO } from "../../actions/types";
import parseParams from "../../util/parseParams";
import { controlsWidth } from "../../util/globals";

@connect((state) => {
  return {
    availableDatasets: state.datasets.availableDatasets,
    datapath: state.datasets.datapath,
    showTreeToo: state.controls.showTreeToo
  };
})
class ChooseSecondTree extends React.Component {
  getStyles() {
    return { base: {} };
  }
  render() {
    // this logic duplicated from ChooseDataset
    if (!this.props.availableDatasets || !this.props.datapath) return null;
    const paramFields = parseParams(this.props.datapath, this.props.availableDatasets).dataset;
    const fields = Object.keys(paramFields).sort((a, b) => paramFields[a][0] > paramFields[b][0]);
    const choices = fields.map((d) => paramFields[d][1]);
    let level = this.props.availableDatasets;
    let treeToo;
    for (let vi = 0; vi < fields.length; vi++) {
      if (choices[vi]) {
        const options = Object.keys(level[fields[vi]]).filter((d) => d !== "default");
        if (Object.keys(level).indexOf("segment") !== -1 && options.length > 1) {
          const treeTooOptions = options.filter((v) => v !== choices[vi]);
          if (this.props.showTreeToo) {
            treeTooOptions.unshift("REMOVE");
          }
          treeToo = {
            fieldIdx: vi,
            options: treeTooOptions,
            treeOne: choices[vi] // the option chosen for tree one (e.g. NA, PB1...)
          };
        }
        // move to the next level in the data set hierarchy
        level = level[fields[vi]][choices[vi]];
      }
    }
    /* second tree? */
    if (treeToo) {
      return (
        <div>
          <SelectLabel key="treetootitle" text="Second Tree"/>
          <div key={"treetooselect"} style={{width: controlsWidth, fontSize: 14}}>
            <Select
              name="selectTreeToo"
              id="selectTreeToo"
              value={this.props.showTreeToo}
              options={treeToo.options.map((opt) => ({value: opt, label: opt}))}
              clearable={false}
              multi={false}
              onChange={(opt) => {
                if (opt.value === "REMOVE") {
                  this.props.dispatch({type: REMOVE_TREE_TOO});
                } else {
                  const dataPath = [...choices];
                  dataPath.splice(treeToo.fieldIdx, 1, opt.value);
                  this.props.dispatch(loadTreeToo(opt.value, dataPath.join("_")));
                }
              }}
            />
          </div>
        </div>
      );
    }
    return null;
  }
}

export default ChooseSecondTree;
