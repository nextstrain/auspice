/* eslint no-restricted-syntax: 0 */
import React from "react";
import { infoNotification, errorNotification, successNotification, warningNotification } from "../../actions/notifications";
import { prettyString, formatURLString, authorString } from "../../util/stringHelpers";

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
  // TODO: improve this block
  // if (isPaperURLValid(info[k])) {
  //   return (
  //     <a href={formatURLString(info[k].paper_url)} target="_blank">
  //       {authorString(k)}
  //     </a>
  //   );
  // }
  return authorString(k);
};

/* this function based on https://github.com/daviddao/biojs-io-newick/blob/master/src/newick.js */
const treeToNewick = (root, temporal) => {
  function recurse(node, parentX) {
    let subtree = "";
    if (node.hasChildren) {
      const children = [];
      node.children.forEach((child) => {
        const subsubtree = recurse(child, temporal ? node.attr.num_date : node.attr.div);
        children.push(subsubtree);
      });
      subtree += "(" + children.join(",") + ")" + node.strain + ":";
      subtree += (temporal ? node.attr.num_date : node.attr.div) - parentX;
    } else { /* terminal node */
      let leaf = node.strain + ":";
      leaf += (temporal ? node.attr.num_date : node.attr.div) - parentX;
      subtree += leaf;
    }
    return subtree;
  }
  return recurse(root, 0) + ";";
};

