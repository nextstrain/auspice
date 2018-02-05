import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import { rgb } from "d3-color";
import LegendItem from "./item";
import { headerFont, darkGrey } from "../../../globalStyles";
import { legendRectSize, legendSpacing, fastTransitionDuration } from "../../../util/globals";
import { determineColorByGenotypeType } from "../../../util/colorHelpers";


@connect((state) => {
  return {
    colorBy: state.controls.colorBy,
    colorOptions: state.metadata.colorOptions,
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
    colorOptions: PropTypes.object,
    colorScale: PropTypes.object,
    params: PropTypes.object,
    routes: PropTypes.array,
    colorBy: PropTypes.string.isRequired,
    style: PropTypes.object,
  }
  // hide/show legend based on initial browserDimensions and legend length
  componentWillMount() {
    this.updateLegendVisibility(this.props.browserDimensions.width, this.props.padding, this.props.colorScale);
  }

  // hide/show legend based on browserDimensions and legend length
  componentWillReceiveProps(nextProps) {
    if (this.props.browserDimensions && nextProps.browserDimensions
        && this.props.colorScale && nextProps.colorScale) {
      if (this.props.browserDimensions.width !== nextProps.browserDimensions.width
        || this.props.colorScale.scale !== nextProps.colorScale.scale) {
        this.updateLegendVisibility(nextProps.browserDimensions.width, nextProps.padding, nextProps.colorScale);
      }
    }
  }

  updateLegendVisibility(currentWidth, padding, colorScale) {
    if (currentWidth < 600 + padding.left + padding.right) {
      this.setState({legendVisible: false});
    } else {
      this.setState({legendVisible: true});
    }
    if (colorScale) {
      if (colorScale.scale.domain().length > 32) {
        this.setState({legendVisible: false});
      }
    }
  }

  getSVGHeight() {
    if (!this.state.legendVisible) {
      return 18;
    }
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

  /*
   * draws rects and titles for each legend item
   * coordinate system from top,left of parent SVG
   */
  legendItems() {
    // const opacity = this.state.legendVisible ? 1 : 0;
    // const offset = this.state.legendVisible ? 0 : -0.25 * this.getSVGHeight();
    let items = [];
    if (this.props.colorScale.scale) {
      items = this.props.colorScale.scale.domain()
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
              dFreq={this.props.colorScale.colorBy === "dfreq"}
              key={d}
              label={d}
              index={i}
            />
          );
        });
    }
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
        left: 12,
        top: 36,
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
