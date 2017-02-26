import React from "react";
import d3 from "d3";
import { connect } from "react-redux";
import LegendItem from "./legend-item";
import { headerFont, darkGrey } from "../../globalStyles";
import { legendRectSize, legendSpacing, fastTransitionDuration,
  controlsWidth } from "../../util/globals";
import titleCase from "title-case";

@connect((state) => {
  return {
    colorBy: state.controls.colorBy,
    colorScale: state.controls.colorScale,
    browserDimensions: state.browserDimensions.browserDimensions
  };
})
class Legend extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      legendVisible: true
    };
  }
  static propTypes = {
    /* react */
    // dispatch: React.PropTypes.func,
    params: React.PropTypes.object,
    routes: React.PropTypes.array,
    /* component api */
    style: React.PropTypes.object,
    sidebar: React.PropTypes.bool
  }
  // hide/show legend based on initial browserDimensions
  componentWillMount() {
    this.updateLegendVisibility(this.props.browserDimensions.width, this.props.sidebar);
  }

  // hide/show legend based on browserDimensions
  componentWillReceiveProps(nextProps) {
    if (this.props.browserDimensions && nextProps.browserDimensions) {
      if (this.props.browserDimensions.width != nextProps.browserDimensions.width) {
        this.updateLegendVisibility(nextProps.browserDimensions.width, nextProps.sidebar);
      }
    }
  }

  updateLegendVisibility(currentWidth, sidebar) {
    const sidebarPadding = sidebar ? controlsWidth + 55 : 0;
    if (currentWidth < 600 + sidebarPadding) {
      this.setState({"legendVisible": false});
    } else {
      this.setState({"legendVisible": true});
    }
  }

  getSVGHeight() {
    let nItems = 10;
    const titlePadding = 20;
    if (this.props.colorScale.scale) {
      nItems = this.props.colorScale.scale.domain().length;
    }
    return Math.ceil(nItems / 2) *
      (legendRectSize + legendSpacing) + legendSpacing + titlePadding || 100;
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
  getTitleString() {
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
    return title;
  }
  getTitleWidth() {
    return 10 + 5.3 * this.getTitleString().length;
  }
  toggleLegend() {
    const newState = this.state.legendVisible ? false : true;
    this.setState({"legendVisible": newState});
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
          }}>
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
            d="M1683 808l-742 741q-19 19-45 19t-45-19l-742-741q-19-19-19-45.5t19-45.5l166-165q19-19 45-19t45 19l531 531 531-531q19-19 45-19t45 19l166 165q19 19 19 45.5t-19 45.5z"/>
        </svg>
      </g>
    );
  }

  /*
   * draws rects and titles for each legend item
   * coordinate system from top,left of parent SVG
   */
  legendItems() {
    const opacity = this.state.legendVisible ? 1 : 0;
    const offset = this.state.legendVisible ? 0 : -0.25 * this.getSVGHeight();
    let items = [];
    if (this.props.colorScale.scale) {
      items = this.props.colorScale.scale.domain().map((d, i) => {
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
    return (
      <g style={{
        opacity: opacity,
        transform: `translate(0, ${offset}px)`,
        transition: `${fastTransitionDuration}ms ease-in-out`
        }}>
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
        left: 12,
        top: 39,
        borderRadius: 2,
        zIndex: 1000
      }
    };
  }
  render() {
    // catch the case where we try to render before anythings ready
    if (!this.props.colorScale) {return (<g/>);}
    const styles = this.getStyles();
    return (
      <svg width = "280" height = {this.getSVGHeight()} style={styles.svg}>
        {this.legendItems()}
        <g onClick={() => { this.toggleLegend(); }}
          style={{cursor: "pointer"}}>
          {this.legendTitle()}
          {this.legendChevron()}
        </g>
      </svg>
    );
  }
}

export default Legend;
