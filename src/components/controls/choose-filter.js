import React from "react";
import Radium from "radium";
import { filterOptions, filterAbbrFwd } from "../../util/globals";
import RecursiveFilter from "./recursive_filter";
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
class ChooseFilter extends React.Component {
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
    style: React.PropTypes.object
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

  parseQuery(query) {
    return query.split("-");
  }


  render() {
    const styles = this.getStyles();

    // pull out filter query
    let filterQuery = this.props.query.location.filter || "all";

    // names of the different selectors in the current hierarchy: [virus, lineage, duration]
    //const fields = Object.keys(paramFields).sort((a, b) => paramFields[a][0] > paramFields[b][0]);
    // the current filters: [flu, h3n2, 3y]
    //const filters = fields.map((d) => paramFields[d][1]);
    const filters = this.parseQuery(filterQuery).map((d) => filterAbbrFwd[d]);
    console.log(filters);
    // make a selector for each of the fields
    const selectors = [];   // list to contain the different data set selectors
    let level = filterOptions; // pointer used to move through the hierarchy -- currently at the top level of datasets
    for (let vi = 0; vi < filters.length; vi++) {
      if (filters[vi]) {
        // pull options from the current level of the dataset hierarchy, ignore 'default'
        const options = Object.keys(level[filters[vi]]).filter((d) => d !== "default");
        selectors.push((
          <div key={vi} style={[
            styles.base,
            this.props.style
          ]}>
            <RecursiveFilter
              {...this.props}
              title={"Filter "}
              filter_tree={filters.slice(0, vi)}
              selected = {filters[vi]}
              options={options}
            />
            </div>
          ));
        // move to the next level in the data set hierarchy
        level = level[filters[vi]];
        console.log(filters[vi], level);
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

export default ChooseFilter;
