const utils = require("../utils");

/** In auspice v1, the `prettyString` function was used extensively to transform values
 * for "nicer" display. v2 JSONs intentially avoid this -- the strings are intended to
 * be displayed as-is. This function is preserved here to aid in converting v1 JSONs
 * to v2 JSONs.
 */
const prettyString = (x, {trim = 0, camelCase = true, removeComma = false, stripEtAl = false, lowerEtAl = false} = {}) => {
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
    if (lowerEtAl) {
      x = x.replace('Et Al', 'et al');
    }
    if (stripEtAl) {
      x = x.replace('et al.', '').replace('Et Al.', '').replace('et al', '').replace('Et Al', '');
    }
    return x;
  } else if (typeof x === "number") {
    /* Expected inputs & outputs: (negatives are the same, except with a preceeding `-` character)
    100 => '100'
    100.34 => '100'
    185781 => '185781'
    85.1 => '85.1'
    85.1234 => '85.12'
    0.1234 => '0.1234'
    0.123456 => '0.1235'
    0.00000000001234 => '1.234e-11'
    0.0 => '0' // -0.0 => '0' as well

    Beware that if there's a leading zero, then javascript interprets it as octal.
    (I've never seen this intention in nextstrain.)
    */
    if (Number.isInteger(x)) {
      return String(parseInt(x, 10));
    }
    const magnitude = Math.ceil(Math.log10(Math.abs(x) + 1e-10));
    if (magnitude > 3) {
      // for numbers over 100 (or under -100), we return the integer (i.e. no decimal places)
      return String(parseInt(x, 10));
    }
    if (magnitude > 0) {
      // for numbers 1 and over (or -1 and below) we'll use 2dp, but strip any trailing zeros
      return x.toPrecision(magnitude+2).replace(/[.]0*$/, '');
    }
    // for numbers between -1 & 1 (not inclusive) we want to use up to 4 significant figues
    const sigFig = String(x).replace(/-?0\.0*/, '').length;
    return x.toPrecision(sigFig > 4 ? 4 : sigFig);
  }
  return x;
};

const formatURLString = (x) => {
  let url = x;
  if (url.startsWith("https_")) {
    url = url.replace(/^https_/, "https:");
  } else if (url.startsWith("http_")) {
    url = url.replace(/^https_/, "http:");
  }
  return url;
};


const traverseTree = (node, cb) => {
  cb(node);
  if (node.children) {
    node.children.forEach((n) => traverseTree(n, cb));
  }
};

const setColorings = (v2, meta) => {
  v2.colorings = [];
  const color_options = meta.color_options;
  for (const [key, value] of Object.entries(color_options)) {
    const coloring = {
      key,
      title: prettyString(value.menuItem) || prettyString(value.legendTitle),
      type: value.type === "continuous" ? "continuous" : "categorical"
    };
    if (value.color_map) {
      coloring.scale = value.color_map.map((s) =>
        [prettyString(s[0], {removeComma: true}), s[1]]
      );
    }
    if (key === "authors") {
      coloring.key = "author";
    }
    v2.colorings.push(coloring);
  }


  /* Auspice (until 2.0.3) changed the ordering of colors by sorting against a predefined list.
  * The intention of v2 JSONs was that the order defined there was reflected in auspice.
  * We still sort v1 JSONs to keep things unchanged
  */
  const colorByMenuPreferredOrdering = [
    "clade_membership",
    "cHI",
    "cTiter",
    "fitness",
    "gt",
    "ep",
    "ne",
    "rb",
    "lbi",
    "dfreq",
    "division",
    "country",
    "region",
    "date",
    "glyc",
    "age",
    "age_score",
    "gender",
    "host",
    "subtype"
  ];
  v2.colorings.sort((a, b) => {
    const [ia, ib] = [colorByMenuPreferredOrdering.indexOf(a.key), colorByMenuPreferredOrdering.indexOf(b.key)];
    if (ia === -1 || ib === -1) {
      if (ia === -1) return 1;
      else if (ib === -1) return -1;
      return 0;
    }
    return ia > ib ? 1 : -1;
  });
};

const setAuthorInfoOnTree = (v2, meta) => {
  /* v1 had an author_info property & the node.attr.authors property
   * v2 has all the info set on the node itself at node.author
   */
  if (!meta.author_info) {
    return;
  }
  traverseTree(v2.tree, (node) => {
    if (node.attr && node.attr.authors) {
      const v1author = node.attr.authors;
      const v1info = meta.author_info[v1author];
      if (!v1info) return;
      node.node_attrs.author = {};
      if (v1info.title) node.node_attrs.author.title = v1info.title;
      if (v1info.journal) node.node_attrs.author.journal = v1info.journal;
      if (v1info.paper_url) node.node_attrs.author.paper_url = formatURLString(v1info.paper_url);
      node.node_attrs.author.value = prettyString(v1author, {camelCase: false});
    }
  });
};


