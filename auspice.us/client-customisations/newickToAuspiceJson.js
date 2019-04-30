/**
 * Newick format parser in JavaScript.
 *
 * Copyright (c) Jason Davies 2010.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 */
const parseNewick = (nwk) => {
  const ancestors = [];
  let tree = {};
  const tokens = nwk.split(/\s*(;|\(|\)|,|:)\s*/);
  for (let i=0; i<tokens.length; i++) {
    const token = tokens[i];
    const subtree = {};
    switch (token) {
      case '(': // new child nodes up next
        tree.children = [subtree];
        ancestors.push(tree);
        tree = subtree;
        break;
      case ',': // next node: another child of the last ancestor
        ancestors[ancestors.length-1].children.push(subtree);
        tree = subtree;
        break;
      case ')': // optional name next
        tree = ancestors.pop();
        break;
      case ':': // optional length next
        break;
      default:
        const x = tokens[i-1];
        if (x === ')' || x === '(' || x === ',') {
          tree.strain = token;
        } else if (x === ':') {
          tree.div = parseFloat(token);
        }
    }
  }
  return tree;
};

const getTreeStruct = (nwk) => {
  const tree = parseNewick(nwk);

  /* ensure every node has a strain name */
  let count = 10000;
  const addNodeName = (node) => {
    if (!node.strain) {
      node.strain=`NODE${count}`;
      count++;
    }
    if (node.children) {
      node.children.forEach((child) => addNodeName(child));
    }
  };
  addNodeName(tree);

  /* div should be cumulative! */
  const cumulativeDivs = (node, soFar=0) => {
    node.div += soFar;
    if (node.children) {
      node.children.forEach((child) => cumulativeDivs(child, node.div));
    }
  };
  cumulativeDivs(tree);


  return tree;
};

/**
 * Convert a newick string to an auspice (v2) JSON
 * @param {string} nwk newick string
 * @returns {object} auspice JSON
 */
const newickToAuspiceJson = (name, nwk) => {
  const json = {
    title: name,
    tree: getTreeStruct(nwk),
    panels: ["tree"],
    version: "2.0"
  };
  return json;
};


export default newickToAuspiceJson;
