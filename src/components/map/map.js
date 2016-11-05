import React from "react";
import Radium from "radium";
import _ from "lodash";
// import Flex from "./framework/flex";
import { connect } from "react-redux";
// import { FOO } from "../actions";
import Card from "../framework/card";


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
    // setupMap()
    setupLeafletPlugins()
    var map = L.map('map', {
      center: [0,0],
      zoom: 2,
      scrollWheelZoom: false,
      minZoom: 2,
      maxZoom: 9,
      zoomControl: false

    })

    L.tileLayer('https://api.mapbox.com/styles/v1/trvrb/ciu03v244002o2in5hlm3q6w2/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoidHJ2cmIiLCJhIjoiY2l1MDRoMzg5MDEwbjJvcXBpNnUxMXdwbCJ9.PMqX7vgORuXLXxtI3wISjw', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
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
        radius: value,
        // color: ""
        // weight:	5	Stroke width in pixels.
        // opacity:	0.5	Stroke opacity.
        // fill:
        fillColor: "rgb(255,0,0)"
        // fillOpacity:
      }).addTo(this.state.map)
    });
  }
  addTransmissionEventsToMap() {
    const transmissions = {};
    const geo = this.props.metadata.geo;

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

    _.forOwn(transmissions, (value, key) => {
      // L.polyline(latlngs, {color: 'red'}).addTo(this.state.map);
      const countries = key.split("/");
      let long0 = geo.country[countries[0]].longitude;
      let long1 = geo.country[countries[1]].longitude;


      // if (Math.abs(long0 - long1) > 100) {
      //   return
        // long0 = long0 + 360;
        // long1 = long1 + 360;
      // }

      L.polyline([
        [geo.country[countries[0]].latitude, long0],
        [geo.country[countries[1]].latitude, long1]
      ], {
        // stroke:	value,
        // radius: value,
        color: "rgb(255,0,0)",
        weight:	value	/* Stroke width in pixels.*/
        // opacity:	0.5	Stroke opacity.
        // fill:
        // fillColor: "rgb(255,0,0)"
        // fillOpacity:
      }).addTo(this.state.map)
    });
  }
  render() {
    if (this.props.nodes && this.state.map && !this.state.tips) {
      this.addAllTipsToMap();
      this.addTransmissionEventsToMap();
      // don't redraw - need to seperately handle virus change redraw
      this.setState({tips: true});
    }
    return (
      <Card title="Transmissions">
        <div style={{
            height: 400,
            width: 800,
            margin: 10
          }} id="map">
        </div>
      </Card>
    );
  }
}

export default Map;
