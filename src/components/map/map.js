/*eslint-env browser*/
/*eslint max-len: 0*/
import React from "react";
import d3 from "d3";
import { connect } from "react-redux";
import Card from "../framework/card";

import { numericToCalendar, calendarToNumeric } from "../../util/dateHelpers";
import setupLeaflet from "../../util/leaflet";
import setupLeafletPlugins from "../../util/leaflet-plugins";
import { drawDemesAndTransmissions, updateOnMoveEnd, updateVisibility } from "../../util/mapHelpers";
import { enableAnimationDisplay, animationWindowWidth, animationTick, twoColumnBreakpoint, enableAnimationPerfTesting } from "../../util/globals";
import computeResponsive from "../../util/computeResponsive";
import {getLatLongs} from "../../util/mapHelpersLatLong";
import { modifyURLquery } from "../../util/urlHelpers";
import {
  createDemeAndTransmissionData,
  updateDemeAndTransmissionDataColAndVis,
  updateDemeAndTransmissionDataLatLong
} from "../../util/mapHelpersLatLong";

import { changeDateFilter } from "../../actions/treeProperties";
import {
  CHANGE_ANIMATION_START,
  CHANGE_ANIMATION_TIME,
  CHANGE_ANIMATION_CUMULATIVE,
  MAP_ANIMATION_PLAY_PAUSE_BUTTON
} from "../../actions/types.js";

@connect((state) => {
  return {
    // datasetGuid: state.tree.datasetGuid,
    absoluteDateMin: state.controls.absoluteDateMin,
    absoluteDateMax: state.controls.absoluteDateMax,
    treeVersion: state.tree.version,
    treeLoaded: state.tree.loaded,
    splitTreeAndMap: state.controls.splitTreeAndMap,
    nodes: state.tree.nodes,
    nodeColors: state.tree.nodeColors,
    visibility: state.tree.visibility,
    visibilityVersion: state.tree.visibilityVersion,
    metadata: state.metadata.metadata,
    browserDimensions: state.browserDimensions.browserDimensions,
    colorScaleVersion: state.controls.colorScale.version,
    map: state.map,
    geoResolution: state.controls.geoResolution,
    mapAnimationDurationInMilliseconds: state.controls.mapAnimationDurationInMilliseconds,
    mapAnimationCumulative: state.controls.mapAnimationCumulative,
    mapAnimationPlayPauseButton: state.controls.mapAnimationPlayPauseButton,
    mapTriplicate: state.controls.mapTriplicate,
    dateMin: state.controls.dateMin,
    dateMax: state.controls.dateMax,
    dateScale: state.controls.dateScale,
    dateFormat: state.controls.dateFormat,
  };
})

