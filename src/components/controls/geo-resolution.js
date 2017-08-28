import React from "react";
import { connect } from "react-redux";
import _keys from "lodash/keys";
import { select } from "../../globalStyles";
import { CHANGE_GEO_RESOLUTION } from "../../actions/types";
import { modifyURLquery } from "../../util/urlHelpers";
import { analyticsControlsEvent } from "../../util/googleAnalytics";

/* Why does this have colorBy set as state (here) and in redux?
   it's for the case where we select genotype, then wait for the
   base to be selected, so we modify state but not yet dispatch
*/

@connect((state) => {
  return {
    metadata: state.metadata.metadata,
    geoResolution: state.controls.geoResolution,
  };
})
class GeoResolution extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }
  getStyles() {
    return {
      base: {
        marginBottom: 10
      }
    };
  }
  createResolutions() {
    let resolutions = null;

    if (this.props.metadata) {
      const resolutionKeys = _keys(this.props.metadata.geo)
      resolutions = resolutionKeys.map((resolution, i) => {
        return (
          <option key={i} value={ resolution }>
            { resolution.toLowerCase() }
          </option>
        )
      })
    }
    return resolutions;
  }
  render() {

    const styles = this.getStyles();

    return (
      <div style={styles.base}>
        <select
          value={this.props.geoResolution}
          style={select}
          id="geoResolution"
          onChange={(e) => {
            analyticsControlsEvent("change-geo-resolution");
            this.props.dispatch({ type: CHANGE_GEO_RESOLUTION, data: e.target.value });
            modifyURLquery(this.context.router, {r: e.target.value}, true);
          }}
        >
        {this.createResolutions()}
        </select>
      </div>
    );
  }
}

export default GeoResolution;
