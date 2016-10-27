import React from "react";
import Radium from "radium";
import queryString from "query-string";
import Select from 'react-select';
import { filterAbbrRev,filterAbbrFwd } from "../../util/globals";

/*
 * implements a selector that
 * (i) knows about the upstream choices and
 * (ii) resets the route upon change
 */
class RecursiveFilter extends React.Component {
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

  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps.filterType !== this.props.filterType
      || nextProps.options !== this.props.options
      || nextProps.location !== this.props.location
      || nextState.selection !== this.state.selection) {
      return true;
    } else {
      return false;
    }
  }

  makeQueryString(filters, fields){
    // the first item specifies the filter type (not really necessary)
    const tmp_filter = [];
    // all other filters are appended as key.value separated by dashes
    for (let ii=0; ii<fields.length; ii+=1){
      if (filters[ii] && filters[ii]){
        tmp_filter.push(fields[ii] + "." + filters[ii]);
      }
    }
    return tmp_filter.join('-');
  }

  setFilterQuery(filters, fields) {
    const ft = this.props.filterType;
    const filterQ = {};
    filterQ[this.props.filterType] = this.makeQueryString(filters, fields);
    // push new query into changeRoute
    const newQuery = Object.assign({}, this.props.location.query, filterQ);
    this.props.changeRoute(this.props.location.pathname, newQuery);
  }

  render() {
    // the selector below resets the path by router.push({pathname:new_path})
    // the currently selected option is passed down as this.props.selected
    // 9/19/2016: https://facebook.github.io/react/docs/forms.html#why-select-value
    const options = [];
    for (let i=0; i<this.props.options.length; i++){
      options.push({value:this.props.options[i],
                    label:this.props.options[i] + (this.props.counts[i] ? " (" + this.props.counts[i] + ")" : "")}
                  );
    }
    return (
      <Select
        style={{width:200}}
        name="form-field-name"
        value={this.state.selection}
        multi={true}
        options={options}
        onChange={(e) => {
            this.setFilterQuery(this.props.filterTree.concat(e.map((d) => d["value"]).join(','))
                                .map((d) => filterAbbrRev[d]||d),
                                this.props.fields);
            this.setState({selection:e});
        }}
      />
    );
  }
}

export default RecursiveFilter;
