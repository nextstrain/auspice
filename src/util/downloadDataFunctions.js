/* eslint no-restricted-syntax: 0 */
import { infoNotification, errorNotification, successNotification, warningNotification } from "../actions/notifications";


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

const plainMIME = "text/plain;charset=utf-8;";

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

export const CSV = (dispatch, nodes) => {
  /* TODO
   * FILENAME BASED ON DATASET NAME
   * DONT HARDCODE ATTRS
   */

  // dont need to traverse the tree - can just loop the nodes
  const hardcodedAttrsTemp = ["country", "authors", "accession", "num_date", "region", "date"];
  const hardcodedFNameTemp = "nextstrain_metadata.csv";
  const data = [];
  for (const node of nodes) {
    if (node.hasChildren) {
      continue;
    }
    const line = [node.strain];
    for (const field of hardcodedAttrsTemp) {
      if (Object.keys(node.attr).indexOf(field) === -1) {
        line.push("unknown");
      } else {
        line.push(node.attr[field]);
      }
    }
    data.push(line);
  }
  const lineArray = [["strain"].concat(hardcodedAttrsTemp)];
  data.forEach((line) => {
    const lineString = line.join(",");
    lineArray.push(lineString);
  });
  const csvContent = lineArray.join("\n");
  write(hardcodedFNameTemp, 'text/csv;charset=utf-8;', csvContent);
  dispatch(infoNotification({message: "Metadata exported to " + hardcodedFNameTemp}));
};

export const newick = (dispatch, root, temporal) => {
  const fName = temporal ? "nextstrain_timetree.new" : "nextstrain_tree.new";
  const message = temporal ? "TimeTree" : "Tree";
  write(fName, plainMIME, treeToNewick(root, temporal));
  dispatch(infoNotification({message: message + " written to " + fName}));
};

// export const nexus = () => {
//   console.log("download nexus");
// };

export const SVG = (dispatch) => {
  console.log("download SVG (currently tree only)");
  const tree = document.getElementById("d3TreeElement");
  let svg_xml = (new XMLSerializer()).serializeToString(tree);
  if (svg_xml.match(/^<g/)) {
    svg_xml = svg_xml.replace(/^<g/, '<svg');
    svg_xml = svg_xml.replace(/<\/g>$/, '</svg>');
  }
  svg_xml = svg_xml.replace("cursor: pointer;", "");
  /* https://stackoverflow.com/questions/23218174/how-do-i-save-export-an-svg-file-after-creating-an-svg-with-d3-js-ie-safari-an */
  if (!svg_xml.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
    svg_xml = svg_xml.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (!svg_xml.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
    svg_xml = svg_xml.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }
  svg_xml = '<?xml version="1.0" standalone="no"?>\r\n' + svg_xml;
  write("nextstrain_tree.svg", "image/svg+xml;charset=utf-8", svg_xml);
  dispatch(infoNotification({message: "Tree SVG saved", details: "nextstrain_tree.svg"}));
};
