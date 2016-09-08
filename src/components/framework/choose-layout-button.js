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
class ChooseLayoutButton extends React.Component {
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
        border: 0,
        backgroundColor: "red",
        color: "white"
      }
    };
  }
  render() {
    const styles = this.getStyles();
    return (
      <button style={[
        styles.base,
        this.props.style
      ]}>
        {this.props.icon} {this.props.title}
      </button>
    );
  }
}

export default ChooseLayoutButton;
