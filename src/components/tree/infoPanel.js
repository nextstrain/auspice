/*eslint-env browser*/
import React from "react";
import * as globals from "../../util/globals";
import {dataFont, infoPanelStyles} from "../../globalStyles";
import { prettyString } from "./tipSelectedPanel";

/**
 * This creates a table of the likelihood values (used for opacity of branches)
 * for each of the legend items (e.g. for each country)
 * @param  {dictionary} l keys: items (e.g. countries), values: probabilities \in [0,1]
 * @return {JSX} table DOM JSX
 */
const likelihoodTable = (attrs, colorBy) => {
  const lkey = colorBy + "_likelihoods";
  if (Object.keys(attrs).indexOf(lkey) === -1) {
    console.log("Error - couldn't find likelihoods for ", lkey);
    return null;
  }
  const vals = Object.keys(attrs[lkey])
    .sort((a, b) => attrs[lkey][a] > attrs[lkey][b] ? -1 : 1)
    .slice(0, 4);
  return (
    <g>
      <p style={{marginBottom: "-0.7em"}}>
        {`${prettyString(colorBy)} likelihoods:`}
      </p>
      {vals.map((k, i) => (
        <p key={i} style={{fontWeight: "200", marginBottom: "-0.7em", marginLeft: "1em"}}>
          {`• ${attrs[lkey][k].toFixed(2).toString()} - ${prettyString(k)}`}
        </p>
      ))}
      <br/>
    </g>
  );
};


const InfoPanel = ({mutType, tree, hovered, viewer, colorBy, likelihoods}) => {

  /* this is a function - we can bail early */
  if (!(tree && hovered)) {
    return null;
  }
  /**
   * This maps tree coordinates to coordinates on the svg.
   * @param  {float} x x
   * @param  {float} y y
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
      wordBreak: "break-word"
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
    /* mutations are stored at:
    NUCLEOTIDE: d.muts = list of strings
    AMINO ACID: d.aa_muts = dict of proteins -> list of strings
    */
    if (mutType === "nuc") {
      if (typeof d.muts !== "undefined" && d.muts.length) {
        const nDisplay = 5; // number of mutations to display (max)
        const n = d.muts.length; // number of mutations that exist
        let m = "Nucleotide mutations: " + d.muts.slice(0, Math.min(nDisplay, n)).join(", ");
        if (n > nDisplay) {
          m += (" + " + (n - nDisplay) + " more");
        }
        return (<span>{m}</span>);
      } else {
        return (<span>No nucleotide mutations</span>);
      }
    } else if (typeof d.aa_muts !== "undefined") {
      /* are there any? */
      const prots = Object.keys(d.aa_muts);
      const counts = {};
      for (const prot of prots) {
        counts[prot] = d.aa_muts[prot].length;
      }
      if (prots.map((k) => counts[k]).reduce((a, b) => a + b, 0)) {
        const nDisplay = 3; // number of mutations to display per protein
        const m = [<span key={"init"}>AA mutations:</span>];
        prots.forEach((prot, idx) => {
          if (counts[prot]) {
            let x = prot + ":\u00A0\u00A0" + d.aa_muts[prot].slice(0, Math.min(nDisplay, counts[prot])).join(", ");
            if (counts[prot] > nDisplay) {
              x += " + " + (counts[prot] - nDisplay) + " more";
            }
            m.push(<span key={idx}><br />{x}</span>);
          }
        });
        return m;
      } else {
        return (<span>No amino acid mutations</span>);
      }
    }
    return "Error parsing mutations.";
  };
  const getFrequencies = (d) => {
    if (d.frequency !== undefined) {
      const disp = "Frequency: " + (100 * d.frequency).toFixed(1) + "%";
      return (<p>{disp}</p>);
    }
    return null;
  };
  const getColorByAttr = (d) => {
    if (colorBy.slice(0,2)!=='gt'){
      const disp = `${prettyString(colorBy)}: ${prettyString(d.attr[colorBy])}`;
      return (<p>{disp}</p>);
    }else{
      return "";
    }
  };

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
              {likelihoods === true ? likelihoodTable(branch.n.attr, colorBy) : getColorByAttr(branch.n)}
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
