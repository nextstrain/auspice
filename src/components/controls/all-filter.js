import React from "react";
import Radium from "radium";
import { filterAbbrFwd } from "../../util/globals";
import ChooseFilter from "./choose-filter";
import parseParams from "../../util/parseParams";
import { connect } from "react-redux";

/* this should be re-thought out & moved to augur */
const filterShortName = {
  "geographic location": "fgeo",
  "authors": "fauth"
};
/*
 * this component implements a series of selectors to select datasets.
 * the dataset hierarchy is specified in a datasets.json, currently
 * in ../../util/globals
*/
@Radium
@connect((state) => ({metadata: state.metadata}))
class AllFilters extends React.Component {
  static propTypes = {
    metadata: React.PropTypes.object.isRequired // should use shape here
  }
  render() {
    const filters = [];
    if (this.props.metadata.metadata) {
      for (let key in this.props.metadata.metadata.controls) {
        // console.log("making filter", key, this.props.metadata.metadata.controls[key])
        filters.push(
          <ChooseFilter
            key={key}
            filterOptions={this.props.metadata.metadata.controls[key]}
            filterType={key}
            shortKey={filterShortName[key]}
          />
        );
      }
    }
    return (
      <div>
        {filters}
      </div>
    );
  }
}

export default AllFilters;
