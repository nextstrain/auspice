import React from "react";
import Radium from "radium";
import _ from "lodash";
// import Flex from "./framework/flex";
import { connect } from "react-redux";
// import { FOO } from "../actions";
import Card from "../framework/card";
import setupLeaflet from "../../util/leaflet";
import setupLeafletPlugins from "../../util/leaflet-plugins";


@connect((state) => {
  return {
    tree: state.tree.tree,
    metadata: state.metadata.metadata
  };
})
@Radium
class Map extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tips: false,
      map: null
    };
  }
  static propTypes = {
    /* react */
    // dispatch: React.PropTypes.func,
    nodes: React.PropTypes.array
  }
  static defaultProps = {
    // foo: "bar"
  }
  componentWillMount() {
    setupLeaflet();
  }
  componentDidMount() {
    setupLeafletPlugins()

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
      zoomControl: false

    })

    L.tileLayer('https://api.mapbox.com/styles/v1/trvrb/ciu03v244002o2in5hlm3q6w2/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoidHJ2cmIiLCJhIjoiY2l1MDRoMzg5MDEwbjJvcXBpNnUxMXdwbCJ9.PMqX7vgORuXLXxtI3wISjw', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
        // noWrap: true
    }).addTo(map);

    L.control.zoom({position: "bottomright"}).addTo(map)

    this.setState({map})

  }
  addAllTipsToMap() {
    const aggregatedLocations = {};
    this.props.nodes.forEach((n) => {
      if (n.children) { return; }
      // look up geo1 geo2 geo3 do lat longs differ
      if (aggregatedLocations[n.attr.country]) {
        aggregatedLocations[n.attr.country]++;
      } else {
        // if we haven't added this pair, add it
        aggregatedLocations[n.attr.country] = 1;
      }
    });

    _.forOwn(aggregatedLocations, (value, key) => {
      L.circleMarker([
        this.props.metadata.geo.country[key].latitude,
        this.props.metadata.geo.country[key].longitude
      ], {
        stroke:	false,
        radius: value * 2,

        // color: ""
        // weight:	5	Stroke width in pixels.
        // opacity:	0.5	Stroke opacity.
        // fill:
        fillColor: this.props.colorScale(key),
        fillOpacity: .6
      }).addTo(this.state.map);
    });
  }
  addTransmissionEventsToMap() {
    const transmissions = {};
    const geo = this.props.metadata.geo;

    // count transmissions for line thickness
    this.props.nodes.forEach((parent) => {
      if (!parent.children) { return; }
      // if (parent.attr.country !== "china") { return; } // remove me, example filter
      parent.children.forEach((child) => {
        if (parent.attr.country === child.attr.country) { return; }
        // look up in transmissions dictionary
        if (transmissions[parent.attr.country + "/" + child.attr.country]) {
          transmissions[parent.attr.country + "/" + child.attr.country]++;
        } else {
          // we don't have it, add it
          transmissions[parent.attr.country + "/" + child.attr.country] = 1;
        }
      });
    });

    // for each item in the object produced above, add a line
    _.forOwn(transmissions, (value, key) => {

      // go from "brazil/cuba" to ["brazil", "cuba"]
      const countries = key.split("/");
      // go from "brazil" to lat0 = -14.2350
      let long0 = geo.country[countries[0]].longitude;
      let long1 = geo.country[countries[1]].longitude;
      let lat0 = geo.country[countries[0]].latitude;
      let lat1 = geo.country[countries[1]].latitude;

      // create new leaflet LatLong objects
      const start = new L.LatLng(lat0, long0)
      const end = new L.LatLng(lat1, long1)

      // remove me! temporary random colors in lieu of scale.

      /*
        add a polyline to the map for current country pair iteratee
        store the computation. access _latlngs to show where each segment is on the map
      */
      const geodesicPath = L.geodesic([[start,end]], {
        // stroke:	value,
        // radius: value,
        color: this.props.colorScale(countries[0]),
        opacity: .5,
        steps: 25,
        weight:	value	/* Stroke width in pixels.*/
        // opacity:	0.5	Stroke opacity.
        // fill:
        // fillColor: randomColor
        // fillOpacity:
      }).addTo(this.state.map)

      /* this will need to be scaled if transmissions is high */
      const arrowSizeMultiplier = value > 1 ? value * 2 : 0;

      // this decorator adds arrows to the lines.
      // decorator docs: https://github.com/bbecquet/Leaflet.PolylineDecorator
      for (let i = 0; i < geodesicPath._latlngs.length; i++) {
        L.polylineDecorator(geodesicPath._latlngs[i], {
          patterns: [{
            offset: 25,
            repeat: 50,
            symbol: L.Symbol.arrowHead({
              pixelSize: 8 + arrowSizeMultiplier,
              pathOptions: {
                fillOpacity: .5,
                color: this.props.colorScale(countries[0]),
                weight: 0
              }
            })
          }]
        }).addTo(this.state.map);
      }

    });
  }
  okToRender() {
    /* this is going to expand so breaking into a function */

    let ok = false;

    /*
      do we have a new dataset
      is our dataset shorter than last time (filtered because of date slider or other control)
    */

    if (
      this.props.metadata &&
      this.props.nodes &&
      this.state.map &&
      !this.state.tips &&
      this.props.colorScale
    ) {
      ok = true
    }

    return ok;
  }
  render() {
    if (this.okToRender()) {
      this.addAllTipsToMap();
      this.addTransmissionEventsToMap();
      // don't redraw on every rerender - need to seperately handle virus change redraw
      this.setState({tips: true});
    }

    // clear layers - store all markers in map state https://github.com/Leaflet/Leaflet/issues/3238#issuecomment-77061011

    return (
      <Card center title="Transmissions">
        <div style={{
            height: 650,
            width: 1028,
            margin: 10
          }} id="map">
        </div>
      </Card>
    );
  }
}

export default Map;
