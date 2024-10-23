import { getTraitFromNode } from "./treeMiscHelpers"


// Prototype - hardcode the CA of streams
function _isFounderNode(node) {
  const FOUNDERS = [
    "NODE_0000731",
    "NODE_0001569", // NOTE - other founder nodes are descendants of this clade
    "NODE_0000648",
    "NODE_0000038",
    "NODE_0001227",
    "NODE_0001571",
    // "NODE_0001773", // VERY BASAL IN TREE - everything is a descendant of this node
  ]
  return FOUNDERS.includes(node.name);
}



/**
 * CAVEATS:
 * - only works for trees with "FOUNDERS" in it
 * - only works for categorical colorScale
 * - only works for temporal tree
 */
export function partitionIntoStreams(nodes, colorScale) {
  
  const {founderIndiciesToDescendantFounderIndicies, founderIndiciesPostorder} =
    getFounderTree(nodes[0], _isFounderNode);


  const streams = {
    streams: [],
    mask: nodes.map((_) => 1), // 1 = show nodes as normal, 0 = mask out, nodes are part of a stream
    // founderTree,
    founderIndiciesToDescendantFounderIndicies,
    founderIndiciesPostorder,
  }

  streams.streams = founderIndiciesPostorder.map((founderIdx) => {
    const stream = {};
    stream.founderIdx = founderIdx;
    const nodesInStream = [];
    const founderNode = nodes[founderIdx];
    stream.founderName = founderNode.name;
    const stack = [founderNode];
    while (stack.length) {
      const node = stack.pop();
      if (founderIndiciesToDescendantFounderIndicies[founderNode.arrayIdx].includes(node.arrayIdx)) {
        // console.log("Stream for", founderNode.name, "skipping subtree of", node.name)
        continue
      }
      streams.mask[node.arrayIdx] = 0;
      // Don't mask the founder node so we can draw a branch to the start of the stream.
      // Note - this double counts this node I think
      // TODO - extend the stem of the founder node branch to join with the stream start point.
      // if (node.arrayIdx===founderNode.arrayIdx) streams.mask[node.arrayIdx] = 1;
      nodesInStream.push(node);
      for (const child of node.children || []) {
        stack.push(child)
      }
    }
    stream.categories = observedCategories(nodesInStream, colorScale);
    stream.categoryColors = stream.categories.map((value) => colorScale.scale(value))
    const pivotData = calcPivots(nodesInStream);
    stream.pivotIntervals = pivotData.intervals;
    stream.pivots = pivotData.pivots;
    stream.nodeIdxs = groupNodesIntoIntervals(nodesInStream, pivotData.intervals); // indexed by pivot idx
    stream.numNodes = nodesInStream.length;
    stream.maxNodesInInterval = Math.max(...stream.nodeIdxs.map((idxs) => idxs.length));
    stream.countsByCategory = groupNodesByCategory(nodes, stream.nodeIdxs, colorScale.colorBy, stream.categories);
    return stream;
  })

  return streams;
}

function observedCategories(nodes, colorScale) {
  const colorBy = colorScale.colorBy;
  const values = new Set();
  for (const node of nodes) {
    values.add(getTraitFromNode(node, colorBy));
  }
  // TODO XXX we want to check the values are a subset of colorScale.legendValues. Or domain?
  // What to do about undefined values?

  return Array.from(values).sort((a,b) => colorScale.legendValues.indexOf(a) - colorScale.legendValues.indexOf(b))
}

function calcPivots(nodes) {
  const domain = nodes.reduce((acc, node) => {
    const value = getTraitFromNode(node, "num_date"); // TODO XXX
    if (acc[0] > value) acc[0] = value;
    if (acc[1] < value) acc[1] = value;
    return acc;
  }, [Infinity, -Infinity])
  const nPivots = 10; // TODO XXX
  const size = (domain[1]-domain[0])/(nPivots-1);
  const intervals = Array.from(Array(nPivots), undefined);
  intervals[0] = [domain[0], domain[0] + size/2];
  intervals[intervals.length-1] = [domain[1]-size/2, domain[1]];
  for (let i=1; i<nPivots-1; i++) {
    intervals[i] = [intervals[i-1][1], intervals[i-1][1]+size]
  }
  const pivots = Array.from(Array(nPivots), (_, i) => domain[0] + i*size);
  // console.log("DOMAIN", domain, "size", size, "intervals", intervals, "pivots", pivots)
  return {intervals, pivots};
}


function groupNodesIntoIntervals(nodes, intervals) {
  const groups = Array.from(Array(intervals.length), () => [])
  // TODO XXX this is very crude
  for (const node of nodes) {
    const value = getTraitFromNode(node, "num_date"); // TODO XXX
    for (let i =0; i<intervals.length; i++) {
      if (value>intervals[i][0] && value<=intervals[i][1]) { // TODO - which side is open, which is closed?
        // TODO XXX - I use arrayIdx not the node itself as adding references to nodes like this
        // crashed the app with "RangeError: Maximum call stack size exceeded". I presume it's a redux-related
        // issue, as it arises from "at trackProperties (redux-toolkit.esm.js:508:22)"
        groups[i].push(node.arrayIdx)
        break
      }
    }
  }
  return groups;
}

function groupNodesByCategory(nodes, nodeIdxsByPivot, colorBy, categories) {
  return categories.map((category) => {
    return nodeIdxsByPivot.map((nodeIdxs) => {
      return nodeIdxs.filter((nodeIdx) => getTraitFromNode(nodes[nodeIdx], colorBy)===category).length
    })
  })
}

/**
 * 
 * @param {object} rootNode redux tree node
 * @param {function} isFounderNode
 */
function getFounderTree(rootNode, isFounderNode) {
  // Tree of nodes (in the main tree) which define stream trees
  const founderTree = {children: []};
  const nodesInStreamFounderTree = [];

  function traverse(node, streamParentNode=founderTree) {
    let newNode;
    if (isFounderNode(node)) {
      // add this as a child to the appropriate parent not in streamFounderTree
      newNode = {children: [], parent: streamParentNode, arrayIdx:node.arrayIdx, name: node.name}
      streamParentNode.children.push(newNode)
      nodesInStreamFounderTree.push(newNode)
    }
    for (const child of node.children || []) {
      traverse(child, newNode||streamParentNode)
    }
  }
  traverse(rootNode);

  // Create mapping of founder nodes (indicies) to all their descendant indicies
  const founderIndiciesToDescendantFounderIndicies = Object.fromEntries(
    nodesInStreamFounderTree.map((node) => {
      const descendantIndicies = [];
      const stack = [node]
      while (stack.length) {
        const n = stack.shift();
        if (n.arrayIdx!==node.arrayIdx) descendantIndicies.push(n.arrayIdx);
        for (const child of n.children || []) stack.push(child);
      }
      return [node.arrayIdx, descendantIndicies]
    })
  )

  // Create a list of founder indicies in postorder order, such that we can trivially visit
  // the nodes without needing traversals
  const founderIndiciesPostorder = [];
  function postorder(node) {
    for (const child of node.children||[]) {
      postorder(child);
    }
    if (node.arrayIdx!==undefined) founderIndiciesPostorder.push(node.arrayIdx);
  }
  postorder(founderTree)

  return {founderTree, founderIndiciesToDescendantFounderIndicies, founderIndiciesPostorder};
}