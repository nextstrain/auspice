import React from "react";
import { infoPanelStyles } from "../../../globalStyles";
import { numericToCalendar } from "../../../util/dateHelpers";
import { getTipColorAttribute } from "../../../util/colorHelpers";
import { isColorByGenotype, decodeColorByGenotype } from "../../../util/getGenotype";
import { getTraitFromNode, getDivFromNode, getVaccineFromNode, getFullAuthorInfoFromNode } from "../../../util/treeMiscHelpers";

const InfoLine = ({name, value, padBelow=false}) => {
  const renderValues = () => {
    if (!value) return null;
    if (Array.isArray(value)) {
      return value.map((v) => (
        <div key={v} style={{fontWeight: "300", marginLeft: "0em"}}>
          {v}
        </div>
      ));
    }
    return (<span style={{fontWeight: "300"}}>{value}</span>);
  };

  return (
    <div style={{paddingBottom: padBelow ? "15px" : "10px"}} key={name}>
      <span style={{fontWeight: "500"}}>
        {name + " "}
      </span>
      {renderValues()}
    </div>
  );
};

const StrainName = ({name}) => (
  <div style={infoPanelStyles.tooltipHeading}>
    {name}
  </div>
);


/**
 * A React component to display information about the branch's time & divergence (where applicable)
 * @param  {Object} props
 * @param  {Object} props.node branch node currently highlighted
 */
const BranchLength = ({node}) => {
  const elements = []; // elements to render
  const divergence = getDivFromNode(node);
  const numDate = getTraitFromNode(node, "num_date");

  if (divergence) {
    elements.push(<InfoLine name="Divergence:" value={divergence.toExponential(3)} key="div"/>);
  }

  if (numDate !== undefined) {
    const date = numericToCalendar(numDate);
    const numDateConfidence = getTraitFromNode(node, "num_date", {confidence: true});
    if (numDateConfidence) {
      elements.push(<InfoLine name="Inferred Date:" value={date} key="inferredDate"/>);
      const dateRange = [numericToCalendar(numDateConfidence[0]), numericToCalendar(numDateConfidence[1])];
      if (dateRange[0] !== dateRange[1]) {
        elements.push(<InfoLine name="Date Confidence Interval:" value={`(${dateRange[0]}, ${dateRange[1]})`} key="dateConf"/>);
      }
    } else {
      elements.push(<InfoLine name="Date:" value={date} key="date"/>);
    }
  }

  return elements;
};

/**
 * A React component to display information about the colorBy for a tip/branch,
 * potentially including a table with confidences.
 * @param  {Object} props
 * @param  {Object} props.node              branch / tip node currently highlighted
 * @param  {string} props.colorBy
 * @param  {bool}   props.colorByConfidence should these (colorBy conf) be displayed, if applicable?
 * @param  {func}   props.colorScale
 */
const ColorBy = ({node, colorBy, colorByConfidence, colorScale}) => {
  if (colorBy === "num_date") {
    return null; /* date has already been displayed via <BranchLength> */
  }
  /* handle genotype as a special case */
  if (isColorByGenotype(colorBy)) {
    const genotype = decodeColorByGenotype(colorBy);
    const name = genotype.aa ?
      `Amino Acid at ${genotype.gene} site ${genotype.positions.join(", ")}:` :
      `Nucleotide at pos ${genotype.positions.join(", ")}:`;
    return <InfoLine name={name} value={getTipColorAttribute(node, colorScale)}/>;
  }
  /* handle author as a special case */
  if (colorBy === "author") {
    const authorInfo = getFullAuthorInfoFromNode(node);
    if (!authorInfo) return null;
    return (
      <>
        <InfoLine name="Author:" value={authorInfo.value}/>
        {authorInfo.title ? <InfoLine name="Title:" value={authorInfo.title}/> : null}
        {authorInfo.journal ? <InfoLine name="Journal:" value={authorInfo.journal}/> : null}
      </>
    );
  }
  /* general case */
  const name = colorBy; // TODO - use meta.colorings[colorBy].title, if it exists!
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
    return <InfoLine name={`${name} (confidence):`} value={vals}/>;
  }
  return <InfoLine name={name} value={getTraitFromNode(node, colorBy)}/>;
};

/**
 * A React Component to Display AA / NT mutations, if present.
 * @param  {Object} props
 * @param  {Object} props.node     branch node which is currently highlighted
 */
