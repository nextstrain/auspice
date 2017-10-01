import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import Select from "react-select";
import { controlsWidth } from "../../util/globals";
import { CHANGE_GEO_RESOLUTION } from "../../actions/types";
import { modifyURLquery } from "../../util/urlHelpers";
import { analyticsControlsEvent } from "../../util/googleAnalytics";

@connect((state) => {
  return {
    geo: state.metadata.metadata.geo,
    geoResolution: state.controls.geoResolution
  };
})
class GeoResolution extends React.Component {

  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  getStyles() {
    return {
      base: {
        marginBottom: 10,
        width: controlsWidth,
        fontSize: 14     
      }
    };
  }

  getGeoResolutionOptions() {
    let options = {};
    if (this.props.geo) {
      options = Object.keys(this.props.geo).map((key) => {
        return {
          value: key,
          label: key
        };
      });
    }
    return options;
  }

  changeGeoResolution(resolution) {
    analyticsControlsEvent("change-geo-resolution");
    this.props.dispatch({ type: CHANGE_GEO_RESOLUTION, data: resolution });
    modifyURLquery(this.context.router, {r: resolution}, true);
  }

  render() {
    const styles = this.getStyles();
    const geoResolutionOptions = this.getGeoResolutionOptions();
    return (
      <div style={styles.base}>
        <Select
          name="selectGeoResolution"
          id="selectGeoResolution"
          value={this.props.geoResolution}
          options={geoResolutionOptions}
          clearable={false}
          multi={false}
          onChange={(opt) => {
            this.changeGeoResolution(opt.value);
          }}
        />
      </div>
    );
  }
}

export default GeoResolution;
