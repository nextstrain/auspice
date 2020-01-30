import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import leaflet from "leaflet";
import _min from "lodash/min";
import _max from "lodash/max";
import { select } from "d3-selection";
import 'd3-transition';
import leafletImage from "leaflet-image";
import Card from "../framework/card";
import { drawDemesAndTransmissions, updateOnMoveEnd, updateVisibility } from "./mapHelpers";
import {
  createDemeAndTransmissionData,
  updateDemeAndTransmissionDataColAndVis,
  updateTransmissionDataLatLong,
  updateDemeDataLatLong
} from "./mapHelpersLatLong";
import { changeDateFilter } from "../../actions/tree";
import { MAP_ANIMATION_PLAY_PAUSE_BUTTON } from "../../actions/types";
// import { incommingMapPNG } from "../download/helperFunctions";
import { timerStart, timerEnd } from "../../util/perf";
import { tabSingle, darkGrey, lightGrey, goColor, pauseColor } from "../../globalStyles";

/* global L */
// L is global in scope and placed by leaflet()
@connect((state) => {
  return {
    // datasetGuid: state.tree.datasetGuid,
    branchLengthsToDisplay: state.controls.branchLengthsToDisplay,
    absoluteDateMin: state.controls.absoluteDateMin,
    absoluteDateMax: state.controls.absoluteDateMax,
    treeVersion: state.tree.version,
    treeLoaded: state.tree.loaded,
    nodes: state.tree.nodes,
    nodeColors: state.tree.nodeColors,
    visibility: state.tree.visibility,
    visibilityVersion: state.tree.visibilityVersion,
    metadata: state.metadata,
    colorScaleVersion: state.controls.colorScale.version,
    map: state.map,
    geoResolution: state.controls.geoResolution,
    animationPlayPauseButton: state.controls.animationPlayPauseButton,
    mapTriplicate: state.controls.mapTriplicate,
    dateMinNumeric: state.controls.dateMinNumeric,
    dateMaxNumeric: state.controls.dateMaxNumeric,
    panelLayout: state.controls.panelLayout,
    colorBy: state.controls.colorScale.colorBy,
    narrativeMode: state.narrative.display,
    pieChart: (
      !state.controls.colorScale.continuous &&                           // continuous color scale = no pie chart
      state.controls.geoResolution !== state.controls.colorScale.colorBy // geo circles match colorby == no pie chart
    ),
    legendValues: state.controls.colorScale.legendValues
  };
})

