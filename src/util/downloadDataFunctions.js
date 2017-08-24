/* eslint no-restricted-syntax: 0 */
import { infoNotification, errorNotification, successNotification, warningNotification } from "../actions/notifications";
import { prettyString, formatURLString } from "./stringHelpers";
import { isPaperURLValid } from "../components/controls/downloadModal";

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

export const authorCSV = (dispatch, dataset, metadata) => {
  const lineArray = [["Author", "n (strains)", "publication title", "journal", "publication URL", "strains"]];
  const filename = "nextstrain_" + dataset + "_authors.csv";

  const authors = {};
  for (const strain of Object.keys(metadata.seq_author_map)) {
    const author = metadata.seq_author_map[strain];
    if (Object.prototype.hasOwnProperty.call(authors, author)) {
      authors[author].push(strain);
    } else {
      authors[author] = [strain];
    }
  }

  const body = [];
  for (const author of Object.keys(metadata.author_info)) {
    body.push([
      prettyString(author, {camelCase: false}),
      metadata.author_info[author].n,
      prettyString(metadata.author_info[author].title, {removeComma: true}),
      prettyString(metadata.author_info[author].journal, {removeComma: true}),
      isPaperURLValid(metadata.author_info[author]) ? formatURLString(metadata.author_info[author].paper_url) : "unknown",
      authors[author].join("\t")
    ]);
  }

  body.forEach((line) => { lineArray.push(line.join(",")); });
  write(filename, MIME.csv, lineArray.join("\n"));
  dispatch(infoNotification({message: "Author metadata exported", details: filename}));
};

export const turnAttrsIntoHeaderArray = (attrs) => {
  return ["Strain"].concat(attrs.map((v) => prettyString(v)));
};

export const strainCSV = (dispatch, dataset, nodes, attrs) => {
  // dont need to traverse the tree - can just loop the nodes
  const filename = "nextstrain_" + dataset + "_metadata.csv";
  const data = [];
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

export const newick = (dispatch, dataset, root, temporal) => {
  const fName = temporal ? "nextstrain_" + dataset + "_timetree.new" : "nextstrain_" + dataset + "_tree.new";
  const message = temporal ? "TimeTree" : "Tree";
  write(fName, MIME.text, treeToNewick(root, temporal));
  dispatch(infoNotification({message: message + " written to " + fName}));
};

export const incommingMapPNG = (data) => {
  let svg = '<?xml version="1.0" standalone="no"?>';
  svg += `<svg xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" width="${data.mapDimensions.x}" height="${data.mapDimensions.y}">\n`;
  svg += `<image width="${data.mapDimensions.x}" height="${data.mapDimensions.y}" xlink:href="${data.base64map}"/>\n`;
  svg += data.demes_transmissions_path;
  svg += "</svg>";
  write(data.fileName, "image/svg", svg);
};

const fixSVGString = (svgBroken) => {
  let svgFixed = svgBroken;
  if (svgFixed.match(/^<g/)) {
    svgFixed = svgFixed.replace(/^<g/, '<svg');
    svgFixed = svgFixed.replace(/<\/g>$/, '</svg>');
  }
  svgFixed = svgFixed.replace("cursor: pointer;", "");
  /* https://stackoverflow.com/questions/23218174/how-do-i-save-export-an-svg-file-after-creating-an-svg-with-d3-js-ie-safari-an */
  if (!svgFixed.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
    svgFixed = svgFixed.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (!svgFixed.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
    svgFixed = svgFixed.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }
  return '<?xml version="1.0" standalone="no"?>\r\n' + svgFixed;
};

export const SVG = (dispatch, dataset) => {
  const files = [];
  /* tree */
  const svg_tree = fixSVGString((new XMLSerializer()).serializeToString(document.getElementById("d3TreeElement")));
  files.unshift("nextstrain_tree.svg");
  write(files[0], MIME, svg_tree);
  /* map */
  const demes_transmissions_xml = (new XMLSerializer()).serializeToString(document.getElementById("d3DemesTransmissions"));
  const groups = demes_transmissions_xml.match(/^<svg(.*?)>(.*?)<\/svg>/);
  files.unshift("nextstrain_" + dataset + "_map.svg");
  /* window.L.save triggers the incommingMapPNG callback, with the data given here passed through */
  window.L.save({
    fileName: files[0],
    demes_transmissions_header: groups[1],
    demes_transmissions_path: groups[2]
  });
  /* entropy panel */
  const svg_entropy = fixSVGString((new XMLSerializer()).serializeToString(document.getElementById("d3entropy")));
  files.unshift("nextstrain_entropy.svg");
  write(files[0], MIME.svg, svg_entropy);
  /* notification */
  dispatch(infoNotification({message: "Vector images saved", details: files.join(", ")}));
};
