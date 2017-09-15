import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import leaflet from "leaflet";
import _min from "lodash/min";
import _max from "lodash/max";
import { select } from "d3-selection";
import leafletImage from "leaflet-image";
import Card from "../framework/card";
import { numericToCalendar, calendarToNumeric } from "../../util/dateHelpers";
import { drawDemesAndTransmissions, updateOnMoveEnd, updateVisibility } from "./mapHelpers";
import { enableAnimationDisplay, animationWindowWidth, animationTick, twoColumnBreakpoint, enableAnimationPerfTesting } from "../../util/globals";
import computeResponsive from "../../util/computeResponsive";
import { modifyURLquery } from "../../util/urlHelpers";
import {
  createDemeAndTransmissionData,
  updateDemeAndTransmissionDataColAndVis,
  updateDemeAndTransmissionDataLatLong
} from "./mapHelpersLatLong";
import { changeDateFilter } from "../../actions/treeProperties";
import { MAP_ANIMATION_PLAY_PAUSE_BUTTON } from "../../actions/types";
import { incommingMapPNG } from "../download/helperFunctions";

/* global L */
// L is global in scope and placed by leaflet()

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
    panelLayout: state.controls.panelLayout,
  };
})

class Map extends React.Component {

  static contextTypes = {
    router: PropTypes.object.isRequired
  }
  static propTypes = {
    treeVersion: PropTypes.number.isRequired,
    treeLoaded: PropTypes.bool.isRequired,
    colorScaleVersion: PropTypes.number.isRequired
  }
  constructor(props) {
    super(props);
    this.state = {
      map: null,
      d3DOMNode: null,
      d3elems: null,
      responsive: null,
      demeData: null,
      transmissionData: null,
      demeIndices: null,
      transmissionIndices: null
    };
  }

  componentWillMount() {
    if (!window.L) {
      leaflet(); /* this sets up window.L */
      /* add a print method to leaflet. some relevent links:
      https://github.com/mapbox/leaflet-image
      https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
      https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL
      */
      window.L.save = (data) => {
        leafletImage(this.state.map, (err, canvas) => {
          canvas.toBlob((blob) => {
            const reader = new FileReader();
            reader.addEventListener('loadend', (e) => {
              incommingMapPNG(Object.assign({}, data, {
                base64map: e.srcElement.result,
                mapDimensions: this.state.map.getSize()
              }));
            });
            reader.readAsDataURL(blob);
          }, "image/png;base64;", 1);
        });
      };
    }
  }
  // componentDidMount() {
  // }
  componentWillReceiveProps(nextProps) {
    /* this is the place we update state in response to new props */
    this.maybeComputeResponsive(nextProps);
    this.maybeRemoveAllDemesAndTransmissions(nextProps); /* geographic resolution just changed (ie., country to division), remove everything. this change is upstream of maybeDraw */
    this.maybeUpdateDemesAndTransmissions(nextProps); /* every time we change something like colorBy */
    this.maybeInvalidateMapSize(nextProps);
  }
  componentDidUpdate(prevProps) {
    if (this.props.nodes === null) { return; }
    this.maybeCreateLeafletMap(); /* puts leaflet in the DOM, only done once */
    this.maybeSetupD3DOMNode(); /* attaches the D3 SVG DOM node to the Leaflet DOM node, only done once */
    this.maybeDrawDemesAndTransmissions(prevProps); /* it's the first time, or they were just removed because we changed dataset or colorby or resolution */
  }
  maybeInvalidateMapSize(nextProps) {
    /* when we procedurally change the size of the card, for instance, when we swap from thirds to full */
    if (
      this.state.map &&
      (
        this.props.sidebar !== nextProps.sidebar ||
        this.props.panelLayout !== nextProps.panelLayout
      )
    ) {
      window.setTimeout(this.invalidateMapSize.bind(this), 1500);
    }
  }
  invalidateMapSize() {
    this.state.map.invalidateSize()
  }
  maybeCreateLeafletMap() {
    /* first time map, this sets up leaflet */
    if (
      this.props.metadata &&
      !this.state.map &&
      document.getElementById("map")
    ) {
      this.createMap();
    }
  }
  maybeComputeResponsive(nextProps) {
    /*
      React to browser width/height changes responsively
      This is stored in state because it's used by both the map and the d3 overlay
    */
    const changes = {
      dimensionsChanged: this.props.browserDimensions.width !== nextProps.browserDimensions.width || this.props.browserDimensions.height !== nextProps.browserDimensions.height,
      responsiveNotSet: !this.state.responsive,
      treeChanged: this.props.treeVersion !== nextProps.treeVersion, // treeVersion change implies tree is ready (modified by the same action)
      sidebarChanged: this.props.sidebar !== nextProps.sidebar,
      panelLayout: this.props.panelLayout !== nextProps.panelLayout,
    };

    // Object.values would be the obvious thing to do here
    // but not supported in many browsers including iOS Safari
    const values = Object.keys(changes).map((key) => {
      return changes[key];
    });

    if (values.some(v => v === true)) {
      this.setState({responsive: this.doComputeResponsive(nextProps)});
    }

  }
  doComputeResponsive(nextProps) {

    const widescreen = nextProps.browserDimensions.width > twoColumnBreakpoint && (this.props.splitTreeAndMap);
    const thirds = nextProps.panelLayout === "thirds"; /* add a check here for min browser width tbd */

    return computeResponsive({
      horizontal: widescreen || thirds ? .5 : 1,
      /* before we added the ability to split manually, we would split automatically on a breakpoint: */
      // horizontal: nextProps.browserDimensions.width > twoColumnBreakpoint && (this.props.splitTreeAndMap) ? 0.5 : 1,
      browserDimensions: nextProps.browserDimensions,
      vertical: thirds ? 0.85 : 1.0, /* if we are in single column, full height */
      sidebar: nextProps.sidebar,
      maxAspectRatio: 1.2,
    });
  }
  maybeSetupD3DOMNode() {
    if (
      this.state.map &&
      this.state.responsive &&
      !this.state.d3DOMNode
    ) {
      const d3DOMNode = select("#map svg").attr("id", "d3DemesTransmissions");
      this.setState({d3DOMNode});
    }
  }