class Map extends React.Component {
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
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-no-bind.md#es6-classes
    this.playPauseButtonClicked = this.playPauseButtonClicked.bind(this);
    this.resetButtonClicked = this.resetButtonClicked.bind(this);
    this.resetZoomButtonClicked = this.resetZoomButtonClicked.bind(this);
    this.fitMapBoundsToData = this.fitMapBoundsToData.bind(this);
  }

  componentWillMount() {
    if (!window.L) {
      leaflet(); /* this sets up window.L */
    }
    if (!window.L.getMapTiles) {
      /* Get the map tiles
      https://github.com/mapbox/leaflet-image
      https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
      https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL
      */
      window.L.getMapTiles = (loadendCallback, errorCallback) => {
        leafletImage(this.state.map, (err, canvas) => {
          if (err) {
            errorCallback(err);
            return;
          }
          const mapDimensions = this.state.map.getSize();
          const loadendCallbackWrapper = (e) => {
            // loadendCallback is a bound version of writeSVGPossiblyIncludingMapPNG
            loadendCallback({
              base64map: e.srcElement.result,
              mapDimensions,
              panOffsets: this.state.map._getMapPanePos()
            });
          };
          canvas.toBlob((blob) => {
            const reader = new FileReader();
            reader.addEventListener('loadend', loadendCallbackWrapper);
            reader.addEventListener('onerror', errorCallback);
            reader.readAsDataURL(blob);
          }, "image/png;base64;", 1);
        });
      };
    }
  }
  componentDidMount() {
    this.maybeChangeSize(this.props);
    const removed = this.maybeRemoveAllDemesAndTransmissions(this.props); /* geographic resolution just changed (ie., country to division), remove everything. this change is upstream of maybeDraw */
    // TODO: if demes are color blended circles, updating rather than redrawing demes would do
    if (!removed) {
      this.maybeUpdateDemesAndTransmissions(this.props); /* every time we change something like colorBy */
    }
    this.maybeInvalidateMapSize(this.props);
  }
  componentWillReceiveProps(nextProps) {
    this.modulateInterfaceForNarrativeMode(nextProps);
    this.maybeChangeSize(nextProps);
    const removed = this.maybeRemoveAllDemesAndTransmissions(nextProps); /* geographic resolution just changed (ie., country to division), remove everything. this change is upstream of maybeDraw */
    // TODO: if demes are color blended circles, updating rather than redrawing demes would do
    if (!removed) {
      this.maybeUpdateDemesAndTransmissions(nextProps); /* every time we change something like colorBy */
    }
    this.maybeInvalidateMapSize(nextProps);
  }
  componentDidUpdate(prevProps) {
    if (this.props.nodes === null) { return; }
    this.maybeCreateLeafletMap(); /* puts leaflet in the DOM, only done once */
    this.maybeSetupD3DOMNode(); /* attaches the D3 SVG DOM node to the Leaflet DOM node, only done once */

    /* If we are changing the geo resolution in a narrative, then we want to mimic the RESET ZOOM
    button by resetting the map bounds to fit the data */
    const mapIsDrawn = !!this.state.map;
    if (mapIsDrawn && this.props.narrativeMode && prevProps.geoResolution !== this.props.geoResolution) {
      this.fitMapBoundsToData();
    }
    this.maybeDrawDemesAndTransmissions(prevProps); /* it's the first time, or they were just removed because we changed dataset or colorby or resolution */
  }
  maybeInvalidateMapSize(nextProps) {
    /* when we procedurally change the size of the card, for instance, when we swap from grid to full */
    if (this.state.map && (this.props.width !== nextProps.width || this.props.height !== nextProps.height)) {
      window.setTimeout(this.invalidateMapSize.bind(this), 1500);
    }
  }
  invalidateMapSize() {
    this.state.map.invalidateSize();
  }
  maybeCreateLeafletMap() {
    /* first time map, this sets up leaflet */
    if (this.props.metadata.loaded && !this.state.map && document.getElementById("map")) {
      this.createMap();
    }
  }
  maybeChangeSize(nextProps) {
    if (this.props.width !== nextProps.width ||
      this.props.height !== nextProps.height ||
      !this.state.responsive ||
      this.props.treeVersion !== nextProps.treeVersion // treeVersion change implies tree is ready (modified by the same action)
    ) {
      /* This is stored in state because it's used by both the map and the d3 overlay */
      this.setState({responsive: {width: nextProps.width, height: nextProps.height}});
    }
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
  modulateInterfaceForNarrativeMode(nextProps) {
    if (this.props.narrativeMode === nextProps.narrativeMode || !this.state.map) return;
    if (nextProps.narrativeMode) {
      L.zoomControlButtons.remove();
      this.state.map.dragging.disable();
      this.state.map.doubleClickZoom.disable();
    } else {
      L.zoomControlButtons = L.control.zoom({position: "bottomright"}).addTo(this.state.map);
      this.state.map.dragging.enable();
      this.state.map.doubleClickZoom.enable();
    }
  }

  maybeDrawDemesAndTransmissions() {
    const mapIsDrawn = !!this.state.map;
    const allDataPresent = !!(this.props.metadata.loaded && this.props.treeLoaded && this.state.responsive && this.state.d3DOMNode);
    const demesTransmissionsNotComputed = !this.state.demeData && !this.state.transmissionData;
    /* if at any point we change dataset and app doesn't remount, we'll need these again */
    // const newColorScale = this.props.colorScale.version !== prevProps.colorScale.version;
    // const newGeoResolution = this.props.geoResolution !== prevProps.geoResolution;
    // const initialVisibilityVersion = this.props.visibilityVersion === 1; /* see tree reducer, we set this to 1 after tree comes back */
    // const newVisibilityVersion = this.props.visibilityVersion !== prevProps.visibilityVersion;

    if (mapIsDrawn && allDataPresent && demesTransmissionsNotComputed) {
      timerStart("drawDemesAndTransmissions");
      /* data structures to feed to d3 latLongs = { tips: [{}, {}], transmissions: [{}, {}] } */

      const {demeData, transmissionData, demeIndices, transmissionIndices} = createDemeAndTransmissionData(
        this.props.nodes,
        this.props.visibility,
        this.props.geoResolution,
        this.props.nodeColors,
        this.props.mapTriplicate,
        this.props.metadata,
        this.state.map,
        this.props.pieChart,
        this.props.legendValues,
        this.props.colorBy,
        this.props.dispatch
      );

      // const latLongs = this.latLongs(demeData, transmissionData); /* no reference stored, we recompute this for now rather than updating in place */
      const d3elems = drawDemesAndTransmissions(
        demeData,
        transmissionData,
        this.state.d3DOMNode,
        this.state.map,
        this.props.nodes,
        this.props.dateMinNumeric,
        this.props.dateMaxNumeric,
        this.props.pieChart
      );

      const SWNE = this.getGeoRange(demeIndices, demeData);
      const maybeNewBounds = L.latLngBounds(SWNE[0], SWNE[1]);
      if (!this.state.boundsSet) { // we are doing the initial render -> set map to the range of the data
        // L. available because leaflet() was called in componentWillMount
        this.state.currentBounds = maybeNewBounds;
        this.state.map.fitBounds(maybeNewBounds);
      } else if (!this.state.currentBounds.equals(maybeNewBounds)) {
        // check to see if the new bounds would be different for any reason - if so, change them!
        this.state.currentBounds = maybeNewBounds;
        this.state.map.fitBounds(maybeNewBounds);
      }

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
      timerEnd("drawDemesAndTransmissions");
    }
  }
  /**
   * removing demes & transmissions, both from the react state & from the DOM.
   * They will be created from scratch (& rendered) by `this.maybeDrawDemesAndTransmissions`
   * This is done when
   *    (a) the dataset has changed
   *    (b) the geo resolution has changed (new transmissions, new deme locations)
   *    (c) we change colorBy -- mainly as the `demeData` structure is different both
   *        pie charts vs circles, and also between different pie charts (different num of slices)
   *
   * Note: we do not modify `state.boundsSet` to stop the map resetting position
   */
  maybeRemoveAllDemesAndTransmissions(nextProps) {
    const mapIsDrawn = !!this.state.map;
    const geoResolutionChanged = this.props.geoResolution !== nextProps.geoResolution;
    const dataChanged = (!nextProps.treeLoaded || this.props.treeVersion !== nextProps.treeVersion);
    const colorByChanged = (nextProps.colorScaleVersion !== this.props.colorScaleVersion);
    if (mapIsDrawn && (geoResolutionChanged || dataChanged || colorByChanged)) {
      this.state.d3DOMNode.selectAll("*").remove();
      this.setState({
        d3elems: null,
        demeData: null,
        transmissionData: null,
        demeIndices: null,
        transmissionIndices: null
      });
      return true;
    }
    return false;
  }
  respondToLeafletEvent(leafletEvent) {
    if (leafletEvent.type === "moveend") { /* zooming and panning */

      if (!this.state.demeData || !this.state.transmissionData) return;

      const newDemes = updateDemeDataLatLong(this.state.demeData, this.state.map);
      const newTransmissions = updateTransmissionDataLatLong(this.state.transmissionData, this.state.map);

      updateOnMoveEnd(
        newDemes,
        newTransmissions,
        this.state.d3elems,
        this.props.dateMinNumeric,
        this.props.dateMaxNumeric,
        this.props.pieChart
      );

      this.setState({demeData: newDemes, transmissionData: newTransmissions});
    }
  }
  // Allow to pass in particular demeIndices & demeData for initial render, when these aren't officially set yet
  getGeoRange(demeIndices = this.state.demeIndices, demeData = this.state.demeData) {
    const latitudes = [];
    const longitudes = [];

    // Check the count data - if it has a count of 0, it's not being drawn, so don't include in Geo range!
    this.props.metadata.geoResolutions.forEach((geoData) => {
      if (geoData.key === this.props.geoResolution) {
        const demeToLatLongs = geoData.demes;
        Object.keys(demeToLatLongs).forEach((deme) => {
          if ((!demeIndices && !demeData) || // if we haven't loaded these yet, take all locations
              (demeIndices && demeData[demeIndices[deme]].count !== 0)) { // if have, only those with counts!
            latitudes.push(demeToLatLongs[deme].latitude);
            longitudes.push(demeToLatLongs[deme].longitude);
          }
        });
      }
    });

    const maxLat = _max(latitudes);
    const minLat = _min(latitudes);
    const maxLng = _max(longitudes);
    const minLng = _min(longitudes);
    const lngRange = (maxLng - minLng) % 360;
    const latRange = (maxLat - minLat);
    const south = _max([-55, minLat - (0.1 * latRange)]);
    const north = _min([70, maxLat + (0.1 * latRange)]);
    const east = _max([-180, minLng - (0.1 * lngRange)]);
    const west = _min([180, maxLng + (0.1 * lngRange)]);

    return [L.latLng(south, west), L.latLng(north, east)];
  }
  /**
   * updates demes & transmissions when redux (tree) visibility or colorScale (i.e. colorBy) has changed
   * returns early if the map or tree isn't ready
   * uses deme & transmission indicies for smart (quick) updating
   */
  maybeUpdateDemesAndTransmissions(nextProps) {
    if (!this.state.map || !this.props.treeLoaded || !this.state.d3elems) { return; }
    const visibilityChange = nextProps.visibilityVersion !== this.props.visibilityVersion;
    const haveData = nextProps.nodes && nextProps.visibility && nextProps.geoResolution && nextProps.nodeColors;

    if (!(visibilityChange && haveData)) { return; }

    timerStart("updateDemesAndTransmissions");
    if (this.props.geoResolution !== nextProps.geoResolution) {
      /* This `if` statement added as part of https://github.com/nextstrain/auspice/issues/722
       * and should be a prime candidate for refactoring in https://github.com/nextstrain/auspice/issues/735
       */
      const {demeData, transmissionData, demeIndices, transmissionIndices} = createDemeAndTransmissionData(
        nextProps.nodes,
        nextProps.visibility,
        nextProps.geoResolution,
        nextProps.nodeColors,
        nextProps.mapTriplicate,
        nextProps.metadata,
        this.state.map,
        nextProps.pieChart,
        nextProps.legendValues,
        nextProps.colorBy,
        nextProps.dispatch
      );
      const d3elems = drawDemesAndTransmissions(
        demeData,
        transmissionData,
        this.state.d3DOMNode,
        this.state.map,
        nextProps.nodes,
        nextProps.dateMinNumeric,
        nextProps.dateMaxNumeric,
        nextProps.pieChart
      );
      this.setState({
        d3elems,
        demeData,
        transmissionData,
        demeIndices,
        transmissionIndices
      });
    } else {
      const { newDemes, newTransmissions } = updateDemeAndTransmissionDataColAndVis(
        this.state.demeData,
        this.state.transmissionData,
        this.state.demeIndices,
        this.state.transmissionIndices,
        nextProps.nodes,
        nextProps.visibility,
        nextProps.geoResolution,
        nextProps.nodeColors,
        nextProps.pieChart,
        nextProps.colorBy,
        nextProps.legendValues
      );
      updateVisibility(
        /* updated in the function above */
        newDemes,
        newTransmissions,
        /* we already have all this */
        this.state.d3elems,
        this.state.map,
        nextProps.nodes,
        nextProps.dateMinNumeric,
        nextProps.dateMaxNumeric,
        nextProps.pieChart
      );

      this.setState({
        demeData: newDemes,
        transmissionData: newTransmissions
      });
    }
    timerEnd("updateDemesAndTransmissions");
  }

  getInitialBounds() {
    let southWest;
    let northEast;

    /* initial map bounds */
    if (this.props.mapTriplicate) {
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
      maxBounds: this.getInitialBounds(),
      minZoom: 1,
      maxZoom: 14,
      zoomSnap: 0.5,
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
      // if mobile OR narrative mode, disable single finger dragging
      dragging: (!L.Browser.mobile) && (!this.props.narrativeMode),
      doubleClickZoom: !this.props.narrativeMode,
      tap: false
    });

    map.getRenderer(map).options.padding = 2;

    L.tileLayer('https://api.mapbox.com/styles/v1/trvrb/ciu03v244002o2in5hlm3q6w2/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoidHJ2cmIiLCJhIjoiY2l1MDRoMzg5MDEwbjJvcXBpNnUxMXdwbCJ9.PMqX7vgORuXLXxtI3wISjw', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    if (!this.props.narrativeMode) {
      L.zoomControlButtons = L.control.zoom({position: "bottomright"}).addTo(map);
    }

    this.setState({map});
  }

  animationButtons() {
    if (this.props.narrativeMode) return null;
    const buttonBaseStyle = {
      color: "#FFFFFF",
      fontWeight: 400,
      fontSize: 12,
      borderRadius: 3,
      padding: 12,
      border: "none",
      zIndex: 900,
      position: "absolute",
      textTransform: "uppercase"
    };
    if (this.props.branchLengthsToDisplay !== "divOnly") {
      return (
        <div>
          <button
            style={{...buttonBaseStyle, top: 20, left: 20, width: 60, backgroundColor: this.props.animationPlayPauseButton === "Pause" ? pauseColor : goColor}}
            onClick={this.playPauseButtonClicked}
          >
            {this.props.animationPlayPauseButton}
          </button>
          <button
            style={{...buttonBaseStyle, top: 20, left: 88, width: 60, backgroundColor: lightGrey}}
            onClick={this.resetButtonClicked}
          >
            Reset
          </button>
        </div>
      );
    }
    /* else - divOnly */
    return (<div/>);
  }

  maybeCreateMapDiv() {
    let container = null;
    if (this.state.responsive) {
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
  playPauseButtonClicked() {
    if (this.props.animationPlayPauseButton === "Play") {
      this.props.dispatch({type: MAP_ANIMATION_PLAY_PAUSE_BUTTON, data: "Pause"});
    } else {
      this.props.dispatch({type: MAP_ANIMATION_PLAY_PAUSE_BUTTON, data: "Play"});
    }
  }
  resetButtonClicked() {
    this.props.dispatch({type: MAP_ANIMATION_PLAY_PAUSE_BUTTON, data: "Play"});
    this.props.dispatch(changeDateFilter({newMin: this.props.absoluteDateMin, newMax: this.props.absoluteDateMax, quickdraw: false}));
  }
  fitMapBoundsToData() {
    const SWNE = this.getGeoRange();
    // window.L available because leaflet() was called in componentWillMount
    this.state.currentBounds = window.L.latLngBounds(SWNE[0], SWNE[1]);
    this.state.map.fitBounds(window.L.latLngBounds(SWNE[0], SWNE[1]));
  }
  resetZoomButtonClicked() {
    this.fitMapBoundsToData();
    this.maybeDrawDemesAndTransmissions();
  }
  getStyles = () => {
    const activeResetZoomButton = true;
    return {
      resetZoomButton: {
        zIndex: 100,
        position: "absolute",
        right: 5,
        top: 0,
        cursor: activeResetZoomButton ? "pointer" : "auto",
        color: activeResetZoomButton ? darkGrey : lightGrey
      }
    };
  };
  render() {
    const styles = this.getStyles();
    const transmissionsExist = this.state.transmissionData && this.state.transmissionData.length;
    // clear layers - store all markers in map state https://github.com/Leaflet/Leaflet/issues/3238#issuecomment-77061011
    return (
      <Card center title={transmissionsExist ? "Transmissions" : "Geography"}>
        {this.maybeCreateMapDiv()}
        {this.props.narrativeMode ? null : (
          <button
            style={{...tabSingle, ...styles.resetZoomButton}}
            onClick={this.resetZoomButtonClicked}
          >
            reset zoom
          </button>
        )}
      </Card>
    );
  }
}

export default Map;
