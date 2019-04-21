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

  traverseTree(tree, (node) => {
    if (node.attr && node.attr.authors) {
      node.attr.authors = makeAuthorKey(node.attr.authors);
    }
  });
};

const setMiscMetaProperties = (v2, meta) => {
  // TITLE (required)
  v2.title = meta.title;
  // VERSION (not required)
  v2.version = "2.0.alpha";
  // UPDATED (required)
  v2.updated = meta.updated;
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

  // (GENOME) ANNOTATIONS
  if (meta.annotations) {
    v2.genome_annotations = meta.annotations;
  }
  // FILTERS
  if (meta.filters) {
    v2.filters = meta.filters;
  }
  // PANELS
  if (meta.panels) {
    v2.panels = meta.panels;
  }
  // [DISPLAY_]DEFAULTS
  if (meta.defaults) {
    v2.display_defaults = {};
    if (meta.defaults.geoResolution) v2.display_defaults.geo_resolution = meta.defaults.geoResolution;
    if (meta.defaults.colorBy) v2.display_defaults.color_by = meta.defaults.colorBy;
    if (meta.defaults.distanceMeasure) v2.display_defaults.distance_measure = meta.defaults.distanceMeasure;
    if (meta.defaults.mapTriplicate) v2.display_defaults.map_triplicate = meta.defaults.mapTriplicate;
    delete meta.defaults;
  }
  // GEO[GRAPHIC_INFO]
  if (meta.geo) {
    v2.geographic_info = meta.geo;
  }
};

const setVaccineChoicesOnNodes = (meta, tree) => {
  if (meta.vaccine_choices) {
    traverseTree(tree, (n) => {
      if (meta.vaccine_choices[n.strain]) {
        n.vaccine = {
          /* in v1 JSONs the only date provided was (typically) the selecion date,
          but note that the cross is always drawn on the tip (i.e. sample date) */
          selection_date: meta.vaccine_choices[n.strain]
        };
      }
    });
  }
  /* move `node.serum` (if value is true) to `node.vaccine.serum` */
  traverseTree(tree, (n) => {
    if (n.serum) {
      if (!n.vaccine) n.vaccine = {};
      n.vaccine.serum = true;
    }
  });
};

const storeTreeAsV2 = (v2, tree) => {
  // const attrsWhichRemain = new Set();
  // const propsRemoved = new Set();

  const allowedProperties = ["strain", "div", "num_date", "vaccine", "labels", "hidden", "mutations", "url", "accession", "traits", "children", "authors"];
  const attrsToIgnore = ["clock_length", "date", "raw_date", "strain"];

  traverseTree(tree, (node) => {
    // strain: already set
    // vaccine: already set (see above)
    if (node.attr) {
      // authors: (key modified above) needs to move to property on node
      if (node.attr.authors) {
        node.authors = node.attr.authors;
        delete node.attr.authors;
      }
      // accession, likewise moves to the node (from `node.attr.accession`)
      if (node.attr.accession) {
        node.accession = node.attr.accession;
        delete node.attr.accession;
      }
      // url, likewise moves to the node (from `node.attr.accession`)
      if (node.attr.url) {
        node.url = node.attr.url;
        delete node.attr.url;
      }
      // branch labels for clade (this behaviour was hardcoded into auspice)
      if (node.attr.clade_name || node.attr.clade_annotation) {
        if (!node.labels) node.labels = {};
        node.labels.clade = node.attr.clade_annotation || node.attr.clade_name;
        delete node.attr.clade_name;
        delete node.attr.clade_annotation;
      }
      // branch labels for "aa" (this behaviour was hardcoded into auspice)
      if (node.aa_muts) {
        const muts = [];
        for (const aa in node.aa_muts) { // eslint-disable-line
          if (node.aa_muts[aa].length) {
            muts.push(`${aa}: ${node.aa_muts[aa].join(", ")}`);
          }
        }
        if (muts.length) {
          if (!node.labels) node.labels = {};
          node.labels.aa = muts.join("; ");
        }
      }
      // num_date
      if (node.attr.num_date) {
        node.num_date = {value: node.attr.num_date};
        delete node.attr.num_date;
        if (node.attr.num_date_confidence) {
          node.num_date.confidence = node.attr.num_date_confidence;
          delete node.attr.num_date_confidence;
        }
      }
      // div (NOTE div can be 0)
      if (node.attr.div !== undefined) {
        node.div = node.attr.div;
        delete node.attr.div;
      }

      /* Transfer the remaining `node.attr[x]` to `node.traits[x]` (different shape) */
      const traitKeys = Object.keys(node.attr)
        .filter((a) => !a.endsWith("_entropy") && !a.endsWith("_confidence"))
        .filter((a) => !attrsToIgnore.includes(a));
      if (traitKeys.length) node.traits = {};
      for (const trait of traitKeys) {
        const data = {value: node.attr[trait]};
        if (node.attr[`${trait}_confidence`]) {
          data.confidence = node.attr[`${trait}_confidence`];
        }
        if (node.attr[`${trait}_entropy`]) {
          data.entropy = node.attr[`${trait}_entropy`];
        }
        node.traits[trait] = data;
      }
      // Object.keys(node.attr).forEach((a) => {attrsWhichRemain.add(a);});
    }

    // NUC + AA MUTATIONS
    if (node.muts || node.aa_muts) {
      node.mutations = {};
      if (node.aa_muts) node.mutations = node.aa_muts;
      if (node.muts) node.mutations.nuc = node.muts;
      delete node.muts;
      delete node.aa_muts;
    }

    // REMOVE NON-V2 PROPS FROM EACH NODE
    Object.keys(node)
      .filter((prop) => !allowedProperties.includes(prop))
      .forEach((prop) => {
        // propsRemoved.add(prop);
        delete node[prop];
      });

  });

  // console.log("These attrs were left over:", attrsWhichRemain);
  // console.log("Props removed (from v1 tree nodes):", propsRemoved);

  v2.tree = tree;
};


const convert = ({tree, meta, treeName}) => {
  const v2 = {};
  setColorings(v2, meta);
  setMiscMetaProperties(v2, meta);
  setAuthorInfo(v2, meta, tree);
  setVaccineChoicesOnNodes(meta, tree);
  storeTreeAsV2(v2, tree);
  v2.tree_name = treeName;
  return v2;
};


module.exports = {
  convert
};
