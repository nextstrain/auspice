import React from "react";
import { infoPanelStyles } from "../../../globalStyles";
import { numericToCalendar } from "../../../util/dateHelpers";
import { getTipColorAttribute } from "../../../util/colorHelpers";
import { isColorByGenotype, decodeColorByGenotype } from "../../../util/getGenotype";
import { getTraitFromNode, getDivFromNode, getVaccineFromNode, getFullAuthorInfoFromNode } from "../../../util/treeMiscHelpers";

const InfoLine = ({name, value, padBelow=false}) => {
  return (
    <div style={padBelow ? {} : {paddingBottom: "10px"}} key={name}>
      <span style={{fontWeight: "500"}}>
        {name + " "}
      </span>
      {value ? (
        <span style={{fontWeight: "300"}}>
          {value}
        </span>
      ) : null}
    </div>
  );
};

const InfoBlock = ({name, values}) => (
  <div style={{paddingBottom: "7px"}}>
    <p style={{marginBottom: "-0.7em", fontWeight: "500"}}>
      {name}
    </p>
    {values.map((k) => (
      <p key={k} style={{fontWeight: "300", marginBottom: "-0.9em", marginLeft: "0em"}}>
        {k}
      </p>
    ))}
    <br/>
  </div>
);

const StrainName = ({name}) => (
  <div style={infoPanelStyles.tooltipHeading}>
    {name}
  </div>
);


/**
 * A React component to display information about the branch length (divergence or time)
 * @param  {Object} props
 * @param  {string} props.distanceMeasure
 * @param  {Object} props.node                branch node currently highlighted
 * @param  {bool}   props.temporalConfidence
 */
const BranchLength = ({distanceMeasure, node, temporalConfidence}) => {
  if (distanceMeasure === "div") {
    return <InfoLine name="Divergence:" value={getDivFromNode(node).toExponential(3)}/>;
  }
  const date = numericToCalendar(getTraitFromNode(node, "num_date"));
  let dateRange = false;
  const dConf = getTraitFromNode(node, "num_date", {confidence: true});
  if (temporalConfidence && dConf) {
    dateRange = [numericToCalendar(dConf[0]), numericToCalendar(dConf[1])];
  }
  if (dateRange && dateRange[0] !== dateRange[1]) {
    return (
      <>
        <InfoLine name="Inferred Date:" value={date}/>
        <InfoLine name="Date Confidence Interval:" value={`(${dateRange[0]}, ${dateRange[1]})`}/>
      </>
    );
  }
  return <InfoLine name="Date:" value={date}/>;
};

/**
 * A React component to display information about the colorBy for a branch,
 * potentially including a table with confidences.
 * @param  {Object} props
 * @param  {Object} props.node              branch node currently highlighted
 * @param  {bool}   props.colorByConfidence should these (colorBy conf) be displayed, if applicable?
 * @param  {string} props.colorBy
 */
const BranchColorBy = ({node, distanceMeasure, temporalConfidence, colorByConfidence, colorBy}) => {
  if (isColorByGenotype(colorBy)) {
    return null; /* muts ahave already been displayed */
  }
  if (colorBy === "num_date") {
    /* if colorBy is date and branch lengths are divergence we should still show node date */
    return (colorBy !== distanceMeasure) ? (
      <BranchLength distanceMeasure={colorBy} node={node} temporalConfiden={temporalConfidence}/>
    ) : null;
  }
  if (colorByConfidence === true) {
    const confidenceData = getTraitFromNode(node, colorBy, {confidence: true});
    if (!confidenceData) {
      console.error("Error - couldn't find confidence vals for ", colorBy);
      return null;
    }
    const vals = Object.keys(confidenceData)
      .sort((a, b) => confidenceData[a] > confidenceData[b] ? -1 : 1)
      .slice(0, 4)
      .map((v) => `${v} (${(100 * confidenceData[v]).toFixed(0)}%)`);
    return <InfoBlock name={`${colorBy} (confidence):`} values={vals}/>;
  }
  return <InfoLine name={colorBy} value={getTraitFromNode(node, colorBy)}/>;
};

