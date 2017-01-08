import React from "react";
import Radium from "radium";
import _ from "lodash";
// import Flex from "./framework/flex";
import { connect } from "react-redux";
// import { FOO } from "../actions";
import Card from "../framework/card";
import setupLeaflet from "../../util/leaflet";
import setupLeafletPlugins from "../../util/leaflet-plugins";
import {addAllTipsToMap, addTransmissionEventsToMap} from "../../util/mapHelpers";
import * as globals from "../../util/globals";
import computeResponsive from "../../util/computeResponsive";

@connect((state) => {
  return {
    tree: state.tree.tree,
    metadata: state.metadata.metadata,
    browserDimensions: state.browserDimensions.browserDimensions
  };
})
class Map extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tips: false,
      map: null,
      datasetGuid: null
    };
  }
  componentWillMount() {
    /* this sets up window.L */
    setupLeaflet();
  }
  componentDidMount() {
    /* this attaches several properties to window.L */
    setupLeafletPlugins();
  }

  componentDidUpdate(prevProps, prevState) {
    /* first time map */
    if (
      this.props.browserDimensions &&
      !this.state.map
    ) {
      this.createMap();
    }

    if (
      prevProps.browserDimensions &&
      prevProps.browserDimensions.height &&
      this.props.browserDimensions.height !== prevProps.browserDimensions.height
    ) {
      /* optionally clear and re-layout the map here */
    }

    if (
      this.props.colorScale &&
      this.state.map && /* we have already drawn the map */
      this.props.metadata && /* we have the data we need */
      this.props.nodes &&
      !this.state.tips /* we haven't already drawn tips */
    ) {
      addAllTipsToMap(this.props.nodes, this.props.metadata, this.props.colorScale, this.state.map);
      addTransmissionEventsToMap(this.props.nodes, this.props.metadata, this.props.colorScale, this.state.map);
      // don't redraw on every rerender - need to seperately handle virus change redraw
      this.setState({tips: true});
    }

  }

  createMap() {

    const southWest = L.latLng(-70, -180);
    const northEast = L.latLng(90, 180);
    const bounds = L.latLngBounds(southWest, northEast);

    var map = L.map('map', {
      center: [0,0],
      zoom: 2,
      scrollWheelZoom: false,
      maxBounds: bounds,
      minZoom: 2,
      maxZoom: 9,
      zoomControl: false,
      /* leaflet sleep see https://cliffcloud.github.io/Leaflet.Sleep/#summary */
      // true by default, false if you want a wild map
      sleep: false,
      // time(ms) for the map to fall asleep upon mouseout
      sleepTime: 750,
      // time(ms) until map wakes on mouseover
      wakeTime: 750,
      // defines whether or not the user is prompted oh how to wake map
      sleepNote: true,
      // should hovering wake the map? (clicking always will)
      hoverToWake: false
    })

    L.tileLayer('https://api.mapbox.com/styles/v1/trvrb/ciu03v244002o2in5hlm3q6w2/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoidHJ2cmIiLCJhIjoiY2l1MDRoMzg5MDEwbjJvcXBpNnUxMXdwbCJ9.PMqX7vgORuXLXxtI3wISjw', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
        // noWrap: true
    }).addTo(map);

    L.control.zoom({position: "bottomright"}).addTo(map)

    this.setState({map})
  }

  createMapDiv() {
    const responsive = computeResponsive({
      horizontal: this.props.browserDimensions && this.props.browserDimensions.width > globals.twoColumnBreakpoint ? .5 : 1,
      vertical: 1, /* if we are in single column, full height */
      browserDimensions: this.props.browserDimensions,
      sidebar: this.props.sidebar
    })
    return (
      <div style={{
          height: responsive.height,
          width: responsive.width
        }} id="map">
      </div>
    )
  }
  render() {

    // clear layers - store all markers in map state https://github.com/Leaflet/Leaflet/issues/3238#issuecomment-77061011
    return (
      <Card center title="Transmissions">
        {this.props.browserDimensions ? this.createMapDiv() : "Loading"}
      </Card>
    );
  }
}

export default Map;