  maybeDrawDemesAndTransmissions() {
    const mapIsDrawn = !!this.state.map;
    const allDataPresent = !!(this.props.metadata && this.props.treeLoaded && this.state.responsive && this.state.d3DOMNode);
    const demesTransmissionsNotComputed = !this.state.demeData && !this.state.transmissionData;
    /* if at any point we change dataset and app doesn't remount, we'll need these again */
    // const newColorScale = this.props.colorScale.version !== prevProps.colorScale.version;
    // const newGeoResolution = this.props.geoResolution !== prevProps.geoResolution;
    // const initialVisibilityVersion = this.props.visibilityVersion === 1; /* see tree reducer, we set this to 1 after tree comes back */
    // const newVisibilityVersion = this.props.visibilityVersion !== prevProps.visibilityVersion;

    if (mapIsDrawn && allDataPresent && demesTransmissionsNotComputed) {
      /* data structures to feed to d3 latLongs = { tips: [{}, {}], transmissions: [{}, {}] } */
      if (!this.state.boundsSet) { // we are doing the initial render -> set map to the range of the data
        const SWNE = this.getGeoRange();
        // L. available because leaflet() was called in componentWillMount
        this.state.map.fitBounds(L.latLngBounds(SWNE[0], SWNE[1])); // eslint-disable-line no-undef
      }

      this.state.map.setMaxBounds(this.getBounds());

      const {
        demeData,
        transmissionData,
        demeIndices,
        transmissionIndices
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
        calendarToNumeric(this.props.dateMin),
        calendarToNumeric(this.props.dateMax)
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
      });
    }
  }
  respondToLeafletEvent(leafletEvent) {
    if (leafletEvent.type === "moveend") { /* zooming and panning */

      const {
        newDemes,
        newTransmissions
      } = updateDemeAndTransmissionDataLatLong(
        this.state.demeData,
        this.state.transmissionData,
        this.state.map
      );

      updateOnMoveEnd(
        newDemes,
        newTransmissions,
        this.state.d3elems,
        calendarToNumeric(this.props.dateMin),
        calendarToNumeric(this.props.dateMax)
      );


    }
  }
  getGeoRange() {
    const latitudes = [];
    const longitudes = [];

    Object.keys(this.props.metadata.geo).forEach((geoLevel) => {
      Object.keys(this.props.metadata.geo[geoLevel]).forEach((geoEntry) => {
        latitudes.push(this.props.metadata.geo[geoLevel][geoEntry].latitude);
        longitudes.push(this.props.metadata.geo[geoLevel][geoEntry].longitude);
      });
    });

    const maxLat = _max(latitudes);
    const minLat = _min(latitudes);
    const maxLng = _max(longitudes);
    const minLng = _min(longitudes);
    const lngRange = (maxLng - minLng) % 360;
    const latRange = (maxLat - minLat);
    const south = _max([-80, minLat - (0.2 * latRange)]);
    const north = _min([80, maxLat + (0.2 * latRange)]);
    const east = _max([-180, minLng - (0.2 * lngRange)]);
    const west = _min([180, maxLng + (0.2 * lngRange)]);
    return [L.latLng(south, west), L.latLng(north, east)];
  }
  /**
   * updates demes & transmissions when redux (tree) visibility or colorScale (i.e. colorBy) has changed
   * returns early if the map or tree isn't ready
   * uses deme & transmission indicies for smart (quick) updating
   */
  maybeUpdateDemesAndTransmissions(nextProps) {
    if (!this.state.map || !this.props.treeLoaded) { return; }
    const colorOrVisibilityChange = nextProps.visibilityVersion !== this.props.visibilityVersion || nextProps.colorScaleVersion !== this.props.colorScaleVersion;
    const haveData = nextProps.nodes && nextProps.visibility && nextProps.geoResolution && nextProps.nodeColors;

    if (
      colorOrVisibilityChange &&
      haveData
    ) {
      const { newDemes, newTransmissions } = updateDemeAndTransmissionDataColAndVis(
        this.state.demeData,
        this.state.transmissionData,
        this.state.demeIndices,
        this.state.transmissionIndices,
        nextProps.nodes,
        nextProps.visibility,
        nextProps.geoResolution,
        nextProps.nodeColors
      );

      updateVisibility(
        /* updated in the function above */
        newDemes,
        newTransmissions,
        /* we already have all this */
        this.state.d3elems,
        this.state.map,
        nextProps.nodes,
        calendarToNumeric(nextProps.dateMin),
        calendarToNumeric(nextProps.dateMax)
      );

      this.setState({
        demeData: newDemes,
        transmissionData: newTransmissions
      });
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

    const zoom = 2;
    const center = [0, 0];

    /* *****************************************
    GET LEAFLET IN THE DOM
    **************************************** */

    const map = L.map('map', {
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
      hoverToWake: false,
      // if mobile, disable single finger dragging
      dragging: !L.Browser.mobile,
      tap: false
    });

    map.getRenderer(map).options.padding = 2;

    L.tileLayer('https://api.mapbox.com/styles/v1/trvrb/ciu03v244002o2in5hlm3q6w2/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoidHJ2cmIiLCJhIjoiY2l1MDRoMzg5MDEwbjJvcXBpNnUxMXdwbCJ9.PMqX7vgORuXLXxtI3wISjw', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.control.zoom({position: "bottomright"}).addTo(map);

    this.setState({map});
  }

  animationButtons() {
    if (enableAnimationDisplay) {
      return (
        <div>
          <button style={{position: "absolute",
            left: 25,
            top: 25,
            zIndex: 9999,
            border: "none",
            width: 56,
            padding: 15,
            borderRadius: 4,
            backgroundColor: "rgb(124, 184, 121)",
            fontWeight: 700,
            color: "white"
          }}
            onClick={this.handleAnimationPlayPauseClicked.bind(this)}
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
            onClick={this.handleAnimationResetClicked.bind(this)}
          >
            Reset
          </button>
        </div>
      );
    }
    return null;
  }

  maybeCreateMapDiv() {
    let container = null;
    if (
      this.props.browserDimensions && /* this can probably be removed */
      this.state.responsive
    ) {
      container = (
        <div style={{position: "relative"}}>
          {this.animationButtons()}
          <div id="map"
            style={{
              height: this.state.responsive.height,
              width: this.state.responsive.width
            }}
          />
        </div>
      );
    }
    return container;
  }
  handleAnimationPlayPauseClicked() {
    /* *****************************************
    ANIMATE MAP (AND THAT LINE ON TREE)
    **************************************** */
    if (this.props.mapAnimationPlayPauseButton === "Play") {
      this.props.dispatch({
        type: MAP_ANIMATION_PLAY_PAUSE_BUTTON,
        data: "Pause"
      });
      this.animateMap();
    } else {
      if (enableAnimationPerfTesting) { window.Perf.resetCount(); }
      clearInterval(window.NEXTSTRAIN.mapAnimationLoop);
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

    const start = calendarToNumeric(this.props.absoluteDateMin);
    let leftWindow = calendarToNumeric(this.props.dateMin);
    const end = calendarToNumeric(this.props.absoluteDateMax);
    const totalRange = end - start; // years in the animation

    const animationIncrement = (animationTick * totalRange) / this.props.mapAnimationDurationInMilliseconds; // [(ms * years) / ms] = years eg 100 ms * 5 years / 30,000 ms =  0.01666666667 years
    const windowRange = animationWindowWidth * totalRange;
    let rightWindow = leftWindow + windowRange;

    if (!window.NEXTSTRAIN) {
      window.NEXTSTRAIN = {}; /* centralize creation of this if we need it anywhere else */
    }

    /* we should setState({reference}) so that it's not possible to create multiple */

    window.NEXTSTRAIN.mapAnimationLoop = setInterval(() => {
      if (enableAnimationPerfTesting) { window.Perf.bump(); }
      const newWindow = {min: numericToCalendar(leftWindow),
        max: numericToCalendar(rightWindow)};

      /* first pass sets the timer to absolute min and absolute min + windowRange because they reference above initial time window */
      this.props.dispatch(changeDateFilter({newMin: newWindow.min, newMax: newWindow.max, quickdraw: true}));
      // don't modifyURLquery

      if (!this.props.mapAnimationCumulative) {
        leftWindow += animationIncrement;
      }
      rightWindow += animationIncrement;

      if (rightWindow >= end) {
        clearInterval(window.NEXTSTRAIN.mapAnimationLoop);
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
