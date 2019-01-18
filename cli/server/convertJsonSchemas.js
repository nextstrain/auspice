

const convert = ({tree, meta, treeName, displayUrl}) => {
  const v2 = {};
  v2.tree = tree;
  v2.meta = meta;
  v2._treeName = treeName;
  v2._displayUrl = displayUrl;
  return v2;
};


module.exports = {
  convert
};
