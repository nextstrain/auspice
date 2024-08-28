import React from "react";
import { infoPanelStyles } from "../../../globalStyles";
import { numericToCalendar } from "../../../util/dateHelpers";
import { getTipColorAttribute } from "../../../util/colorHelpers";
import { isColorByGenotype, decodeColorByGenotype } from "../../../util/getGenotype";
import { getTraitFromNode, getDivFromNode, getVaccineFromNode,
  getFullAuthorInfoFromNode, getTipChanges, getBranchMutations } from "../../../util/treeMiscHelpers";
import { isValueValid, strainSymbol } from "../../../util/globals";
import { formatDivergence, getIdxOfInViewRootNode } from "../phyloTree/helpers";
import { parseIntervalsOfNsOrGaps } from "./MutationTable";
import { nodeDisplayName } from "./helpers";

export const InfoLine = ({name, value, padBelow=false}) => {
  const renderValues = () => {
    if (!value && value !== 0) return null;
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

/**
 * A React component to display information about the branch's time & divergence (where applicable)
 * @param  {Object} props
 * @param  {Object} props.node branch node currently highlighted
 */
const BranchLength = ({node, t}) => {
  const elements = []; // elements to render
  const divergence = getDivFromNode(node);
  const numDate = getTraitFromNode(node, "num_date");

  if (divergence) {
    elements.push(<InfoLine name={t("Divergence")+":"} value={formatDivergence(divergence)} key="div"/>);
  }

  if (numDate !== undefined) {
    const date = numericToCalendar(numDate);
    const numDateConfidence = getTraitFromNode(node, "num_date", {confidence: true});
    if (numDateConfidence && numDateConfidence[0] !== numDateConfidence[1]) {
      elements.push(<InfoLine name={t("Inferred Date")+":"} value={date} key="inferredDate"/>);
      const dateRange = [numericToCalendar(numDateConfidence[0]), numericToCalendar(numDateConfidence[1])];
      if (dateRange[0] !== dateRange[1]) {
        elements.push(<InfoLine name={t("Date Confidence Interval")+":"} value={`(${dateRange[0]}, ${dateRange[1]})`} key="dateConf"/>);
      }
    } else {
      elements.push(<InfoLine name={t("Date")+":"} value={date} key="date"/>);
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
 * @param  {object} props.colorings
 */
const ColorBy = ({node, colorBy, colorByConfidence, colorScale, colorings}) => {
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
    // <InfoLine name="Author:" value={authorInfo.value}/> This is already displayed by AttributionInfo
    return (
      <>
        {authorInfo.title ? <InfoLine name="Title:" value={authorInfo.title}/> : null}
        {authorInfo.journal ? <InfoLine name="Journal:" value={authorInfo.journal}/> : null}
      </>
    );
  }
  /* general case */
  const name = (colorings && colorings[colorBy] && colorings[colorBy].title) ?
    colorings[colorBy].title :
    colorBy;
  const value = getTraitFromNode(node, colorBy);

  /* case where the colorScale is temporal */
  if (colorScale.scaleType==="temporal" && typeof value === "number") {
    return <InfoLine name={`${name}:`} value={numericToCalendar(value)}/>;
  }

  /* helper function to avoid code duplication */
  const showCurrentColorByWithoutConfidence = () => {
    return isValueValid(value) ?
      <InfoLine name={`${name}:`} value={value}/> :
      null;
  };

  /* handle trait confidences with lots of edge cases.
  This can be much improved upon resolution of https://github.com/nextstrain/augur/issues/386 */
  if (colorByConfidence === true) {
    const confidenceData = getTraitFromNode(node, colorBy, {confidence: true});
    if (!confidenceData) {
      console.error("couldn't find confidence vals for ", colorBy);
      return null;
    }
    /* if it's a tip with one confidence value > 0.99 then we interpret this as a known (i.e. not inferred) state */
    if (!node.hasChildren && Object.keys(confidenceData).length === 1 && Object.values(confidenceData)[0] > 0.99) {
      return showCurrentColorByWithoutConfidence();
    }
    const vals = Object.keys(confidenceData)
      .filter((v) => isValueValid(v))
      .sort((a, b) => confidenceData[a] > confidenceData[b] ? -1 : 1)
      .slice(0, 4)
      .map((v) => `${v} (${(100 * confidenceData[v]).toFixed(0)}%)`);
    if (!vals.length) return null; // can happen if values are invalid
    return <InfoLine name={`${name} (confidence):`} value={vals}/>;
  }
  return showCurrentColorByWithoutConfidence();
};

/**
 * A React Component to display summary counts of changes between a tip node & the root
 * @param  {Object} props
 * @param  {Object} props.node     branch node which is currently highlighted
 */
const TipMutations = ({node, t}) => {
  const changes = getTipChanges(node);
  if (!changes.nuc) return null; // can happen on trees with no mutations defined
  const nucCounts = {changes: 0, gaps: 0, reversionsToRoot: 0, ns: 0};
  const aaCounts = {changes: 0, gaps: 0, reversionsToRoot: 0};
  Object.keys(changes)
    .forEach((gene) => {
      Object.entries(changes[gene]).forEach(([key, muts]) => {
        if (gene==="nuc") {
          nucCounts[key] += muts.length;
        } else {
          aaCounts[key] += muts.length;
        }
      });
    });
  let ntSummary = `${nucCounts.changes}${nucCounts.reversionsToRoot ? ` + ${nucCounts.reversionsToRoot} reversions to root`: ''}`;
  ntSummary += `${nucCounts.gaps ? ` + ${nucCounts.gaps} gaps`: ''}${nucCounts.nt ? ` + ${nucCounts.nt} Ns`: ''}`;
  let aaSummary = `${aaCounts.changes}${aaCounts.reversionsToRoot ? ` + ${aaCounts.reversionsToRoot} reversions to root`: ''}`;
  aaSummary += `${aaCounts.gaps ? ` + ${aaCounts.gaps} gaps`: ''}`;
  return [
    <InfoLine name={t("Nucleotide changes")+":"} value={ntSummary} key="nuc"/>,
    <InfoLine name={t("Amino Acid changes")+":"} value={aaSummary} key="aa"/>
  ];
};

/**
 * A React Component to Display AA / NT mutations, if present.
 * @param  {Object} props
 * @param  {Object} props.node     branch node which is currently highlighted
 * @param  {Object} props.geneSortFn function to sort a list of genes
 * @param  {Object} props.observedMutations counts of all observed mutations across the tree

 */
const BranchMutations = ({node, geneSortFn, observedMutations, t}) => {
  if (!node.branch_attrs || !node.branch_attrs.mutations) return null;
  const elements = []; // elements to render
  const mutations = node.branch_attrs.mutations;

  const categorisedMutations = getBranchMutations(node, observedMutations);

  const subset = (muts, maxNum) =>
    muts.slice(0, Math.min(maxNum, muts.length)).join(", ") +
    (muts.length > maxNum ? ` + ${muts.length-maxNum} more` : '');

  /* --------- NUCLEOTIDE MUTATIONS --------------- */
  if (categorisedMutations.nuc) {
    const nDisplay = 5; // max number of mutations to display per category
    if (categorisedMutations.nuc.unique.length) {
      elements.push(<InfoLine name='Unique Nucleotide mutations:' value={subset(categorisedMutations.nuc.unique, nDisplay)} key="nuc_unique"/>);
    }
    if (categorisedMutations.nuc.homoplasies.length) {
      elements.push(<InfoLine name='Homoplasic mutations:' value={subset(categorisedMutations.nuc.homoplasies, nDisplay)} key="nuc_homoplasies"/>);
    }
    if (categorisedMutations.nuc.reversionsToRoot.length) {
      elements.push(<InfoLine name='Reversions to Root:' value={categorisedMutations.nuc.reversionsToRoot.length} key="nuc_rtr"/>);
    }
    if (categorisedMutations.nuc.gaps.length) {
      const value = `${parseIntervalsOfNsOrGaps(categorisedMutations.nuc.gaps).length} regions, ${categorisedMutations.nuc.gaps.length}bp.`;
      elements.push(<InfoLine name='Gaps:' value={value} key="nuc_gaps"/>);
    }
    if (categorisedMutations.nuc.undeletions.length) {
      const value = `${parseIntervalsOfNsOrGaps(categorisedMutations.nuc.undeletions).length} regions, ${categorisedMutations.nuc.undeletions.length}bp.`;
      elements.push(<InfoLine name='Undeletions:' value={value} key="nuc_undeletions"/>);
    }
    if (categorisedMutations.nuc.ns.length) {
      const value = `${parseIntervalsOfNsOrGaps(categorisedMutations.nuc.ns).length} regions, ${categorisedMutations.nuc.ns.length}bp.`;
      elements.push(<InfoLine name='Ns:' value={value} key="nuc_ns"/>);
    }
  } else {
    elements.push(<InfoLine name={t("No nucleotide mutations")} value="" key="nuc"/>);
  }

  /* --------- AMINO ACID MUTATIONS --------------- */
  /* AA mutations are found at `mutations[prot_name]` -> Array of strings */
  const prots = Object.keys(mutations)
    .sort(geneSortFn)
    .filter((v) => v !== "nuc");

  const mutationsToDisplay = {};
  let shouldDisplay = false;

  for (const prot of prots) {
    const muts = mutations[prot].filter((mut) => !mut.endsWith("X"));
    if (muts.length) {
      mutationsToDisplay[prot] = muts;
      shouldDisplay = true;
    }
  }
  if (shouldDisplay) {
    const nDisplay = 3; // number of mutations to display per protein
    const nProtsToDisplay = 7; // max number of proteins to display
    const mutationsToRender = [];
    Object.keys(mutationsToDisplay).forEach((prot, idx) => {
      if (idx < nProtsToDisplay) {
        let x = prot + ":\u00A0\u00A0" + mutationsToDisplay[prot].slice(0, Math.min(nDisplay, mutationsToDisplay[prot].length)).join(", ");
        if (mutationsToDisplay[prot].length > nDisplay) {
          x += " + " + t("{{x}} more", {x: mutationsToDisplay[prot].length - nDisplay});
        }
        mutationsToRender.push(x);
      } else if (idx === nProtsToDisplay) {
        mutationsToRender.push(`(${t("protein mutations truncated")})`);
      }
    });
    elements.push(<InfoLine name={t("AA mutations")+":"} value={mutationsToRender} key="aa"/>);
  } else if (mutations.nuc && mutations.nuc.length) {
    /* we only print "No amino acid mutations" if we didn't already print
    "No nucleotide mutations" above */
    elements.push(<InfoLine name={t("No amino acid mutations")} key="aa"/>);
  }

  return elements;
};

/**
 * A React component to render the descendent(s) of the current branch
 * @param  {Object} props
 * @param  {Object} props.node  branch node which is currently highlighted
 */
const BranchDescendants = ({node, t, tipLabelKey}) => {
  const [name, value] = node.fullTipCount === 1 ?
    [nodeDisplayName(t, node, tipLabelKey, true), ""] :
    [t("Number of descendants")+":", node.fullTipCount];
  return <InfoLine name={name} value={value} padBelow/>;
};

/**
 * A React component to show vaccine information, if present
 * @param  {Object} props
 * @param  {Object} props.node  branch node which is currently highlighted
 */
const VaccineInfo = ({node, t}) => {
  const vaccineInfo = getVaccineFromNode(node);
  if (!vaccineInfo) return null;
  const renderElements = [];
  if (vaccineInfo.selection_date) {
    renderElements.push(<InfoLine name={t("Vaccine selected")+":"} value={vaccineInfo.selection_date} key="seldate"/>);
  }
  if (vaccineInfo.start_date) {
    renderElements.push(<InfoLine name={t("Vaccine start date")+":"} value={vaccineInfo.start_date} key="startdate"/>);
  }
  if (vaccineInfo.end_date) {
    renderElements.push(<InfoLine name={t("Vaccine end date")+":"} value={vaccineInfo.end_date} key="enddate"/>);
  }
  if (vaccineInfo.serum) {
    renderElements.push(<InfoLine name={t("Serum strain")} key="serum"/>);
  }
  return renderElements;
};

/**
 * A React component to show attribution information, if present
 * @param  {Object} props
 * @param  {Object} props.node  branch node which is currently highlighted
 */
const AttributionInfo = ({node}) => {
  const renderElements = [];
  const authorInfo = getFullAuthorInfoFromNode(node);
  if (authorInfo) {
    renderElements.push(<InfoLine name="Author:" value={authorInfo.value} key="author"/>);
  }

  /* The `gisaid_epi_isl` is a special value attached to nodes introduced during the 2019 nCoV outbreak.
  If set, we display this extra piece of information on hover */
  const gisaid_epi_isl = getTraitFromNode(node, "gisaid_epi_isl");
  if (isValueValid(gisaid_epi_isl)) {
    const epi_isl = gisaid_epi_isl.split("_")[2];
    renderElements.push(<InfoLine name="GISAID EPI ISL:" value={epi_isl} key="gisaid_epi_isl"/>);
  }

  return renderElements;
};

const Container = ({node, panelDims, children}) => {

  const xOffset = 10;
  const yOffset = 10;

  let width = 200;
  if (panelDims.width < 420) {
    width = 200;
  } else if (panelDims.width < 460) {
    width = 220;
  } else if (panelDims.width < 500) {
    width = 240;
  } else if (panelDims.width < 540) {
    width = 260;
  } else {
    width = 280;
  }

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
  if (xPos < panelDims.width * 0.5) {
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
  selectedNode,
  colorBy,
  colorByConfidence,
  colorScale,
  panelDims,
  colorings,
  geneSortFn,
  observedMutations,
  tipLabelKey,
  t
}) => {
  if (!selectedNode) return null
  const node = selectedNode.node.n; // want the redux node, not the phylo node
  const idxOfInViewRootNode = getIdxOfInViewRootNode(node);
  return (
    <Container node={node} panelDims={panelDims}>
      {selectedNode.isBranch===false ? (
        <>
          <div style={infoPanelStyles.tooltipHeading}>
            {nodeDisplayName(t, node, tipLabelKey, false)}
          </div>
          {tipLabelKey!==strainSymbol && <InfoLine name="Node name:" value={node.name}/>}
          <VaccineInfo node={node} t={t}/>
          <TipMutations node={node} t={t}/>
          <BranchLength node={node} t={t}/>
          <ColorBy node={node} colorBy={colorBy} colorByConfidence={colorByConfidence} colorScale={colorScale} colorings={colorings}/>
          <AttributionInfo node={node}/>
          <Comment>{t("Click on tip to display more info")}</Comment>
        </>
      ) : (
        <>
          <BranchDescendants node={node} t={t} tipLabelKey={tipLabelKey}/>
          <BranchMutations node={node} geneSortFn={geneSortFn} observedMutations={observedMutations} t={t}/>
          <BranchLength node={node} t={t}/>
          <ColorBy node={node} colorBy={colorBy} colorByConfidence={colorByConfidence} colorScale={colorScale} colorings={colorings}/>
          <Comment>
            {idxOfInViewRootNode === node.arrayIdx ? t('Click to zoom out to parent clade') : t('Click to zoom into clade')}
          </Comment>
          <Comment>{t("Shift + Click to display more info")}</Comment>
        </>
      )}
    </Container>
  );
};

export default HoverInfoPanel;
