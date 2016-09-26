import React from "react";
import Radium from "radium";
// import _ from "lodash";
// import Flex from "./framework/flex";
// import { connect } from "react-redux";
// import { FOO } from "../actions";


/*
 * Tip defines the appearance of the leafs or tips in the tree.
 *
*/

@Radium
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
    node: React.PropTypes.object,
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

  determineLegendMatch() {
    const {
      colorBy,
      continuous,
      selectedLegendItem,
      legendBoundsMap
    } = this.props;
    // construct a dictionary that maps a legend entry to the preceding interval
    let bool;
    // equates a tip and a legend element
    // exact match is required for categorical qunantities such as genotypes, regions
    // continuous variables need to fall into the interal (lower_bound[leg], leg]
    if (continuous) {
      bool = (this.props.node.attr[colorBy] <= legendBoundsMap.upper_bound[selectedLegendItem]) &&
        (this.props.node.attr[colorBy] > legendBoundsMap.lower_bound[selectedLegendItem]);
    } else {
      bool = this.props.node.attr[colorBy] === selectedLegendItem;
    }
    return bool;
  }


  tipRadius(){
    if (this.determineLegendMatch()){
      return 6;
    }else{
      return 3;
    }
  }

  tipColor(){
    if (this.props.node.clade%10){
      return this.props.colorScale(this.props.node.attr[this.props.colorBy]);
    }else{
      return "CCC";
    }
  }

  getTip() {
    if (!this.props.node.hasChildren) {
      return (
        <circle
          fill={this.tipColor()}
          r={this.tipRadius()}
          cx={this.props.x}
          cy={this.props.y}
        />
      );
    } else {
      return (
        <rect
          fill={this.tipColor()}
          width= {2*this.tipRadius()}
          height={2*this.tipRadius()}
          x={this.props.x}
          y={this.props.y}
        />
      );
    }
  }
  render() {
    const styles = this.getStyles();
    return (
      <g>
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
