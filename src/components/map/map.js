import React from "react";
import Radium from "radium";
import _ from "lodash";
// import Flex from "./framework/flex";
import { connect } from "react-redux";
// import { FOO } from "../actions";
import Card from "../framework/card";
import setupLeaflet from "../../util/leaflet";
import setupLeafletPlugins from "../../util/leaflet-plugins";
import {setupTipsAndTransmissions} from "../../util/mapHelpers";
import * as globals from "../../util/globals";
import computeResponsive from "../../util/computeResponsive";
import {
  MAP_ANIMATION_TICK,
  MAP_ANIMATION_END
} from "../../actions";

@connect((state) => {
  return {
    tree: state.tree.tree,
    metadata: state.metadata.metadata,
    browserDimensions: state.browserDimensions.browserDimensions,
    map: state.map
  };
})
class Map extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tips: false,
      map: null,
      datasetGuid: null,
      responsive: null
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

  componentWillReceiveProps(nextProps) {
    /*
      React to browser width/height changes responsively
      This is stored in state because it's used by both the map and the d3 overlay
    */
    if (
      this.props.browserDimensions &&
      (this.props.browserDimensions.width !== nextProps.browserDimensions.width ||
      this.props.browserDimensions.height !== nextProps.browserDimensions.height)
    ) {
      const responsive = computeResponsive({
        horizontal: nextProps.browserDimensions.width > globals.twoColumnBreakpoint ? .5 : 1,
        vertical: 1, /* if we are in single column, full height */
        browserDimensions: nextProps.browserDimensions,
        sidebar: nextProps.sidebar
      })
      this.setState({responsive})
    } else if (!this.props.browserDimensions && nextProps.browserDimensions) { /* first time */
      const responsive = computeResponsive({
        horizontal: nextProps.browserDimensions.width > globals.twoColumnBreakpoint ? .5 : 1,
        vertical: 1, /* if we are in single column, full height */
        browserDimensions: nextProps.browserDimensions,
        sidebar: nextProps.sidebar
      })
      this.setState({responsive})
    }
  }

  componentDidUpdate(prevProps, prevState) {

    /* first time map */
    if (
      this.props.browserDimensions &&
      !this.state.map
    ) {
      console.info("creating map")
      this.createMap();
    }

    if (
      this.state.map && // we have a map
      prevProps.datasetGuid &&
      this.props.datasetGuid &&
      prevProps.datasetGuid !== this.props.datasetGuid // and the dataset has changed
    ) {
      console.info("removing map")
      this.state.map.remove()
      this.setState({
        map: null,
        tips: false
      })

    }

    if (
      this.props.colorScale &&
      this.state.map && /* we have already drawn the map */
      this.props.metadata && /* we have the data we need */
      this.props.nodes &&
      this.state.responsive &&
      !this.state.tips /* we haven't already drawn tips */
    ) {
      setupTipsAndTransmissions(
        this.props.nodes,
        this.props.metadata,
        this.props.colorScale,
        this.state.map,
        this.state.responsive
      );
      // don't redraw on every rerender - need to seperately handle virus change redraw
      this.setState({
        tips: true
      });
    }

  }
  /******************************************
   * GET LEAFLET IN THE DOM
   *****************************************/
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

    L.control.zoom({position: "bottomright"}).addTo(map);

    this.setState({map});
  }

  createMapDiv() {
    return (
      <div style={{position: "relative"}}>
        <button style={{
            position: "absolute",
            left: 25,
            top: 25,
            zIndex: 9999,
            border: "none",
            padding: 15,
            borderRadius: 4,
            backgroundColor: "rgb(124, 184, 121)",
            fontWeight: 700,
            color: "white"
          }}
          onClick={this.handleAnimationPlayClicked.bind(this)}>
          Play
        </button>
        <div style={{
            height: this.state.responsive.height,
            width: this.state.responsive.width
          }} id="map">
        </div>
      </div>
    )
  }
  /******************************************
   * ANIMATE MAP (AND THAT LINE ON TREE)
   *****************************************/
  handleAnimationPlayClicked() { /* this will all probably go down into components/map/map.js */
    this.animateMap();
  }

  animateMap() {
    let start = null;

      const step = (timestamp) => {
        if (!start) start = timestamp;

        let progress = timestamp - start;

        this.props.dispatch({
          type: MAP_ANIMATION_TICK,
          data: {
            progress
          }
        })

        if (progress < globals.mapAnimationDurationInMilliseconds) {
          window.requestAnimationFrame(step);
        } else {
          this.props.dispatch({ type: MAP_ANIMATION_END })
        }
      }

      window.requestAnimationFrame(step);
  }

  render() {
    // console.log('map sees', this.props.map)
    // clear layers - store all markers in map state https://github.com/Leaflet/Leaflet/issues/3238#issuecomment-77061011

    return (
      <Card center title="Transmissions">
        {this.props.browserDimensions ? this.createMapDiv() : "Loading"}
      </Card>
    );
  }
}

export default Map;
