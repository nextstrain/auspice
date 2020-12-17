import React from "react";
import { withTheme } from 'styled-components';
import * as icons from "../framework/svg-icons";
import { NODE_VISIBLE } from "../../util/globals";
import { materialButton } from "../../globalStyles";
import * as helpers from "./helperFunctions";
import { getNumSelectedTips } from "../info/info";
import { getFullAuthorInfoFromNode } from "../../util/treeMiscHelpers";

const RectangularTreeIcon = withTheme(icons.RectangularTree);
const PanelsGridIcon = withTheme(icons.PanelsGrid);
const MetaIcon = withTheme(icons.Meta);
const iconWidth = 25;

/**
 * A React Component displaying buttons which trigger data-downloads. Intended for display within the
 * larger Download modal component
 */
export const DownloadButtons = ({dispatch, t, tree, entropy, metadata, colorBy, mutType, panelsToDisplay, panelLayout, filters, visibility, visibleStateCounts, relevantPublications}) => {
  const totalTipCount = metadata.mainTreeNumTips;
  const selectedTipsCount = getNumSelectedTips(tree.nodes, tree.visibility);
  const partialData = selectedTipsCount !== totalTipCount;
  const filePrefix = getFilePrefix();

  return (
    <>
      <div style={{fontWeight: 500, marginTop: "0px", marginBottom: "20px"}}>
        {partialData ?
          `The current view is displaying data for ${selectedTipsCount}/${totalTipCount} tips. Downloaded data is representative of this (i.e. it is a subset of the entire dataset).` :
          `Download data for the entire dataset (${totalTipCount} tips).`
        }
      </div>
      <Button
        name="Tree (Newick)"
        description="Phylogenetic tree in Newick format with branch lengths in units of divergence."
        icon={<RectangularTreeIcon width={iconWidth} selected />}
        onClick={() => helpers.exportTree({isNewick: true, dispatch, filePrefix, tree, temporal: false})}
      />
      <Button
        name="TimeTree (Newick)"
        description="Phylogenetic tree in Newick format with branch lengths measured in years."
        icon={<RectangularTreeIcon width={iconWidth} selected />}
        onClick={() => helpers.exportTree({isNewick: true, dispatch, filePrefix, tree, temporal: true})}
      />
      <Button
        name="Tree (Nexus)"
        description="Phylogeny in Nexus format with branch lengths in units of divergence. Colorings are included as annotations."
        icon={<RectangularTreeIcon width={iconWidth} selected />}
        onClick={() => helpers.exportTree({dispatch, filePrefix, tree, colorings: metadata.colorings, colorBy, temporal: false})}
      />
      <Button
        name="TimeTree (Nexus)"
        description="Phylogeny in Neexus format with branch lengths measured in years. Colorings are included as annotations."
        icon={<RectangularTreeIcon width={iconWidth} selected />}
        onClick={() => helpers.exportTree({dispatch, filePrefix, tree, colorings: metadata.colorings, colorBy, temporal: true})}
      />
      <Button
        name="Metadata (TSV)"
        description={`Per-sample metadata (n = ${selectedTipsCount}).`}
        icon={<MetaIcon width={iconWidth} selected />}
        onClick={() => helpers.strainTSV(dispatch, filePrefix, tree.nodes, metadata.colorings, tree.visibility)}
      />
      {helpers.areAuthorsPresent(tree) && (
        <Button
          name="Author Metadata (TSV)"
          description={`Metadata for ${selectedTipsCount} samples grouped by their ${getNumUniqueAuthors(tree.nodes, tree.visibility)} authors.`}
          icon={<MetaIcon width={iconWidth} selected />}
          onClick={() => helpers.authorTSV(dispatch, filePrefix, tree)}
        />
      )}
      {entropy.loaded && (
        <Button
          name="Genetic diversity data (TSV)"
          description={`The data behind the diversity panel showing ${entropy.showCounts?`a count of changes across the tree`:`normalised shannon entropy`} per ${mutType==="nuc"?"nucleotide":"codon"}.`}
          icon={<MetaIcon width={iconWidth} selected />}
          onClick={() => helpers.entropyTSV(dispatch, filePrefix, entropy, mutType)}
        />
      )}
      <Button
        name="Screenshot (SVG)"
        description="Screenshot of the current nextstrain display in SVG format; CC-BY licensed."
        icon={<PanelsGridIcon width={iconWidth} selected />}
        onClick={() => helpers.SVG(
          dispatch,
          t,
          metadata,
          tree.nodes,
          filters,
          visibility,
          visibleStateCounts,
          getFilePrefix(),
          panelsToDisplay,
          panelLayout,
          relevantPublications
        )}
      />
    </>
  );
};

/**
 * React Component for an individual button
 */
function Button({name, description, icon, onClick}) {
  const buttonTextStyle = Object.assign({}, materialButton, {backgroundColor: "rgba(0,0,0,0)", paddingLeft: "10px", color: "white", minWidth: "300px", textAlign: "left" });
  const buttonLabelStyle = { fontStyle: "italic", fontSize: "14px", color: "lightgray" };
  return (
    <div key={name} onClick={onClick} style={{cursor: 'pointer' }}>
      {icon}
      <button style={buttonTextStyle} name={name}>
        {name}
      </button>
      <div style={{ display: "inline-block", height: "30px", verticalAlign: "top", paddingTop: "6px" }}>
        <label style={buttonLabelStyle} htmlFor={name}>
          {description}
        </label>
      </div>
    </div>
  );
}

function getNumUniqueAuthors(nodes, nodeVisibilities) {
  const authors = new Set(nodes
    .filter((n, i) => nodeVisibilities[i] === NODE_VISIBLE && n.inView)
    .map((n) => getFullAuthorInfoFromNode(n))
    .filter((a) => a && a.value)
    .map((a) => a.value)
  );
  return authors.size;
}

function getFilePrefix() {
  return "nextstrain_" +
    window.location.pathname
        .replace(/^\//, '')       // Remove leading slashes
        .replace(/:/g, '-')       // Change ha:na to ha-na
        .replace(/\//g, '_');     // Replace slashes with spaces
}
