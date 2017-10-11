import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import { changeS3Bucket } from "../../actions/loadData";
import { analyticsControlsEvent } from "../../util/googleAnalytics";
import Toggle from "./toggle";

@connect((state) => ({
  analysisSlider: state.controls.analysisSlider,
  panels: state.metadata.panels,
  s3bucket: state.datasets.s3bucket
}))
class DataSource extends React.Component {
  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    s3bucket: PropTypes.string.isRequired
  }
  static contextTypes = {
    router: PropTypes.object.isRequired
  }
  render() {
    return (
      <Toggle
        display
        on={this.props.s3bucket === "staging"}
        callback={() => {
          analyticsControlsEvent("change-s3-bucket");
          this.props.dispatch(changeS3Bucket(this.context.router));
        }}
        label="Staging server (nightly builds)"
      />
    );
  }
}

export default DataSource;
