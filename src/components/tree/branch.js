import React from "react";
import Radium from "radium";
import d3 from "d3";
// import _ from "lodash";
import { connect } from "react-redux";
import { BRANCH_MOUSEENTER, BRANCH_MOUSELEAVE } from "../../actions/controls";


@connect()
@Radium
class Branch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

    };
  }
  static propTypes = {
    /* react */
    dispatch: React.PropTypes.func,
    params: React.PropTypes.object,
    routes: React.PropTypes.array,
    /* component api */
    style: React.PropTypes.object,
    branchStrokeWidth: React.PropTypes.number,
    branchStrokeColor: React.PropTypes.string,
    xscale: React.PropTypes.func,
    yscale: React.PropTypes.func,
    datum: React.PropTypes.object
  }
  static defaultProps = {
    branchStrokeWidth: 1,
    branchStrokeColor: "darkgrey"
  }
  getStyles() {
    return {
      base: {

      }
    };
  }
  setupFreqScale() {
    return d3.scale.sqrt().domain([0, 1]).range([1, 10]);
  }
  branchPoints() {
    // const freqScale = this.setupFreqScale();
    // const mod = 0.5 * freqScale(d.target.frequency) - freqScale(0);

    const mod = 0;

    if (this.props.layout=='rectangular'){
      return 'M'+(this.props.source_x - mod).toString() +
        " " +
        this.props.source_y.toString() +
        " L " +
        (this.props.source_x - mod).toString() +
        " " +
        this.props.target_y.toString() +
        " L " +
        (this.props.target_x).toString() +
        " " +
        this.props.target_y.toString();
    }else if (this.props.layout=='radial'){
      var tmp_d = 'M '+(this.props.source_x).toString() +
        "  " +
        this.props.source_y.toString() +
        " A " +
        this.pros.r_x.toString() +
        " " +
        this.props.r_y.toString() +
        " 0 0 1 " +
        ((this.props.target_x-this.props.center)*rinner/router+this.props.center).toString() +
        " " +
        ((this.props.target_y-this.props.center)*rinner/router+this.props.center).toString() +
        " L " +
        this.props.target_x.toString() +
        " " +
        this.props.target_y.toString();
      return tmp_d;
    }
  }
  render() {
    return (
      <path
        d={this.branchPoints()}
        onMouseEnter={() => {
          this.props.dispatch({
            type: BRANCH_MOUSEENTER,
            /*
              send the source and target nodes in the action,
              use x and y values in them to place tooltip
            */
            data: this.props.datum
          });
        }}
        onMouseLeave={() => {
          this.props.dispatch({ type: BRANCH_MOUSELEAVE });
        }}
        style={{
          stroke: this.props.branchStrokeColor,
          strokeWidth: this.props.branchStrokeWidth,
          strokeLinejoin: "round",
          fill: "none",
          cursor: "pointer"
        }}></path>
    );
  }
}

export default Branch;


//   .on("mouseover", (d) => { /* todo */
//     if ((colorBy !== "genotype") & (typeof addClade !== "undefined")) {
//       clade_freq_event = setTimeout(addClade, 1000, d);
//     }
//   })
//   .on("mouseout", (d) => {
//     // linkTooltip.hide(d);
//     if (typeof addClade !== "undefined") {
//       clearTimeout(clade_freq_event);
//     };
//   })
//   .on("click", zoom);
