/* eslint no-restricted-syntax: 0 */
import { infoNotification, warningNotification } from "../../actions/notifications";
import { spaceBetweenTrees } from "../tree/tree";
import { getTraitFromNode, getDivFromNode, getFullAuthorInfoFromNode, getVaccineFromNode, getAccessionFromNode } from "../../util/treeMiscHelpers";
import { numericToCalendar } from "../../util/dateHelpers";
import { NODE_VISIBLE } from "../../util/globals";
import { datasetSummary } from "../info/datasetSummary";
import { isColorByGenotype } from "../../util/getGenotype";

export const isPaperURLValid = (d) => {
  return (
    Object.prototype.hasOwnProperty.call(d, "paper_url") &&
    !d.paper_url.endsWith('/') &&
    d.paper_url !== "?"
  );
};

/* this function based on https://github.com/daviddao/biojs-io-newick/blob/master/src/newick.js */
const treeToNewick = (tree, temporal, internalNodeNames=false, nodeAnnotation=() => "") => {
  const getXVal = temporal ? (n) => getTraitFromNode(n, "num_date") : getDivFromNode;

  function recurse(node, parentX) {
    if (!node.inView || tree.visibility[node.arrayIdx]!==NODE_VISIBLE) {
      return "";
    }
    if (node.hasChildren) {
      const childSubtrees = node.children.map((child) => {
        const subtree = recurse(child, getXVal(node));
        return subtree;
      });
      return `(${childSubtrees.filter((t) => !!t).join(",")})` +
        `${internalNodeNames?node.name:""}${nodeAnnotation(node)}:${getXVal(node) - parentX}`;
    }
    /* terminal node */
    const leaf = `${node.name}${nodeAnnotation(node)}:${getXVal(node) - parentX}`;
    return leaf;
  }

  const rootNode = tree.nodes[tree.idxOfInViewRootNode];
  const rootXVal = getXVal(rootNode);
  return recurse(rootNode, rootXVal) + ";";
};

const MIME = {
  text: "text/plain;charset=utf-8;",
  csv: 'text/csv;charset=utf-8;',
  tsv: `text/tab-separated-values;charset=utf-8;`,
  svg: "image/svg+xml;charset=utf-8"
};

const treeToNexus = (tree, colorings, colorBy, temporal) => {
  /**
   * Create a NEXUS-type node-annotation conforming with BEAST export format
   * For example:
   * [&country=Thailand,region=SoutheastAsia,lbi=0.3355275145752664,gt-NS1_349=M]
   * Simple key+value pairs look like `key=value` (value can be string or numeric & doesn't need to be quoted.
   * Ranges can be included like `key={v1,v2}` (v1,v2 are usually numeric)
   * Square brackets cannot be in the key or value, neither can curly brackets (except as noted above)
   * not can commas or equals signs, except as noted above.
   * We also strip non-latin characters, which cause issues for FigTree
   *
   * We export all node_attrs which are colorings, as well as divergence if the tree is temporally scaled.
   * If the current color-by is a genotype, we export this.
   */
  const makeNodeAnnotation = () => {
    const t = (x) => String(x).replace(/[[\]{}=,]/g, '').replace(/[\u0250-\ue007]/g, '');
    const genotype = isColorByGenotype(colorBy) ? t(colorBy.replace(/,/g, '/')) : undefined;
    return (node) => {
      const annotations = [];
      Object.keys(colorings).forEach((c) => {
        if (c.includes("_lab") || c.includes("author")) return;
        const v = getTraitFromNode(node, c);
        if (v) {
          annotations.push(`${t(c)}=${t(v)}`);
          const conf = getTraitFromNode(node, c, {confidence: true});
          if (Array.isArray(conf) && conf.length===2) {
            annotations.push(`${t(c)}_CI={${conf.map((cv) => t(cv)).join(",")}}`);
          }
        }
      });
      if (genotype) {
        annotations.push(`${genotype}=${t(node.currentGt.replace(/\s/g, ""))}`);
      }
      if (temporal) { // if temporal metric, export `div` as an attr if it exists
        const div = getDivFromNode(node);
        if (div!==undefined) annotations.push(`div=${div}`);
      }
      if (!annotations.length) return ``;
      return `[&${annotations.join(',')}]`;
    };
  };
  return [
    '#nexus',
    'begin trees;',
    "  tree one = "+treeToNewick(tree, temporal, true, makeNodeAnnotation()),
    "end;"
  ].join("\n");
};

