import React from "react";
import Radium from "radium";
import { datasets } from "../../util/globals";
import ChooseVirusSelect from "./choose-virus-select";
import parseParams from "../../util/parseParams";
import { connect } from "react-redux";

@Radium
@connect((state) => {
  return {
    datasetPathName: state.controls.datasetPathName
  }
})
class ChooseVirus extends React.Component {
  constructor(props) {
    super(props);
  }
  static propTypes = {
    params: React.PropTypes.object,
    routes: React.PropTypes.array,
    style: React.PropTypes.object
  }
  getStyles() {
    return { base: {} }
  }

  render() {
    const styles = this.getStyles();
    /* ALL OF THIS SHOULD COME FROM REDUX, NOT THE URL!!!!!! */
    // remove starting or trailing slashes from path
    let tmppath = ((this.props.location.pathname[0] === "/")
                    ? this.props.location.pathname.substring(1)
                    : this.props.location.pathname);
    tmppath = ((tmppath[tmppath.length - 1] === "/")
                ? tmppath.substring(0, tmppath.length - 1)
                : tmppath);
    // analyse the current route in order to adjust the dataset selection choices
    const params = parseParams(tmppath);
    const paramFields = params.dataset;
    // names of the different selectors in the current hierarchy: [virus, lineage, duration]
    const fields = Object.keys(paramFields).sort((a, b) => paramFields[a][0] > paramFields[b][0]);
    // the current choices: [flu, h3n2, 3y]
    const choices = fields.map((d) => paramFields[d][1]);
    // make a selector for each of the fields
    const selectors = [];   // list to contain the different data set selectors
    let level = datasets; // pointer used to move through the hierarchy -- currently at the top level of datasets
    for (let vi = 0; vi < fields.length; vi++) {
      if (choices[vi]){
        // pull options from the current level of the dataset hierarchy, ignore 'default'
        const options = Object.keys(level[fields[vi]]).filter((d) => d !== "default");
        selectors.push((
          <div key={vi} style={[
            styles.base,
            this.props.style
          ]}>
            <ChooseVirusSelect
              {...this.props}
              title={"Choose "+fields[vi]}
              query={this.props.query}
              choice_tree={choices.slice(0, vi)}
              selected = {choices[vi]}
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

export default ChooseVirus;
