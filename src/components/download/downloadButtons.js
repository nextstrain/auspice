import React from "react";
import { withTheme } from 'styled-components';
import * as icons from "../framework/svg-icons";
import { materialButton } from "../../globalStyles";
import * as helpers from "./helperFunctions";
import { getNumSelectedTips } from "../info/info";
import { getFullAuthorInfoFromNode } from "../../util/treeMiscHelpers";

const RectangularTreeIcon = withTheme(icons.RectangularTree);
const PanelsGridIcon = withTheme(icons.PanelsGrid);
const MetaIcon = withTheme(icons.Meta);

export const DownloadButtons = ({dispatch, t, tree, nodes, entropy, metadata, mutType, panelsToDisplay, panelLayout, filters, visibility, visibleStateCounts, relevantPublications}) => {
  // and with the check done to make sure the node is visible in strainTSV(),
  // so if speed becomes a concern, getNumUniqueAuthorscould alter this to just generate the list of selected nodes once,
  // on modal creation, and add it as a property on the modal
  const selectedTipsCount = getNumSelectedTips(nodes, tree.visibility);
  // likewise, this is somewhat redundant with authorTSV()
  const uniqueAuthorCount = getNumUniqueAuthors(nodes);
  const filePrefix = getFilePrefix();
  const iconWidth = 25;
  const buttons = [
    <Button
      name="Tree (Newick)"
      description="Phylogenetic tree in Newick format with branch lengths in units of divergence."
      icon={<RectangularTreeIcon width={iconWidth} selected />}
      onClick={() => helpers.newick(dispatch, filePrefix, nodes[0], false)}
    />,
    <Button
      name="TimeTree (Newick)"
      description="Phylogenetic tree in Newick format with branch lengths measured in years."
      icon={<RectangularTreeIcon width={iconWidth} selected />}
      onClick={() => helpers.newick(dispatch, filePrefix, nodes[0], true)}
    />,
    <Button
      name="All Metadata (TSV)"
      description={`Per-sample metadata for all samples in the dataset (n = ${metadata.mainTreeNumTips}).`}
      icon={<MetaIcon width={iconWidth} selected />}
      onClick={() => helpers.strainTSV(dispatch, filePrefix, nodes, metadata.colorings, false, null)}
    />
  ];
  if (selectedTipsCount > 0) {
    buttons.push(
      <Button
        name="Selected Metadata (TSV)"
        description={`Per-sample metadata for strains which are currently displayed (n = ${selectedTipsCount}/${metadata.mainTreeNumTips}).`}
        icon={<MetaIcon width={iconWidth} selected />}
        onClick={() => helpers.strainTSV(dispatch, filePrefix, nodes, metadata.colorings, true, tree.visibility)}
      />
    );
  }
  if (helpers.areAuthorsPresent(tree)) {
    buttons.push(
      <Button
        name="Author Metadata (TSV)"
        description={`Metadata for all samples in the dataset (n = ${metadata.mainTreeNumTips}) grouped by their ${uniqueAuthorCount} authors.`}
        icon={<MetaIcon width={iconWidth} selected />}
        onClick={() => helpers.authorTSV(dispatch, filePrefix, tree)}
      />
    );
  }
  if (entropy.loaded) {
    let description = `The data behind the diversity panel`;
    description += ` showing ${entropy.showCounts ? `a count of changes across the tree` : `normalised shannon entropy`}`;
    description += mutType === "nuc" ? " per nucleotide." : " per codon.";
    if (selectedTipsCount !== metadata.mainTreeNumTips) {
      description += ` Restricted to strains which are currently displayed (n = ${selectedTipsCount}/${metadata.mainTreeNumTips}).`;
    }
    buttons.push(
      <Button
        name="Genetic diversity data (TSV)"
        description={description}
        icon={<MetaIcon width={iconWidth} selected />}
        onClick={() => helpers.entropyTSV(dispatch, filePrefix, entropy, mutType)}
      />
    );
  }
  buttons.push(
    <Button
      name="Screenshot (SVG)"
      description="Screenshot of the current nextstrain display in SVG format; CC-BY licensed."
      icon={<PanelsGridIcon width={iconWidth} selected />}
      onClick={() => helpers.SVG(
        dispatch,
        t,
        metadata,
        nodes,
        filters,
        visibility,
        visibleStateCounts,
        getFilePrefix(),
        panelsToDisplay,
        panelLayout,
        relevantPublications
      )}
    />
  );
  return buttons;
};

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

function getNumUniqueAuthors(nodes) {
  const authors = nodes.map((n) => getFullAuthorInfoFromNode(n))
    .filter((a) => a && a.value);
  const uniqueAuthors = new Set(authors.map((a) => a.value));
  return uniqueAuthors.size;
}

export function getFilePrefix() {
  return "nextstrain_" +
    window.location.pathname
        .replace(/^\//, '')       // Remove leading slashes
        .replace(/:/g, '-')       // Change ha:na to ha-na
        .replace(/\//g, '_');     // Replace slashes with spaces
}
