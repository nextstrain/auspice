import React from "react";
import Radium from "radium";
import _ from "lodash";
// import Flex from "./framework/flex";
import { connect } from "react-redux";
// import { FOO } from "../actions";


@connect(state => {
  return state.tree
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

  componentDidMount() {
    // setupMap()
    var map = L.map('map', {
      center: [0,0],
      zoom: 2
    })

    L.tileLayer('https://api.mapbox.com/styles/v1/trvrb/ciu03v244002o2in5hlm3q6w2/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoidHJ2cmIiLCJhIjoiY2l1MDRoMzg5MDEwbjJvcXBpNnUxMXdwbCJ9.PMqX7vgORuXLXxtI3wISjw', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    this.setState({map})

  }
  addAllTipsToMap() {
    const aggregatedLocations = {};
    this.props.nodes.forEach((n) => {
      if (n.children) { return }
      if (aggregatedLocations[n.attr.latitude + "/" + n.attr.longitude]) {
        // if we haven't added this pair, add it
        aggregatedLocations[n.attr.latitude + "/" + n.attr.longitude]++
      } else {
        aggregatedLocations[n.attr.latitude + "/" + n.attr.longitude] = 1
      }
    })

    console.log(aggregatedLocations)

    _.forOwn(aggregatedLocations, (value, key) => {

        const latlong = key.split("/")

        L.circleMarker([latlong[0], latlong[1]], {
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

  render() {
    if (this.props.nodes && this.state.map && !this.state.tips) {
      this.addAllTipsToMap();
      // don't redraw - need to seperately handle virus change redraw
      this.setState({tips: true});
    }
    return (
      <div style={{height: 500, width: 1000, marginTop: 40, marginBottom: 40}} id="map">
      </div>
    );
  }
}

export default Map;