class Map extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      map: null,
      d3DOMNode: null,
      d3elems: null,
      // datasetGuid: null,
      responsive: null,
      demeData: null,
      transmissionData: null,
      demeIndices: null,
      transmissionIndices: null
    };
  }
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }
  static propTypes = {
    treeVersion: React.PropTypes.number.isRequired,
    treeLoaded: React.PropTypes.bool.isRequired,
    colorScaleVersion: React.PropTypes.number.isRequired
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
    this.maybeRemoveAllDemesAndTransmissions(nextProps); /* geographic resolution just changed (ie., country to division), remove everything. this change is upstream of maybeDraw */
  }
  componentDidUpdate(prevProps, prevState) {
    if (this.props.nodes === null) {return}
    this.maybeCreateLeafletMap(); /* puts leaflet in the DOM, only done once */
    this.maybeSetupD3DOMNode(); /* attaches the D3 SVG DOM node to the Leaflet DOM node, only done once */
    this.maybeDrawDemesAndTransmissions(prevProps); /* it's the first time, or they were just removed because we changed dataset or colorby or resolution */
    this.maybeUpdateDemesAndTransmissions(prevProps); /* every time we change something like colorBy */
  }
  maybeCreateLeafletMap() {
    /* first time map, this sets up leaflet */
    if (
      // this.props.browserDimensions && // no longer needed - in redux from the start
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
    const changes = {
      dimensionsChanged: this.props.browserDimensions.width !== nextProps.browserDimensions.width || this.props.browserDimensions.height !== nextProps.browserDimensions.height,
      responsiveNotSet: !this.state.responsive,
      treeChanged: this.props.treeVersion !== nextProps.treeVersion, // treeVersion change implies tree is ready (modified by the same action)
      sidebarChanged: this.props.sidebar !== nextProps.sidebar
    };
    // Object.values would be the obvious thing to do here
    // but not supported in many browsers including iOS Safari
    let somethingChanged = false;
    for (var property in changes) {
      if (changes.hasOwnProperty(property)) {
        if (changes[property] === true) {
          somethingChanged = true;
        }
      }
    }
    if (somethingChanged) {
      this.setState({responsive: this.doComputeResponsive(nextProps)});
    }
    // if (
    //   this.props.browserDimensions &&
    //   (this.props.browserDimensions.width !== nextProps.browserDimensions.width ||
    //   this.props.browserDimensions.height !== nextProps.browserDimensions.height)
    // ) {
    //   this.setState({responsive: this.doComputeResponsive(nextProps)});
    // } else if (!this.state.responsive && nextProps.browserDimensions) { /* first time */
    //   this.setState({responsive: this.doComputeResponsive(nextProps)});
    // } else if (
    //   this.props.browserDimensions &&
    //   this.props.datasetGuid &&
    //   nextProps.datasetGuid &&
    //   this.props.datasetGuid !== nextProps.datasetGuid // the dataset has changed
    // ) {
    //   this.setState({responsive: this.doComputeResponsive(nextProps)});
    // } else if (this.props.sidebar !== nextProps.sidebar) {
    //   this.setState({responsive: this.doComputeResponsive(nextProps)});
    // }
  }
  doComputeResponsive(nextProps) {
    return computeResponsive({
      horizontal: nextProps.browserDimensions.width > twoColumnBreakpoint && (this.props.splitTreeAndMap) ? .5 : 1,
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

    const mapIsDrawn = !!this.state.map;
    const allDataPresent = !!(this.props.metadata && this.props.treeLoaded && this.state.responsive && this.state.d3DOMNode);
    const demesTransmissionsComputed = !this.state.demeData && !this.state.transmissionData;

    /* if at any point we change dataset and app doesn't remount, we'll need these again */
    // const newColorScale = this.props.colorScale.version !== prevProps.colorScale.version;
    // const newGeoResolution = this.props.geoResolution !== prevProps.geoResolution;
    // const initialVisibilityVersion = this.props.visibilityVersion === 1; /* see tree reducer, we set this to 1 after tree comes back */
    // const newVisibilityVersion = this.props.visibilityVersion !== prevProps.visibilityVersion;

    if (
      // determining when the tree is ready needs to be improved
      // this.props.datasetGuid &&
      mapIsDrawn &&
      allDataPresent &&
      demesTransmissionsComputed
    ) {
      /* data structures to feed to d3 latLongs = { tips: [{}, {}], transmissions: [{}, {}] } */
      if (!this.state.boundsSet){ //we are doing the initial render -> set map to the range of the data
        const SWNE = this.getGeoRange();
        this.state.map.fitBounds(L.latLngBounds(SWNE[0], SWNE[1]));
      }

      this.state.map.setMaxBounds(this.getBounds())

      const {
        demeData,
        transmissionData,
        demeIndices,
        transmissionIndices,
        minTransmissionDate
      } = createDemeAndTransmissionData(
        this.props.nodes,
        this.props.visibility,
        this.props.geoResolution,
        this.props.nodeColors,
        this.props.mapTriplicate,
        this.props.metadata,
        this.state.map
      );

      // const latLongs = this.latLongs(demeData, transmissionData); /* no reference stored, we recompute this for now rather than updating in place */
      const d3elems = drawDemesAndTransmissions(
        demeData,
        transmissionData,
        this.state.d3DOMNode,
        this.state.map,
        this.props.nodes,
        calendarToNumeric(this.props.dateFormat, this.props.dateScale, this.props.dateMin),
        calendarToNumeric(this.props.dateFormat, this.props.dateScale, this.props.dateMax),
        minTransmissionDate
      );

      /* Set up leaflet events */
      // this.state.map.on("viewreset", this.respondToLeafletEvent.bind(this));
      this.state.map.on("moveend", this.respondToLeafletEvent.bind(this));

      // don't redraw on every rerender - need to seperately handle virus change redraw
      this.setState({
        boundsSet: true,
        d3elems,
        demeData,
        transmissionData,
        demeIndices,
        transmissionIndices
      });
    }
  }
  maybeRemoveAllDemesAndTransmissions(nextProps) {
    /* as of jul 7 2017, the constructor / componentDidMount is NOT running
    on dataset change! */

    /*
      xx dataset change or resolution change, remove all demes and transmissions d3 added
      xx we could also make this smoother: http://bl.ocks.org/alansmithy/e984477a741bc56db5a5
      THE ABOVE IS NO LONGER TRUE: while App remounts, this is all getting nuked, so it doesn't matter.
      Here's what we were doing and might do again:

      // this.state.map && // we have a map
      // this.props.datasetGuid &&
      // nextProps.datasetGuid &&
      // this.props.datasetGuid !== nextProps.datasetGuid // and the dataset has changed
    */

    const mapIsDrawn = !!this.state.map;
    const geoResolutionChanged = this.props.geoResolution !== nextProps.geoResolution;
    const dataChanged = (!nextProps.treeLoaded || this.props.treeVersion !== nextProps.treeVersion);

    // (this.props.colorBy !== nextProps.colorBy ||
    //   this.props.visibilityVersion !== nextProps.visibilityVersion ||
    //   this.props.colorScale.version !== nextProps.colorScale.version);

    if (mapIsDrawn && (geoResolutionChanged || dataChanged)) {
      this.state.d3DOMNode.selectAll("*").remove();

      /* clear references to the demes and transmissions d3 added */
      this.setState({
        boundsSet: false,
        d3elems: null,
        demeData: null,
        transmissionData: null,
        demeIndices: null,
        transmissionIndices: null
      })
    }
  }
  respondToLeafletEvent(leafletEvent) {
    if (leafletEvent.type === "moveend") { /* zooming and panning */

      updateDemeAndTransmissionDataLatLong(
        this.state.demeData,
        this.state.transmissionData,
        this.state.map);

      updateOnMoveEnd(
        this.state.demeData,
        this.state.transmissionData,
        this.state.minTransmissionDate,
        this.state.d3elems,
        calendarToNumeric(this.props.dateFormat, this.props.dateScale, this.props.dateMin),
        calendarToNumeric(this.props.dateFormat, this.props.dateScale, this.props.dateMax),
        this.props.nodes
      );
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
  maybeUpdateDemesAndTransmissions(prevProps) {
    /* nothing to update */
    const noMap = !this.state.map;
    if (noMap || !this.props.treeLoaded) { return; }

    if (
      this.props.visibilityVersion !== prevProps.visibilityVersion ||
      this.props.colorScaleVersion !== prevProps.colorScaleVersion
    ) {
      updateDemeAndTransmissionDataColAndVis(
        this.state.demeData,
        this.state.transmissionData,
        this.state.demeIndices,
        this.state.transmissionIndices,
        this.props.nodes,
        this.props.visibility,
        this.props.geoResolution,
        this.props.nodeColors);
      updateVisibility(
        this.state.demeData,
        this.state.transmissionData,
        this.state.d3elems,
        this.state.map,
        this.props.nodes,
        calendarToNumeric(this.props.dateFormat, this.props.dateScale, this.props.dateMin),
        calendarToNumeric(this.props.dateFormat, this.props.dateScale, this.props.dateMax),
        this.state.minTransmissionDate
      );
    }

  }

  getBounds() {
    let southWest;
    let northEast;

    /* initial map bounds */
    if (this.props.mapTriplicate === true) {
      southWest = L.latLng(-70, -360);
      northEast = L.latLng(80, 360);
    } else {
      southWest = L.latLng(-70, -180);
      northEast = L.latLng(80, 180);
    }

    const bounds = L.latLngBounds(southWest, northEast);

    return bounds;
  }
  createMap() {

    let zoom = 2;
    let center = [0,0];

    /******************************************
    * GET LEAFLET IN THE DOM
    *****************************************/

    var map = L.map('map', {
      center: center,
      zoom: zoom,
      scrollWheelZoom: false,
      maxBounds: this.getBounds(),
      minZoom: 2,
      maxZoom: 10,
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

  animationButtons() {
    if (!enableAnimationDisplay) {
        return null;
    } else {
      return (
        <div>
        <button style={{
            position: "absolute",
            left: 25,
            top: 25,
            zIndex: 9999,
            border: "none",
            width: 56,
            padding: 15,
            borderRadius: 4,
            backgroundColor: "rgb(124, 184, 121)",
            fontWeight: 700,
            color: "white",
          }}
          onClick={this.handleAnimationPlayPauseClicked.bind(this) }
          >
          {this.props.mapAnimationPlayPauseButton}
        </button>
        <button style={{
            position: "absolute",
            left: 90,
            top: 25,
            zIndex: 9999,
            border: "none",
            padding: 15,
            borderRadius: 4,
            backgroundColor: "rgb(230, 230, 230)",
            fontWeight: 700,
            color: "white"
          }}
          onClick={this.handleAnimationResetClicked.bind(this) }
          >
          Reset
        </button>
        </div>
      )
    }
  }

  maybeCreateMapDiv() {
    let container = null;
    if (
      this.props.browserDimensions &&
      this.state.responsive
    ) {
      container = (
        <div style={{position: "relative"}}>
          {this.animationButtons()}
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
  handleAnimationPlayPauseClicked() {
    /******************************************
    * ANIMATE MAP (AND THAT LINE ON TREE)
    *****************************************/
    if (this.props.mapAnimationPlayPauseButton === "Play") {
      this.props.dispatch({
        type: MAP_ANIMATION_PLAY_PAUSE_BUTTON,
        data: "Pause"
      });
      this.animateMap();
    } else {
      if (enableAnimationPerfTesting) {window.Perf.resetCount();}
      clearInterval(window.NEXTSTRAIN.mapAnimationLoop)
      window.NEXTSTRAIN.mapAnimationLoop = null;
      this.props.dispatch({
        type: MAP_ANIMATION_PLAY_PAUSE_BUTTON,
        data: "Play"
      });
      modifyURLquery(this.context.router, {dmin: this.props.dateMin, dmax: this.props.dateMax});
    }
  }

  resetAnimation() {
    clearInterval(window.NEXTSTRAIN.mapAnimationLoop);
    window.NEXTSTRAIN.mapAnimationLoop = null;
    this.props.dispatch(changeDateFilter({newMin: this.props.absoluteDateMin, newMax: this.props.absoluteDateMax, quickdraw: false}));
    this.props.dispatch({
      type: MAP_ANIMATION_PLAY_PAUSE_BUTTON,
      data: "Play"
    });
    modifyURLquery(this.context.router, {dmin: false, dmax: false});
  }

  handleAnimationResetClicked() {
    this.resetAnimation();
  }
  animateMap() {
    /* By default, start at absoluteDateMin; allow overriding via augur default export */

    // dates are num date format
    // leftWindow --- rightWindow ------------------------------- end
    // 2011.4 ------- 2011.6 ------------------------------------ 2015.4

    let start = calendarToNumeric(this.props.dateFormat, this.props.dateScale, this.props.absoluteDateMin);
    let leftWindow = calendarToNumeric(this.props.dateFormat, this.props.dateScale, this.props.dateMin);
    let end = calendarToNumeric(this.props.dateFormat, this.props.dateScale, this.props.absoluteDateMax);
    let totalRange = end - start; // years in the animation

    let animationIncrement = (animationTick * totalRange) / this.props.mapAnimationDurationInMilliseconds; // [(ms * years) / ms] = years eg 100 ms * 5 years / 30,000 ms =  0.01666666667 years
    const windowRange = animationWindowWidth * totalRange;
    let rightWindow = leftWindow + windowRange;

    if (!window.NEXTSTRAIN) {
      window.NEXTSTRAIN = {}; /* centralize creation of this if we need it anywhere else */
    }

    /* we should setState({reference}) so that it's not possible to create multiple */

    window.NEXTSTRAIN.mapAnimationLoop = setInterval(() => {
      if (enableAnimationPerfTesting) {window.Perf.bump();}
      const newWindow = {min: numericToCalendar(this.props.dateFormat, this.props.dateScale, leftWindow),
        max: numericToCalendar(this.props.dateFormat, this.props.dateScale, rightWindow)};

      /* first pass sets the timer to absolute min and absolute min + windowRange because they reference above initial time window */
      this.props.dispatch(changeDateFilter({newMin: newWindow.min, newMax: newWindow.max, quickdraw: true}));
      // don't modifyURLquery

      if (!this.props.mapAnimationCumulative) {
        leftWindow = leftWindow + animationIncrement;
      }
      rightWindow = rightWindow + animationIncrement;

      if (rightWindow >= end) {
        clearInterval(window.NEXTSTRAIN.mapAnimationLoop)
        window.NEXTSTRAIN.mapAnimationLoop = null;
        this.props.dispatch(changeDateFilter({newMin: this.props.absoluteDateMin, newMax: this.props.absoluteDateMax, quickdraw: false}));
        this.props.dispatch({
          type: MAP_ANIMATION_PLAY_PAUSE_BUTTON,
          data: "Play"
        });
        modifyURLquery(this.context.router, {dmin: false, dmax: false});
      }
    }, animationTick);

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
