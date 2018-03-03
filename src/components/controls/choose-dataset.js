import React from "react";
import Select from "react-select";
import { connect } from "react-redux";
import ChooseDatasetSelect from "./choose-dataset-select";
import parseParams from "../../util/parseParams";
import { SelectLabel } from "../framework/select-label";
import { loadTreeToo } from "../../actions/loadData";
import { controlsWidth } from "../../util/globals";

// // remove starting or trailing slashes from path
// const tidyUpPathname = (pathname) => {
//   const tmppath = pathname[0] === "/" ? pathname.substring(1) : pathname;
//   return tmppath[tmppath.length - 1] === "/" ? tmppath.substring(0, tmppath.length - 1) : tmppath;
// };

@connect((state) => {
  return {
    availableDatasets: state.datasets.availableDatasets,
    datapath: state.datasets.datapath
  };
})
class ChooseDataset extends React.Component {
  getStyles() {
    return { base: {} };
  }
  render() {
    /* if the manifest file hasn't loaded (i.e. availableDatasets doesn't exist) or
    the datapath hasn't been set (can happen on initial page load), then don't render a drop-down */
    if (!this.props.availableDatasets || !this.props.datapath) return null;
    const styles = this.getStyles();
    /* analyse the current route in order to adjust the dataset selection choices.
    paramFields is an object with keys "virus" and potentially "lineage" and "duration"
    as well */
    const paramFields = parseParams(this.props.datapath, this.props.availableDatasets).dataset;
    // names of the different selectors in the current hierarchy: [virus, lineage, duration]
    // there will be (fields.length) dropdown boxes
    const fields = Object.keys(paramFields).sort((a, b) => paramFields[a][0] > paramFields[b][0]);
    // the current choice, e.g. [flu, h3n2, 3y] or [zika]
    const choices = fields.map((d) => paramFields[d][1]);
    /* make a selector for each of the fields. I.e. if it's only "zika", then the
    selectors array will only have 1 element */
    const selectors = []; // list to contain the different data set selectors
    let level = this.props.availableDatasets; // pointer used to move through the hierarchy -- currently at the top level of datasets
    let treeToo;
    for (let vi = 0; vi < fields.length; vi++) {
      if (choices[vi]) {
        // pull options from the current level of the dataset hierarchy, ignore 'default'
        const options = Object.keys(level[fields[vi]]).filter((d) => d !== "default");
        selectors.push((
          <div key={vi} style={styles.base}>
            <ChooseDatasetSelect
              title={"Choose " + fields[vi]}
              choice_tree={choices.slice(0, vi)}
              selected={choices[vi]}
              options={options}
            />
          </div>
        ));
	if (Object.keys(level).indexOf("segment") !== -1 && options.length > 1) {
	  treeToo = {
	    fieldIdx: vi,
	    options: options.filter((v) => v !== choices[vi]),
	    treeOne: choices[vi] // the option chosen for tree one (e.g. NA, PB1...)
	  };
	}
        // move to the next level in the data set hierarchy
        level = level[fields[vi]][choices[vi]];
      }
    }

    /* second tree? */
    if (treeToo) {
      selectors.push((
	<SelectLabel key="treetootitle" text="Second Tree"/>
      ));
      selectors.push((
	<div key={"treetooselect"} style={{width: controlsWidth, fontSize: 14}}>
	  <Select
	    name="selectTreeToo"
	    id="selectTreeToo"
	    value={"...unknown..."}
	    options={treeToo.options.map((opt) => ({value: opt, label: opt}))}
	    clearable={false}
	    multi={false}
	    onChange={(opt) => {
	      const dataPath = [...choices];
	      dataPath.splice(treeToo.fieldIdx, 1, opt.value);
	      this.props.dispatch(loadTreeToo(opt.value, dataPath.join("_")));
	    }}
	  />
	</div>
      ));
    }

    // return a list of selectors in the order of the data set hierarchy
    return (
      <div>
        {selectors}
      </div>
    );
  }
}

export default ChooseDataset;
