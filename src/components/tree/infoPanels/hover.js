import React from "react";
import { infoPanelStyles } from "../../../globalStyles";
import { prettyString } from "../../../util/stringHelpers";
import { numericToCalendar } from "../../../util/dateHelpers";
import { getTipColorAttribute } from "../../../util/colorHelpers";
import { isColorByGenotype, decodeColorByGenotype } from "../../../util/getGenotype";
import { getTraitFromNode } from "../../../util/treeMiscHelpers";

const renderInfoLine = (item, value, {noPadding=false}={}) => {
  const style = noPadding ? {} : {paddingBottom: "7px"};
  return (
    <div style={style} key={item}>
      <span style={{fontWeight: "500"}}>
        {item + " "}
      </span>
      {value ? (
        <span style={{fontWeight: "300"}}>
          {value}
        </span>
      ) : null}
    </div>
  );
};

const renderInfoBlock = (item, values) => (
  <div style={{paddingBottom: "7px"}}>
    <p style={{marginBottom: "-0.7em", fontWeight: "500"}}>
      {item}
    </p>
    {values.map((k) => (
      <p key={k} style={{fontWeight: "300", marginBottom: "-0.9em", marginLeft: "0em"}}>
        {k}
      </p>
    ))}
    <br/>
  </div>
);


const renderBranchDivergence = (d) =>
  renderInfoLine("Divergence:", prettyString(d.div.toExponential(3)));


const renderBranchTime = (d, temporalConfidence) => {
  const date = numericToCalendar(d.num_date.value);
  let dateRange = false;
  if (temporalConfidence && d.num_date.confidence) {
    dateRange = [
      numericToCalendar(d.num_date.confidence[0]),
      numericToCalendar(d.num_date.confidence[1])
    ];
  }
  if (dateRange && dateRange[0] !== dateRange[1]) {
    return (
      <>
        {renderInfoLine("Inferred Date:", date)}
        {renderInfoLine("Date Confidence Interval:", `(${dateRange[0]}, ${dateRange[1]})`)}
      </>
    );
  }
  return renderInfoLine("Date:", date);
};

/**
 * Display information about the colorBy, potentially in a table with confidences
 * @param  {node} d branch node currently highlighted
 * @param  {bool} colorByConfidence should these (colorBy conf) be displayed, if applicable?
 * @param  {string} colorBy
 * @return {React Component} to be displayed
 */
const displayColorBy = (d, distanceMeasure, temporalConfidence, colorByConfidence, colorBy) => {
  if (isColorByGenotype(colorBy)) {
    return null; /* muts ahave already been displayed */
  }
  if (colorBy === "num_date") {
    /* if colorBy is date and branch lengths are divergence we should still show node date */
    return (colorBy !== distanceMeasure) ? renderBranchTime(d, temporalConfidence) : null;
  }
  if (colorByConfidence === true) {
    const confidenceData = getTraitFromNode(d, colorBy, {confidence: true});
    if (!confidenceData) {
      console.error("Error - couldn't find confidence vals for ", colorBy);
      return null;
    }
    const vals = Object.keys(confidenceData)
      .sort((a, b) => confidenceData[a] > confidenceData[b] ? -1 : 1)
      .slice(0, 4)
      .map((v) => `${prettyString(v)} (${(100 * confidenceData[v]).toFixed(0)}%)`);
    return renderInfoBlock(`${prettyString(colorBy)} (confidence):`, vals);
  }
  if (colorBy === "none") {
    return null;
  }
  return renderInfoLine(prettyString(colorBy), prettyString(getTraitFromNode(d, colorBy)));
};

/**
 * Currently not used - implement when augur outputs frequencies
 * @param  {node} d branch node currently highlighted
 * @return {JSX} to be displayed (or null)
 */
// const getFrequenciesJSX = (d) => {
//   if (d.frequency !== undefined) {
//     const disp = "Frequency: " + (100 * d.frequency).toFixed(1) + "%";
//     return (<p>{disp}</p>);
//   }
//   return null;
// };

