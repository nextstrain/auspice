import React from "react";
import RectangularTreeLayout from "../framework/svg-tree-layout-rectangular";
import RadialTreeLayout from "../framework/svg-tree-layout-radial";
import UnrootedTreeLayout from "../framework/svg-tree-layout-unrooted";
import ClockTreeLayout from "../framework/svg-tree-layout-clock";
import {materialButton, materialButtonSelected, medGrey} from "../../globalStyles";
import { connect } from "react-redux";
import { CHANGE_LAYOUT } from "../../actions/controls";


@connect((state) => {
  return {
    layout: state.controls.layout
  };
})
class ChooseLayout extends React.Component {
  getStyles() {
    return {
      container: {
        marginBottom: 10
      },
      title: {
        margin: 5,
        position: "relative",
        top: -1
      }
    };
  }

  setLayoutQueryParam(title) {
    const location = this.props.router.getCurrentLocation();
    const newQuery = Object.assign({}, location.query, {l: title});
    this.props.router.push({
      pathname: location.pathname,
      query: newQuery
    });
  }

  render() {
    const styles = this.getStyles();
    const selected = this.props.layout;
    return (
      <div style={styles.container}>
        <div style={{margin: 5}}>
          <RectangularTreeLayout width={25} stroke={medGrey}/>
          <button
            key={1}
            style={selected === "rect" ? materialButtonSelected : materialButton}
            onClick={() => {
              this.props.dispatch({ type: CHANGE_LAYOUT, data: "rect" });
              this.setLayoutQueryParam("rect");
            }}>
          <span style={styles.title}> {"rectangular"} </span>
          </button>
        </div>
        <div style={{margin: 5}}>
          <RadialTreeLayout width={25} stroke={medGrey}/>
          <button
            key={2}
            style={selected === "radial" ? materialButtonSelected : materialButton}
            onClick={() => {
              this.props.dispatch({ type: CHANGE_LAYOUT, data: "radial" });
              this.setLayoutQueryParam("radial");
            }}>
            <span style={styles.title}> {"radial"} </span>
          </button>
        </div>
        <div style={{margin: 5}}>
          <UnrootedTreeLayout width={25} stroke={medGrey}/>
          <button
            key={3}
            style={selected === "unrooted" ? materialButtonSelected : materialButton}
            onClick={() => {
              this.props.dispatch({ type: CHANGE_LAYOUT, data: "unrooted" });
              this.setLayoutQueryParam("unrooted");
            }}>
            <span style={styles.title}> {"unrooted"} </span>
          </button>
        </div>
        <div style={{margin: 5}}>
          <ClockTreeLayout width={25} stroke={medGrey}/>
          <button
            key={4}
            style={selected === "clock" ? materialButtonSelected : materialButton}
            onClick={() => {
              this.props.dispatch({ type: CHANGE_LAYOUT, data: "clock" });
              this.setLayoutQueryParam("clock");
            }}>
            <span style={styles.title}> {"clock"} </span>
          </button>
        </div>
      </div>
    );
  }

}

export default ChooseLayout;
