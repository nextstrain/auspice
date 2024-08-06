/* eslint no-restricted-syntax: 0 */
import { unparse } from "papaparse";
import { errorNotification, infoNotification, warningNotification } from "../../actions/notifications";
import { spaceBetweenTrees } from "../tree/tree";
import { getTraitFromNode, getDivFromNode, getFullAuthorInfoFromNode, getVaccineFromNode, getAccessionFromNode } from "../../util/treeMiscHelpers";
import { numericToCalendar } from "../../util/dateHelpers";
import { NODE_VISIBLE, nucleotide_gene } from "../../util/globals";
import { datasetSummary } from "../info/datasetSummary";
import { isColorByGenotype } from "../../util/getGenotype";
import { EmptyNewickTreeCreated } from "../../util/exceptions";
import { Dataset } from "../../actions/loadData";

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
      if (!headerFields.includes(traitName)) headerFields.push(traitName);
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

    /* handle `author` specially */
    const fullAuthorInfo = getFullAuthorInfoFromNode(node);
    if (fullAuthorInfo) {
      const traitName = "author";
      if (!headerFields.includes(traitName)) headerFields.push(traitName);
      tipTraitValues[node.name][traitName] = fullAuthorInfo.value;
      if (isPaperURLValid(fullAuthorInfo)) {
        tipTraitValues[node.name][traitName] += ` (${fullAuthorInfo.paper_url})`;
      }
    }

    /* handle `vaccine` specially */
    const vaccine = getVaccineFromNode(node);
    if (vaccine && vaccine.selection_date) {
      const traitName = "vaccine_selection_date";
      if (!headerFields.includes(traitName)) headerFields.push(traitName);
      tipTraitValues[node.name][traitName] = vaccine.selection_date;
    }

    /* handle `accession` specially */
    const accession = getAccessionFromNode(node);
    if ("accession" in accession) {
      const traitName = "accession";
      if (!headerFields.includes(traitName)) headerFields.push(traitName);
      tipTraitValues[node.name][traitName] = accession.accession;
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
        if (!headerFields.includes(traitName)) headerFields.push(traitName);
        tipTraitValues[node.name][traitName] = traitValue;
      }
    }

    /* handle `author` specially */
    const fullAuthorInfo = getFullAuthorInfoFromNode(node);
    if (fullAuthorInfo) {
      const traitName = "author";
      if (!headerFields.includes(traitName)) headerFields.push(traitName);
      tipTraitValues[node.name][traitName] = fullAuthorInfo.value;
      if (isPaperURLValid(fullAuthorInfo)) {
        tipTraitValues[node.name][traitName] += ` (${fullAuthorInfo.paper_url})`;
      }
    }

  }

  /* write out information we've collected */
  const filename = `${filePrefix}_acknowledgements.tsv`;
  write(filename, MIME.tsv, createTsvString(Object.values(tipTraitValues), headerFields));
  dispatch(infoNotification({message: `Acknowledgments exported to ${filename}`}));
};

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

/* define actual writer as a closure, because it may need to be triggered asynchronously */
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
  for (const key in panels) {
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

export const SVG = (dispatch, t, metadata, nodes, visibility, filePrefix, panelsInDOM, panelLayout, publications) => {
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

  /* downloading the map tiles is an async call */
  if (panelsInDOM.indexOf("map") !== -1) {
    window.L.getMapSvg(writeSVGPossiblyIncludingMap.bind(this, dispatch, filePrefix, panelsInDOM, panelLayout, textStrings));
  } else {
    writeSVGPossiblyIncludingMap(dispatch, filePrefix, panelsInDOM, panelLayout, textStrings, undefined);
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
 * Write out Auspice JSON(s) for the current view. We do this by re-fetching the original
 * JSON because we don't keep a copy of the unprocessed data around.
 *
 * Sidecar files are not fetched, but we can also download them if desired.
 *
 * Note that we are not viewing a narrative, as the download button functionality is disabled
 * for narratives.
 */
export const auspiceJSON = (dispatch, datasetNames) => {
  const filenames = [];
  if (!datasetNames.some(Boolean)) {
    console.error(`Unable to fetch empty dataset names: ${JSON.stringify(datasetNames)}`);
    return dispatch(errorNotification({message: "Unable to download Auspice JSON (see console for more info)"}))
  }
  for (const datasetName of datasetNames) {
    if (!datasetName) continue; // e.g. no 2nd tree
    const filename = datasetName.replace('/', '_') + '.json';
    filenames.push(filename);
    const dataset = new Dataset(datasetName);
    dataset.fetchMain(); // initialises dataset.main (a promise)
    dataset.main.then((jsonContents) => {
      write(filename, MIME.json, JSON.stringify(jsonContents));
    }).catch((err) => {
      // I think this error path should be rarely (never!) encountered, because the fetch call has
      // worked to load the dataset in the first place...
      console.error(`Error fetching JSON for ${datasetName}: ${err}`);
      dispatch(errorNotification({message: `Error preparing ${filename} JSON for download (see console for more info)`}));
    });
  }
  dispatch(infoNotification({message: `Preparing Auspice JSON(s) for download: ${filenames.join(', ')}`}));
};
