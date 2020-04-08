import React from "react";
import { connect } from "react-redux";
import { rgb } from "d3-color";
import LegendItem from "./item";
import { headerFont, darkGrey } from "../../../globalStyles";
import { legendRectSize, legendSpacing, legendMaxLength, fastTransitionDuration, months } from "../../../util/globals";
import { numericToCalendar } from "../../../util/dateHelpers";
import { isColorByGenotype, decodeColorByGenotype } from "../../../util/getGenotype";
import { TOGGLE_LEGEND } from "../../../actions/types";

const svg = {
  position: "absolute",
  top: 26,
  borderRadius: 4,
  zIndex: 1000,
  userSelect: "none"
};

@connect((state) => {
  return {
    colorBy: state.controls.colorBy,
    colorings: state.metadata.colorings,
    colorScale: state.controls.colorScale,
    legendOpen: state.controls.legendOpen
  };
})
class Legend extends React.Component {
  constructor(props) {
    super(props);
  }

  showLegend() {
    // redux state takes precedent
    if (this.props.legendOpen !== undefined) { return this.props.legendOpen; }

    // Our default state changes based on the size of the window or the number of items in the legend.
    if (this.props.width < 600 || this.props.colorScale.legendValues.length > 32) {
      return false;
    }
    return true;
  }

  getSVGHeight() {
    if (!this.showLegend()) {
      return 18;
    }
    const nItems = this.props.colorScale.legendValues.length;
    const titlePadding = 20;
    return Math.ceil(nItems / 2) *
      (legendRectSize + legendSpacing) + legendSpacing + titlePadding || 100;
  }

  getSVGWidth() {
    if (this.showLegend()) {
      return 290;
    }
    return this.getTitleWidth() + 20;
  }

  getTransformationForLegendItem(i) {
    const count = this.props.colorScale.legendValues.length;
    const stack = Math.ceil(count / 2);
    const fromRight = Math.floor(i / stack);
    const fromTop = (i % stack);
    const horz = fromRight * 145 + 10;
    const vert = fromTop * (legendRectSize + legendSpacing);
    return "translate(" + horz + "," + vert + ")";
  }
  getTitleString() {
    if (isColorByGenotype(this.props.colorBy)) {
      const genotype = decodeColorByGenotype(this.props.colorBy);
      return genotype.aa
        ? `Genotype at ${genotype.gene} site ${genotype.positions.join(", ")}`
        : `Nucleotide at position ${genotype.positions.join(", ")}`;
    }
    return this.props.colorings[this.props.colorBy] === undefined ?
      "" : this.props.colorings[this.props.colorBy].title;
  }

  getTitleWidth() {
    // This is a hack because we can't use getBBox in React.
    // Lots of work to get measured width of DOM element.
    // Works fine, but will need adjusting if title font is changed.
    return 15 + 5.3 * this.getTitleString().length;
  }

  toggleLegend() {
    this.props.dispatch({type: TOGGLE_LEGEND, value: !this.props.legendOpen});
  }

  /*
   * draws legend title
   * coordinate system from top,left of parent SVG
   */
  legendTitle() {
    return (
      <g id="Title">
        <rect width={this.getTitleWidth()} height="12" fill="rgba(255,255,255,.85)"/>
        <text
          x={this.getTitleOffset()}
          y={10}
          style={{
            fontSize: 12,
            fill: darkGrey,
            fontFamily: headerFont,
            backgroundColor: "#fff"
          }}
        >
          {this.getTitleString()}
        </text>
      </g>
    );
  }

  /*
   * draws show/hide chevron
   * coordinate system from top,left of parent SVG
   */
  legendChevron() {
    const degrees = this.showLegend() ? -180 : 0;

    const offset = this.getArrowOffset();
    return (
      <g id="Chevron" transform={`translate(${offset},0)`}>
        <svg width="12" height="12" viewBox="0 0 1792 1792">
          <rect width="1792" height="1792" fill="rgba(255,255,255,.85)"/>
          <path
            fill={darkGrey}
            style={{
              transform: `rotate(${degrees}deg)`,
              transformOrigin: "50% 50%",
              transition: `${fastTransitionDuration}ms ease-in-out`
            }}
            d="M1683 808l-742 741q-19 19-45 19t-45-19l-742-741q-19-19-19-45.5t19-45.5l166-165q19-19 45-19t45 19l531 531 531-531q19-19 45-19t45 19l166 165q19 19 19 45.5t-19 45.5z"
          />
        </svg>
      </g>
    );
  }

  styleLabelText(label) {
    /* depending on the colorBy, we display different labels! */
    if (this.props.colorBy === "num_date") {
      const legendValues = this.props.colorScale.legendValues;
      if (
        (legendValues[legendValues.length-1] - legendValues[0] > 10) && /* range spans more than 10 years */
        (legendValues[legendValues.length-1] - parseInt(label, 10) >= 10) /* current label (value) is more than 10 years from the most recent */
      ) {
        return parseInt(label, 10);
      }
      const [yyyy, mm, dd] = numericToCalendar(label).split('-'); // eslint-disable-line
      return `${months[mm]} ${yyyy}`;
    }
    return label;
  }

  /*
   * draws rects and titles for each legend item
   * coordinate system from top,left of parent SVG
   */
  legendItems() {
    const items = this.props.colorScale.legendValues
      .filter((d) => d !== undefined)
      .map((d, i) => {
        return (
          <LegendItem
            dispatch={this.props.dispatch}
            legendRectSize={legendRectSize}
            legendSpacing={legendSpacing}
            legendMaxLength={legendMaxLength}
            rectFill={rgb(this.props.colorScale.scale(d)).brighter([0.35]).toString()}
            rectStroke={rgb(this.props.colorScale.scale(d)).toString()}
            transform={this.getTransformationForLegendItem(i)}
            key={d}
            value={d}
            label={this.styleLabelText(d)}
            index={i}
          />
        );
      });
    // This gives the nice looking show/hide animation. Should restore while maintaining
    // legend collapse functionality.
    // <g style={{
    //   opacity: opacity,
    //   transform: `translate(0, ${offset}px)`,
    //   transition: `${fastTransitionDuration}ms ease-in-out`
    //   }}>
    return (
      <g id="ItemsContainer">
        <rect width="290" height={this.getSVGHeight()} fill="rgba(255,255,255,.85)"/>
        <g id="Items" transform="translate(0,20)">
          {items}
        </g>
      </g>
    );
  }

  getStyles() {
    return {
      svgLeft: {
        ...svg,
        left: 5
      },
      svgRight: {
        ...svg,
        right: 5
      }
    };
  }

  getSVGStyle() {
    const styles = this.getStyles();

    if (this.props.right) { return styles.svgRight; }
    return styles.svgLeft;
  }

  getArrowOffset() {
    if (this.props.right) {
      return this.getSVGWidth() - 20;
    }
    return this.getTitleWidth();
  }

  getTitleOffset() {
    if (this.props.right) {
      return this.getSVGWidth() - this.getTitleWidth() - 15;
    }
    return 5;
  }

  render() {
    // catch the case where we try to render before anythings ready
    if (!this.props.colorScale) return null;
    return (
      <svg
        id="TreeLegendContainer"
        width={this.getSVGWidth()}
        height={this.getSVGHeight()}
        style={this.getSVGStyle()}
      >
        {this.legendItems()}
        <g
          id="TitleAndChevron"
          onClick={() => this.toggleLegend()}
          style={{cursor: "pointer", textAlign: "right" }}
        >
          {this.legendTitle()}
          {this.legendChevron()}
        </g>
      </svg>
    );
  }
}

export default Legend;
