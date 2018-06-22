import React from "react";
import { connect } from "react-redux";
import ChooseDatasetSelect from "./choose-dataset-select";
import parseParams from "../../util/parseParams";

// // remove starting or trailing slashes from path
// const tidyUpPathname = (pathname) => {
//   const tmppath = pathname[0] === "/" ? pathname.substring(1) : pathname;
//   return tmppath[tmppath.length - 1] === "/" ? tmppath.substring(0, tmppath.length - 1) : tmppath;
// };

const renderBareDataPath = (datapath) => (
  <span style={{ fontSize: 14 }}>
    { datapath }
  </span>
);

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
    /* If we're running without a manifest (or it hasn't loaded yet), show the
       raw datapath if we have one, otherwise don't render anything.  In
       sans-manifest mode, this helps the user know what they're looking at.
     */
    if (!this.props.availableDatasets) {
      return this.props.datapath
        ? renderBareDataPath(this.props.datapath)
        : null;
    }

    const styles = this.getStyles();

    /* analyse the current route in order to adjust the dataset selection choices.
    paramFields is an object with keys "virus" and potentially "lineage" and "duration"
    as well */
    const params      = parseParams(this.props.datapath, this.props.availableDatasets);
    const paramFields = params.dataset;

    /* If the parsed params aren't valid, then just show the bare datapath
       instead of an incomplete set of dataset choosers.  This happens, for
       example, when viewing a dataset that's not in the loaded manifest, such
       as a local test dataset.
     */
    if (!params.valid) {
      return renderBareDataPath(this.props.datapath);
    }

    // names of the different selectors in the current hierarchy: [virus, lineage, duration]
    // there will be (fields.length) dropdown boxes
    const fields = Object.keys(paramFields).sort((a, b) => paramFields[a][0] > paramFields[b][0]);
    // the current choice, e.g. [flu, h3n2, 3y] or [zika]
    const choices = fields.map((d) => paramFields[d][1]);
    /* make a selector for each of the fields. I.e. if it's only "zika", then the
    selectors array will only have 1 element */
    const selectors = []; // list to contain the different data set selectors
    let level = this.props.availableDatasets; // pointer used to move through the hierarchy -- currently at the top level of datasets
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
        // move to the next level in the data set hierarchy
        level = level[fields[vi]][choices[vi]];
      }
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
