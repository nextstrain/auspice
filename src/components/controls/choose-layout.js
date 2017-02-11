import React from "react";
import RectangularTreeLayout from "../framework/svg-tree-layout-rectangular";
import RadialTreeLayout from "../framework/svg-tree-layout-radial";
import UnrootedTreeLayout from "../framework/svg-tree-layout-unrooted";
import ClockTreeLayout from "../framework/svg-tree-layout-clock";
import {materialButton, materialButtonSelected, medGrey} from "../../globalStyles";
import { connect } from "react-redux";
import { CHANGE_LAYOUT } from "../../actions/types";
import { modifyURLquery } from "../../util/urlHelpers";

@connect((state) => {
  return {
    layout: state.controls.layout
  };
})
class ChooseLayout extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }
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
           modifyURLquery(this.context.router, {l: "rect"}, true);
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
           modifyURLquery(this.context.router, {l: "radial"}, true);
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
           modifyURLquery(this.context.router, {l: "unrooted"}, true);
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
           modifyURLquery(this.context.router, {l: "clock"}, true);
         }}>
         <span style={styles.title}> {"clock"} </span>
       </button>
       </div>
     </div>
   );
 }


}

export default ChooseLayout;
