import React from "react";
import Radium from "radium";
// import _ from "lodash";
// import Flex from "./framework/flex";
// import { connect } from "react-redux";
// import { FOO } from "../actions";


// @connect(state => {
//   return state.FOO;
// })
@Radium
class RectangleTreeLayout extends React.Component {
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
  getStyles() {
    return {
      base: {

      }
    };
  }
  render() {
    const styles = this.getStyles();
    return (
      <svg width={this.props.width || 20} viewBox="0 0 17 16">
          <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
              <g transform="translate(-20.000000, -21.000000)" stroke="#5A5A5A">
                  <g transform="translate(20.000000, 22.000000)">
                      <polyline points="2 9 2 13.0258789 12.1352539 13.0258789 12.1352539 11.2182617 16.9116211 11.2182617"></polyline>
                      <polyline points="12 13 12 14 16.8701172 14"></polyline>
                      <polyline points="2 9 2.04206233 5.04833741 6.9604869 4.97854032 7.08285004 2.09917136 11.6662099 2.05662382 11.6662099 0 16.5332031 0"></polyline>
                      <polyline points="11.5 2 11.5 3 16.5 3"></polyline>
                      <path d="M0,9 L2,9" id="Path-6"></path>
                      <polyline points="7 5 7 8 16.690918 8"></polyline>
                  </g>
              </g>
          </g>
      </svg>
    );
  }
}

export default RectangleTreeLayout;
