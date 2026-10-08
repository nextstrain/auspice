/* eslint no-restricted-syntax: 0 */
import { unparse } from "papaparse";
import { infoNotification, warningNotification } from "../../actions/notifications";
import { spaceBetweenTrees } from "../tree/tree";
import { getTraitFromNode, getUrlFromNode, getDivFromNode, getFullAuthorInfoFromNode, getVaccineFromNode, getAccessionFromNode } from "../../util/treeMiscHelpers";
import { numericToCalendar } from "../../util/dateHelpers";
import { NODE_VISIBLE, nucleotide_gene } from "../../util/globals";
import { datasetSummary } from "../info/datasetSummary";
import { isColorByGenotype } from "../../util/getGenotype";
import { EmptyNewickTreeCreated } from "../../util/exceptions";
import { createDatasetJson } from "../../util/constructDatasetJson";
import { dataFont } from "../../globalStyles";
import { htmlToSvg } from "./domToSvg";
import { latoFontDefs } from "./embedFont";

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
    if (!node.shell.inView || tree.visibility[node.arrayIdx]!==NODE_VISIBLE) {
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

  /**
   * Try the filtered root first as this may be different from the in view root node
   * We still need to fallback on the idxOfInViewRootNode because the idxOfFilteredRoot
   * is undefined when there are no filters applied.
   */
  const rootNode = tree.nodes[tree.idxOfFilteredRoot || tree.idxOfInViewRootNode];
  const rootXVal = getXVal(rootNode);
  const newickTree = recurse(rootNode, rootXVal);
  if (!newickTree) {
    throw new EmptyNewickTreeCreated();
  }
  return newickTree + ";";
};

