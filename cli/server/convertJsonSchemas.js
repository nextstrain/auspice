const utils = require("../utils");

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
