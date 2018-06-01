import React from "react";
import { connect } from "react-redux";
import Select from "react-select";
import { controlsWidth } from "../../util/globals";
import { CHANGE_GEO_RESOLUTION } from "../../actions/types";
import { analyticsControlsEvent } from "../../util/googleAnalytics";

@connect((state) => {
  return {
    metadata: state.metadata,
    geoResolution: state.controls.geoResolution
  };
})
class GeoResolution extends React.Component {

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
    let options = [];
    if (this.props.metadata.loaded) {
      options = Object.keys(this.props.metadata.geo).map((key) => {
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
          searchable={false}
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
