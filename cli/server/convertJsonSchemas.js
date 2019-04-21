const utils = require("../utils");

/* this is from "../../src/util/stringHelpers" but can't be imported here
 * In v1 schemas, provided values were liable to be transformed before rendering.
 * This is not the case for v2 where we generally try to render strings as provided
 */
const prettyString = (x, {multiplier = false, trim = 0, camelCase = true, removeComma = false, stripEtAl = false} = {}) => {
  if (!x && x!== 0) {
    return "";
  }
  if (typeof x === "string") {
    if (trim > 0 && x.length > trim) {
      x = x.slice(0, trim) + "...";
    }
    if (["usvi", "usa", "uk"].indexOf(x.toLowerCase()) !== -1) {
      return x.toUpperCase();
    }
    x = x.replace(/_/g, " ");
    if (camelCase) {
      x = x.replace(/\w\S*/g, (y) => y.charAt(0).toUpperCase() + y.substr(1));
    }
    if (removeComma) {
      x = x.replace(/,/g, "");
    }
    if (stripEtAl) {
      x = x.replace('et al.', '').replace('Et Al.', '').replace('et al', '').replace('Et Al', '');
    }
    return x;
  } else if (typeof x === "number") {
    const val = parseFloat(x);
    const magnitude = Math.ceil(Math.log10(Math.abs(val) + 1e-10));
    return multiplier ? val.toFixed(5 - magnitude) + "\u00D7" : val.toFixed(5 - magnitude);
  }
  return x;
};

const traverseTree = (node, cb) => {
  cb(node);
  if (node.children) {
    node.children.forEach((n) => traverseTree(n, cb));
  }
};

const setColorings = (v2, meta) => {
  v2.colorings = {};
  const color_options = meta.color_options;
  delete meta.color_options;
  for (const [key, value] of Object.entries(color_options)) {
    v2.colorings[key] = {};
    v2.colorings[key].title = value.legendTitle || value.menuItem;
    if (value.type === "continuous") {
      v2.colorings[key].type = "continuous";
    } else {
      v2.colorings[key].type = "categorical"; // or "ordinal"
    }
    if (value.color_map) {
      v2.colorings[key].scale = {};
      value.color_map.forEach((x) => { // x is [<deme name>, <color hex>]
        v2.colorings[key].scale[x[0]] = x[1];
      });
    }
  }
};

const makeAuthorKey = (author) => {
  /* ideally this should be unique, but since it's not unique in v1 we can't make it unique here :( */
  return author.toLowerCase().replace("et al", "").replace(/\s/g, "").replace(/[:;,-_]/g, "");
};

const setAuthorInfo = (v2, meta, tree) => {
  // v1: n, title, journal, paper_url
  // v2: authors, title, journal, url
  if (!meta.author_info) {
    return;
  }
  v2.author_info = {};
  for (const [v1author, v1info] of Object.entries(meta.author_info)) { // eslint-disable-line
    const key = makeAuthorKey(v1author);
    const info = {
      /* in v2 schemas, the string provided is rendered as is. This fn recreates the transforms the client used to provide */
      authors: prettyString(v1author)
    };
    if (v1info.title) info.title = v1info.title;
    if (v1info.journal) info.journal = v1info.journal;
    if (v1info.paper_url) info.url = v1info.paper_url;
    v2.author_info[key] = info;
  }
  delete meta.author_info;

  traverseTree(tree, (node) => {
    if (node.attr && node.attr.authors) {
      node.attr.authors = makeAuthorKey(node.attr.authors);
    }
  });
};

const setMiscMetaProperties = (v2, meta) => {
  // TITLE (required)
  v2.title = meta.title;
  delete meta.title;
  // VERSION (not required)
  v2.version = "2.0.alpha";
  // UPDATED (required)
  v2.updated = meta.updated;
  delete meta.updated;
  if (!v2.updated) {
    utils.warn("\"Updated\" field not provided in v1 meta JSON but is required");
  }
  // MAINTAINERS (required)
  if (meta.maintainer) {
    v2.maintainers = [
      {name: meta.maintainer[0], url: meta.maintainer[1]}
    ];
  } else { /* while it _should_ be there, sometimes it's not */
    v2.maintainers = [
      {name: "unknown", url: "https://nextstrain.org"}
    ];
  }
  delete meta.maintainer;

};

const convert = ({tree, meta, treeName, displayUrl}) => {
  const v2 = {};
  setColorings(v2, meta);
  setMiscMetaProperties(v2, meta);
  setAuthorInfo(v2, meta, tree);
  console.log(v2);

  /* add the rest in the same format as auspice currently expects
  (neither v1 nor v2!). */
  v2.tree = tree;
  v2.meta = meta;
  v2._treeName = treeName;
  v2._displayUrl = displayUrl;
  return v2;
};


module.exports = {
  convert
};
