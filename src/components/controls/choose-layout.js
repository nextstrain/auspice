import React from "react";
import Radium from "radium";
// import _ from "lodash";
import Flex from "../framework/flex";
// import { connect } from "react-redux";
// import { FOO } from "../actions";
import ChooseLayoutButton from "../framework/choose-layout-button";
import RectangleTreeLayout from "../framework/rectangle-tree-layout-svg";

// @connect(state => {
//   return state.FOO;
// })
@Radium
class ChooseLayout extends React.Component {
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
      <Flex justifyContent="space-between">
      <ChooseLayoutButton
        style={this.props.style}
        icon={<RectangleTreeLayout/>}
        title={"Rectangle"}/>
        <ChooseLayoutButton
          icon={<RectangleTreeLayout/>}
          title={"Rectangle"}/>
          <ChooseLayoutButton
            icon={<RectangleTreeLayout/>}
            title={"Rectangle"}/>
      </Flex>
    );
  }
}

export default ChooseLayout;
