import React from "react";
import Radium from "radium";
// import _ from "lodash";
// import Flex from "./framework/flex";
// import { connect } from "react-redux";
// import { FOO } from "../actions";
import d3 from "d3";
import { legendRectSize, legendSpacing, defaultColorBy } from "../../util/globals";
import LegendItem from "./legend-item";


// @connect(state => {
//   return state.FOO;
// })
@Radium
class Legend extends React.Component {
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
    controls: React.PropTypes.object,
    colorScale: React.PropTypes.func
  }
  static defaultProps = {

  }
  chooseLegendTitle() {
    let legendTitle = "";
    console.log("Legend:", this.props);
    const colorBy = (this.props.query.colorBy) ? this.props.query.colorBy : defaultColorBy;
    return this.props.colorOptions[colorBy].legendTitle;
  }

  getSVGHeight() {
    return Math.ceil(this.props.controls.colorScale.domain().length / 2) *
      (legendRectSize + legendSpacing) + legendSpacing || 100;
  }
  getTransformationForLegendItem(i) {
    const count = this.props.controls.colorScale.domain().length;
    const stack = Math.ceil(count / 2);
    const fromRight = Math.floor(i / stack);
    const fromTop = (i % stack);
    const horz = fromRight * 145 + 5;
    const vert = fromTop * (legendRectSize + legendSpacing) + 5;
    return "translate(" + horz + "," + vert + ")";
  }
  createLegendItems() {
    let legendItems = this.props.controls.colorScale.domain().map((d, i) => {
      return (
        <LegendItem
          legendRectSize={legendRectSize}
          legendSpacing={legendSpacing}
          rectFill={d3.rgb(this.props.controls.colorScale(d)).brighter([0.35]).toString()}
          rectStroke={d3.rgb(this.props.controls.colorScale(d)).toString()}
          transform={this.getTransformationForLegendItem(i)}
          dFreq={this.props.controls.colorBy === "dfreq"}
          key={i}
          label={d}
          index={i}/>
      );
    });
    return legendItems;
  }
  getStyles() {
    return {
      svg: {
        width: 280,
        height: this.getSVGHeight(),
      },
      container: {
        marginBottom: 20
      }
    };
  }
  render() {
    const styles = this.getStyles();
    return (
      <div style={styles.container}>
        <p>{this.chooseLegendTitle()}</p>
      <svg style={styles.svg}>
        {this.createLegendItems()}
      </svg>
      </div>
    );
  }
}

export default Legend;
