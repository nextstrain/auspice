import React from "react";
import Radium from "radium";
import { filterAbbrFwd } from "../../util/globals";
import ChooseFilter from "./choose-filter";
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
class AllFilters extends React.Component {
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

  render() {
    const styles = this.getStyles();
    const filters = [];
    if (this.props.metadata.metadata) {
      for (let key in this.props.metadata.metadata.controls){
        filters.push(<ChooseFilter {...this.props}
                      filterOptions={this.props.metadata.metadata.controls[key]}
                      filterType={key}
                     />);
      }
    }
    return (
      <div>
        Filters:
        {filters}
      </div>
      );
  }
}

export default AllFilters;