const MIME = {
  text: "text/plain;charset=utf-8;",
  csv: 'text/csv;charset=utf-8;',
  tsv: `text/tab-separated-values;charset=utf-8;`,
  svg: "image/svg+xml;charset=utf-8",
  json: "application/json",
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

/**
 * Create a properly formatted TSV string for given data using Papa.unparse().
 *
 * Each object within the data array should represent a single row in the
 * TSV string. All values of the object will be converted to their string
 * representation via `toString` within unparse
 * (see https://github.com/mholt/PapaParse/blame/824bbd9daf17168bddfc5485066771453cab423e/papaparse.js#L464).
 *
 * The optional columns parameter allows you to specify the specific keys to
 * use as columns in the TSV string. Note, order of column names will
 * determine order of output columns in the TSV string.
 *
 * If columns are not specified, then parser will use the keys of the first
 * Object in the data array as the columns for the TSV string.
 *
 * See Papa Parse docs for more details about config options: https://www.papaparse.com/docs#json-to-csv
 *
 * @param {Array<Object>} data
 * @param {Array<string>|null} columns
 * @returns {string}
 */
const createTsvString = (data, columns=null) => {
  return unparse(
    data,
    {
      quotes: false,
      quoteChar: '"',
      escapeChar: '"',
      delimiter: "\t",
      header: true,
      newline: "\n",
      skipEmptyLines: true,
      columns
    }
  );
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
 * with the relevant information (num isolates, journal etcetera)
 */
export const authorTSV = (dispatch, filePrefix, tree) => {
  const COUNT = "n (strains)";
  const UNKNOWN = "unknown";
  const info = {};
  tree.nodes
    .filter((n, i) => tree.visibility[i] === NODE_VISIBLE && n.shell.inView)
    .filter((n) => !n.hasChildren).forEach((n) => {
      const author = getFullAuthorInfoFromNode(n);
      if (!author) return;
      if (info[author.value]) {
        /* this author has been seen before */
        info[author.value][COUNT] += 1;
        info[author.value].strains.push(n.name);
      } else {
        /* author as-yet unseen */
        info[author.value] = {
          Author: author.value,
          "publication title": author.title || UNKNOWN,
          journal: author.journal || UNKNOWN,
          "publication URL": isPaperURLValid(author) ? author.paper_url : UNKNOWN,
          [COUNT]: 1,
          strains: [n.name]
        };
      }
    });

  /* Specify order of header fields */
  const headerFields = ["Author", COUNT, "publication title", "journal", "publication URL", "strains"];

  /* write out information we've collected */
  const filename = filePrefix + "_authors.tsv";
  write(filename, MIME.tsv, createTsvString(Object.values(info), headerFields));
  dispatch(infoNotification({message: "Author metadata exported", details: filename}));
};

/**
 * Create & write a TSV file where each row is a strain in the tree,
 * with the relevant information (accession, traits, etcetera).
 * Only visible nodes (tips) will be included in the file.
 */
export const strainTSV = (dispatch, filePrefix, nodes, nodeVisibilities) => {

  /* traverse the tree & store tip information. We cannot write this out as we go as we don't know
  exactly which header fields we want until the tree has been traversed. */
  const tipTraitValues = {};
  const headerFields = ["strain"];

  for (const [i, node] of nodes.entries()) {
    if (node.hasChildren) continue; /* we only consider tips */

    if (nodeVisibilities[i] !== NODE_VISIBLE || !node.shell.inView) {
      continue;
    }

    tipTraitValues[node.name] = {strain: node.name};
    if (!node.node_attrs) continue; /* if this is not set then we don't have any node info! */

    /* handle `num_date` specially */
    /* do this first so that "date" immediately follows "strain" in downloaded TSV */
    const numDate = getTraitFromNode(node, "num_date");
    if (numDate) {
      const traitName = "date"; // matches use in augur metadata.tsv
      headerInsert(headerFields, null, traitName)
      const numDateConfidence = getTraitFromNode(node, "num_date", {confidence: true});
      if (numDateConfidence && numDateConfidence[0] !== numDateConfidence[1]) {
        tipTraitValues[node.name][traitName] = `${numericToCalendar(numDate)} (${numericToCalendar(numDateConfidence[0])} - ${numericToCalendar(numDateConfidence[1])})`;
      } else {
        tipTraitValues[node.name][traitName] = numericToCalendar(numDate);
      }
    }

    /* collect values (as writable strings) of the same "traits" as can be viewed by the modal displayed
    when clicking on tips. Note that "num_date", "author" and "vaccine" are considered separately below */
    const nodeAttrsToIgnore = ["author", "div", "num_date", "vaccine", "accession"];
    const traits = Object.keys(node.node_attrs).filter((k) => !nodeAttrsToIgnore.includes(k));
    for (const trait of traits) {
      const value = getTraitFromNode(node, trait);
      if (value !== undefined) {
        headerInsert(headerFields, null, trait);
        if (typeof value === 'string') {
          tipTraitValues[node.name][trait] = value;
        } else if (typeof value === "number") {
          tipTraitValues[node.name][trait] = parseFloat(value).toFixed(2);
        }

        const url = getUrlFromNode(node, trait);
        if (url) {
          headerInsert(headerFields, trait, urlify(trait));
          tipTraitValues[node.name][urlify(trait)] = url;
        }
      }
    }

    /* handle `author` specially */
    const fullAuthorInfo = getFullAuthorInfoFromNode(node);
    if (fullAuthorInfo) {
      const traitName = "author";
      headerInsert(headerFields, null, traitName);
      tipTraitValues[node.name][traitName] = fullAuthorInfo.value;
      if (isPaperURLValid(fullAuthorInfo)) {
        headerInsert(headerFields, traitName, urlify(traitName));
        tipTraitValues[node.name][urlify(traitName)] = fullAuthorInfo.paper_url;
      }
    }

    /* handle `vaccine` specially */
    const vaccine = getVaccineFromNode(node);
    if (vaccine && vaccine.selection_date) {
      const traitName = "vaccine_selection_date";
      headerInsert(headerFields, null, traitName);
      tipTraitValues[node.name][traitName] = vaccine.selection_date;
    }

    /* handle `accession` specially */
    const accession = getAccessionFromNode(node);
    if (accession.accession) {
      const traitName = "accession";
      headerInsert(headerFields, null, traitName);
      tipTraitValues[node.name][traitName] = accession.accession;
      if (accession.url) {
        headerInsert(headerFields, traitName, urlify(traitName));
        tipTraitValues[node.name][urlify(traitName)] = accession.url;
      }
    }
  }

  /* write out information we've collected */
  const filename = `${filePrefix}_metadata.tsv`;
  write(filename, MIME.tsv, createTsvString(Object.values(tipTraitValues), headerFields));
  dispatch(infoNotification({message: `Metadata exported to ${filename}`}));
};

/**
 * Create & write a TSV file where each row is a strain in the tree,
 * but only include the following fields:
 * - strain
 * - gisaid_epi_isl
 * - genbank_accession
 * - originating_lab
 * - submitting_lab
 * - author
 * Only visible nodes (tips) will be included in the file.
 */
export const acknowledgmentsTSV = (dispatch, filePrefix, nodes, nodeVisibilities) => {

  /* traverse the tree & store tip information. We cannot write this out as we go as we don't know
  exactly which header fields we want until the tree has been traversed. */
  const tipTraitValues = {};
  const headerFields = ["strain"];

  for (const [i, node] of nodes.entries()) {
    if (node.hasChildren) continue; /* we only consider tips */

    if (nodeVisibilities[i] !== NODE_VISIBLE || !node.shell.inView) {
      continue;
    }

    tipTraitValues[node.name] = {strain: node.name};
    if (!node.node_attrs) continue; /* if this is not set then we don't have any node info! */

    /* collect values of relevant traits */
    const traitsToExport = ["gisaid_epi_isl", "genbank_accession", "originating_lab", "submitting_lab"];
    for (const traitName of traitsToExport) {
      const traitValue = getTraitFromNode(node, traitName);
      if (traitValue) {
        headerInsert(headerFields, null, traitName)
        tipTraitValues[node.name][traitName] = traitValue;
      }
    }

    /* handle `author` specially */
    const fullAuthorInfo = getFullAuthorInfoFromNode(node);
    if (fullAuthorInfo) {
      const traitName = "author";
      headerInsert(headerFields, null, traitName)
      tipTraitValues[node.name][traitName] = fullAuthorInfo.value;
      if (isPaperURLValid(fullAuthorInfo)) {
        headerInsert(headerFields, traitName, urlify(traitName));
        tipTraitValues[node.name][urlify(traitName)] = fullAuthorInfo.paper_url;
      }
    }

  }

  /* write out information we've collected */
  const filename = `${filePrefix}_acknowledgements.tsv`;
  write(filename, MIME.tsv, createTsvString(Object.values(tipTraitValues), headerFields));
  dispatch(infoNotification({message: `Acknowledgments exported to ${filename}`}));
};


/**
 * Inserts *el2* after *el1* in the provided *arr* array (modified in-place)
 * if *el1* is `null` then we add *el2* to the end of the array (in-place)
 * If *el2* is already in the *arr* nothing is done
 */
function headerInsert(arr, el1, el2) {
  if (arr.includes(el2)) return
  if (el1===null) {
    arr.push(el2);
    return
  }
  const idx1 = arr.indexOf(el1);
  if (idx1===-1) {
    console.warn(`Element ${el1} not present in provided array`)
    return;
  }
  arr.splice(idx1+1, 0, el2);
}

/**
 * For a column *name* return the associated column name to use for URLs
 */
function urlify(name) {
  return `${name}__url`;
}


export const exportTree = ({dispatch, filePrefix, tree, isNewick, temporal, colorings, colorBy}) => {
  try {
    const fName = `${filePrefix}_${temporal?'timetree':'tree'}.${isNewick?'nwk':'nexus'}`;
    const treeString = isNewick ? treeToNewick(tree, temporal) : treeToNexus(tree, colorings, colorBy, temporal);
    write(fName, MIME.text, treeString);
    dispatch(infoNotification({message: `${temporal ? "TimeTree" : "Tree"} written to ${fName}`}));
  } catch (err) {
    console.error(err);
    const warningObject = {message: "Error saving tree!"};
    if (err instanceof EmptyNewickTreeCreated) {
      warningObject.details = "An empty tree was created. If you have selected genomes, note that we do not support downloads of multiple subtrees.";
    }
    dispatch(warningNotification(warningObject));
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

  // Special handling of layout if measurements panel is included
  // Display as if we are in "full" view to display all filtered measurements
  if (panels.measurements) {
    if (panels.tree) {
      width = Math.max(panels.tree.width, panels.measurements.width);
      height = panels.tree.height + padding + panels.measurements.height;
      panels.measurements.y = panels.tree.height + padding;
    } else {
      width = panels.measurements.width;
      height = panels.measurements.height;
    }

    panels.measurementsXAxis.y = height;
    height += panels.measurementsXAxis.height;

    if (panels.map) {
      width = Math.max(width, panels.map.width);
      panels.map.y = height + padding;
      height += padding + panels.map.height;
    }
  } else {
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
  for (const key in panels) {
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

/**
 * Build the footer text as SVG by rendering the (HTML) strings into a detached, off-screen
 * block, letting the browser lay them out & wrap them to `width`, then reading that layout
 * back as SVG via htmlToSvg(). The block is removed before we return. Coordinates in the
 * returned markup are translated to (x, y).
 * Returns {width, height, markup}.
 */
const footerToSvg = (textStrings, x, y, width) => {
  const div = document.createElement("div");
  div.style.cssText = `position:absolute; left:-99999px; top:0; width:${width}px; font-family:lato,sans-serif; font-size:14px; line-height:1.4; color:#000;`;
  textStrings.forEach((s) => {
    const p = document.createElement("p");
    p.style.cssText = "margin:0 0 6px 0;";
    p.innerHTML = s || "&nbsp;"; /* the strings are trusted HTML we constructed in SVG() */
    div.appendChild(p);
  });
  document.body.appendChild(div);
  try {
    const {width: w, height: h, markup} = htmlToSvg(div);
    return {width: w, height: h, markup: `<g transform="translate(${x},${y})">\n${markup}\n</g>`};
  } finally {
    document.body.removeChild(div);
  }
};

/* define actual writer as a closure, because it may need to be triggered asynchronously */
const writeSVGPossiblyIncludingMap = (dispatch, filePrefix, panelsInDOM, panelLayout, textStrings, fontDefs, map) => {
  const errors = [];
  /* for each panel present in the DOM, create a data structure with the dimensions & the paths/shapes etc */
  const panels = {tree: undefined, map: undefined, entropy: undefined, frequencies: undefined};

  /* Each panel (tree, map, measurements) can render its own legend, which is an HTML overlay
  rather than a single SVG, so we read it back into SVG via htmlToSvg(). The legends share the
  `LegendContainer` id, so we identify the right one by whichever overlaps the given panel's
  origin element (the element whose top-left is 0,0 of that panel's SVG). We record the offset
  relative to that origin and resolve it to an absolute position once the panel is laid out. */
  const legends = [];
  const usedLegendEls = new Set();
  const captureLegend = (panel, originEl, label) => {
    if (!originEl) {
      console.warn(`[SVG export] ${label}: panel origin element not found; legend omitted`);
      return;
    }
    const o = originEl.getBoundingClientRect();
    /* pick the as-yet-unused legend with the largest overlap with this panel */
    let best;
    let bestArea = 0;
    for (const el of document.querySelectorAll('[id="LegendContainer"]')) {
      if (usedLegendEls.has(el)) continue;
      const r = el.getBoundingClientRect();
      const ix = Math.max(0, Math.min(o.right, r.right) - Math.max(o.left, r.left));
      const iy = Math.max(0, Math.min(o.bottom, r.bottom) - Math.max(o.top, r.top));
      if (ix * iy > bestArea) { bestArea = ix * iy; best = el; }
    }
    if (!best) {
      console.warn(`[SVG export] ${label}: no legend overlaps this panel; legend omitted`);
      return;
    }
    usedLegendEls.add(best);
    try {
      const r = best.getBoundingClientRect();
      const {width, height, markup} = htmlToSvg(best);
      legends.push({panel, offsetX: r.left - o.left, offsetY: r.top - o.top, width, height, inner: markup});
    } catch (e) {
      errors.push(`${label} legend`);
      console.error(`${label} legend SVG save error:`, e);
    }
  };

  if (panelsInDOM.indexOf("tree") !== -1) {
    try {
      panels.tree = processXMLString((new XMLSerializer()).serializeToString(document.getElementById("MainTree")));
    } catch (e) {
      panels.tree = undefined;
      errors.push("tree");
      console.error("Tree SVG save error:", e);
    }
    /* The tree's legend is positioned relative to d3treeParent (= 0,0 of the tree panel's SVG). */
    if (panels.tree) {
      captureLegend("tree", document.getElementById("d3treeParent"), "tree");
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
  if (panelsInDOM.indexOf("measurements") !== -1) {
    try {
      panels.measurements = processXMLString((new XMLSerializer()).serializeToString(document.getElementById("d3MeasurementsSVG")));
      panels.measurementsXAxis = processXMLString((new XMLSerializer()).serializeToString(document.getElementById("d3MeasurementsXAxisSVG")));
      // Get the actual width of SVG from the measurements container since the SVG just uses width=100%
      const measurementsContainer = document.getElementById("measurementsSVGContainer");
      panels.measurements.width = measurementsContainer.clientWidth;
      panels.measurementsXAxis.width = measurementsContainer.clientWidth;
    } catch (e) {
      panels.measurements = undefined;
      errors.push("measurements");
      console.error("Measurements SVG save error:", e);
    }
    /* the measurements legend is positioned relative to the measurements SVG (its panel origin) */
    if (panels.measurements) {
      captureLegend("measurements", document.getElementById("d3MeasurementsSVG"), "measurements");
    }
  }
  if (panelsInDOM.indexOf("entropy") !== -1) {
    try {
      panels.entropy = processXMLString((new XMLSerializer()).serializeToString(document.getElementById("d3entropyParent")));
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
    /* the map legend is positioned relative to the leaflet container (= 0,0 of the map panel) */
    captureLegend("map", document.getElementById("map"), "map");
  }

  /* collect all panels as individual <svg> elements inside a bounding <svg> tag, and write to file */
  const output = [];
  /* logic for extracting the overall width etc */
  const overallDimensions = createBoundingDimensionsAndPositionPanels(panels, panelLayout, textStrings.length);

  /* Render the footer text to real SVG <text> (via a throwaway HTML block) rather than a
  <foreignObject>, which browsers render but vector editors (Illustrator/Inkscape) don't.
  We let the browser wrap the text to the available width, then read the lines back. */
  const footer = footerToSvg(
    textStrings,
    overallDimensions.padding,
    overallDimensions.textY,
    overallDimensions.width - 2 * overallDimensions.padding
  );
  /* grow the canvas if the (wrapped) footer is taller than the space we reserved for it */
  const totalHeight = Math.max(
    overallDimensions.height,
    overallDimensions.textY + footer.height + overallDimensions.padding
  );

  /* Set the app font & base weight as defaults on the root <svg> so they cascade to panel text
  (entropy, tree, …) that inherits font-family / font-weight from a stylesheet rather than an
  inline style — that cascade doesn't exist in a standalone SVG file, so otherwise such text
  falls back to the renderer's defaults (commonly a serif face at a too-light weight). The base
  weight 400 matches `html, p, div { font-weight: 400 }` in global.css. Text that sets its own
  font-family / font-weight (legend, footer, via htmlToSvg) overrides these. */
  output.push(`<svg xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" font-family="${dataFont}" font-weight="400" width="${overallDimensions.width}" height="${totalHeight}">`);
  if (fontDefs) output.push(fontDefs); /* embedded @font-face so viewers render Lato, not a fallback */
  for (const key in panels) {
    if (panels[key]) {
      injectAsSVGStrings(output, key, panels[key]); // modifies output in place
    }
  }
  /* draw legends on top of their panels, now that each panel has a final (x, y) */
  legends.forEach((lg) => {
    const panel = panels[lg.panel];
    if (!panel) return;
    injectAsSVGStrings(output, `${lg.panel}Legend`, {
      x: panel.x + lg.offsetX,
      y: panel.y + lg.offsetY,
      width: lg.width,
      height: lg.height,
      inner: lg.inner
    });
  });
  output.push(footer.markup);

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

export const SVG = async (dispatch, t, metadata, nodes, visibility, filePrefix, panelsInDOM, panelLayout, publications) => {
  /* make the text strings */
  const textStrings = [];
  textStrings.push(metadata.title);
  textStrings.push(`Last updated ${metadata.updated}`);
  const address = window.location.href.replace(/&/g, '&amp;');
  textStrings.push(`Downloaded from <a href="${address}">${address}</a> on ${new Date().toLocaleString()}`);
  textStrings.push(datasetSummary({
    mainTreeNumTips: metadata.mainTreeNumTips,
    nodes,
    visibility,
    t
  }));
  textStrings.push("");
  textStrings.push(`${t("Data usage part 1")} A full list of sequence authors is available via <a href="https://nextstrain.org">nextstrain.org</a>.`);
  textStrings.push(`Visualizations are licensed under CC-BY.`);
  textStrings.push(`Relevant publications:`);
  publications.forEach((pub) => {
    textStrings.push(`<a href="${pub.href}">${pub.author}, ${pub.title}, ${pub.journal} (${pub.year})</a>`);
  });

  /* embed the Lato font so the SVG renders identically outside the app (async: fetches the
  already-cached font files & base64-encodes them) */
  const fontDefs = await latoFontDefs();

  /* downloading the map tiles is an async call */
  if (panelsInDOM.indexOf("map") !== -1) {
    window.L.getMapSvg(writeSVGPossiblyIncludingMap.bind(this, dispatch, filePrefix, panelsInDOM, panelLayout, textStrings, fontDefs));
  } else {
    writeSVGPossiblyIncludingMap(dispatch, filePrefix, panelsInDOM, panelLayout, textStrings, fontDefs, undefined);
  }
};

export const entropyTSV = (dispatch, filePrefix, entropy) => {
  const headerEntropyBarMap = {
    base: "x",
    gene: "prot",
    position: "codon",
    events: "y",
    entropy: "y"
  };
  // Change headers based on nuc/aa and events/entropy states
  const headerFields = entropy.selectedCds === nucleotide_gene ? ["base"] : ["gene", "position"];
  headerFields.push(entropy.showCounts ? "events" : "entropy");

  // Create array of data objects to write to TSV
  const objectsToWrite = entropy.bars.map((bar) =>
    Object.fromEntries(headerFields.map((field) => [field, bar[headerEntropyBarMap[field]]]))
  );

  /* write out information we've collected */
  const filename = `${filePrefix}_diversity.tsv`;
  write(filename, MIME.tsv, createTsvString(objectsToWrite, headerFields));
  dispatch(infoNotification({message: `Diversity data exported to ${filename}`}));
};


/**
 * Write out Auspice JSON(s) for the current view by recreating JSON state from Redux state
 *
 * Sidecar files and second trees are not yet handled
 *
 * Note that we are not viewing a narrative, as the download button functionality is disabled
 * for narratives.
 */
export function auspiceJSON(dispatch, state, filePrefix) {
  let fname = filePrefix + '.json';
  if (fname === 'nextstrain_.json') { // datasets with no URL-relevant information (i.e. auspice.us)
    if (state.metadata.title) { // use the title in the filename (or at least the first 25 chars)
      fname = 'nextstrain_' + state.metadata.title.trim().slice(0, 25).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.json';
    } else {
      fname = 'nextstrain.json';
    }
  }
  const json = createDatasetJson(() => state);
  write(fname, MIME.json, JSON.stringify(json));

  dispatch(infoNotification({
    message: `Saving main dataset JSON as '${fname}'`
  }));

  if (state.treeToo.loaded) {
    dispatch(warningNotification({
      message: `Download functionality only supports the main (LHS) tree at the moment`
    }));
  }
}