/**
 * The v1 JSON annotations used 0-based starts for the gene positions and `1`/`-1` for
 * the strand. This function converts those to GFF-like format.
 * @param {object} annotations a mapping of gene name (or "nuc") to information about the feature.
 * The feature information was an object with properties `start`, `end` and `strand`
 */
const convertToGffFormat = (annotations) => {
  for (const name in annotations) { // eslint-disable-line
    // Convert from 0-based BED format to 1-based GFF format for start position
    annotations[name].start += 1;
    // half-open 0-based BED end position is the same as 1-based closed ended GFF position.
    // Represent forward(+) and reverse(-) strands
    annotations[name].strand = annotations[name].strand === 1 ? "+" : "-";
  }
  return annotations;
};

const setMiscMetaProperties = (v2, meta) => {
  // TITLE (required)
  v2.title = meta.title;
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
  }

  // (GENOME) ANNOTATIONS
  if (meta.annotations) {
    v2.genome_annotations = convertToGffFormat(meta.annotations);
  }
  // FILTERS
  if (meta.filters) {
    v2.filters = meta.filters;
    if (v2.filters.includes("authors")) {
      v2.filters.splice(v2.filters.indexOf("authors"), 1, "author");
    }
  }
  // PANELS
  if (meta.panels) {
    v2.panels = meta.panels;
  }
  // [DISPLAY_]DEFAULTS (v1 this was `defaults`, v2 is `display_defaults`)
  if (meta.defaults) {
    v2.display_defaults = {};
    const v1v2Fields = [
      ["geoResolution", "geo_resolution"], // i.e. v1: meta.defaults.geoResultion, v2: meta.display_defaults.geo_resolution
      ["colorBy", "color_by"],
      ["distanceMeasure", "distance_measure"],
      ["mapTriplicate", "map_triplicate"],
      ["layout", "layout"]
    ];
    for (const v1v2 of v1v2Fields) {
      if (meta.defaults[v1v2[0]]) {
        v2.display_defaults[v1v2[1]] = meta.defaults[v1v2[0]];
      }
    }
    delete meta.defaults;
  }
  // GEO -> GEO_RESOLUTIONS (note that the shape is different)
  if (meta.geo) {
    v2.geo_resolutions = [];
    for (const [key, demes] of Object.entries(meta.geo)) {
      const prettyDemes = {};
      Object.keys(demes).forEach((location) => {
        prettyDemes[prettyString(location, {removeComma: true})] = demes[location];
      });
      v2.geo_resolutions.push({key, demes: prettyDemes});
    }
  }
};

const setVaccineChoicesOnNodes = (v2, v1meta) => {
  if (!v1meta.vaccine_choices) return;

  /* vaccine choices is a dict of strain name -> selection date (string) */
  const vaxChoices = new Set(Object.keys(v1meta.vaccine_choices));
  traverseTree(v2.tree, (n) => {
    if (vaxChoices.has(n.name)) {
      if (!n.node_attrs.vaccine) n.node_attrs.vaccine = {};
      n.node_attrs.vaccine.selection_date = v1meta.vaccine_choices[n.name];
    }
  });
};


/**
 * Note: branch labels were hardcoded into auspice v1 (aa + clade)
 */
const setLabels = (v2) => {
  traverseTree(v2.tree, (node) => {
    /* are their aa mutations? */
    if (node.branch_attrs && node.branch_attrs.mutations) {
      const mutations = node.branch_attrs.mutations;
      const aaMutsToLabel = Object.keys(mutations)
        .filter((key) => key !== "nuc")
        .map((aa) => `${aa}: ${mutations[aa].join(", ")}`);
      if (aaMutsToLabel.length) {
        if (!node.branch_attrs.labels) node.branch_attrs.labels = {};
        node.branch_attrs.labels.aa = aaMutsToLabel.join("; ");
      }
    }

    /* clade label */
    if (node.attr.clade_name || node.attr.clade_annotation) {
      if (!node.branch_attrs.labels) node.branch_attrs.labels = {};
      node.branch_attrs.labels.clade = node.attr.clade_annotation || node.attr.clade_name;
    }
  });
};

