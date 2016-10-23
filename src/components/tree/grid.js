import React from "react";
import Radium from "radium";
import {VictoryAnimation} from "victory";
import GridLine from "./gridLine";

/*
 * Tree creates all TreeNodes of the tree, which consist of branches and tips.
 * Tree assignes the desired locations to all TreeNodes
*/
@Radium
class Grid extends React.Component {
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
    style: React.PropTypes.object
    // foo: React.PropTypes.string
  }
  xVal(tick, distanceMeasure, layout) {
    return this.props.xScale(tick);
  }
  yVal(tick, distanceMeasure, layout) {
    return this.props.yScale(tick);
  }


  drawGrid() {
    const xmin = (this.props.xScale.domain()[0]>0)?this.props.xScale.domain()[0]:0.0;
    const xmax = this.props.xScale.domain()[1];
    let offset;
    if (this.props.layout==="radial" && this.props.distanceMeasure==="num_date") {
      offset = this.props.nodes[0].attr["num_date"];
    } else {
      offset = 0;
    }
    const logRange = Math.floor(Math.log10(xmax - xmin));
    const roundingLevel = Math.pow(10, logRange);
    const gridMin = Math.floor((xmin+offset)/roundingLevel)*roundingLevel;
    const gridPoints = [];
    for (let ii = 0; ii <= (xmax + offset - gridMin)/roundingLevel+0.4; ii++) {
      if (gridMin + roundingLevel*ii>offset){
          gridPoints.push(gridMin + roundingLevel*ii);
      }
    }
    const gridLines = gridPoints.map((tick, index) => {
        return (
          <GridLine
            {...this.props}
            x={this.xVal(tick-offset, this.props.distanceMeasure, this.props.layout)}
            y={this.yVal(tick-offset, this.props.distanceMeasure, this.props.layout)}
            cx={this.props.xScale(0)}
            cy={this.props.yScale(0)}
            rx={this.xVal(tick-offset, this.props.distanceMeasure, this.props.layout) - this.props.xScale(0)}
            ry={this.yVal(tick-offset, this.props.distanceMeasure, this.props.layout) - this.props.yScale(0)}
            key={index}
            layout={this.props.layout}
            distanceMeasure={this.props.distanceMeasure}
            label={tick.toString()}
            width={2}
            stroke={'#CCC'}
          />
       );
    });

    const minorRoundingLevel = roundingLevel / (this.props.distanceMeasure === "div" ? 5 : 6);
    const minorGridPoints = [];
    for (let ii = 0; ii <= (xmax + offset - gridMin)/minorRoundingLevel+3; ii++) {
      if (gridMin + minorRoundingLevel*ii>offset){
          minorGridPoints.push(gridMin + minorRoundingLevel*ii);
      }
    }
    const minorGridLines = minorGridPoints.map((tick, index) => {
        return (
          <GridLine
            {...this.props}
            x={this.xVal(tick-offset, this.props.distanceMeasure, this.props.layout)}
            y={this.yVal(tick-offset, this.props.distanceMeasure, this.props.layout)}
            cx={this.props.xScale(0)}
            cy={this.props.yScale(0)}
            rx={this.xVal(tick-offset, this.props.distanceMeasure, this.props.layout) - this.props.xScale(0)}
            ry={this.yVal(tick-offset, this.props.distanceMeasure, this.props.layout) - this.props.yScale(0)}
            key={index+gridLines.length}
            layout={this.props.layout}
            distanceMeasure={this.props.distanceMeasure}
            width={.5}
            stroke={'#AAA'}
            label={""}
          />
       );
    });
    return gridLines.concat(minorGridLines);
  }

  render() {
    return (
      <g>
       {this.drawGrid()}
      </g>
    );
  }
}
export default Grid;
