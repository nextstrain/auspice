import React from "react";
import Radium from "radium";
import { NODE_MOUSEENTER, NODE_MOUSELEAVE } from "../../actions/controls";
import { connect } from "react-redux";
import {slowTransitionDuration, mediumTransitionDuration, fastTransitionDuration} from "../../util/globals";
import d3 from "d3";
// import _ from "lodash";
// import Flex from "./framework/flex";
// import { FOO } from "../actions";


/*
 * Tip defines the appearance of the leafs or tips in the tree.
 *
*/
@connect()
class Tip extends React.Component {
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
    node: React.PropTypes.object
  }
  static defaultProps = {
    // foo: "bar"
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (!this.props.node.hasChildren) {
      return true;
    } else {
      return false;
    }
  }

  getStyles() {
    return {
      base: {

      }
    };
  }

  getOpacity() {
    return this.props.tipVisibility == "visible" ? 1 : 0;
  }

  getFillColor() {
    	return d3.rgb(this.props.nodeColor).brighter([0.65]).toString();
  }

  getTip() {
    if (!this.props.node.hasChildren) {
      return (
        <circle
          cx="0"
          cy="0"
          r={this.props.tipRadius}  // keeping this as r rather than scaling because of shared transition times with x,y pos
          style = {{
            stroke: this.props.nodeColor,
            fill: this.getFillColor(),
            opacity: this.getOpacity(),
            transform: `translate3d(${this.props.x}px, ${this.props.y}px, 0)`,
            WebkitTransform: `translate3d(${this.props.x}px, ${this.props.y}px, 0)`,
            transition: `transform ${mediumTransitionDuration}ms ease-in-out,
              opacity ${fastTransitionDuration}ms linear,
              stroke ${mediumTransitionDuration}ms linear,
              fill ${mediumTransitionDuration}ms linear`
          }}
        />
      );
    } else {
      return null;
    }
  }

  render() {
    const styles = this.getStyles();
    return (
      <g>
        onMouseEnter={() => {
          this.props.dispatch({
            type: NODE_MOUSEENTER,
            /*
              send the source and target nodes in the action,
              use x and y values in them to place tooltip
            */
            data: this.props.node
          });
        }}
        onMouseLeave={() => {
          this.props.dispatch({ type: NODE_MOUSELEAVE });
        }}
        {this.getTip()}
      </g>
    );
  }
}

export default Tip;

/*

propTypes: {
    // You can declare that a prop is a specific JS primitive. By default, these
    // are all optional.
    optionalArray: React.PropTypes.array,
    optionalBool: React.PropTypes.bool,
    optionalFunc: React.PropTypes.func,
    optionalNumber: React.PropTypes.number,
    optionalObject: React.PropTypes.object,
    optionalString: React.PropTypes.string,

    // Anything that can be rendered: numbers, strings, elements or an array
    // (or fragment) containing these types.
    optionalNode: React.PropTypes.node,

    // A React element.
    optionalElement: React.PropTypes.element,

    // You can also declare that a prop is an instance of a class. This uses
    // JS's instanceof operator.
    optionalMessage: React.PropTypes.instanceOf(Message),

    // You can ensure that your prop is limited to specific values by treating
    // it as an enum.
    optionalEnum: React.PropTypes.oneOf(['News', 'Photos']),

    // An object that could be one of many types
    optionalUnion: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number,
      React.PropTypes.instanceOf(Message)
    ]),

    // An array of a certain type
    optionalArrayOf: React.PropTypes.arrayOf(React.PropTypes.number),

    // An object with property values of a certain type
    optionalObjectOf: React.PropTypes.objectOf(React.PropTypes.number),

    // An object taking on a particular shape
    optionalObjectWithShape: React.PropTypes.shape({
      color: React.PropTypes.string,
      fontSize: React.PropTypes.number
    }),

    // You can chain any of the above with `isRequired` to make sure a warning
    // is shown if the prop isn't provided.
    requiredFunc: React.PropTypes.func.isRequired,

    // A value of any data type
    requiredAny: React.PropTypes.any.isRequired,

*/