/**
 * Set the basic properties on each & every node in the tree
 * `name` {string}, `node_attrs` {obj}, `branch_attrs` {obj}
 * Note that `children` is not different between v1 & v2
 * @param {*} v2 v2 JSON to be modified
 * @param {*} tree v1 tree JSON data
 */
const setBasicTreeStructure = (v2, tree) => {
  traverseTree(tree, (node) => {
    // convert node.strain to node.name & store as a top-level property
    if (node.strain !== undefined) {
      node.name = node.strain;
      delete node.strain;
    } else {
      throw new Error("v1-v2 conversion error -- `strain` missing from node");
    }
    // create `node_attrs` and `branch_attrs` (will overwrite a v1 key of the same name)
    node.node_attrs = {};
    node.branch_attrs = {};
  });
  v2.tree = tree;
};

/**
 * v2 trees can only have 4 properties: `name`, `branch_attrs`, `node_attrs` & `children`
 * anything else is left over from the v1 tree & is removed here
 */
const removeNonV2TreeProps = (v2) => {
  const v2keys = ["name", "branch_attrs", "node_attrs", "children"];
  traverseTree(v2.tree, (node) => {
    Object.keys((node)).forEach((key) => {
      if (!v2keys.includes(key)) {
        delete node[key];
      }
    });
  });
};

/**
 * Assign most of the properties already present on the tree into their
 * correct location as per the v2 schema.
 * @param {object} v2 v2 dataset
 */
const setNodeBranchAttrs = (v2) => {

  /* valid traits which have been taken care of separately */
  const traitsToIgnore = new Set(["num_date", "gt", "div", "author"]);
  const traitsToAssign = [];
  if (v2.meta.colorings) {
    v2.meta.colorings.forEach((c) => {
      if (!traitsToIgnore.has(c.key)) traitsToAssign.push(c.key);
    });
  }
  if (v2.meta.geo_resolutions) {
    v2.meta.geo_resolutions.forEach((c) => {
      if (!traitsToIgnore.has(c.key) && !traitsToAssign.includes(c.key)) {
        traitsToAssign.push(c.key);
      }
    });
  }

  traverseTree(v2.tree, (node) => {

    if (node.attr) {
      if (node.attr.url) node.node_attrs.url = node.attr.url;
      if (node.attr.accession) node.node_attrs.accession = node.attr.accession;
    }


    /* amino acid / nucleotide mutations */
    const mutations = {};
    if (node.aa_muts) {
      Object.keys(node.aa_muts).forEach((aa) => {
        if (node.aa_muts[aa].length) {
          mutations[aa] = node.aa_muts[aa];
        }
      });
    }
    if (node.muts && node.muts.length) {
      mutations.nuc = node.muts;
    }
    if (mutations) {
      node.branch_attrs.mutations = mutations;
    }

    /* num_date -- note that this can be 0 */
    if (node.attr.num_date !== undefined) {
      node.node_attrs.num_date = {value: node.attr.num_date};
      if (node.attr.num_date_confidence) {
        node.node_attrs.num_date.confidence = node.attr.num_date_confidence;
      }
    }

    /* divergence (div) -- note 1: this can be 0. note 2: this is cumulative */
    if (node.attr.div !== undefined) {
      node.node_attrs.div = node.attr.div;
    }

    if (node.hidden) node.node_attrs.hidden = node.hidden;

    /* transfer the colorings & geo resolutions */
    traitsToAssign.forEach((traitKey) => {
      const data = {value: prettyString(node.attr[traitKey], {removeComma: true})};
      if (node.attr[`${traitKey}_confidence`]) {
        data.confidence = {};
        Object.keys(node.attr[`${traitKey}_confidence`]).forEach((key) => {
          data.confidence[prettyString(key)] = node.attr[`${traitKey}_confidence`][key];
        });
      }
      if (node.attr[`${traitKey}_entropy`]) {
        data.entropy = node.attr[`${traitKey}_entropy`];
      }
      node.node_attrs[traitKey] = data;
    });

  });
};


const convertFromV1 = ({tree, meta}) => {
  const v2 = {version: "v2", meta: {}};
  // set metadata
  setColorings(v2["meta"], meta);
  setMiscMetaProperties(v2["meta"], meta);
  // set tree structure
  setBasicTreeStructure(v2, tree);
  setNodeBranchAttrs(v2);
  setLabels(v2);
  setAuthorInfoOnTree(v2, meta);
  setVaccineChoicesOnNodes(v2, meta);
  removeNonV2TreeProps(v2);
  return v2;
};


module.exports = {
  convertFromV1
};
