import React from "react";
import Radium from "radium";
// import _ from "lodash";
// import Flex from "./framework/flex";
// import { connect } from "react-redux";
// import { FOO } from "../actions";
import d3 from "d3";
import { legendRectSize, legendSpacing } from "../../util/globals";
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

    if (colorBy === "ep") {
      legendTitle = "Epitope mutations";
    } else if (colorBy === "ne") {
      legendTitle = "Non-epitope mutations";
    } else if (colorBy === "rb") {
      legendTitle = "Receptor binding mutations";
    } else if (colorBy === "lbi") {
      legendTitle = "Local branching index";
    } else if (colorBy === "region") {
      legendTitle = "Region";
    } else if (colorBy === "genotype") {
      legendTitle = "Genotype";
    } else if (colorBy === "date") {
      legendTitle = "Date";
    } else if (colorBy === "cHI") {
      legendTitle = "log<sub>2</sub> titer distance from root";
    } else if (colorBy === "HI_dist") {
      legendTitle = "log<sub>2</sub> titer distance from " + focusNode.strain;
    } else if (colorBy === "dfreq") {
      const tmp_nmonth = Math.round(12 * dfreq_dn * time_step);
      let tmp_text = "Freq. change (" + tmp_nmonth + " month";
      if (tmp_nmonth > 1) {
        tmp_text += "s";
      }
      legendTitle = tmp_text + ")";
    } else if (colorBy === "fitness") {
      legendTitle = "Relative fitness";
    }

    return legendTitle;
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
      base: {
        width: 280,
        height: this.getSVGHeight(),
      }
    };
  }
  render() {
    const styles = this.getStyles();
    return (
      <svg style={styles.base}>
        {this.createLegendItems()}
      </svg>
    );
  }
}

export default Legend;


/*

todo discuss:

// construct a dictionary that maps a legend entry to the preceding interval
const lower_bound = {};
const upper_bound = {};
lower_bound[colorScale.domain()[0]] = -100000000;
upper_bound[colorScale.domain()[0]] = colorScale.domain()[0];
for (let i = 1; i < colorScale.domain().length; i++) {
  lower_bound[colorScale.domain()[i]] = colorScale.domain()[i - 1];
  upper_bound[colorScale.domain()[i]] = colorScale.domain()[i];
}
upper_bound[colorScale.domain()[colorScale.domain().length - 1]] = 10000000;
// function that equates a tip and a legend element
// exact match is required for categorical qunantities such as genotypes, regions
// continuous variables need to fall into the interal (lower_bound[leg], leg]
const legend_match = (leg, tip) => {
  if (
    (colorBy === "lbi") ||
    (colorBy === "date") ||
    (colorBy === "dfreq") ||
    (colorBy === "HI_dist") ||
    (colorBy === "cHI")
  ) {
    return (tip.coloring <= upper_bound[leg]) && (tip.coloring > lower_bound[leg]);
  } else {
    return tip.coloring === leg;
  }
};

*/
