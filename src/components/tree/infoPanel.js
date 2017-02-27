/*eslint-env browser*/
import React from "react";
import * as globals from "../../util/globals";
import {dataFont, infoPanelStyles} from "../../globalStyles";
import { prettyString } from "./tipSelectedPanel";

const InfoPanel = ({tree, hovered, responsive, viewer}) => {

  /* this is a function - we can bail early */
  if (!(tree && hovered)) {
    return null
  }

  /**
   * This maps tree coordinates to coordinates on the svg.
   * @param  {float} x
   * @param  {float}} y
   * @param  {reactSVGpanZoom} V viewer state
   * @return {[x,y]} point on plane
   */
  const treePosToViewer = (x,y, V) =>{
    const dx = (x*V.a + V.e); //this is the distance form the upper left corner
    const dy = (y*V.d + V.f); //at the current zoome level
    return {x: dx, y: dy};
  }

  /* I have no idea how these should acually be calculated, but apparently
  they are relative to the HTML body */
  const viewerState = viewer.getValue();
  const xOffset = 10;
  const yOffset = 10;

  const width = 200;
  const pos = treePosToViewer(hovered.d.xTip, hovered.d.yTip, viewerState);

  const styles = {
    container: {
      position: "absolute",
      width,
      padding: "10px",
      borderRadius: 10,
      zIndex: 1000,
      pointerEvents: "none",
      fontFamily: infoPanelStyles.panel.fontFamily,
      fontSize: 14,
      lineHeight: 1,
      fontWeight: infoPanelStyles.panel.fontWeight,
      color: infoPanelStyles.panel.color,
      backgroundColor: infoPanelStyles.panel.backgroundColor,
      wordWrap: "break-word",
    }
  };
  if (pos.x<viewerState.viewerWidth*0.7){
    styles.container.left = pos.x + xOffset;
  }else{
    styles.container.right = viewerState.viewerWidth-pos.x + xOffset;
  }
  if (pos.y<viewerState.viewerHeight*0.7){
    styles.container.top = pos.y + 4*yOffset;
  }else{
    styles.container.bottom = viewerState.viewerHeight-pos.y+yOffset;
  }

  /* getX methods return styled JSX */
  const getMutations = (d) => {
    let mutations = "";
    if ((typeof d.muts !== "undefined") && (globals.mutType === "nuc") && (d.muts.length)) {
      const numMutsToShow = 5;
      let tmp_muts = d.muts;
      const nmuts = tmp_muts.length;
      tmp_muts = tmp_muts.slice(0, Math.min(numMutsToShow, nmuts));
      mutations += tmp_muts.join(", ");
      if (nmuts > numMutsToShow) {
        mutations += " + " + (nmuts - numMutsToShow) + " more";
      }
    }
    return (
      mutations !== "" ?
      <span>Mutations at {mutations}</span> :
      <span>No mutations</span>
    );
  };
  const getFrequencies = (d) => {
    if (d.frequency !== undefined) {
      const disp = "Frequency: " + (100 * d.frequency).toFixed(1) + "%";
      return (<li>{disp}</li>);
    }
    return null;
  }

  const makeInfoPanel = () => {
    if (hovered.type === ".tip") {
      const tip = hovered.d;
      return (
        <div style={styles.container}>
          <div className={"tooltip"} style={infoPanelStyles.tooltip}>
            <div style={infoPanelStyles.tooltipHeading}>
              {tip.n.attr.strain}
            </div>
            <div>
              {prettyString(tip.n.attr.country)}, {prettyString(tip.n.attr.date)}
            </div>
            <div style={infoPanelStyles.comment}>
              Click on tip to display more info
            </div>
          </div>
        </div>
      );
    } else { /* BRANCH */
      const branch = hovered.d;
      return (
        <div style={styles.container}>
          <div className={"tooltip"} style={infoPanelStyles.tooltip}>
            <div style={infoPanelStyles.tooltipHeading}>
              {`Branch with ${branch.n.fullTipCount} children`}
            </div>
            <div>
              {getFrequencies(branch.n)}
              {getMutations(branch.n)}
            </div>
            <div style={infoPanelStyles.comment}>
              Click on branch to zoom into this clade
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    makeInfoPanel()
  );
};

export default InfoPanel;
