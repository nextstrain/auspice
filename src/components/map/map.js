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
  updateDemeAndTransmissionDataLatLong
} from "./mapHelpersLatLong";
import { changeDateFilter } from "../../actions/tree";
import { MAP_ANIMATION_PLAY_PAUSE_BUTTON } from "../../actions/types";
// import { incommingMapPNG } from "../download/helperFunctions";
import { timerStart, timerEnd } from "../../util/perf";
import { lightGrey, goColor, pauseColor } from "../../globalStyles";
import { errorNotification } from "../../actions/notifications";

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
    narrativeMode: state.narrative.display
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
    this.maybeRemoveAllDemesAndTransmissions(this.props); /* geographic resolution just changed (ie., country to division), remove everything. this change is upstream of maybeDraw */
    this.maybeUpdateDemesAndTransmissions(this.props); /* every time we change something like colorBy */
    this.maybeInvalidateMapSize(this.props);
  }
  componentWillReceiveProps(nextProps) {
    this.modulateInterfaceForNarrativeMode(nextProps);
    this.maybeChangeSize(nextProps);
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
      if (!this.state.boundsSet) { // we are doing the initial render -> set map to the range of the data
        const SWNE = this.getGeoRange();
        // L. available because leaflet() was called in componentWillMount
        this.state.map.fitBounds(L.latLngBounds(SWNE[0], SWNE[1]));
      }

      const {
        demeData,
        transmissionData,
        demeIndices,
        transmissionIndices,
        demesMissingLatLongs
      } = createDemeAndTransmissionData(
        this.props.nodes,
        this.props.visibility,
        this.props.geoResolution,
        this.props.nodeColors,
        this.props.mapTriplicate,
        this.props.metadata,
        this.state.map
      );

      const filteredDemesMissingLatLongs = [...demesMissingLatLongs].filter((value) => {
        return value !== "Unknown" || value !== "unknown";
      });

      if (filteredDemesMissingLatLongs.size) {
        this.props.dispatch(errorNotification({
          message: "The following demes are missing lat/long information",
          details: [...filteredDemesMissingLatLongs].join(", ")
        }));
      }

      // const latLongs = this.latLongs(demeData, transmissionData); /* no reference stored, we recompute this for now rather than updating in place */
      const d3elems = drawDemesAndTransmissions(
        demeData,
        transmissionData,
        this.state.d3DOMNode,
        this.state.map,
        this.props.nodes,
        this.props.dateMinNumeric,
        this.props.dateMaxNumeric
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
      timerEnd("drawDemesAndTransmissions");
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
        this.props.dateMinNumeric,
        this.props.dateMaxNumeric
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
    if (!this.state.map || !this.props.treeLoaded) { return; }
    const colorOrVisibilityChange = nextProps.visibilityVersion !== this.props.visibilityVersion || nextProps.colorScaleVersion !== this.props.colorScaleVersion;
    const haveData = nextProps.nodes && nextProps.visibility && nextProps.geoResolution && !!nextProps.nodeColors;

    if (!(colorOrVisibilityChange && haveData)) { return; }
    timerStart("updateDemesAndTransmissions");
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
      nextProps.dateMinNumeric,
      nextProps.dateMaxNumeric
    );

    this.setState({
      demeData: newDemes,
      transmissionData: newTransmissions
    });
    timerEnd("updateDemesAndTransmissions");
  }

  getInitialBounds() {
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
      maxBounds: this.getInitialBounds(),
      minZoom: 2,
      maxZoom: 10,
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
