import React from "react";
import Radium from "radium";
import Select from "react-select";
import { controlsWidth } from "../../util/globals";
import { connect } from "react-redux";
import { applyFilterQuery } from "../../actions/treeProperties"
import { analyticsControlsEvent } from "../../util/googleAnalytics";
import { prettyString } from "../../util/stringHelpers";

/*
 * implements a selector that
 * (i) knows about the upstream choices and
 * (ii) URL features have been removed. Potentially to be added in the future.
 * (iii) dispatches an action to change the state of the app
 */
@Radium
@connect((state) => ({selections: state.controls.filters}))
class RecursiveFilter extends React.Component {
  constructor(props) {
    super(props);
  }
  static propTypes = {
    filterTree: React.PropTypes.array.isRequired,
    filterType: React.PropTypes.string.isRequired,
    shortKey: React.PropTypes.string.isRequired,
    counts: React.PropTypes.array.isRequired,
    fields: React.PropTypes.array.isRequired,
    options: React.PropTypes.array.isRequired,
    dispatch: React.PropTypes.func.isRequired,
    selections: React.PropTypes.object.isRequired
  }
  // static contextTypes = {
  //   router: React.PropTypes.object.isRequired
  // }

  setFilterQuery(e) {
    /* the variables of interest:
    this.props.filterType: e.g. authers || geographic location
    this.props.fields: e.g. region || country || authors
    values: list of selected values, e.g [brazil, usa, ...]
    */
    const values = this.props.filterTree.concat(e.map((d) => d["value"]));
    analyticsControlsEvent(`filter-${this.props.filterType.replace(/\s/gi, "-")}`);
    this.props.dispatch(
      applyFilterQuery(this.props.filterType, this.props.fields, values)
    );
    // console.log("selection:", e)
  }

  render() {
    const options = [];
    for (let i = 0; i < this.props.options.length; i++) {
      options.push({
        value: this.props.options[i],
        label: prettyString(this.props.options[i]).replace("Et Al", "et al") + (this.props.counts[i] ? " (" + this.props.counts[i] + ")" : "")
      });
    }
    /* note that e (onChange) is an array of objects each with label and value */
    return (
      <Select
        style={{width: controlsWidth}}
        name="form-field-name"
        value={this.props.selections[this.props.fields]}
        multi={true}
        options={options}
        onChange={(e) => this.setFilterQuery(e)}
      />
    );
  }
}

export default RecursiveFilter;
