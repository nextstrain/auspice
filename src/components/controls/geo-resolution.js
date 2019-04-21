import React from "react";
import { connect } from "react-redux";
import Select from "react-select";
import { controlsWidth } from "../../util/globals";
import { CHANGE_GEO_RESOLUTION } from "../../actions/types";
import { analyticsControlsEvent } from "../../util/googleAnalytics";
import { SidebarSubtitle } from "./styles";

@connect((state) => {
  return {
    metadata: state.metadata,
    geoResolution: state.controls.geoResolution
  };
})
class GeoResolution extends React.Component {
  getGeoResolutionOptions() {
    if (this.props.metadata.loaded) {
      return Object.keys(this.props.metadata.geographicInfo)
        .map((key) => ({ value: key, label: key }));
    }
    return [];
  }

  changeGeoResolution(resolution) {
    analyticsControlsEvent("change-geo-resolution");
    this.props.dispatch({ type: CHANGE_GEO_RESOLUTION, data: resolution });
  }

  render() {
    const geoResolutionOptions = this.getGeoResolutionOptions();
    return (
      <>
        <SidebarSubtitle spaceAbove>
          Geographic resolution
        </SidebarSubtitle>
        <div style={{marginBottom: 10, width: controlsWidth, fontSize: 14}}>
          <Select
            name="selectGeoResolution"
            id="selectGeoResolution"
            value={this.props.geoResolution}
            options={geoResolutionOptions}
            clearable={false}
            searchable={false}
            multi={false}
            onChange={(opt) => {this.changeGeoResolution(opt.value);}}
          />
        </div>
      </>
    );
  }
}

export default GeoResolution;
