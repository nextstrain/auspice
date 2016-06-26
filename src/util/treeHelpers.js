/*********************************
**********************************
**********************************
**********************************
** Tree functions
**********************************
**********************************
**********************************
*********************************/

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


export const calcNodeAges = (tw) => {
  tips.forEach((d) => {
    const date = new Date(d.date.replace(/XX/g, "01"));
    const oneYear = 365.25 * 24 * 60 * 60 * 1000; // days*hours*minutes*seconds*milliseconds
    const diffYears = (globalDate.getTime() - date.getTime()) / oneYear;
    d.diff = diffYears;
    if (d.diff > 0 && d.diff < tw) {
      d.current = true;
    } else {
      d.current = false;
    }
    for (let k in restrictTo) {
      if (d[k] !== restrictTo[k] && restrictTo[k] !== "all") {
        d.current = false;
      }
    }
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

/**
 * for each node, calculate the exponentially attenuated tree length below the node
 * the polarizer is send "up", i.e. to parents
**/
export const calcUpPolarizers = (node) => {
  node.up_polarizer = 0;
  if (typeof node.children !== "undefined") {
    for (let i = 0; i < node.children.length; i++) {
      calcUpPolarizers(node.children[i]);
      node.up_polarizer += node.children[i].up_polarizer;
    }
  }
  const bl = node.branch_length / LBItau;
  node.up_polarizer *= Math.exp(-bl);
  if (node.alive) { // only alive branches contribute anything
    node.up_polarizer += LBItau * (1 - Math.exp(-bl));
  }
};

/**
 * for each node, calculate the exponentially attenuated tree length above the node,
 * that is "outside" the clade defined by this node. this down polarizer is send to children
**/
export const calcDownPolarizers = (node) => {
  if (typeof node.children !== "undefined") {
    for (let i1 = 0; i1 < node.children.length; i1++) {
      node.children[i1].down_polarizer = node.down_polarizer;
      for (let i2 = 0; i2 < node.children.length; i2++) {
        if (i1 !== i2) {
          node.children[i1].down_polarizer += node.children[i2].up_polarizer;
        }
      }
      // account for the attenuation over the branch_length
      const bl = node.children[i1].branch_length / LBItau;
      node.children[i1].down_polarizer *= Math.exp(-bl);
      if (node.children[i1].alive) { //the branch contributes only when the node is alive
        node.children[i1].down_polarizer += LBItau * (1 - Math.exp(-bl));
      }
      calcDownPolarizers(node.children[i1]);
    }
  }
};

export const calcPolarizers = (node) => {
  calcUpPolarizers(node);
  node.down_polarizer = 0; // set the down polarizer of the root to 0
  calcDownPolarizers(node);
};

/**
 * calculate the LBI for all nodes downstream of node
 * allnodes is provided for easy normalization at the end
**/
export const calcLBI = (node, allnodes) => {
  setNodeAlive(node);
  calcPolarizers(node);
  allnodes.forEach((d) => {
    d.LBI = 0;
    d.LBI += d.down_polarizer;
    if (typeof d.children !== "undefined") {
      for (let i = 0; i < d.children.length; i++) {
        d.LBI += d.children[i].up_polarizer;
      }
    }
  });
  // normalize the LBI to range [0,1]
  /* possible bug - where does maxLBI get used? is this attaching to window? */
  maxLBI = d3.max(allnodes.map((d) => { return d.LBI; }));
  allnodes.forEach((d) => { d.LBI /= maxLBI;});
};

export const adjust_freq_by_date = (nodes, rootNode) => {
  nodes.forEach((d) => {
    d.frequency = (d.tipCount) / rootNode.tipCount;
  });
};
