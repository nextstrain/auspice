/* eslint no-restricted-syntax: 0 */
import React from "react";
import { infoNotification, warningNotification } from "../../actions/notifications";
import { prettyString, formatURLString, authorString } from "../../util/stringHelpers";
import { spaceBetweenTrees } from "../tree/tree";
import { getTraitFromNode } from "../../util/treeMiscHelpers";

export const isPaperURLValid = (d) => {
  return (
    Object.prototype.hasOwnProperty.call(d, "paper_url") &&
    !d.paper_url.endsWith('/') &&
    d.paper_url !== "?"
  );
};

export const getAuthor = (info, k) => {
  if (info === undefined || k === undefined) {
    return (
      <span>Not Available</span>
    );
  }
  return authorString(k);
};

/* this function based on https://github.com/daviddao/biojs-io-newick/blob/master/src/newick.js */
const treeToNewick = (root, temporal) => {
  function recurse(node, parentX) {
    let subtree = "";
    if (node.hasChildren) {
      const children = [];
      node.children.forEach((child) => {
        const subsubtree = recurse(child, temporal ? node.num_date.value : node.div);
        children.push(subsubtree);
      });
      subtree += "(" + children.join(",") + ")" + node.name + ":";
      subtree += (temporal ? node.num_date.value : node.div) - parentX;
    } else { /* terminal node */
      let leaf = node.name + ":";
      leaf += (temporal ? node.num_date.value : node.div) - parentX;
      subtree += leaf;
    }
    return subtree;
  }
  return recurse(root, 0) + ";";
};

