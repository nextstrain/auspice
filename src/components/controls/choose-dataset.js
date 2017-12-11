import React from "react";
// import PropTypes from 'prop-types';
import { connect } from "react-redux";
import ChooseDatasetSelect from "./choose-dataset-select";
import parseParams from "../../util/parseParams";

// remove starting or trailing slashes from path
const tidyUpPathname = (pathname) => {
  const tmppath = pathname[0] === "/" ? pathname.substring(1) : pathname;
  return tmppath[tmppath.length - 1] === "/" ? tmppath.substring(0, tmppath.length - 1) : tmppath;
};

@connect((state) => {
  return {
    datasetPathName: state.controls.datasetPathName, /* triggers component update */
    geoResolution: state.controls.geoResolution,
    pathogen: state.datasets.pathogen,
    pathname: state.datasets.pathname
  };
})
class ChooseDataset extends React.Component {
  getStyles() {
    return { base: {} };
  }
  render() {
    /* if charon hasn't given us data yet, we should not render the dropdown */
    if (!this.props.pathogen || !this.props.pathname) return null;

    const datasets = {pathogen: this.props.pathogen};
    const styles = this.getStyles();
    // const pathname = this.context.router.history.location.pathname;
    const pathname = this.props.pathname;
    /* analyse the current route in order to adjust the dataset selection choices.
    paramFields is an object with keys "virus" and potentially "lineage" and "duration"
    as well */
    // return null;
    const paramFields = parseParams(tidyUpPathname(pathname), datasets).dataset;
    // names of the different selectors in the current hierarchy: [virus, lineage, duration]
    // there will be (fields.length) dropdown boxes
    const fields = Object.keys(paramFields).sort((a, b) => paramFields[a][0] > paramFields[b][0]);
    // the current choice, e.g. [flu, h3n2, 3y] or [zika]
    const choices = fields.map((d) => paramFields[d][1]);
    /* make a selector for each of the fields. I.e. if it's only "zika", then the
    selectors array will only have 1 element */
    const selectors = []; // list to contain the different data set selectors
    let level = datasets; // pointer used to move through the hierarchy -- currently at the top level of datasets
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
