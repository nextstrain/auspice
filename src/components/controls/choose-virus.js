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
    let options=['default'];
    let selectors = [];
    let level = datasets;
    let tmppath = (this.props.location.pathname[0]=='/')?this.props.location.pathname.substring(1):this.props.location.pathname;
    tmppath = (tmppath[tmppath.length-1]=='/')?tmppath.substring(0,tmppath.length-1):tmppath;
    const config = parseParams(tmppath)['dataset']
    const fields = Object.keys(config).sort( (a,b) => config[a][0]>config[b][0]);
    const choices = fields.map((d) => config[d][1]);
    // console.log('control:', this.props, fields, choices);
    for (let vi=0; vi<fields.length; vi++){
      if (choices[vi]){
        options = Object.keys(level[fields[vi]]).filter((d) => d!='default');
        // console.log(fields[vi], choices[vi], options, choices.slice(0,vi+1));
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
        level = level[fields[vi]][choices[vi]];
      }
    }
    // console.log(selectors);
    return (
      <div>
        {selectors}
      </div>
      );
  }
}

//
// {this.props.query.strain ? this.renderDurationSelect() : null}

export default ChooseVirus;
