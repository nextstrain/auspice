import React from "react";
import { connect } from "react-redux";
import { loadJSONs } from "../../actions/loadData";
import { PAGE_CHANGE } from "../../actions/types";

/* The DatsetLoader component simply triggers the (async) loadJSONs action
 * and then redirects to the "main" page (via a PAGE_CHANGE action).
 * Note that if the loadJSONs action "fails" it will subsequently redirect to a 404 page
 */
@connect()
class DatasetLoader extends React.Component {
  constructor(props) {
    super(props);
  }
  componentWillMount() {
    this.props.dispatch(loadJSONs()); // choose via URL
    this.props.dispatch({type: PAGE_CHANGE, displayComponent: "main"});
  }
  render() {
    return null;
  }
}

export default DatasetLoader;
