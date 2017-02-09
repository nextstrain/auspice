import React from "react";
import Radium from "radium";
import Select from "react-select";
import { filterAbbrRev, filterAbbrFwd } from "../../util/globals";
import { modifyURL } from "../../util/urlHelpers";

/*
 * implements a selector that
 * (i) knows about the upstream choices and
 * (ii) resets the route upon change
 */
@Radium
class RecursiveFilter extends React.Component {
  static propTypes = {
    filterTree: React.PropTypes.array.isRequired,
    filterType: React.PropTypes.string.isRequired,
    shortKey: React.PropTypes.string.isRequired,
    counts: React.PropTypes.array.isRequired,
    fields: React.PropTypes.array.isRequired,
    options: React.PropTypes.array.isRequired
  }
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }
  // // TODO this is broken!
  // makeQueryString(filters, fields){
  //   // the first item specifies the filter type (not really necessary)
  //   const tmp_filter = [];
  //   // all other filters are appended as key.value separated by dashes
  //   for (let ii = 0; ii < fields.length; ii += 1) {
  //     if (filters[ii] && filters[ii]) {
  //       tmp_filter.push(fields[ii] + "." + filters[ii]);
  //     }
  //   }
  //   return tmp_filter.join("-");
  // }

  setFilterQuery(filters, fields) {
    const ft = this.props.filterType;
    const filterQ = {};
    // console.log("in r-filter. setting", this.props.filterType, "to", this.makeQueryString(filters, fields))
    // filterQ[this.props.filterType] = this.makeQueryString(filters, fields);
    filterQ[this.props.shortKey] = filters;
    modifyURL(this.context.router, null, filterQ, false)
  }

  render() {
    const options = [];
    for (let i = 0; i < this.props.options.length; i++) {
      options.push({
        value: this.props.options[i],
        label: this.props.options[i] + (this.props.counts[i] ? " (" + this.props.counts[i] + ")" : "")
      });
    }
    return (
      <Select
        style={{width:230}}
        name="form-field-name"
        value={this.state.selection}
        multi={true}
        options={options}
        onChange={(e) => {
          this.setFilterQuery(
            this.props.filterTree.concat(e.map((d) => d["value"])
              .join(','))
              .map((d) => filterAbbrRev[d] || d),
            this.props.fields
          );
          this.setState({selection:e});
        }}
      />
    );
  }
}

export default RecursiveFilter;
