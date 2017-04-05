import React from "react";
import d3 from "d3";
import _ from "lodash";
import moment from "moment";
import { connect } from "react-redux";
import Card from "../framework/card";
import {changeDateFilter} from "../../actions/treeProperties";
import setupLeaflet from "../../util/leaflet";
import setupLeafletPlugins from "../../util/leaflet-plugins";
import {drawDemesAndTransmissions, updateOnMoveEnd} from "../../util/mapHelpers";
import * as globals from "../../util/globals";
import computeResponsive from "../../util/computeResponsive";
import getLatLongs from "../../util/mapHelpersLatLong";
// import {
//   MAP_ANIMATION_TICK,
//   MAP_ANIMATION_END
// } from "../../actions";

@connect((state) => {
  return {
    datasetGuid: state.tree.datasetGuid,
    controls: state.controls,
    nodes: state.tree.nodes,
    visibility: state.tree.visibility,
    visibilityVersion: state.tree.visibilityVersion,
    metadata: state.metadata.metadata,
    browserDimensions: state.browserDimensions.browserDimensions,
    colorScale: state.controls.colorScale,
    colorBy: state.controls.colorBy,
    map: state.map,
    geoResolution: state.controls.geoResolution,
    sequences: state.sequences
  };
})
class Map extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      map: null,
      demes: false,
      latLongs: null,
      d3DOMNode: null,
      d3elems: null,
      datasetGuid: null,
      responsive: null,
    };
  }
  static propTypes = {
    colorScale: React.PropTypes.object.isRequired
  }
  componentWillMount() {
    if (!window.L) {
      setupLeaflet(); /* this sets up window.L */
    }
  }
  componentDidMount() {
    /*
      this attaches several properties to window.L
      it's a bit of a hack, but it's a code execution order problem and it works fine.
    */
    setupLeafletPlugins();
  }
  componentWillReceiveProps(nextProps) {
    this.maybeComputeResponive(nextProps);
  }
  componentDidUpdate(prevProps, prevState) {
    this.maybeCreateLeafletMap(); /* puts leaflet in the DOM, only done once */
    this.maybeSetupD3DOMNode(); /* attaches the D3 SVG DOM node to the Leaflet DOM node, only done once */
    this.maybeDrawDemesAndTransmissions(prevProps); /* it's the first time, or they were just removed because we changed dataset or colorby or resolution */
    this.maybeUpdateDemesAndTransmissions(); /* every time we change something like colorBy */
    this.maybeAnimateDemesAndTransmissions();
  }
  maybeCreateLeafletMap() {
    /* first time map, this sets up leaflet */
    if (
      this.props.browserDimensions &&
      this.props.metadata &&
      !this.state.map &&
      document.getElementById("map")
    ) {
      this.createMap();
    }
  }
  maybeComputeResponive(nextProps) {
    /*
      React to browser width/height changes responsively
      This is stored in state because it's used by both the map and the d3 overlay
    */
    if (
      this.props.browserDimensions &&
      (this.props.browserDimensions.width !== nextProps.browserDimensions.width ||
      this.props.browserDimensions.height !== nextProps.browserDimensions.height)
    ) {
      this.setState({responsive: this.doComputeResponsive(nextProps)});
    } else if (!this.state.responsive && nextProps.browserDimensions) { /* first time */
      this.setState({responsive: this.doComputeResponsive(nextProps)});
    } else if (
      this.props.browserDimensions &&
      this.props.datasetGuid &&
      nextProps.datasetGuid &&
      this.props.datasetGuid !== nextProps.datasetGuid // the dataset has changed
    ) {
      this.setState({responsive: this.doComputeResponsive(nextProps)});
    } else if (this.props.sidebar !== nextProps.sidebar) {
      this.setState({responsive: this.doComputeResponsive(nextProps)});
    }
  }
  doComputeResponsive(nextProps) {
    return computeResponsive({
      horizontal: nextProps.browserDimensions.width > globals.twoColumnBreakpoint ? .5 : 1,
      vertical: 1.0, /* if we are in single column, full height */
      browserDimensions: nextProps.browserDimensions,
      sidebar: nextProps.sidebar,
      minHeight: 480,
      maxAspectRatio: 1.0,
    })
  }
  maybeSetupD3DOMNode() {
    if (
      this.state.map &&
      this.state.responsive &&
      !this.state.d3DOMNode
    ) {
      const d3DOMNode = d3.select("#map svg");
      this.setState({d3DOMNode});
    }
  }
  maybeDrawDemesAndTransmissions(prevProps) {

    /* before April 2017 we fired this every time */

    const mapIsDrawn = !!this.state.map;
    const allDataPresent = !!(this.props.colorScale && this.props.metadata && this.props.nodes && this.state.responsive && this.state.d3DOMNode);
    const demesAbsent = !this.state.demes;

    /* if at any point we change dataset and app doesn't remount, we'll need these again */
    // const newColorScale = this.props.colorScale.version !== prevProps.colorScale.version;
    // const newGeoResolution = this.props.geoResolution !== prevProps.geoResolution;
    // const initialVisibilityVersion = this.props.visibilityVersion === 1; /* see tree reducer, we set this to 1 after tree comes back */
    // const newVisibilityVersion = this.props.visibilityVersion !== prevProps.visibilityVersion;

    if (
      mapIsDrawn &&
      allDataPresent &&
      demesAbsent
    ) {
      /* data structures to feed to d3 latLongs = { tips: [{}, {}], transmissions: [{}, {}] } */
      if (!this.state.boundsSet){ //we are doing the initial render -> set map to the range of the data
        const SWNE = this.getGeoRange();
        this.state.map.fitBounds(L.latLngBounds(SWNE[0], SWNE[1]));
      }

      const latLongs = this.latLongs(); /* no reference stored, we recompute this for now rather than updating in place */
      const d3elems = drawDemesAndTransmissions(
        latLongs,
        this.props.colorScale.scale,
        this.state.d3DOMNode,
        this.state.map,
      );

      /* Set up leaflet events */
      // this.state.map.on("viewreset", this.respondToLeafletEvent.bind(this));
      this.state.map.on("moveend", this.respondToLeafletEvent.bind(this));

      // don't redraw on every rerender - need to seperately handle virus change redraw
      this.setState({
        boundsSet: true,
        demes: true,
        d3elems,
        latLongs,
      });
    }
  }
  respondToLeafletEvent(leafletEvent) {
    if (leafletEvent.type === "moveend") { /* zooming and panning */
      updateOnMoveEnd(this.state.d3elems, this.latLongs());
    }
  }
  getGeoRange() {
    const latitudes = [];
    const longitudes = [];
    for (let k in this.props.metadata.geo){
      for (let c in this.props.metadata.geo[k]){
        latitudes.push(this.props.metadata.geo[k][c].latitude);
        longitudes.push(this.props.metadata.geo[k][c].longitude);
      }
    }
    const maxLat = d3.max(latitudes);
    const minLat = d3.min(latitudes);
    const maxLng = d3.max(longitudes);
    const minLng = d3.min(longitudes);
    const lngRange = (maxLng - minLng)%360;
    const latRange = (maxLat - minLat);
    const south = Math.max(-80, minLat - latRange*0.2);
    const north = Math.min(80, maxLat + latRange*0.2);
    const east = Math.max(-180, minLng - lngRange*0.2);
    const west = Math.min(180, maxLng + lngRange*0.2);
    return [L.latLng(south,west), L.latLng(north, east)];
  }
  maybeUpdateDemesAndTransmissions() {
    /* todo */
  }
  maybeAnimateDemesAndTransmissions() {
    /* todo */
  }
  latLongs() {
    return getLatLongs(
      this.props.nodes,
      this.props.visibility,
      this.props.metadata,
      this.state.map,
      this.props.colorBy,
      this.props.geoResolution,
      this.props.colorScale,
      this.props.sequences
    );
  }
  createMap() {

    /******************************************
    * GET LEAFLET IN THE DOM
    *****************************************/
    // console.log("createMap", this.props.nodes);
    const southWest = L.latLng(-70, -180);
    const northEast = L.latLng(80, 180);
    // console.log(southWest, northEast);
    const bounds = L.latLngBounds(southWest, northEast);
    let zoom = 2;
    let center = [0,0];

    /*
      hardcode zoom level. this will last a while.
      when we want to dynamically calculate the bounds,
      map will have to know about the path latlongs calculated in maphelpers.
      not at all sure how we'll do that and account for great circle paths.

      if we do this, it has to be done procedurally from reset to handle dataset switch
    */
    // if (window.location.pathname.indexOf("ebola") !== -1) {
    //   zoom = 7;
    //   center = [8, -11];
    // } else if (window.location.pathname.indexOf("zika") !== -1) {
    //   /* zika is fine at the default settings */
    // }

    var map = L.map('map', {
      center: center,
      zoom: zoom,
      scrollWheelZoom: false,
      maxBounds: bounds,
      minZoom: 2,
      maxZoom: 8,
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

    map.getRenderer(map).options.padding = 2;

    L.tileLayer('https://api.mapbox.com/styles/v1/trvrb/ciu03v244002o2in5hlm3q6w2/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoidHJ2cmIiLCJhIjoiY2l1MDRoMzg5MDEwbjJvcXBpNnUxMXdwbCJ9.PMqX7vgORuXLXxtI3wISjw', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
        // noWrap: true
    }).addTo(map);

    L.control.zoom({position: "bottomright"}).addTo(map);

    this.setState({map});
  }
  maybeCreateMapDiv() {
    let container = null;
    if (
      this.props.browserDimensions &&
      this.state.responsive
    ) {
      container = (
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
          onClick={this.handleAnimationPlayClicked.bind(this) }
            >
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
    return container;
  }
  handleAnimationPlayClicked() {
    /******************************************
    * ANIMATE MAP (AND THAT LINE ON TREE)
    *****************************************/

    this.animateMap();
  }
  animateMap() {
    const timeSliderWindow = 1; /* in months for now  */
    const incrementBy = 5; /* in days for now */
    const incrementByUnit = "day";
    const tick = 100;
    const trailing = true;
    /* initial time window */
    let first = moment(this.props.controls.absoluteDateMin, "YYYY-MM-DD");
    let second = moment(this.props.controls.absoluteDateMin, "YYYY-MM-DD").add(timeSliderWindow, "months");
    let last = moment(this.props.controls.absoluteDateMax, "YYYY-MM-DD");

    const animationLoop = setInterval(() => {
      /* first pass sets the timer to absolute min and absolute min + 6 months because they reference above initial time window */
      this.props.dispatch(changeDateFilter(first.format("YYYY-MM-DD"), second.format("YYYY-MM-DD")));
      if (trailing) {
        first = first.add(incrementBy, incrementByUnit);
      }
      second = second.add(incrementBy, incrementByUnit);

      if (second.valueOf() >= last.valueOf()) {
        clearInterval(animationLoop)
        this.props.dispatch(changeDateFilter(first.format("YYYY-MM-DD"), second.format("YYYY-MM-DD")));
      }
    }, tick);

    // controls: state.controls,
    // this.props.dateMin //"2013-06-28"
    // this.props.dateMax //"2016-11-21"
    // this.props.absoluteDateMin //"2013-06-29"
    // this.props.absoluteDateMax //"2016-11-21"
    // export const CHANGE_DATE_MIN = "CHANGE_DATE_MIN";
    // export const CHANGE_DATE_MAX = "CHANGE_DATE_MAX";
    // export const CHANGE_ABSOLUTE_DATE_MIN = "CHANGE_ABSOLUTE_DATE_MIN";
    // export const CHANGE_ABSOLUTE_DATE_MAX = "CHANGE_ABSOLUTE_DATE_MAX";

    // =======OLD RAF CODE=======
    // let start = null;
    //
    // const step = (timestamp) => {
    //   if (!start) start = timestamp;
    //
    //   let progress = timestamp - start;
    //
    //   this.props.dispatch({
    //     type: MAP_ANIMATION_TICK,
    //     data: {
    //       progress
    //     }
    //   })
    //
    //   if (progress < globals.mapAnimationDurationInMilliseconds) {
    //     window.requestAnimationFrame(step);
    //   } else {
    //     this.props.dispatch({ type: MAP_ANIMATION_END })
    //   }
    // }
    // window.requestAnimationFrame(step);
  }
  render() {
    // clear layers - store all markers in map state https://github.com/Leaflet/Leaflet/issues/3238#issuecomment-77061011
    return (
      <Card center title="Transmissions">
        {this.maybeCreateMapDiv()}
      </Card>
    );
  }
}

export default Map;

// this was called from componentWillReceiveProps
// this.maybeRemoveAllDemesAndTransmissions(nextProps); /* dataset or colorby just changed, this change is upstream of maybeDraw */

// maybeRemoveAllDemesAndTransmissions(nextProps) {
//   /*
//     xx dataset change, remove all demes and transmissions d3 added
//     xx we could also make this smoother: http://bl.ocks.org/alansmithy/e984477a741bc56db5a5
//     THE ABOVE IS NO LONGER TRUE: while App remounts, this is all getting nuked, so it doesn't matter.
//     Here's what we were doing and might do again:
//
//     // this.state.map && // we have a map
//     // this.props.datasetGuid &&
//     // nextProps.datasetGuid &&
//     // this.props.datasetGuid !== nextProps.datasetGuid // and the dataset has changed
//
//     this.state.d3DOMNode.selectAll("*").remove();
//
//     // clear references to the demes and transmissions d3 added
//     this.setState({
//       demes: false,
//       d3elems: null,
//       latLongs: null,
//     })
//   */
// }