const MIME = {
  text: "text/plain;charset=utf-8;",
  csv: 'text/csv;charset=utf-8;',
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

export const authorCSV = (dispatch, filePrefix, metadata, tree) => {
  const lineArray = [["Author", "n (strains)", "publication title", "journal", "publication URL", "strains"]];
  const filename = filePrefix + "_authors.csv";

  const authors = {};
  tree.nodes.filter((n) => !n.hasChildren && n.attr.authors).forEach((n) => {
    if (!authors[n.attr.authors]) {
      authors[n.attr.authors] = [n.strain];
    } else {
      authors[n.attr.authors].push(n.strain);
    }
  });
  const body = [];
  for (const author of Object.keys(metadata.author_info)) {
    body.push([
      prettyString(author, {camelCase: false}),
      metadata.author_info[author].n,
      prettyString(metadata.author_info[author].title, {removeComma: true}),
      prettyString(metadata.author_info[author].journal, {removeComma: true}),
      isPaperURLValid(metadata.author_info[author]) ? formatURLString(metadata.author_info[author].paper_url) : "unknown",
      authors[author].join(" ")
    ]);
  }

  body.forEach((line) => { lineArray.push(line.join(",")); });
  write(filename, MIME.csv, lineArray.join("\n"));
  dispatch(infoNotification({message: "Author metadata exported", details: filename}));
};

export const turnAttrsIntoHeaderArray = (attrs) => {
  return ["Strain"].concat(attrs.map((v) => prettyString(v)));
};

export const strainCSV = (dispatch, filePrefix, nodes, rawAttrs) => {
  // dont need to traverse the tree - can just loop the nodes
  const filename = filePrefix + "_metadata.csv";
  const data = [];
  const includeAttr = (v) => (!(v.includes("entropy") || v.includes("confidence") || v === "div" || v === "paper_url"));
  const attrs = ["accession", "date", "region", "country", "division", "authors", "journal", "title", "url"];
  attrs.filter((v) => rawAttrs.indexOf(v) !== -1); // remove those "ideal" atttrs not actually present
  rawAttrs.forEach((v) => {
    if (attrs.indexOf(v) === -1 && includeAttr(v)) {
      attrs.push(v);
    }
  });
  for (const node of nodes) {
    if (node.hasChildren) {
      continue;
    }
    const line = [node.strain];
    // console.log(node.attr)
    for (const field of attrs) {
      if (Object.keys(node.attr).indexOf(field) === -1) {
        line.push("unknown");
      } else {
        const value = node.attr[field];
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
  const lineArray = [turnAttrsIntoHeaderArray(attrs)];
  data.forEach((line) => {
    const lineString = line.join(",");
    lineArray.push(lineString);
  });
  const csvContent = lineArray.join("\n");
  write(filename, MIME.csv, csvContent);
  dispatch(infoNotification({message: "Metadata exported to " + filename}));
};

export const newick = (dispatch, filePrefix, root, temporal) => {
  const fName = temporal ? filePrefix + "_timetree.new" : filePrefix + "_tree.new";
  const message = temporal ? "TimeTree" : "Tree";
  write(fName, MIME.text, treeToNewick(root, temporal));
  dispatch(infoNotification({message: message + " written to " + fName}));
};

const processXMLString = (input) => {
  /* split into bounding <g> (or <svg>) tag, and inner paths / shapes etc */
  const parts = input.match(/^(<s?v?g.+?>)(.+)<\/s?v?g>$/);
  if (!parts) return undefined;
  /* extract width & height from the initial <g> bounding group */
  const dimensions = parts[1].match(/width="([0-9.]+)".+height="([0-9.]+)"/);
  if (!dimensions) return undefined;
  /* the map uses transform3d & viewbox */
  const viewbox = parts[1].match(/viewBox="([0-9-]+)\s([0-9-]+)\s([0-9-]+)\s([0-9-]+)"/);
  return {
    transform: [0, 0],
    viewbox: viewbox ? viewbox.slice(1) : undefined,
    width: parseFloat(dimensions[1]),
    height: parseFloat(dimensions[2]),
    inner: parts[2]
  };
};

// width="3070" height="2945"
// viewBox="-1228 -1187 3070 2945" style="transform: translate3d(-1228px, -1187px, 0px);"


/* take the panels (see processXMLString for struct) and calculate the overall size of the SVG
as well as the offsets (transforms) to position panels appropriately within this */
const createBoundingSVGStringAndPositionPanels = (panels) => {

  if (panels.mapD3) console.log(`DEBUG: mapD3 is ${panels.mapD3.width}x${panels.mapD3.height}, mapTiles is ${panels.mapTiles.width}x${panels.mapTiles.height}`)

  const padding = 50;
  let width = 0;
  let height = 0;
  if (panels.tree && panels.mapD3 && panels.mapTiles) {
    width = panels.tree.width + padding + panels.mapTiles.width;
    height = panels.tree.height;
    panels.mapD3.transform[0] = panels.tree.width + padding;
    panels.mapTiles.transform = panels.mapD3.transform;
  } else if (panels.tree) {
    width = panels.tree.width;
    height = panels.tree.height;
  } else if (panels.mapD3 && panels.mapTiles) {
    width = panels.mapTiles.width;
    height = panels.mapTiles.height;
  }
  if (panels.entropy) {
    if (width < panels.entropy.width) width = panels.entropy.width;
    if (height) {
      panels.entropy.transform[1] = height + padding;
      height += padding + panels.entropy.height;
    } else {
      height = panels.entropy.height;
    }
  }
  if (panels.frequencies) {
    if (width < panels.frequencies.width) width = panels.frequencies.width;
    if (height) {
      panels.frequencies.transform[1] = height + padding;
      height += padding + panels.frequencies.height;
    } else {
      height = panels.frequencies.height;
    }
  }
  return `<svg xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`;
};

const injectAsSVGStrings = (output, key, data) => {
  let header = `<svg id="${key}" width="${data.width}" height="${data.height}" transform="translate(${data.transform[0]} ${data.transform[1]})"`;
  if (data.viewbox) {
    header += ` viewBox="${data.viewbox.join(" ")}"`;
  }
  header += ">";
  console.log("HEADER", header)
  output.push(header);
  output.push(data.inner);
  output.push("</svg>");
};

/* define actual writer as a closure, because it may need to be triggered asyncronously */
const writeSVGPossiblyIncludingMapPNG = (dispatch, filePrefix, panelsInDOM, mapTiles) => {
  console.log("writeSVGPossiblyIncludingMapPNG()")
  const successes = [];
  const errors = [];
  /* for each panel present in the DOM, create a data structure with the dimensions & the paths/shapes etc */
  const panels = {tree: undefined, mapTiles: undefined, mapD3: undefined, entropy: undefined, frequencies: undefined};
  if (panelsInDOM.indexOf("tree") !== -1) {
    try {
      panels.tree = processXMLString((new XMLSerializer()).serializeToString(document.getElementById("d3TreeElement")));
    } catch (e) {
      console.error("Tree SVG save error:", e);
    }
  }
  if (panelsInDOM.indexOf("entropy") !== -1) {
    try {
      panels.entropy = processXMLString((new XMLSerializer()).serializeToString(document.getElementById("d3entropyParent")));
    } catch (e) {
      console.error("Entropy SVG save error:", e);
    }
  }
  if (panelsInDOM.indexOf("frequencies") !== -1) {
    try {
      panels.frequencies = processXMLString((new XMLSerializer()).serializeToString(document.getElementById("d3frequenciesSVG")));
    } catch (e) {
      console.error("Frequencies SVG save error:", e);
    }
  }
  if (panelsInDOM.indexOf("map") !== -1 && mapTiles) {
    panels.mapTiles = {
      transform: [0, 0],
      viewbox: undefined,
      width: parseFloat(mapTiles.mapDimensions.x),
      height: parseFloat(mapTiles.mapDimensions.y),
      inner: `<image width="${mapTiles.mapDimensions.x}" height="${mapTiles.mapDimensions.y}" xlink:href="${mapTiles.base64map}"/>`
    };
    try {
      panels.mapD3 = processXMLString((new XMLSerializer()).serializeToString(document.getElementById("d3DemesTransmissions")));
    } catch (e) {
      console.error("Map demes & tranmisions SVG save error:", e);
    }
  }

  /* collect all panels as individual <svg> elements inside a bounding <svg> tag, and write to file */
  const output = [];
  /* logic for extracting the overall width etc */
  output.push(createBoundingSVGStringAndPositionPanels(panels));
  for (let key in panels) { // eslint-disable-line
    if (panels[key]) {
      injectAsSVGStrings(output, key, panels[key]); // modifies output in place
    }
  }
  output.push("</svg>");
  console.log(panels)
  console.log(output)
  write(filePrefix + ".svg", MIME.svg, output.join("\n"));

  // if (panels.indexOf("map") !== -1) {
  //   try {
  //     const errorCallback = () => {
  //       dispatch(warningNotification({message: "Errors while saving map SVG"}));
  //     };
  //     const demes_transmissions_xml = (new XMLSerializer()).serializeToString(document.getElementById("d3DemesTransmissions"));
  //     const groups = demes_transmissions_xml.match(/^<svg(.*?)>(.*?)<\/svg>/);
  //     const fileName = filePrefix + "_map.svg";
  //     /* window.L.save triggers the incommingMapPNG callback, with the data given here passed through */
  //     console.log("groups:", groups)
  //     console.log("calling windlow.L.save")
  //     window.L.save({
  //       fileName,
  //       demes_transmissions_header: groups[1],
  //       demes_transmissions_path: groups[2]
  //     }, errorCallback);
  //     successes.push(fileName);
  //   } catch (e) {
  //     /* note that errors in L.save are in a callback so aren't caught here */
  //     errors.push("map");
  //     console.error("Map SVG save error:", e);
  //   }
  // }

  /* notifications */
  if (successes.length) {
    dispatch(infoNotification({message: "Vector images saved", details: successes}));
  }
  if (errors.length) {
    dispatch(warningNotification({message: "Errors saving SVG images", details: errors}));
  }
};

const getMapTilesErrorCallback = (e) => {
  console.warn("getMapTiles errorCallback", e);
};

export const SVG = (dispatch, filePrefix, panelsInDOM) => {
  /* downloading the map tiles is an async call */
  if (panelsInDOM.indexOf("map") !== -1) {
    window.L.getMapTiles(writeSVGPossiblyIncludingMapPNG.bind(this, dispatch, filePrefix, panelsInDOM), getMapTilesErrorCallback);
  } else {
    writeSVGPossiblyIncludingMapPNG(dispatch, filePrefix, panelsInDOM, undefined);
  }
};