const Mutations = ({node}) => {
  if (!node.branch_attrs || !node.branch_attrs.mutations) return null;
  const elements = []; // elements to render
  const mutations = node.branch_attrs.mutations;

  /* --------- NUCLEOTIDE MUTATIONS --------------- */
  /* Nt mutations are found at `mutations.nuc` -> Array of strings */
  if (mutations.nuc && mutations.nuc.length) {
    const nDisplay = 9; // max number of mutations to display
    const nGapDisp = 4; // max number of gaps/Ns to display

    // gather muts with N/-
    const ngaps = mutations.nuc.filter((mut) => {
      return mut.slice(-1) === "N" || mut.slice(-1) === "-" ||
        mut.slice(0, 1) === "N" || mut.slice(0, 1) === "-";
    });
    const gapLen = ngaps.length; // number of mutations that exist with N/-

    // gather muts without N/-
    const nucs = mutations.nuc.filter((mut) => {
      return mut.slice(-1) !== "N" && mut.slice(-1) !== "-" &&
        mut.slice(0, 1) !== "N" && mut.slice(0, 1) !== "-";
    });
    const nucLen = nucs.length; // number of mutations that exist without N/-

    let m = nucs.slice(0, Math.min(nDisplay, nucLen)).join(", ");
    m += nucLen > nDisplay ? " + " + (nucLen - nDisplay) + " more" : "";
    let mGap = ngaps.slice(0, Math.min(nGapDisp, gapLen)).join(", ");
    mGap += gapLen > nGapDisp ? " + " + (gapLen - nGapDisp) + " more" : "";

    if (nucLen !== 0) {
      elements.push(<InfoLine name="Nucleotide mutations:" value={m} key="nuc"/>);
    }
    if (gapLen !== 0) {
      elements.push(<InfoLine name="Gap/N mutations:" value={mGap} key="gaps"/>);
    }
  } else {
    elements.push(<InfoLine name="No nucleotide mutations" value="" key="nuc"/>);
  }

  /* --------- AMINO ACID MUTATIONS --------------- */
  /* AA mutations are found at `mutations[prot_name]` -> Array of strings */
  const prots = Object.keys(mutations).filter((v) => v !== "nuc");
  const nMutsPerProt = {};
  let numberOfAaMuts = 0;
  for (const prot of prots) {
    nMutsPerProt[prot] = mutations[prot].length;
    numberOfAaMuts += mutations[prot].length;
  }
  if (numberOfAaMuts > 0) {
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
    elements.push(<InfoLine name="AA mutations:" value={mutationsToRender} key="aa"/>);
  } else if (mutations.nuc && mutations.nuc.length) {
    /* we only print "No amino acid mutations" if we didn't already print
    "No nucleotide mutations" above */
    elements.push(<InfoLine name="No amino acid mutations" key="aa"/>);
  }

  return elements;
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
 * A React component to show vaccine information, if present
 * @param  {Object} props
 * @param  {Object} props.node  branch node which is currently highlighted
 */
const VaccineInfo = ({node}) => {
  const vaccineInfo = getVaccineFromNode(node);
  if (!vaccineInfo) return null;
  const renderElements = [];
  if (vaccineInfo.selection_date) {
    renderElements.push(<InfoLine name="Vaccine selected:" value={vaccineInfo.selection_date} key="seldate"/>);
  }
  if (vaccineInfo.start_date) {
    renderElements.push(<InfoLine name="Vaccine start date:" value={vaccineInfo.start_date} key="startdate"/>);
  }
  if (vaccineInfo.end_date) {
    renderElements.push(<InfoLine name="Vaccine end date:" value={vaccineInfo.end_date} key="enddate"/>);
  }
  if (vaccineInfo.serum) {
    renderElements.push(<InfoLine name="Serum strain" key="serum"/>);
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
          <Mutations node={node}/>
          <BranchLength node={node}/>
          <ColorBy node={node} colorBy={colorBy} colorByConfidence={colorByConfidence} colorScale={colorScale}/>
          <Comment>Click on tip to display more info</Comment>
        </>
      ) : (
        <>
          <BranchDescendents node={node}/>
          <Mutations node={node}/>
          <BranchLength node={node}/>
          <ColorBy node={node} colorBy={colorBy} colorByConfidence={colorByConfidence} colorScale={colorScale}/>
          <Comment>Click to zoom into clade</Comment>
        </>
      )}
    </Container>
  );
};

export default HoverInfoPanel;
