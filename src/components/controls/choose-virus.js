import React from "react";
import Radium from "radium";
// import _ from "lodash";
// import Flex from "./framework/flex";
// import { connect } from "react-redux";
// import { FOO } from "../actions";
import { viruses } from "../../util/globals";
import ChooseVirusSelect from "./choose-virus-select";

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
    return (
      <div style={[
        styles.base,
        this.props.style
      ]}>
        <ChooseVirusSelect
          title={"Choose virus"}
          query={this.props.query}
          queryParamAccessor={"virus"}
          options={viruses.list}/>
        {
          this.props.query.virus && viruses[this.props.query.virus].strains ?
            <ChooseVirusSelect
              title={"Choose strain"}
              query={this.props.query}
              queryParamAccessor={"strain"}
              options={viruses[this.props.query.virus].strains}/> : null
        }
        {
          this.props.query.virus && /* if there is a virus in the query params Flu */
          this.props.query.strain && /* and a strain H3N2 check if that strain has a duration */
          viruses[this.props.query.virus][this.props.query.strain] ?
            <ChooseVirusSelect
              title={"Choose dataset duration in years"}
              query={this.props.query}
              queryParamAccessor={"duration"}
              options={viruses[this.props.query.virus][this.props.query.strain]}/> : null
        }
      </div>
    );
  }
}

//
// {this.props.query.strain ? this.renderDurationSelect() : null}

export default ChooseVirus;
