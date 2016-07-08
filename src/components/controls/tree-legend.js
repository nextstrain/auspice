import React from "react";
import Radium from "radium";
// import _ from "lodash";
// import Flex from "./framework/flex";
// import { connect } from "react-redux";
// import { FOO } from "../actions";


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
  }
  static defaultProps = {
    // foo: "bar"
  }
  getStyles() {
    return {
      base: {

      }
    };
  }
  render() {
    const styles = this.getStyles();
    return (
      <div style={[
        styles.base,
        this.props.style
      ]}>
        {"Legend"}
      </div>
    );
  }
}

export default Legend;


/*********************************
**********************************
**********************************
**********************************
** Legend
**********************************
**********************************
**********************************
*********************************/

/*

const legend = d3.select("#legend")
  .attr("width", 280)
  .attr("height", 100);


const legendRectSize = 15;
const legendSpacing = 4;
const makeLegend = () => {

d3.select("#legend-title").html((d) => {
  if (colorBy === "ep") {
    return "Epitope mutations";
  }
  if (colorBy === "ne") {
    return "Non-epitope mutations";
  }
  if (colorBy === "rb") {
    return "Receptor binding mutations";
  }
  if (colorBy === "lbi") {
    return "Local branching index";
  }
  if (colorBy === "region") {
    return "Region";
  }
  if (colorBy === "genotype") {
    return "Genotype";
  }
  if (colorBy === "date") {
    return "Date";
  }
  if (colorBy === "cHI") {
    return "log<sub>2</sub> titer distance from root";
  }
  if (colorBy === "HI_dist") {
    return "log<sub>2</sub> titer distance from " + focusNode.strain;
  }
  if (colorBy === "dfreq") {
    const tmp_nmonth = Math.round(12 * dfreq_dn * time_step);
    let tmp_text = "Freq. change (" + tmp_nmonth + " month";
    if (tmp_nmonth > 1) {
      tmp_text += "s";
    }
    return tmp_text + ")";
  }
  if (colorBy === "fitness") {
    return "Relative fitness";
  }
});

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

const count = colorScale.domain().length;
const stack = Math.ceil(count / 2);
d3.select("#legend")
  .attr("height", stack * (legendRectSize + legendSpacing) + legendSpacing);

const tmp_leg = legend.selectAll(".legend")
  .data(colorScale.domain())
  .enter().append("g")
  .attr("class", "legend")
  .attr("transform", (d, i) => {
    const fromRight = Math.floor(i / stack);
    const fromTop = i % stack;
    const horz = fromRight * 145 + 5;
    const vert = fromTop * (legendRectSize + legendSpacing) + 5;
    return "translate(" + horz + "," + vert + ")";
  });

tmp_leg.append("rect")
  .attr("width", legendRectSize)
  .attr("height", legendRectSize)
  .style("fill", (d) => {
    const col = colorScale(d);
    return d3.rgb(col).brighter([0.35]).toString();
  })
  .style("stroke", (d) => {
    const col = colorScale(d);
    return d3.rgb(col).toString();
  })
  .on("mouseover", (leg) => {
    treeplot.selectAll(".tip") //highlight all tips corresponding to legend
      .filter((d) => { return legend_match(leg, d); })
      .attr("r", (d) => { return tipRadius(d) * 1.7; })
      .style("fill", (t) => {
        return d3.rgb(tipFillColor(t)).brighter();
      });
  })
  .on("mouseout", (leg) => {
    treeplot.selectAll(".tip") //undo highlight
      .filter((d) => { return legend_match(leg, d);})
      .attr("r", (d) => { return tipRadius(d); })
      .style("fill", (t) => {
        return d3.rgb(tipFillColor(t));
      });
  });

tmp_leg.append("text")
  .attr("x", legendRectSize + legendSpacing + 5)
  .attr("y", legendRectSize - legendSpacing)
  .text((d) => {
    let label = d.toString().replace(/([a-z])([A-Z])/g, "$1 $2").replace(/,/g, ", ");
    if (colorBy === "dfreq") {
      label += "\u00D7";
    }
    return label;
  })
  .on("mouseover", (leg) => {
    treeplot.selectAll(".tip")
      .filter((d) => {return legend_match(leg, d);})
      .attr("r", (d) => {return tipRadius(d) * 1.7;})
      .style("fill", (t) => {
        return d3.rgb(tipFillColor(t)).brighter();
      });
  })
  .on("mouseout", (leg) => {
    treeplot.selectAll(".tip")
      .filter((d) => {return legend_match(leg, d);})
      .attr("r", (d) => {return tipRadius(d); })
      .style("fill", (t) => {
        return d3.rgb(tipFillColor(t));
      });
  });
return tmp_leg;
};

const removeLegend = () => {
legend.selectAll(".legend")
.remove();
};
*/
