import React from "react";
import { connect } from "react-redux";
import { rgb } from "d3-color";
import LegendItem from "./item";
import { headerFont, darkGrey } from "../../../globalStyles";
import { legendRectSize, legendSpacing, fastTransitionDuration, months } from "../../../util/globals";
import { determineColorByGenotypeType } from "../../../util/colorHelpers";
import { prettyString } from "../../../util/stringHelpers";
import { numericToCalendar } from "../../../util/dateHelpers";


@connect((state) => {
  return {
    colorBy: state.controls.colorBy,
    colorOptions: state.metadata.colorOptions,
    colorScale: state.controls.colorScale
  };
})
class Legend extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      legendVisible: true
    };
  }
  // hide/show legend based on initial width and legend length
  componentWillMount() {
    this.updateLegendVisibility(this.props.width, this.props.colorScale);
  }

  // hide/show legend based on available width and legend length
  componentWillReceiveProps(nextProps) {
    if (this.props.width !== nextProps.width || this.props.colorScale.version !== nextProps.colorScale.version) {
      this.updateLegendVisibility(nextProps.width, nextProps.colorScale);
    }
  }

  updateLegendVisibility(width, colorScale) {
    if (width < 600 || colorScale.legendValues.length > 32) {
      this.setState({legendVisible: false});
    } else {
      this.setState({legendVisible: true});
    }
  }

  getSVGHeight() {
    if (!this.state.legendVisible) {
      return 18;
    }
    const nItems = this.props.colorScale.legendValues.length;
    const titlePadding = 20;
    return Math.ceil(nItems / 2) *
      (legendRectSize + legendSpacing) + legendSpacing + titlePadding || 100;
  }
  getTransformationForLegendItem(i) {
    const count = this.props.colorScale.legendValues.length;
    const stack = Math.ceil(count / 2);
    const fromRight = Math.floor(i / stack);
    const fromTop = (i % stack);
    const horz = fromRight * 145;
    const vert = fromTop * (legendRectSize + legendSpacing);
    return "translate(" + horz + "," + vert + ")";
  }
  getTitleString() {
    const g = determineColorByGenotypeType(this.props.colorBy); /* g = false, "aa" or "nuc" */
    if (g) {
      if (g === "nuc") {
        return "Genotype at position " + this.props.colorBy.replace("gt-", "").replace("nuc_", "");
      }
      return "Genotype at " + this.props.colorBy.replace("gt-", "").replace("_", " site ");
    }
    return this.props.colorOptions[this.props.colorBy] === undefined ?
      "" : this.props.colorOptions[this.props.colorBy].legendTitle;
  }
  getTitleWidth() {
    return 10 + 5.3 * this.getTitleString().length;
  }
  toggleLegend() {
    const newState = !this.state.legendVisible;
    this.setState({legendVisible: newState});
  }

  /*
   * draws legend title
   * coordinate system from top,left of parent SVG
   */
  legendTitle() {
    return (
      <g>
        <rect width={this.getTitleWidth()} height="12" fill="rgba(255,255,255,.85)"/>
        <text
          x={0}
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
    const degrees = this.state.legendVisible ? -180 : 0;
    // This is a hack because we can't use getBBox in React.
    // Lots of work to get measured width of DOM element.
    // Works fine, but will need adjusting if title font is changed.
    const offset = this.getTitleWidth();
    return (
      <g transform={`translate(${offset},0)`}>
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
    if (this.props.colorBy === "clade_membership") {
      return label; /* unchanged */
    } else if (this.props.colorBy === "num_date") {
      const vals = this.props.colorScale.legendValues;
      if (vals[vals.length - 1] - vals[0] > 10) {
        if (vals[vals.length - 1] - parseInt(label, 10) < 10) {
          const [yyyy, mm, dd] = numericToCalendar(label).split('-'); // eslint-disable-line
          return `${months[mm]} ${yyyy}`;
        }
        return parseInt(label, 10);
      }
      const [yyyy, mm, dd] = numericToCalendar(label).split('-'); // eslint-disable-line
      return `${months[mm]} ${yyyy}`;
    } else if (this.props.colorScale.continuous) {
      return label;
    }
    return prettyString(label);
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
      <g>
        <rect width="280" height={this.getSVGHeight()} fill="rgba(255,255,255,.85)"/>
        <g transform="translate(0,20)">
          {items}
        </g>
      </g>
    );
  }

  getStyles() {
    return {
      svg: {
        position: "absolute",
        left: 8,
        top: 30,
        borderRadius: 2,
        zIndex: 1000
      }
    };
  }
  render() {
    // catch the case where we try to render before anythings ready
    if (!this.props.colorScale) return null;
    const styles = this.getStyles();
    return (
      <svg width="280" height={this.getSVGHeight()} style={styles.svg}>
        {this.legendItems()}
        <g onClick={() => { this.toggleLegend(); }}
          style={{cursor: "pointer"}}
        >
          {this.legendTitle()}
          {this.legendChevron()}
        </g>
      </svg>
    );
  }
}

export default Legend;