/**
 * Display AA / NT mutations. If there are none, return `null`;
 * Nt mutations are found at `d.mutations.nuc` -> Array of strings
 * AA mutations are found at `d.mutations[prot_name]` -> Array of strings
 * @param  {node} d branch node currently highlighted
 * @param  {string} mutType "AA" or "nuc"
 * @return {React component | null}
 */
const renderMutations = (d, mutType) => {
  if (!d.mutations) return null;

  if (mutType === "nuc") {
    if (d.mutations.nuc && d.mutations.nuc.length) {
      const nDisplay = 9; // max number of mutations to display
      const nGapDisp = 4; // max number of gaps/Ns to display

      // gather muts with N/-
      const ngaps = d.mutations.nuc.filter((mut) => {
        return mut.slice(-1) === "N" || mut.slice(-1) === "-"
          || mut.slice(0, 1) === "N" || mut.slice(0, 1) === "-";
      });
      const gapLen = ngaps.length; // number of mutations that exist with N/-

      // gather muts without N/-
      const nucs = d.mutations.nuc.filter((mut) => {
        return mut.slice(-1) !== "N" && mut.slice(-1) !== "-"
          && mut.slice(0, 1) !== "N" && mut.slice(0, 1) !== "-";
      });
      const nucLen = nucs.length; // number of mutations that exist without N/-

      let m = nucs.slice(0, Math.min(nDisplay, nucLen)).join(", ");
      m += nucLen > nDisplay ? " + " + (nucLen - nDisplay) + " more" : "";
      let mGap = ngaps.slice(0, Math.min(nGapDisp, gapLen)).join(", ");
      mGap += gapLen > nGapDisp ? " + " + (gapLen - nGapDisp) + " more" : "";

      if (gapLen === 0) {
        return renderInfoLine("Nucleotide mutations:", m);
      }
      if (nucLen === 0) {
        return renderInfoLine("Gap/N mutations:", mGap);
      }
      return (
        <>
          {renderInfoLine("Nucleotide mutations:", m)}
          {renderInfoLine("Gap/N mutations:", mGap)}
        </>
      );

    }
    return renderInfoLine("No nucleotide mutations", "");
  }
  if (mutType === "aa") {
    /* calculate protein -> num(mutations) */
    const prots = Object.keys(d.mutations).filter((v) => v !== "nuc");
    const nMutsPerProt = {};
    let totalMuts = 0;
    for (const prot of prots) {
      nMutsPerProt[prot] = d.mutations[prot].length;
      totalMuts += d.mutations[prot].length;
    }
    if (!totalMuts) {
      return renderInfoLine("No amino acid mutations");
    }
    const nDisplay = 3; // number of mutations to display per protein
    const nProtsToDisplay = 7; // max number of proteins to display
    let protsRendered = 0;
    const mutationsToRender = [];
    prots.forEach((prot) => {
      if (nMutsPerProt[prot] && protsRendered < nProtsToDisplay) {
        let x = prot + ":\u00A0\u00A0" + d.mutations[prot].slice(0, Math.min(nDisplay, nMutsPerProt[prot])).join(", ");
        if (nMutsPerProt[prot] > nDisplay) {
          x += " + " + (nMutsPerProt[prot] - nDisplay) + " more";
        }
        mutationsToRender.push(x);
        protsRendered++;
        if (protsRendered === nProtsToDisplay) {
          mutationsToRender.push(`(protein mutations truncated)`);
        }
      }
    });
    return renderInfoBlock("AA mutations:", mutationsToRender);
  }
  /* if mutType is neither "aa" nor "muc" then render nothing */
  return null;
};

const getBranchDescendents = (n) => (
  <>
    {n.fullTipCount === 1 ?
      renderInfoLine("Branch leading to", n.strain) :
      renderInfoLine("Number of descendants:", n.fullTipCount)
    }
    <br style={{display: "block", lineHeight: "10px"}} />
  </>
);

