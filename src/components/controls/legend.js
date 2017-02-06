import React from "react";
import d3 from "d3";
import { connect } from "react-redux";
import { legendRectSize, legendSpacing, defaultColorBy } from "../../util/globals";
import LegendItem from "./legend-item";
import {headerFont, medGrey, darkGrey} from "../../globalStyles";
import titleCase from "title-case";

@connect((state) => {
  return {
    colorBy: state.controls.colorBy
  };
})
class Legend extends React.Component {
  getSVGHeight() {
    let nItems = 10;
    if (this.props.colorScale.scale) {
      nItems = this.props.colorScale.scale.domain().length;
    }
    return Math.ceil(nItems / 2) *
      (legendRectSize + legendSpacing) + legendSpacing + 20 || 100;
  }
  getTransformationForLegendItem(i) {
    const count = this.props.colorScale.scale.domain().length;
    const stack = Math.ceil(count / 2);
    const fromRight = Math.floor(i / stack);
    const fromTop = (i % stack);
    const horz = fromRight * 145;
    const vert = fromTop * (legendRectSize + legendSpacing);
    return "translate(" + horz + "," + vert + ")";
  }
  createLegendTitle() {
    let title = "";
    if (this.props.colorBy) {
      title = this.props.colorBy;
    }
    if (title === "num_date") {
      title = "date";
    }
    if (title.slice(0,2) === "gt") {
      title = title.replace("gt-", "Genotype at ").replace("_", " site ");
    } else {
      title = titleCase(title);
    }
    return (
      <text
        x={0}
        y={10}
        style={{
          fontSize: 12,
          fill: darkGrey,
          fontFamily: headerFont
        }}>
        {title}
      </text>
    );
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
      <svg
        width = {styles.svg.width}
        height = {styles.svg.height}
        style={{
          position: "absolute",
          left: 12,
          top: 38,
          borderRadius: 2,
          zIndex: 1000,
          backgroundColor: "rgba(255,255,255,.85)"
        }}>
        <g>{this.createLegendTitle()}</g>
        <g transform="translate(0,20)">{this.createLegendItems()}</g>
      </svg>
    );
  }
}

export default Legend;
