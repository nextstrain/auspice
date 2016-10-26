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
//
// })
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
    const colorBy = (this.props.location.query.colorBy) ? this.props.location.query.colorBy : defaultColorBy;
    if (this.props.colorOptions[colorBy]){
      return this.props.colorOptions[colorBy].legendTitle;
    } else {
      return "[* legend title absent]";
    }
  }

  getSVGHeight() {
    let nItems = 10;
    if (this.props.colorScale.scale) {
      nItems = this.props.colorScale.scale.domain().length;
    }
    return Math.ceil(nItems / 2) *
      (legendRectSize + legendSpacing) + legendSpacing || 100;
  }
  getTransformationForLegendItem(i) {
    const count = this.props.colorScale.scale.domain().length;
    const stack = Math.ceil(count / 2);
    const fromRight = Math.floor(i / stack);
    const fromTop = (i % stack);
    const horz = fromRight * 145 + 5;
    const vert = fromTop * (legendRectSize + legendSpacing) + 5;
    return "translate(" + horz + "," + vert + ")";
  }
  createLegendItems() {
    let legendItems = [];
    if (this.props.colorScale.scale) {
      legendItems = this.props.colorScale.scale.domain().map((d, i) => {
        return (
          <LegendItem
            legendRectSize={legendRectSize}
            legendSpacing={legendSpacing}
            rectFill={d3.rgb(this.props.colorScale.scale(d)).brighter([0.35]).toString()}
            rectStroke={d3.rgb(this.props.colorScale.scale(d)).toString()}
            transform={this.getTransformationForLegendItem(i)}
            dFreq={this.props.colorScale.colorBy === "dfreq"}
            key={i}
            label={d}
            index={i}
          />
        );
      });
    }
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
      <g>
        {this.createLegendItems()}
      </g>
    );
  }
}

export default Legend;

// </svg>
//   </div>
//   <div style={styles.container}>
//   <p>{this.chooseLegendTitle()}</p>
// <svg style={styles.svg}>