/**
 * A React Component to Display AA / NT mutations, if present.
 * @param  {Object} props
 * @param  {Object} props.node     branch node which is currently highlighted
 * @param  {string} props.mutType  "AA" or "nuc"
 */
const Mutations = ({node, mutType}) => {
  if (!node.branch_attrs || !node.branch_attrs.mutations) return null;
  const mutations = node.branch_attrs.mutations;
  /* Nt mutations are found at `mutations.nuc` -> Array of strings */
  /* AA mutations are found at `mutations[prot_name]` -> Array of strings */

  if (mutType === "nuc") {
    if (mutations.nuc && mutations.nuc.length) {
      const nDisplay = 9; // max number of mutations to display
      const nGapDisp = 4; // max number of gaps/Ns to display

      // gather muts with N/-
      const ngaps = mutations.nuc.filter((mut) => {
        return mut.slice(-1) === "N" || mut.slice(-1) === "-"
          || mut.slice(0, 1) === "N" || mut.slice(0, 1) === "-";
      });
      const gapLen = ngaps.length; // number of mutations that exist with N/-

      // gather muts without N/-
      const nucs = mutations.nuc.filter((mut) => {
        return mut.slice(-1) !== "N" && mut.slice(-1) !== "-"
          && mut.slice(0, 1) !== "N" && mut.slice(0, 1) !== "-";
      });
      const nucLen = nucs.length; // number of mutations that exist without N/-

      let m = nucs.slice(0, Math.min(nDisplay, nucLen)).join(", ");
      m += nucLen > nDisplay ? " + " + (nucLen - nDisplay) + " more" : "";
      let mGap = ngaps.slice(0, Math.min(nGapDisp, gapLen)).join(", ");
      mGap += gapLen > nGapDisp ? " + " + (gapLen - nGapDisp) + " more" : "";

      if (gapLen === 0) {
        return <InfoLine name="Nucleotide mutations:" value={m}/>;
      }
      if (nucLen === 0) {
        return <InfoLine name="Gap/N mutations:" value={mGap}/>;
      }
      return (
        <>
          <InfoLine name="Nucleotide mutations:" value={m}/>
          <InfoLine name="Gap/N mutations:" value={mGap}/>
        </>
      );

    }
    return <InfoLine name="No nucleotide mutations" value=""/>;
  }
  if (mutType === "aa") {
    /* calculate protein -> num(mutations) */
    const prots = Object.keys(mutations).filter((v) => v !== "nuc");
    const nMutsPerProt = {};
    let totalMuts = 0;
    for (const prot of prots) {
      nMutsPerProt[prot] = mutations[prot].length;
      totalMuts += mutations[prot].length;
    }
    if (!totalMuts) {
      return <InfoLine name="No amino acid mutations"/>;
    }
    const nDisplay = 3; // number of mutations to display per protein
    const nProtsToDisplay = 7; // max number of proteins to display
    let protsRendered = 0;
    const mutationsToRender = [];
    prots.forEach((prot) => {
      if (nMutsPerProt[prot] && protsRendered < nProtsToDisplay) {
        let x = prot + ":\u00A0\u00A0" + mutations[prot].slice(0, Math.min(nDisplay, nMutsPerProt[prot])).join(", ");
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
    return <InfoBlock name="AA mutations:" values={mutationsToRender}/>;
  }
  /* if mutType is neither "aa" nor "muc" then render nothing */
  return null;
};

/**
 * A React component to render the descendent(s) of the current branch
 * @param  {Object} props
 * @param  {Object} props.node  branch node which is currently highlighted
 */
const BranchDescendents = ({node}) => {
  const [name, value] = node.fullTipCount === 1 ?
    ["Branch leading to", node.name] :
    ["Number of descendants:", node.fullTipCount];
  return <InfoLine name={name} value={value} padBelow/>;
};

/**
 * A React component to display information about the colorBy for a tip
 * @param  {Object} props
 * @param  {Object} props.node               branch node which is currently highlighted
 * @param  {string} props.colorBy
 * @param  {string} props.distanceMeasure
 * @param  {bool}   props.temporalConfidence
 * @param  {func}   props.colorScale
 */
const TipColorBy = ({node, colorBy, distanceMeasure, temporalConfidence, colorScale}) => {
  if (colorBy === "num_date") {
    if (distanceMeasure === "num_date") return null;
    return <BranchLength distanceMeasure={colorBy} node={node} temporalConfiden={temporalConfidence}/>;
  } else if (colorBy === "author") {
    const authorInfo = getFullAuthorInfoFromNode(node);
    if (!authorInfo) return null;
    return (
      <>
        <InfoLine name="Author:" value={authorInfo.value}/>
        {authorInfo.title ? <InfoLine name="Title:" value={authorInfo.title}/> : null}
        {authorInfo.journal ? <InfoLine name="Journal:" value={authorInfo.journal}/> : null}
      </>
    );
  } else if (isColorByGenotype(colorBy)) {
    const genotype = decodeColorByGenotype(colorBy);
    const key = genotype.aa ?
      `Amino Acid at ${genotype.gene} site ${genotype.positions.join(", ")}:` :
      `Nucleotide at pos ${genotype.positions.join(", ")}:`;
    const state = getTipColorAttribute(node, colorScale);
    return <InfoLine name={key} value={state}/>;
  }
  return <InfoLine name={`${colorBy}:`} value={getTraitFromNode(node, colorBy)}/>;
};

/**
 * A React component to show vaccine information, if present
 * @param  {Object} props
 * @param  {Object} props.node  branch node which is currently highlighted
 */
const VaccineInfo = ({node}) => {
  const vaccineInfo = getVaccineFromNode(node);
  if (!vaccineInfo) return null;
  const renderElements = [];
  if (vaccineInfo.selection_date) {
    renderElements.push(<InfoLine name="Vaccine selected:" value={vaccineInfo.selection_date}/>);
  }
  if (vaccineInfo.start_date) {
    renderElements.push(<InfoLine name="Vaccine start date:" value={vaccineInfo.start_date}/>);
  }
  if (vaccineInfo.end_date) {
    renderElements.push(<InfoLine name="Vaccine end date:" value={vaccineInfo.end_date}/>);
  }
  if (vaccineInfo.serum) {
    renderElements.push(<InfoLine name="Serum strain"/>);
  }
  return renderElements;
};

const Container = ({node, panelDims, children}) => {
  const xOffset = 10;
  const yOffset = 10;
  const width = 200;

  /* this adjusts the x-axis for the right tree in dual tree view */
  const xPos = node.shell.that.params.orientation[0] === -1 ?
    panelDims.width / 2 + panelDims.spaceBetweenTrees + node.shell.xTip :
    node.shell.xTip;
  const yPos = node.shell.yTip;
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


  return (
    <div style={styles.container}>
      <div className={"tooltip"} style={infoPanelStyles.tooltip}>
        {children}
      </div>
    </div>
  );
};

const Comment = ({children}) => (
  <div style={infoPanelStyles.comment}>
    {children}
  </div>
);

const HoverInfoPanel = ({
  mutType,
  temporalConfidence,
  distanceMeasure,
  hovered,
  colorBy,
  colorByConfidence,
  colorScale,
  panelDims
}) => {
  if (!hovered) return null;
  const node = hovered.d.n;
  return (
    <Container node={node} panelDims={panelDims}>
      {hovered.type === ".tip" ? (
        <>
          <StrainName name={node.name}/>
          <VaccineInfo node={node}/>
          <TipColorBy node={node} colorBy={colorBy} distanceMeasure={distanceMeasure} temporalConfidence={temporalConfidence} colorScale={colorScale}/>
          <BranchLength distanceMeasure={distanceMeasure} node={node} temporalConfidence={temporalConfidence}/>
          <Comment>Click on tip to display more info</Comment>
        </>
      ) : (
        <>
          <BranchDescendents node={node}/>
          <Mutations node={node} mutType={mutType}/>
          <BranchLength distanceMeasure={distanceMeasure} node={node} temporalConfidence={temporalConfidence}/>
          <BranchColorBy node={node} distanceMeasure={distanceMeasure} temporalConfidence={temporalConfidence} colorByConfidence={colorByConfidence} colorBy={colorBy}/>
          <Comment>Click to zoom into clade</Comment>
        </>
      )}
    </Container>
  );
};

export default HoverInfoPanel;