const MIME = {
  text: "text/plain;charset=utf-8;",
  csv: 'text/csv;charset=utf-8;',
  tsv: `text/tab-separated-values;charset=utf-8;`,
  svg: "image/svg+xml;charset=utf-8"
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
  tree.nodes.filter((n) => !n.hasChildren && n.author).forEach((n) => {
    if (info[n.author.value]) {
      info[n.author.value].count += 1;
      info[n.author.value].strains.push(n.name);
    } else {
      info[n.author.value] = {
        author: n.author.author || n.author.value,
        title: n.author.title || UNKNOWN,
        journal: n.author.journal || UNKNOWN,
        url: isPaperURLValid(n.author) ? n.author.paper_url : UNKNOWN,
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

const turnAttrsIntoHeaderArray = (attrs) => {
  return ["Strain"].concat(attrs.map((v) => prettyString(v)));
};

/**
 * Create & write a TSV file where each row is a strain in the tree,
 * with the relevent information (accession, traits, etcetera)
 * TODO this needs testing / improving after the move to v2 JSONs
 */
export const strainTSV = (dispatch, filePrefix, nodes) => {
  // dont need to traverse the tree - can just loop the nodes
  const filename = filePrefix + "_metadata.tsv";
  const data = [];

  const traitsToInclude = new Set(["author"]);
  nodes.forEach((n) => {
    if (n.traits) {
      Object.keys(n.traits).forEach((t) => traitsToInclude.add(t));
    }
  })

  for (const node of nodes) {
    if (node.hasChildren) {
      continue;
    }
    /* line is an array of values, will be written out as a tab seperated line */
    const line = [node.name];
    getTraitFromNode

    for (const trait of traitsToInclude) {
      if (trait === "author") {
        if (node.author) {
          let info = node.author.author || node.author.value;
          if (node.author.title) info += `, ${node.author.title}.`;
          if (node.author.journal) info += ` ${node.author.journal}`;
          line.push(info)
        } else {
          line.push("unknown")
        }
        continue;
      }
      let value = getTraitFromNode(node, trait);
      if (!value) {
        line.push("unknown")
      } else {
        if (typeof value === 'string') {
          if (value.lastIndexOf("http", 0) === 0) {
            line.push(formatURLString(value));
          } else {
            line.push(prettyString(value, {removeComma: true}));
          }
        } else if (typeof value === "number") {
          line.push(parseFloat(value).toFixed(2));
        } else if (typeof value === "object") {
          if (Array.isArray(value)) {
            if (typeof value[0] === "number") {
              line.push(value.map((v) => parseFloat(v).toFixed(2)).join(" - "));
            } else {
              line.push(value.map((v) => prettyString(v, {removeComma: true})).join(" - "));
            }
          } else { /* not an array, but a relational object */
            let x = "";
            for (const k of Object.keys(value)) {
              const v = typeof value[k] === "number" ? parseFloat(value[k]).toFixed(2) : prettyString(value[k], {removeComma: true});
              x += prettyString(k, {removeComma: true}) + ": " + v + ";";
            }
            line.push(x);
          }
        } else {
          console.warn("Tried to save " + value + " of type " + typeof value);
          line.push("unknown");
        }
      }
    }
    data.push(line);
  }
  const lineArray = [turnAttrsIntoHeaderArray([...traitsToInclude]).join("\t")];
  data.forEach((line) => {
    const lineString = line.join("\t");
    lineArray.push(lineString);
  });
  const tsvContent = lineArray.join("\n");
  write(filename, MIME.tsv, tsvContent);
  dispatch(infoNotification({message: "Metadata exported to " + filename}));
};

export const newick = (dispatch, filePrefix, root, temporal) => {
  const fName = temporal ? filePrefix + "_timetree.nwk" : filePrefix + "_tree.nwk";
  const message = temporal ? "TimeTree" : "Tree";
  write(fName, MIME.text, treeToNewick(root, temporal));
  dispatch(infoNotification({message: message + " written to " + fName}));
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

  if (panels.tree && panels.mapD3 && panels.mapTiles) {
    if (panelLayout === "grid") {
      width = panels.tree.width + padding + panels.mapTiles.width;
      height = Math.max(panels.tree.height, panels.mapTiles.height);
      panels.mapD3.x = panels.tree.width + padding;
    } else {
      width = Math.max(panels.tree.width, panels.mapTiles.width);
      height = panels.tree.height + padding + panels.mapTiles.height;
      panels.mapD3.y = panels.tree.height + padding;
    }
    panels.mapTiles.x = panels.mapD3.x;
    panels.mapTiles.y = panels.mapD3.y;
  } else if (panels.tree) {
    width = panels.tree.width;
    height = panels.tree.height;
  } else if (panels.mapD3 && panels.mapTiles) {
    width = panels.mapTiles.width;
    height = panels.mapTiles.height;
  }
  /* need to adjust map demes & transmissions to account for panning */
  if (panels.mapD3) {
    // console.log("adding offsets to mapD3 x,y ", panels.mapD3._panOffsets.x, panels.mapD3._panOffsets.y);
    panels.mapD3.x += panels.mapD3._panOffsets.x;
    panels.mapD3.y += panels.mapD3._panOffsets.y;
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
const writeSVGPossiblyIncludingMapPNG = (dispatch, filePrefix, panelsInDOM, panelLayout, textStrings, mapTiles) => {
  const errors = [];
  /* for each panel present in the DOM, create a data structure with the dimensions & the paths/shapes etc */
  const panels = {tree: undefined, mapTiles: undefined, mapD3: undefined, entropy: undefined, frequencies: undefined};
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
  if (panelsInDOM.indexOf("map") !== -1 && mapTiles) {
    panels.mapTiles = {
      x: 0,
      y: 0,
      viewbox: undefined,
      width: parseFloat(mapTiles.mapDimensions.x),
      height: parseFloat(mapTiles.mapDimensions.y),
      inner: `<image width="${mapTiles.mapDimensions.x}" height="${mapTiles.mapDimensions.y}" xlink:href="${mapTiles.base64map}"/>`
    };
    try {
      panels.mapD3 = processXMLString((new XMLSerializer()).serializeToString(document.getElementById("d3DemesTransmissions")));
      // modify the width & height of the mapD3 to match the tiles (not sure how this actually works in the DOM)
      panels.mapD3.width = panels.mapTiles.width;
      panels.mapD3.height = panels.mapTiles.height;
      panels.mapD3._panOffsets = mapTiles.panOffsets;
    } catch (e) {
      panels.mapD3 = undefined;
      panels.mapTiles = undefined;
      errors.push("map");
      console.error("Map demes & tranmisions SVG save error:", e);
    }
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

const getMapTilesErrorCallback = (e) => {
  console.warn("getMapTiles errorCallback", e);
};

export const SVG = (dispatch, filePrefix, panelsInDOM, panelLayout, textStrings) => {
  /* downloading the map tiles is an async call */
  if (panelsInDOM.indexOf("map") !== -1) {
    window.L.getMapTiles(writeSVGPossiblyIncludingMapPNG.bind(this, dispatch, filePrefix, panelsInDOM, panelLayout, textStrings), getMapTilesErrorCallback);
  } else {
    writeSVGPossiblyIncludingMapPNG(dispatch, filePrefix, panelsInDOM, panelLayout, textStrings, undefined);
  }
};