const getPanelStyling = (d, panelDims) => {
  const xOffset = 10;
  const yOffset = 10;
  const width = 200;

  /* this adjusts the x-axis for the right tree in dual tree view */
  const xPos = d.that.params.orientation[0] === -1 ?
    panelDims.width / 2 + panelDims.spaceBetweenTrees + d.xTip :
    d.xTip;
  const yPos = d.yTip;
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
  if (xPos < panelDims.width * 0.6) {
    styles.container.left = xPos + xOffset;
  } else {
    styles.container.right = panelDims.width - xPos + xOffset;
  }
  if (yPos < panelDims.height * 0.55) {
    styles.container.top = yPos + 4 * yOffset;
  } else {
    styles.container.bottom = panelDims.height - yPos + yOffset;
  }
  return styles;
};

const tipDisplayColorByInfo = (d, colorBy, distanceMeasure, temporalConfidence, mutType, colorScale, authorInfo) => {
  if (colorBy === "num_date") {
    if (distanceMeasure === "num_date") return null;
    return renderBranchTime(d.n, temporalConfidence);
  }
  if (colorBy === "authors") {
    if (authorInfo[d.n.authors]) {
      return renderInfoLine("Authors:", authorInfo[d.n.authors].authors);
    }
    return null;
  }
  if (isColorByGenotype(colorBy)) {
    const genotype = decodeColorByGenotype(colorBy);
    const key = genotype.aa
      ? `Amino Acid at ${genotype.gene} site ${genotype.positions.join(", ")}`
      : `Nucleotide at pos ${genotype.positions.join(", ")}`;
    const state = getTipColorAttribute(d.n, colorScale);
    return renderInfoLine(key + ":", state);
  }
  if (colorBy === "none") {
    return null;
  }
  return renderInfoLine(prettyString(colorBy) + ":", prettyString(getTraitFromNode(d.n, colorBy)));
};

const displayVaccineInfo = (d) => {
  if (d.n.vaccine) {
    const items = [];
    if (d.n.vaccine.selection_date) {
      items.push(renderInfoLine("Vaccine selected:", d.n.vaccine.selection_date));
    }
    if (d.n.vaccine.start_date) {
      items.push(renderInfoLine("Vaccine start date:", d.n.vaccine.start_date));
    }
    if (d.n.vaccine.end_date) {
      items.push(renderInfoLine("Vaccine end date:", d.n.vaccine.end_date));
    }
    if (d.n.vaccine.serum) {
      items.push(renderInfoLine("Serum strain", ""));
    }
    return items;
  }
  return null;
};

/* the actual component - a pure function, so we can return early if needed */
const HoverInfoPanel = ({mutType, temporalConfidence, distanceMeasure,
  hovered, colorBy, colorByConfidence, colorScale, panelDims, authorInfo}) => {

  if (!hovered) return null;

  const tip = hovered.type === ".tip";
  const d = hovered.d;
  const styles = getPanelStyling(d, panelDims);
  let inner;
  if (tip) {
    inner = (
      <span>
        {displayVaccineInfo(d)}
        {tipDisplayColorByInfo(d, colorBy, distanceMeasure, temporalConfidence, mutType, colorScale, authorInfo)}
        {distanceMeasure === "div" ? renderBranchDivergence(d.n) : renderBranchTime(d.n, temporalConfidence)}
      </span>
    );
  } else {
    inner = (
      <span>
        {getBranchDescendents(d.n)}
        {/* getFrequenciesJSX(d.n, mutType) */}
        {renderMutations(d.n, mutType)}
        {distanceMeasure === "div" ? renderBranchDivergence(d.n) : renderBranchTime(d.n, temporalConfidence)}
        {displayColorBy(d.n, distanceMeasure, temporalConfidence, colorByConfidence, colorBy)}
      </span>
    );
  }
  return (
    <div style={styles.container}>
      <div className={"tooltip"} style={infoPanelStyles.tooltip}>
        <div style={infoPanelStyles.tooltipHeading}>
          {tip ? d.n.strain : null}
        </div>
        {inner}
        <p/>
        <div style={infoPanelStyles.comment}>
          {tip ? "Click on tip to display more info" : "Click to zoom into clade"}
        </div>
      </div>
    </div>
  );
};

export default HoverInfoPanel;
