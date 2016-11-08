import React from "react";
import Radium from "radium";
import GridLine from "./gridLine";
import {slowTransitionDuration} from "../../util/globals";

/*
 * Tree creates all TreeNodes of the tree, which consist of branches and tips.
 * Tree assignes the desired locations to all TreeNodes
*/
@Radium
class Grid extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      faded: false,
      distanceMeasure: this.props.distanceMeasure,
      layout: this.props.layout,
      xScale: this.props.xScale,
      yScale: this.props.yScale
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

  componentWillReceiveProps(nextProps) {
    if (this.state.distanceMeasure != nextProps.distanceMeasure || this.state.layout != nextProps.layout) {
      this.setState({faded: true});
    }
    setTimeout(function() {
      this.setState({
        faded: false,
        distanceMeasure: this.props.distanceMeasure,
        layout: this.props.layout,
        xScale: this.props.xScale,
        yScale: this.props.yScale
      });
    }.bind(this), 0.5*slowTransitionDuration);
  }

  xVal(tick, distanceMeasure, layout) {
    return this.state.xScale(tick);
  }
  yVal(tick, distanceMeasure, layout) {
    return this.state.yScale(tick);
  }


  drawGrid(distanceMeasure, layout, xScale, yScale) {
    const xmin = (xScale.domain()[0]>0)?xScale.domain()[0]:0.0;
    const xmax = xScale.domain()[1];
    let offset;
    if (layout==="radial" && distanceMeasure==="num_date") {
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
            x={this.xVal(tick-offset, distanceMeasure, layout)}
            y={this.yVal(tick-offset, distanceMeasure, layout)}
            cx={xScale(0)}
            cy={yScale(0)}
            rx={this.xVal(tick-offset, distanceMeasure, layout) - xScale(0)}
            ry={this.yVal(tick-offset, distanceMeasure, layout) - yScale(0)}
            key={index}
            layout={layout}
            distanceMeasure={distanceMeasure}
            label={tick.toString()}
            width={2}
            stroke={'#CCC'}
          />
       );
    });

    const minorRoundingLevel = roundingLevel / (distanceMeasure === "div" ? 5 : 6);
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
            x={this.xVal(tick-offset, distanceMeasure, layout)}
            y={this.yVal(tick-offset, distanceMeasure, layout)}
            cx={xScale(0)}
            cy={yScale(0)}
            rx={this.xVal(tick-offset, distanceMeasure, layout) - xScale(0)}
            ry={this.yVal(tick-offset, distanceMeasure, layout) - yScale(0)}
            key={index+gridLines.length}
            layout={layout}
            distanceMeasure={distanceMeasure}
            width={.5}
            stroke={'#AAA'}
            label={""}
          />
       );
    });
    return gridLines.concat(minorGridLines);
  }

  render() {
    const opacity = this.state.faded ? "0" : "1";
    return (
      <g style={{
        transition: `opacity ${0.5*slowTransitionDuration}ms linear`,
        opacity: opacity
      }}>
       {this.drawGrid(this.state.distanceMeasure, this.state.layout, this.state.xScale, this.state.yScale)}
      </g>
    );
  }
}
export default Grid;
