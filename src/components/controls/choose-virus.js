import React from "react";
import Radium from "radium";
// import _ from "lodash";
// import Flex from "./framework/flex";
// import { connect } from "react-redux";
// import { FOO } from "../actions";
import { datasets } from "../../util/globals";
import ChooseVirusSelect from "./choose-virus-select";
import parseParams from "../../util/parseParams";

// @connect(state => {
//   return state.FOO;
// })

/*
 * this component implements a series of selectors to select datasets.
 * the dataset hierarchy is specified in a datasets.json, currently
 * in ../../util/globals
*/
@Radium
class ChooseVirus extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

    };
  }
  static propTypes = {
    /* react */
    // dispatch: React.PropTypes.func,
    params: React.PropTypes.object,
    routes: React.PropTypes.array,
    /* component api */
    style: React.PropTypes.object,
    // foo: React.PropTypes.string
  }
  static defaultProps = {
    // foo: "bar"
  }
  getStyles() {
    return {
      base: {

      }
    };
  }

  render() {
    const styles = this.getStyles();

    // remove starting or trailing slashes from path
    let tmppath = (this.props.location.pathname[0]=='/')?this.props.location.pathname.substring(1):this.props.location.pathname;
    tmppath = (tmppath[tmppath.length-1]=='/')?tmppath.substring(0,tmppath.length-1):tmppath;
    // analyse the current route in order to adjust the dataset selection choices
    const parsedParams = parseParams(tmppath)['dataset']
    // names of the different selectors in the current hierarchy: [virus, lineage, duration]
    const fields = Object.keys(parsedParams).sort( (a,b) => parsedParams[a][0]>parsedParams[b][0]);
    // the current choices: [flu, h3n2, 3y]
    const choices = fields.map((d) => parsedParams[d][1]);

    // make a selector for each of the fields
    let selectors = [];   // list to contain the different data set selectors
    let level = datasets; // pointer used to move through the hierarchy -- currently at the top level of datasets
    for (let vi=0; vi<fields.length; vi++){
      if (choices[vi]){
        // pull options from the current level of the dataset hierarchy, ignore 'default'
        const options = Object.keys(level[fields[vi]]).filter((d) => d!='default');
        selectors.push((
          <div style={[
            styles.base,
            this.props.style
            ]}>
            <ChooseVirusSelect
              title={"Choose "+fields[vi]}
              query={this.props.query}
              choice_tree={choices.slice(0,vi)}
              selected = {choices[vi]}
              options={options}/>
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
