import { tipRadius, freqScale } from "./globals";
import { getGenotype } from "./getGenotype";

export const gatherTips = (node, tips) => {

  if (typeof node.children !== "undefined") {
    for (let i = 0, c = node.children.length; i < c; i++) {
      gatherTips(node.children[i], tips);
    }
  } else {
    tips.push(node);
  }
  return tips;
};

export const getVaccines = (tips) => {
  const v = [];
  tips.forEach((tip) => {
    if (vaccineStrains.indexOf(tip.strain) !== -1) {
      tip.choice = vaccineChoice[tip.strain];
      v.push(tip);
    }
  });
  return v;
};

export const calcDates = (nodes) => {
  nodes.forEach((d) => {
    d.dateval = new Date(d.date);
  });
};

export const minimumAttribute = (node, attr, min) => {
  if (typeof node.children !== "undefined") {
    for (let i = 0, c = node.children.length; i < c; i++) {
      min = minimumAttribute(node.children[i], attr, min);
    }
  } else if (node[attr] < min) {
    min = node[attr];
  }
  return min;
};

export const maximumAttribute = (node, attr, max) => {
  if (typeof node.children !== "undefined") {
    for (let i = 0, c = node.children.length; i < c; i++) {
      max = maximumAttribute(node.children[i], attr, max);
    }
  } else if (node[attr] > max) {
    max = node[attr];
  }
  return max;
};

export const calcBranchLength = (node) => {
  if (typeof node.children !== "undefined") {
    for (let i = 0, c = node.children.length; i < c; i++) {
      calcBranchLength(node.children[i]);
      node.children[i].branch_length = node.children[i].xvalue - node.xvalue;
    }
  }
};

/**
 * for each node, calculate the number of subtending tips (alive or dead)
**/
export const calcFullTipCounts = (node) => {
  node.fullTipCount = 0;
  if (typeof node.children !== "undefined") {
    for (let i = 0; i < node.children.length; i++) {
      calcFullTipCounts(node.children[i]);
      node.fullTipCount += node.children[i].fullTipCount;
    }
  } else {
    node.fullTipCount = 1;
  }
};


/**
 * for each node, calculate the number of tips in the currently selected time window.
**/
export const calcTipCounts = (node) => {
  node.tipCount = 0;
  if (typeof node.children !== "undefined") {
    for (let i = 0; i < node.children.length; i++) {
      calcTipCounts(node.children[i]);
      node.tipCount += node.children[i].tipCount;
    }
  } else if (node.current) {
    node.tipCount = 1;
  }
  // console.log("node has children so iterate", node.tipCount, "number of children", node.children && node.children.length, node.current)
};

/**
sets each node in the tree to alive=true if it has at least one descendent with current=true
**/
export const setNodeAlive = (node) => {
  if (typeof node.children !== "undefined") {
    let aliveChildren = false;
    for (let i = 0, c = node.children.length; i < c; i++) {
      setNodeAlive(node.children[i]);
      aliveChildren = aliveChildren || node.children[i].alive;
    }
    node.alive = aliveChildren;
  } else {
    node.alive = node.current;
  }
};


export const adjust_freq_by_date = (nodes, rootNode) => {
  // console.log("all nodes and root node", nodes, rootNode)
  return nodes.map((d) => {
    // console.log("tipcount & rootnodeTipcount", d.tipCount, rootNode.tipCount)
    // d.frequency = (d.tipCount) / rootNode.tipCount;
  });
};

// export const arrayInEquality = function(a,b) {
//   if (a&&b){
//     const eq = a.map((d,i)=>d!==b[i]);
//     return eq.some((d)=>d);
//   }else{
//     return true;
//   }
// };

// branch thickness is from clade frequencies
export const branchThickness = function (tree) {
  if (tree.nodes) {
    const maxTipCount = tree.nodes[0].fullTipCount;
    return tree.nodes.map((d) => {
      return freqScale(d.fullTipCount / maxTipCount);
    });
  }
  return 2.0;
}

const getTipColorAttribute = function (node, colorScale, sequences) {
  if (colorScale.colorBy.slice(0, 3) === "gt-" && colorScale.genotype) {
    return getGenotype(colorScale.genotype[0][0],
                       colorScale.genotype[0][1],
                       node,
                       sequences.sequences);
  }
  return node.attr[colorScale.colorBy];
};

export const calcNodeColor = function (tree, colorScale, sequences) {
  if (tree && tree.nodes && colorScale && colorScale.colorBy) {
    const nodeColorAttr = tree.nodes.map((n) => getTipColorAttribute(n, colorScale, sequences));
    return nodeColorAttr.map((n) => colorScale.scale(n));
  }
  return null;
};

const determineLegendMatch = function (selectedLegendItem,
                                       node,
                                       legendBoundsMap,
                                       colorScale,
                                       sequences) {
  let bool;
  const nodeAttr = getTipColorAttribute(node, colorScale, sequences);
  // equates a tip and a legend element
  // exact match is required for categorical qunantities such as genotypes, regions
  // continuous variables need to fall into the interal (lower_bound[leg], leg]
  if (legendBoundsMap) {
    bool = (nodeAttr <= legendBoundsMap.upper_bound[selectedLegendItem]) &&
           (nodeAttr > legendBoundsMap.lower_bound[selectedLegendItem]);
  } else {
    bool = nodeAttr === selectedLegendItem;
  }
  return bool;
};

export const calcTipRadii = function (selectedLegendItem,
                           colorScale,
                           sequences,
                           tree
                         ) {
  if (selectedLegendItem && tree && tree.nodes){
    const legendMap = colorScale.continuous ? colorScale.legendBoundsMap : false;
    return tree.nodes.map((d) => determineLegendMatch(selectedLegendItem, d, legendMap, colorScale, sequences) ? 6 : 3);
  } else if (tree && tree.nodes) {
    return tree.nodes.map((d) => tipRadius);
  }
  return null; // fallthrough
};

const parseFilterQuery = function (query) {
  const tmp = query.split("-").map((d) => d.split("."));
  return {
    "fields": tmp.map((d) => d[0]),
    "filters": tmp.map((d) => d[d.length - 1].split(","))
  };
};

export const calcTipVisibility = function (tree, metaMetadata, controls) {
  if (tree.nodes){
    /* extract the filter information from redux.
    redux.filters has 2 keys, each with an array of values
    keys: "region" and/or "authors"
    filterPairs is a list of lists. Each list defines the filtering to do.
    i.e. [ [ region, [...values]], [authors, [...values]]]
    */
    const filterPairs = [];
    Object.keys(controls.filters).map((key) => {
      if (controls.filters[key].length) {
        filterPairs.push([key, controls.filters[key]]);
      }
    });

    const lowerLimit = controls.dateMin;
    const upperLimit = controls.dateMax;
    if (upperLimit && lowerLimit) {
      if (filterPairs.length) {
        return tree.nodes.map((d) => (
          d.attr.date >= lowerLimit
          && d.attr.date < upperLimit
          && filterPairs.every((x) => x[1].indexOf(d.attr[x[0]]) > -1)
        ) ? "visible" : "hidden");
      } else {
        return tree.nodes.map((d) => (
          d.attr.date >= lowerLimit
          && d.attr.date < upperLimit
        ) ? "visible" : "hidden");
      }
    }
  }
  return "visible";
};
