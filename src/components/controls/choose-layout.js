import React from "react";
import RectangularTreeLayout from "../framework/svg-tree-layout-rectangular";
import RadialTreeLayout from "../framework/svg-tree-layout-radial";
import UnrootedTreeLayout from "../framework/svg-tree-layout-unrooted";
import ClockTreeLayout from "../framework/svg-tree-layout-clock";
import {materialButton} from "../../globalStyles";
import { connect } from "react-redux";
import { CHANGE_LAYOUT } from "../../actions/types";
import { modifyURLquery } from "../../util/urlHelpers";

@connect()
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
        marginLeft: 7,
        position: "relative",
        top: -7,
        fontWeight: 300
      }
    };
  }

  render() {
   const styles = this.getStyles();
   return (
     <div style={styles.container}>
       <button
         key={1}
         style={materialButton}
         onClick={() => {
           this.props.dispatch({ type: CHANGE_LAYOUT, data: "rect" });
           modifyURLquery(this.context.router, {l: "rect"}, true);
         }}>
         <RectangularTreeLayout width={25} stroke="rgb(130,130,130)"/>
         <span style={styles.title}> {"rectangular"} </span>
       </button>
       <button
         key={2}
         style={materialButton}
         onClick={() => {
           this.props.dispatch({ type: CHANGE_LAYOUT, data: "radial" });
           modifyURLquery(this.context.router, {l: "radial"}, true);
         }}>
         <RadialTreeLayout width={25} stroke="rgb(130,130,130)"/>
         <span style={styles.title}> {"radial"} </span>
       </button>
       <button
         key={3}
         style={materialButton}
         onClick={() => {
           this.props.dispatch({ type: CHANGE_LAYOUT, data: "unrooted" });
           modifyURLquery(this.context.router, {l: "unrooted"}, true);
         }}>
         <UnrootedTreeLayout width={25} stroke="rgb(130,130,130)"/>
         <span style={styles.title}> {"unrooted"} </span>
       </button>
       <button
         key={4}
         style={materialButton}
         onClick={() => {
           this.props.dispatch({ type: CHANGE_LAYOUT, data: "clock" });
           modifyURLquery(this.context.router, {l: "clock"}, true);
         }}>
         <ClockTreeLayout width={25} stroke="rgb(130,130,130)"/>
         <span style={styles.title}> {"clock"} </span>
       </button>
     </div>
   );
 }
}

export default ChooseLayout;
