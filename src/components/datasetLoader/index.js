import React from "react";
import { connect } from "react-redux";
import { loadJSONs } from "../../actions/loadData";
import { PAGE_CHANGE } from "../../actions/types";

const nextstrainLogo = require("../../images/nextstrain-logo-small.png");

export const Spinner = ({availableHeight}) => (
  <img className={"spinner"} src={nextstrainLogo} alt="loading" style={{marginTop: `${availableHeight / 2 - 100}px`}}/>
);

@connect((state) => ({
  browserDimensions: state.browserDimensions.browserDimensions,
  metadataLoaded: state.metadata.loaded,
  treeLoaded: state.tree.loaded
}))
class DatasetLoader extends React.Component {
  constructor(props) {
    super(props);
  }
  componentWillMount() {
    this.props.dispatch(loadJSONs()); // choose via URL
  }
  componentDidUpdate() {
    if (this.props.metadataLoaded && this.props.treeLoaded) {
      this.props.dispatch({
	type: PAGE_CHANGE,
	displayComponent: "main"
      });
    }
  }

  render() {
    return (
      <Spinner availableHeight={this.props.browserDimensions.height}/>
    );
  }

}

export default DatasetLoader;