const write = (filename, type, content) => {
  /* https://stackoverflow.com/questions/18848860/javascript-array-to-csv/18849208#comment59677504_18849208 */
  const blob = new Blob([content], { type: type });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const areAuthorsPresent = (tree) => {
  for (let i=0; i<tree.nodes.length; i++) {
    if (getFullAuthorInfoFromNode(tree.nodes[i])) {
      return true;
    }
  }
  return false;
};

/**
 * Create & write a TSV file where each row is an author,
 * with the relevent information (num isolates, journal etcetera)
 */
export const authorTSV = (dispatch, filePrefix, tree) => {
  const lineArray = [];
  lineArray.push(["Author", "n (strains)", "publication title", "journal", "publication URL", "strains"].join("\t"));
  const filename = filePrefix + "_authors.tsv";
  const UNKNOWN = "unknown";
  const info = {};
  tree.nodes
    .filter((n, i) => tree.visibility[i] === NODE_VISIBLE && n.inView)
    .filter((n) => !n.hasChildren).forEach((n) => {
      const author = getFullAuthorInfoFromNode(n);
      if (!author) return;
      if (info[author.value]) {
        /* this author has been seen before */
        info[author.value].count += 1;
        info[author.value].strains.push(n.name);
      } else {
        /* author as-yet unseen */
        info[author.value] = {
          author: author.value,
          title: author.title || UNKNOWN,
          journal: author.journal || UNKNOWN,
          url: isPaperURLValid(author) ? author.paper_url : UNKNOWN,
          count: 1,
          strains: [n.name]
        };
      }
    });
  Object.values(info).forEach((v) => {
    lineArray.push([v.author, v.count, v.title, v.journal, v.url, v.strains.join(",")].join("\t"));
  });

  write(filename, MIME.tsv, lineArray.join("\n"));
  dispatch(infoNotification({message: "Author metadata exported", details: filename}));
};

/**
 * Create & write a TSV file where each row is a strain in the tree,
 * with the relevent information (accession, traits, etcetera).
 * Only visible nodes (tips) will be included in the file.
 */
export const strainTSV = (dispatch, filePrefix, nodes, colorings, nodeVisibilities) => {

  /* traverse the tree & store tip information. We cannot write this out as we go as we don't know
  exactly which header fields we want until the tree has been traversed. */
  const tipTraitValues = {};
  const headerFields = ["Strain"];

  for (const [i, node] of nodes.entries()) {
    if (node.hasChildren) continue; /* we only consider tips */

    if (nodeVisibilities[i] !== NODE_VISIBLE || !node.inView) {
      continue;
    }

    tipTraitValues[node.name] = {Strain: node.name};
    if (!node.node_attrs) continue; /* if this is not set then we don't have any node info! */

    /* collect values (as writable strings) of the same "traits" as can be viewed by the modal displayed
    when clicking on tips. Note that "num_date", "author" and "vaccine" are considered seperately below */
    const nodeAttrsToIgnore = ["author", "div", "num_date", "vaccine", "accession"];
    const traits = Object.keys(node.node_attrs).filter((k) => !nodeAttrsToIgnore.includes(k));
    for (const trait of traits) {
      if (!headerFields.includes(trait)) headerFields.push(trait);
      const value = getTraitFromNode(node, trait);
      if (value) {
        if (typeof value === 'string') {
          tipTraitValues[node.name][trait] = value;
        } else if (typeof value === "number") {
          tipTraitValues[node.name][trait] = parseFloat(value).toFixed(2);
        }
      }
    }

    /* handle `num_date` specially */
    const numDate = getTraitFromNode(node, "num_date");
    if (numDate) {
      const traitName = "Collection Data"; // can cusomise as desired. Will appear in header.
      if (!headerFields.includes(traitName)) headerFields.push(traitName);
      const numDateConfidence = getTraitFromNode(node, "num_date", {confidence: true});
      if (numDateConfidence && numDateConfidence[0] !== numDateConfidence[1]) {
        tipTraitValues[node.name][traitName] = `${numericToCalendar(numDate)} (${numericToCalendar(numDateConfidence[0])} - ${numericToCalendar(numDateConfidence[1])})`;
      } else {
        tipTraitValues[node.name][traitName] = numericToCalendar(numDate);
      }
    }

    /* handle `author` specially */
    const fullAuthorInfo = getFullAuthorInfoFromNode(node);
    if (fullAuthorInfo) {
      const traitName = "Author";
      if (!headerFields.includes(traitName)) headerFields.push(traitName);
      tipTraitValues[node.name][traitName] = fullAuthorInfo.value;
      if (isPaperURLValid(fullAuthorInfo)) {
        tipTraitValues[node.name][traitName] += ` (${fullAuthorInfo.paper_url})`;
      }
    }

    /* handle `vaccine` specially */
    const vaccine = getVaccineFromNode(node);
    if (vaccine && vaccine.selection_date) {
      const traitName = "Vaccine Selection Date";
      if (!headerFields.includes(traitName)) headerFields.push(traitName);
      tipTraitValues[node.name][traitName] = vaccine.selection_date;
    }

    /* handle `accession` specially */
    const accession = getAccessionFromNode(node);
    if (accession) {
      const traitName = "Accession";
      if (!headerFields.includes(traitName)) headerFields.push(traitName);
      tipTraitValues[node.name][traitName] = accession;
    }
  }

  /* turn the information into a string to be written */
  // for the header, attempt to use titles defined via metadata->colorings where possible
  const header = headerFields.map((n) => {
    return (colorings && colorings[n] && colorings[n].title) ? colorings[n].title : n;
  });
  const linesToWrite = [header.join("\t")];
  for (const data of Object.values(tipTraitValues)) {
    const thisLine = [];
    for (const trait of headerFields) {
      thisLine.push(data[trait] || "");
    }
    linesToWrite.push(thisLine.join("\t"));
  }

  /* write out information we've collected */
  const filename = `${filePrefix}_metadata.tsv`;
  write(filename, MIME.tsv, linesToWrite.join("\n"));
  dispatch(infoNotification({message: `Metadata exported to ${filename}`}));
};

export const exportTree = ({dispatch, filePrefix, tree, isNewick, temporal, colorings, colorBy}) => {
  try {
    const fName = `${filePrefix}_${temporal?'timetree':'tree'}.${isNewick?'nwk':'nexus'}`;
    const treeString = isNewick ? treeToNewick(tree, temporal) : treeToNexus(tree, colorings, colorBy, temporal);
    write(fName, MIME.text, treeString);
    dispatch(infoNotification({message: `${temporal ? "TimeTree" : "Tree"} written to ${fName}`}));
  } catch (err) {
    console.error(err);
    dispatch(warningNotification({message: "Error saving tree!"}));
  }
};

const processXMLString = (input) => {
  /* split into bounding tag, and inner paths / shapes etc */
  const parts = input.match(/^(<.+?>)(.+)<\/.+?>$/);
  if (!parts) return undefined;

  /* extract width & height from the initial <g> bounding group */
  const dimensions = parts[1].match(/width.+?([0-9.]+).+height.+?([0-9.]+)/);

  if (!dimensions) return undefined;
  /* the map uses transform3d & viewbox */
  const viewbox = parts[1].match(/viewBox="([0-9-]+)\s([0-9-]+)\s([0-9-]+)\s([0-9-]+)"/);
  return {
    x: 0,
    y: 0,
    viewbox: viewbox ? viewbox.slice(1) : undefined,
    width: parseFloat(dimensions[1]),
    height: parseFloat(dimensions[2]),
    inner: parts[2]
  };
};

/* take the panels (see processXMLString for struct) and calculate the overall size of the SVG
as well as the offsets (x, y) to position panels appropriately within this */
const createBoundingDimensionsAndPositionPanels = (panels, panelLayout, numLinesOfText) => {
  const padding = 50;
  let width = 0;
  let height = 0;

  /* calculating the width of the tree panel is harder if there are two trees */
  if (panels.secondTree) {
    panels.secondTree.x = spaceBetweenTrees + panels.tree.width;
    panels.tree.width += (spaceBetweenTrees + panels.secondTree.width);
  }

  if (panels.tree && panels.map) {
    if (panelLayout === "grid") {
      width = panels.tree.width + padding + panels.map.width;
      height = Math.max(panels.tree.height, panels.map.height);
      panels.map.x = panels.tree.width + padding;
    } else {
      width = Math.max(panels.tree.width, panels.map.width);
      height = panels.tree.height + padding + panels.map.height;
      panels.map.y = panels.tree.height + padding;
    }
  } else if (panels.tree) {
    width = panels.tree.width;
    height = panels.tree.height;
  } else if (panels.map) {
    width = panels.map.width;
    height = panels.map.height;
  }

  if (panels.entropy) {
    if (width < panels.entropy.width) {
      width = panels.entropy.width;
    } else {
      panels.entropy.x = (width - panels.entropy.width) / 2;
    }
    if (height) {
      panels.entropy.y = height + padding;
      height += padding + panels.entropy.height;
    } else {
      height = panels.entropy.height;
    }
  }
  if (panels.frequencies) {
    if (width < panels.frequencies.width) {
      width = panels.frequencies.width;
    } else {
      panels.frequencies.x = (width - panels.frequencies.width) / 2;
    }
    if (height) {
      panels.frequencies.y = height + padding;
      height += padding + panels.frequencies.height;
    } else {
      height = panels.frequencies.height;
    }
  }

  /* add top&left padding */
  for (let key in panels) { // eslint-disable-line
    if (panels[key]) {
      panels[key].x += padding;
      panels[key].y += padding;
    }
  }
  width += padding*2;
  height += padding*2;
  const textHeight = numLinesOfText * 36 + 20;
  height += textHeight;

  return {
    width,
    height,
    padding,
    textY: height - textHeight,
    textHeight
  };
};

const injectAsSVGStrings = (output, key, data) => {
  const svgTag = `<svg id="${key}" width="${data.width}" height="${data.height}" x="${data.x}" y="${data.y}">`;
  // if (data.viewbox) svgTag = svgTag.replace(">", ` viewBox="${data.viewbox.join(" ")}">`);
  output.push(svgTag);
  output.push(data.inner);
  output.push("</svg>");
};

/* define actual writer as a closure, because it may need to be triggered asyncronously */
const writeSVGPossiblyIncludingMap = (dispatch, filePrefix, panelsInDOM, panelLayout, textStrings, map) => {
  const errors = [];
  /* for each panel present in the DOM, create a data structure with the dimensions & the paths/shapes etc */
  const panels = {tree: undefined, map: undefined, entropy: undefined, frequencies: undefined};
  if (panelsInDOM.indexOf("tree") !== -1) {
    try {
      panels.tree = processXMLString((new XMLSerializer()).serializeToString(document.getElementById("MainTree")));
      panels.treeLegend = processXMLString((new XMLSerializer()).serializeToString(document.getElementById("TreeLegendContainer")));
    } catch (e) {
      panels.tree = undefined;
      errors.push("tree");
      console.error("Tree SVG save error:", e);
    }
    if (panels.tree && document.getElementById('SecondTree')) {
      try {
        panels.secondTree = processXMLString((new XMLSerializer()).serializeToString(document.getElementById("SecondTree")));
        if (document.getElementById('Tangle')) {
          panels.tangle = processXMLString((new XMLSerializer()).serializeToString(document.getElementById("Tangle")));
        }
      } catch (e) {
        errors.push("second tree / tanglegram");
        console.error("Second Tree / tanglegram SVG save error:", e);
      }
    }
  }
  if (panelsInDOM.indexOf("entropy") !== -1) {
    try {
      panels.entropy = processXMLString((new XMLSerializer()).serializeToString(document.getElementById("d3entropyParent")));
      panels.entropy.inner = panels.entropy.inner.replace(/<text/g, `<text class="txt"`);
      panels.entropy.inner = `<style>.txt { font-family: "Lato", "Helvetica Neue", "Helvetica", "sans-serif"; }</style>${panels.entropy.inner}`;
    } catch (e) {
      panels.entropy = undefined;
      errors.push("entropy");
      console.error("Entropy SVG save error:", e);
    }
  }
  if (panelsInDOM.indexOf("frequencies") !== -1) {
    try {
      panels.frequencies = processXMLString((new XMLSerializer()).serializeToString(document.getElementById("d3frequenciesSVG")));
    } catch (e) {
      panels.frequencies = undefined;
      errors.push("frequencies");
      console.error("Frequencies SVG save error:", e);
    }
  }
  if (panelsInDOM.indexOf("map") !== -1 && map) {
    panels.map = {
      x: 0,
      y: 0,
      viewbox: undefined,
      width: parseFloat(map.mapDimensions.x),
      height: parseFloat(map.mapDimensions.y),
      inner: map.mapSvg
    };
  }

  /* collect all panels as individual <svg> elements inside a bounding <svg> tag, and write to file */
  const output = [];
  /* logic for extracting the overall width etc */
  const overallDimensions = createBoundingDimensionsAndPositionPanels(panels, panelLayout, textStrings.length);
  output.push(`<svg xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" width="${overallDimensions.width}" height="${overallDimensions.height}">`);
  for (let key in panels) { // eslint-disable-line
    if (panels[key]) {
      injectAsSVGStrings(output, key, panels[key]); // modifies output in place
    }
  }
  /* add text to bottom of SVG in HTML format */
  output.push(`<foreignObject x="${overallDimensions.padding}" y="${overallDimensions.height - overallDimensions.textHeight}" height="${overallDimensions.textHeight}" width="${overallDimensions.width - 2*overallDimensions.padding}">`);
  textStrings.forEach((s) => {
    output.push(`<p xmlns="http://www.w3.org/1999/xhtml" style="font-family:lato,sans-serif;">`);
    output.push(s);
    output.push("</p>");
  });
  output.push("</foreignObject>");

  output.push("</svg>");
  // console.log(panels)
  // console.log(output)
  write(filePrefix + ".svg", MIME.svg, output.join("\n"));

  if (!errors.length) {
    dispatch(infoNotification({
      message: "Vector image saved",
      details: filePrefix + ".svg"
    }));
  } else {
    dispatch(warningNotification({
      message: "Vector image saved",
      details: `Saved to ${filePrefix}.svg, however there were errors with ${errors.join(", ")}`
    }));
  }
};

export const SVG = (dispatch, t, metadata, nodes, filters, visibility, visibleStateCounts, filePrefix, panelsInDOM, panelLayout, publications) => {
  /* make the text strings */
  const textStrings = [];
  textStrings.push(metadata.title);
  textStrings.push(`Last updated ${metadata.updated}`);
  const address = window.location.href.replace(/&/g, '&amp;');
  textStrings.push(`Downloaded from <a href="${address}">${address}</a> on ${new Date().toLocaleString()}`);
  textStrings.push(datasetSummary({
    mainTreeNumTips: metadata.mainTreeNumTips,
    nodes,
    filters,
    visibility,
    visibleStateCounts,
    t
  }));
  textStrings.push("");
  textStrings.push(`${t("Data usage part 1")} A full list of sequence authors is available via <a href="https://nextstrain.org">nextstrain.org</a>.`);
  textStrings.push(`Visualizations are licensed under CC-BY.`);
  textStrings.push(`Relevant publications:`);
  publications.forEach((pub) => {
    textStrings.push(`<a href="${pub.href}">${pub.author}, ${pub.title}, ${pub.journal} (${pub.year})</a>`);
  });

  /* downloading the map tiles is an async call */
  if (panelsInDOM.indexOf("map") !== -1) {
    window.L.getMapSvg(writeSVGPossiblyIncludingMap.bind(this, dispatch, filePrefix, panelsInDOM, panelLayout, textStrings));
  } else {
    writeSVGPossiblyIncludingMap(dispatch, filePrefix, panelsInDOM, panelLayout, textStrings, undefined);
  }
};

export const entropyTSV = (dispatch, filePrefix, entropy, mutType) => {
  const lines = mutType === "nuc" ? ["base"] : ["gene\tposition"];
  lines[0] += entropy.showCounts ? "\tevents" : "\tentropy";
  entropy.bars.forEach((bar) => {
    if (mutType === "nuc") {
      lines.push(`${bar.x}\t${bar.y}`);
    } else {
      lines.push(`${bar.prot}\t${bar.codon}\t${bar.y}`);
    }
  });
  /* write out information we've collected */
  const filename = `${filePrefix}_diversity.tsv`;
  write(filename, MIME.tsv, lines.join("\n"));
  dispatch(infoNotification({message: `Diversity data exported to ${filename}`}));
};

