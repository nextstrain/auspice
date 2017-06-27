/*eslint-env browser*/
import React from "react";
import { infoPanelStyles } from "../../globalStyles";
import { prettyString } from "./treeViewFunctions";
import { floatDateToMoment } from "../../util/dateHelpers";
import moment from "moment";

/**
 * This creates a table of the confidence values (used for opacity of branches)
 * for each of the legend items (e.g. for each country)
 * @param  {object} attrs keys: items (e.g. countries)
 * @param  {string} colorBy e.g. country. Guaranteed that colorBy + "_confidence" is
 * a valid key of attrs
 * @return {JSX} table DOM JSX
 */
const confidenceTableJSX = (attrs, colorBy) => {
  const lkey = colorBy + "_confidence";
  if (Object.keys(attrs).indexOf(lkey) === -1) {
    console.log("Error - couldn't find confidence vals for ", lkey);
    return null;
  }
  const vals = Object.keys(attrs[lkey])
    .sort((a, b) => attrs[lkey][a] > attrs[lkey][b] ? -1 : 1)
    .slice(0, 4);
  return (
    <g>
      <p style={{marginBottom: "-0.7em"}}>
        {`${prettyString(colorBy)} confidence:`}
      </p>
      {vals.map((k, i) => (
        <p key={i} style={{fontWeight: "200", marginBottom: "-0.7em", marginLeft: "1em"}}>
          {`• ${(100 * attrs[lkey][k]).toFixed(0)}% - ${prettyString(k)}`}
        </p>
      ))}
      <br/>
    </g>
  );
};

/**
 * Display information about the currently highlighed branch
 * Depends on whether confidence vals are available, whether temporal
 * confidence intervals are present etc
 * @param  {node} d branch node currently highlighted
 * @param  {bool} colorByConfidence should these (colorBy conf) be displayed, if applicable?
 * @param  {string} colorBy a valid key of attrs
 * @param  {string} distanceMeasure num_date or div
 * @param  {bool} temporalConfidence num_date_confidence valid key of d.attrs?
 * @return {JSX} to be displayed
 */
const colorByInfoJSX = (d, colorByConfidence, colorBy, distanceMeasure, temporalConfidence) => {
  if (colorBy === "num_date") { // TEMPORAL COLOURING
    if (distanceMeasure === "div") {
      return (<p>{`Divergence: ${prettyString(d.attr.div.toExponential(3))}`}</p>);
    }
    const date = floatDateToMoment(d.attr[colorBy]).format("YYYY-MM-DD");
    if (temporalConfidence) {
      return (<p>
        {`Date: ${date}`}
        <br/>
        {`Date Confidence Interval: (${floatDateToMoment(d.attr.num_date_confidence[0]).format("YYYY-MM-DD")}, ${floatDateToMoment(d.attr.num_date_confidence[1]).format("YYYY-MM-DD")})`}
      </p>);
    }
    return (<p>{`Date: ${date}`}</p>);
  } else if (colorByConfidence === true) { // COLOURING WITH CONFIDENCES PRESENT
    return confidenceTableJSX(d.attr, colorBy);
  } else if (colorBy.slice(0, 2) === "gt") { // COLOURING BY GENOTYPE
    return null; /* display nothing for genotypes */
  }
  /* the default: just show the attr value */
  return (<p>{`${prettyString(colorBy)}: ${prettyString(d.attr[colorBy])}`}</p>);
};

/**
 * not sure when this is used...
 * @param  {node} d branch node currently highlighted
 * @return {JSX} to be displayed (or null)
 */
const getFrequenciesJSX = (d) => {
  if (d.frequency !== undefined) {
    const disp = "Frequency: " + (100 * d.frequency).toFixed(1) + "%";
    return (<p>{disp}</p>);
  }
  return null;
};


/**
 * Display AA / NT mutations in JSX
 * @param  {node} d branch node currently highlighted
 * @param  {string} mutType "AA" or "nuc"
 * @return {JSX} to be displayed (or null)
 */
const getMutationsJSX = (d, mutType) => {
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
          let x = prot + ":\u00A0\u00A0" +
            d.aa_muts[prot].slice(0, Math.min(nDisplay, counts[prot])).join(", ");
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

/**
 * This maps tree coordinates to coordinates on the svg.
 * @param  {float} x x
 * @param  {float} y y
 * @param  {reactSVGpanZoom} V viewer state
 * @return {[x,y]} point on plane
 */
const treePosToViewer = (x, y, V) => {
  const dx = (x * V.a + V.e); // this is the distance form the upper left corner
  const dy = (y * V.d + V.f); // at the current zoom level
  return {x: dx, y: dy};
};

const InfoPanel = ({
  tree, mutType, temporalConfidence, distanceMeasure, hovered, viewer, colorBy, colorByConfidence
}) => {
  /* this is a function - we can bail early */
  if (!(tree && hovered)) {
    return null;
  }
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
  if (pos.x < viewerState.viewerWidth * 0.7) {
    styles.container.left = pos.x + xOffset;
  }else{
    styles.container.right = viewerState.viewerWidth - pos.x + xOffset;
  }
  if (pos.y < viewerState.viewerHeight * 0.7) {
    styles.container.top = pos.y + 4 * yOffset;
  } else {
    styles.container.bottom = viewerState.viewerHeight - pos.y + yOffset;
  }

  const tip = hovered.type === ".tip";
  const d = hovered.d;
  let inner;
  if (tip) {
    inner = (
      <div>
        {prettyString(d.n.attr.country)}, {prettyString(d.n.attr.date)}
      </div>
    );
  } else {
    inner = (
      <div>
        {getFrequenciesJSX(d.n, mutType)}
        {getMutationsJSX(d.n)}
        {colorByInfoJSX(d.n, colorByConfidence, colorBy, distanceMeasure, temporalConfidence)}
      </div>
    );
  }
  return (
    <div style={styles.container}>
      <div className={"tooltip"} style={infoPanelStyles.tooltip}>
        <div style={infoPanelStyles.tooltipHeading}>
          {tip ? d.n.attr.strain : `Branch with ${d.n.fullTipCount} children`}
        </div>
        {inner}
        <div style={infoPanelStyles.comment}>
          {tip ? "Click on tip to display more info" : "Click on branch to zoom into this clade"}
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;
