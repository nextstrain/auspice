import React from "react";
import Radium from "radium";
// import _ from "lodash";
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

    };
  }
  static propTypes = {
    /* react */
    // dispatch: React.PropTypes.func,
    params: React.PropTypes.object,
    routes: React.PropTypes.array,
    /* component api */
    style: React.PropTypes.object,
    // foo: React.PropTypes.string
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

    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    this.setState({map})

  }
  addAllTipsToMap() {
    this.props.nodes.map((n) => {
      if (!n.children) {
        L.marker([n.attr.latitude, n.attr.longitude]).addTo(this.state.map)
        // .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
        // .openPopup();
      }
    })
  }

  render() {
    if (this.props.nodes && this.state.map) { this.addAllTipsToMap() }
    return (
      <div style={{height: 500, width: 1000, marginTop: 40, marginBottom: 40}} id="map">
      </div>
    );
  }
}

export default Map;
