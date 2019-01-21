

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

const convert = ({tree, meta, treeName, displayUrl}) => {
  const v2 = {};
  setColorings(v2, meta);
  v2.tree = tree;
  v2.meta = meta;
  v2._treeName = treeName;
  v2._displayUrl = displayUrl;
  return v2;
};


module.exports = {
  convert
};
