import { getTraitFromNode } from "./treeMiscHelpers"
import { NODE_VISIBLE } from "./globals";
import { sum } from "d3-array";


// Prototype - hardcode the CA of streams
function _isFounderNode(node) {

  if (node?.branch_attrs?.labels?.clade) return true;
  return false;


  const FOUNDERS = [
    // ZIKA:
    // "NODE_0000200", // 133, including below, so 40 of its own
    // "NODE_0000241", // 93 tips
    // "NODE_0000001"

  
    // FLU:
    "NODE_0001834",
    "NODE_0001220", // 1220
    "NODE_0001102", // 80
    "NODE_0000729", // 729, less 154 = 575
    "NODE_0001261", // 154
  ]
  return FOUNDERS.includes(node.name);
}



/**
 * CAVEATS:
 * - only works for trees with "FOUNDERS" in it
 * - only works for categorical colorScal`e
 * - only works for temporal tree
 */
export function partitionIntoStreams(enabled, nodes, visibility, colorScale, absoluteDateMinNumeric, absoluteDateMaxNumeric) {
  
  const streams = {
    streams: [],
    mask: nodes.map((_) => 1), // 1 = show nodes as normal, 0 = mask out, nodes are part of a stream
  }

  if (!enabled) return streams;

  const {founderIndiciesToDescendantFounderIndicies, foundersPostorder, streamGroups} =
    getFounderTree(nodes, _isFounderNode);
  streams.streamGroups = streamGroups;

  streams.streams = foundersPostorder.map((founderInfo) => { // TKTK
    const stream = {};
    stream.founderIdx = founderInfo.idx; // index of the root node (not part of the stream as it's not a tip)
    stream.founderVisibility = visibility[stream.founderIdx]===NODE_VISIBLE;

    stream.originatingNodeIdx = founderInfo.originatingNodeIdx;
    stream.originatingStreamIdx = foundersPostorder.reduce((ret, v, i) => v.idx===founderInfo.originatingStreamFounderIdx ? i : ret, null)
    const nodesInStream = []; // TERMINAL NODES ONLY
    const founderNode = nodes[founderInfo.idx];
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

      // nodesInStream is terminal only
      if (!node.hasChildren) {
        nodesInStream.push(node);
      }
      for (const child of node.children || []) {
        stack.push(child)
      }
    }
    // categories may have zero counts associated with them (over all pivots) depending on visibility settings
    stream.categories = observedCategories(nodesInStream, colorScale);
    stream.categoryColors = stream.categories.map((value) => colorScale.scale(value))
    // TODO XXX - the starting color needs to be modified if it is to match the branches!
    // See calculateStrokeColors, but this would need refactoring
    stream.startingColor = colorScale.scale(getTraitFromNode(nodes[founderInfo.idx], colorScale.colorBy))
    const pivotData = calcPivots(nodesInStream, absoluteDateMinNumeric, absoluteDateMaxNumeric);
    stream.pivotIntervals = pivotData.intervals;
    stream.pivots = pivotData.pivots;
    // nodeIdxs are all nodes, visible and not visible
    stream.nodeIdxs = groupNodesIntoIntervals(nodesInStream, pivotData.intervals); // indexed by pivot idx
    // stream.numNodes = nodesInStream.length;
    stream.maxNodesInInterval = Math.max(...stream.nodeIdxs.map((idxs) => idxs.length));
    stream.countsByCategory = countsByCategory(nodes, stream.nodeIdxs, visibility, colorScale.colorBy, stream.categories);
    const descendantFounderIndicies = founderIndiciesToDescendantFounderIndicies[founderNode.arrayIdx];
    stream.fullTipCountExSubstreams = calcFullTipCountExSubstreams(nodes, stream.founderIdx, descendantFounderIndicies);
    return stream;
  })

  return streams;
}


function calcFullTipCountExSubstreams(nodes, founderNodeIdx, descendantFounderIndicies) {
  let fullTipCount = nodes[founderNodeIdx].fullTipCount;
  const stack = [nodes[founderNodeIdx]];
  while (stack.length) {
    const node = stack.pop();
    if (descendantFounderIndicies.includes(node.arrayIdx)) {
      fullTipCount -= nodes[node.arrayIdx].fullTipCount;
    } else {
      for (const child of (node.children || [])) stack.push(child);
    }
  }
  return fullTipCount;
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

function calcPivots(nodes, absoluteDateMinNumeric, absoluteDateMaxNumeric) {
  const domain = nodes.reduce((acc, node) => {
    const value = getTraitFromNode(node, "num_date"); // TODO XXX
    if (acc[0] > value) acc[0] = value;
    if (acc[1] < value) acc[1] = value;
    return acc;
  }, [Infinity, -Infinity])

  const domainFraction = (domain[1]-domain[0]) / (absoluteDateMaxNumeric - absoluteDateMinNumeric);
  const availablePivots = 50;
  const nPivots = Math.ceil(domainFraction * availablePivots);
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

export function countsByCategory(nodes, nodeIdxsByPivot, visibility, colorBy, categories) {
  console.log("countsByCategory")
  return categories.map((category) => {
    return nodeIdxsByPivot.map((nodeIdxs) => {
      return nodeIdxs.filter(
        (nodeIdx) => getTraitFromNode(nodes[nodeIdx], colorBy)===category && visibility[nodeIdx]===NODE_VISIBLE
      ).length
    })
  })
}

export function streamConnectorVisibility() {
  // TODO XXX - returns boolean - is the founderIdx visible ? and then render has access to this!
}


/**
 * 
 * @param {object} rootNode redux tree node
 * @param {function} isFounderNode
 */
function getFounderTree(treeNodes, isFounderNode) {
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
  traverse(treeNodes[0]);

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
  const foundersPostorder = []
  function postorder(node) {
    for (const child of node.children||[]) {
      postorder(child);
    }
    if (node.arrayIdx===undefined) {
      return
    }
    foundersPostorder.push({
      idx: node.arrayIdx,
      rootName: node.name,
      originatingNodeIdx: treeNodes[node.arrayIdx].parent.arrayIdx,
      originatingStreamFounderIdx: Object.hasOwn(node.parent, "arrayIdx") ? node.parent.arrayIdx : null,
      childStreamFounders: node?.children?.map((c) => c.arrayIdx) || [],
      // NOTE: no concept of child-non-streams, i.e. can't have a normal tree sprout from a stream
    })
  }
  postorder(founderTree)
  foundersPostorder.forEach((f, i) => {f.streamIdx = i;});

  const streamGroups = founderTree.children.map((n) => { // n: founderTreeNode
    const indicies = [];
    const stack = [n];
    while (stack.length) {
      const m = stack.shift(); // preorder
      indicies.push(foundersPostorder.filter((d) => d.idx===m.arrayIdx)[0].streamIdx);
      // indicies.push(m.arrayIdx);
      for (const child of m.children) stack.unshift(child);
    }
    return indicies;
  })


  console.log({founderTree, founderIndiciesToDescendantFounderIndicies, foundersPostorder, streamGroups})
  return {founderTree, founderIndiciesToDescendantFounderIndicies, foundersPostorder, streamGroups};
}