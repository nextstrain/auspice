import { ReduxNode, StreamDimensions, StreamSummary, Visibility } from "../reducers/tree/types";
import { getTraitFromNode, getDivFromNode } from "./treeMiscHelpers"
import { NODE_VISIBLE } from "./globals";
import pdf from '@stdlib/stats-base-dists-normal-pdf';

/**
* Side effects:
*  - sets node.streamMembership -> false | stream name
*  - sets node.streamStart -> boolean
* Returns
*  "streams": each key -> object
*  "connectedStreamOrdering" (or a tree structure? This seems hard...)
* ToDo
*   - parse in streamLabel / don't hardcode here
*/
export function labelStreamMembership(tree: ReduxNode, branchLabelKey): Record<string, StreamSummary> {
  console.groupCollapsed("labelStreamMembership")
  console.log(`Branch label: ${branchLabelKey}`)
  const streams: Record<string, StreamSummary> = {};
  const connectedStreamStartNodes: Record<string,ReduxNode> = {};

  /**
   * We should be able to traverse the tree from the root node (or at least
   * the subtree root nodes), however `setDisplayOrder` can not currently
   * deal with subtree root nodes which are stream origins - i.e. the JSON
   * tree(s) can't have a branch label used as a stream on the root.
   */
  // const stack: [ReduxNode, false|string][] = [[tree, false]];
  const stack: [ReduxNode, false|string][] = tree.children
    .map((subtreeRootNode) => subtreeRootNode.children)
    .flat()
    .map((node) => [node, false]);

  while (stack.length) {
    const [node, parentStreamMembership] = stack.pop();
    const newStreamMembership = node?.branch_attrs?.labels?.[branchLabelKey];

    /* clear any previous stream-related information using `streamName` as a sentinel value */
    // note that node.inStream (which is on every node) is re-set later in this loop
    if (node.streamName) {
      delete node.streamName;
      delete node.streamPivots;
      delete node.streamCategories;
      delete node.streamDimensions;
      delete node.streamMaxHeight;
    }

    if (newStreamMembership) {
      console.log("Stream start", newStreamMembership, ", from node", node.name, parentStreamMembership ? ` nested within ${parentStreamMembership}` : ' (new start!)');
      
      if (newStreamMembership in streams) throw new Error("labelStreamMembership fatal error I");

      streams[newStreamMembership] = {
        name: newStreamMembership,
        startNode: node.arrayIdx,
        members: [], // terminals only
        streamChildren: [], // direct children only
        parentStreamName: parentStreamMembership, 
      };
      node.streamName = newStreamMembership;

      if (parentStreamMembership) {
        if (!(parentStreamMembership in streams)) throw new Error("labelStreamMembership fatal error II");
        streams[parentStreamMembership].streamChildren.push(newStreamMembership);
      } else {
        connectedStreamStartNodes[newStreamMembership] = node;
      }
    }

    const currentStreamMembership = newStreamMembership || parentStreamMembership;
    node.inStream = !!currentStreamMembership;
    if (currentStreamMembership && !node.hasChildren) {
      streams[currentStreamMembership].members.push(node.arrayIdx);
    }

    for (const child of node.children || []) {
      stack.push([child, currentStreamMembership])
    }
  }

  /* ladderise all descendant streams from each of the start points (non-nested streams) */
  for (const streamRoot of Object.values(connectedStreamStartNodes)) {
    ladderiseConnectedStreams(streams, streamRoot);
  }

  
  console.log("streams", streams)
  console.groupEnd();
  return streams;
}



export function processStreams(
  streams: Record<string, StreamSummary>,
  nodes: ReduxNode[],
  visibility: Visibility[],
  metric: "num_date"|"div",
  colorScale,
  { skipPivots=false, skipCategories=false }: {skipPivots?: boolean, skipCategories?: boolean} = {}
):void {
  console.groupCollapsed("processStreams")
  console.log(`color: ${colorScale.colorBy} metric: ${metric} skipPivots: ${skipPivots} skipCategories: ${skipCategories}`)
  const totalNumberOfStreams = Object.keys(streams).length;
  for (const stream of Object.values(streams)) {
    const startNode = nodes[stream.startNode];
    const nodesThisStream = _pick(nodes, stream.members)

    /**
     * Pivots often don't need to be recalculated
     */
    let pivots;
    if (skipPivots) {
      pivots = startNode.streamPivots
    } else {
      pivots = calcPivots(totalNumberOfStreams, startNode, nodesThisStream, metric);
      startNode.streamPivots = pivots
    }

    /**
     * Categories only need to be recalculated when the colouring changes (or upon stream creation)
     */
    if (!skipCategories) {
      startNode.streamCategories = observedCategories(nodesThisStream, colorScale);
    }

    /**
     * When a stream is being instantiated for the first time we need to compute the max height.
     * Importantly this considers all candidate nodes to be visible.
     */
    let dimensions: StreamDimensions;
    let everythingIsVisibleAnyway = false;
    let streamNodeCountsTotal: number;
    let streamNodeCountsVisible: number;

    if (!Object.hasOwn(startNode, "streamMaxHeight")) {
      ({dimensions, streamNodeCountsTotal, streamNodeCountsVisible} = computeStreamDimensions(nodesThisStream, pivots, metric, startNode.streamCategories, true));
      startNode.streamMaxHeight = dimensions.length ? computeStreamMaxHeight(dimensions) : 0;

      const visibilityValues = new Set(visibility);
      if (visibilityValues.size===1 && visibilityValues.has(NODE_VISIBLE)) {
        everythingIsVisibleAnyway = true;
      }
    }

    /**
     * Compute the dimensions of the stream, taking into account visibility
     */
    if (!everythingIsVisibleAnyway) {
      ({dimensions, streamNodeCountsTotal, streamNodeCountsVisible} = computeStreamDimensions(nodesThisStream, pivots, metric, startNode.streamCategories, visibility));
    }

    startNode.streamDimensions = dimensions;
    startNode.streamNodeCounts = {total: streamNodeCountsTotal, visible: streamNodeCountsVisible};

    console.log(`Stream ${stream.name}, ${nodesThisStream.length} tips. nPivots: ${startNode.streamPivots.length}, nCatgegories: ${startNode.streamCategories.length}, max height (kde weight): ${startNode.streamMaxHeight}. Start node:`, startNode)
  }

  console.groupEnd()
}



/**
 * NOTE: KDE weights are undercounted if any measurable weight is assigned to values beyond the pivots calculated
 * here... TODO XXX
 * 
 * NOTE: We should know the maximum observed date/div in the tree and ensure our pivots don't exceed it, but if
 * you don't add pivots beyond the last node in the stream it's a hard stop...
 * 
 * NOTE: We should make the number of pivots depend on the zoom level / number of streams in view...
 */
function calcPivots(totalNumberOfStreams: number, streamStartNode: ReduxNode, contributingNodes: ReduxNode[], metric: "num_date"|"div" ): number[] {
  const startValue = metric==='div' ? getDivFromNode(streamStartNode) : getTraitFromNode(streamStartNode, 'num_date');

  if (contributingNodes.length===0) { /* stream with no terminal nodes */
    return [startValue];
  }

  const nPivots = totalNumberOfStreams > 100 ? 10 : 50;

  const domain = contributingNodes.reduce((acc, node) => {
    const value = metric==='div' ? getDivFromNode(node) : getTraitFromNode(node, 'num_date');
    if (acc[0] > value) acc[0] = value;
    if (acc[1] < value) acc[1] = value;
    return acc;
  }, [Infinity, -Infinity])

  // extend the span on the left side by going half way to the origin node

  domain[0] -= Math.abs(domain[0]-startValue)/2
  // extend the span on the right by 5% of the (new) span
  domain[1] += Math.abs(domain[1] - domain[0])/20;
  // if we have zero span then we need to add some arbritrary span
  // TODO - this needs some understanding of the div/num_date in the tree overall
  if (domain[0]===domain[1]) domain[1] += metric==='div' ? 1/20 : 1;

  const size = Math.abs(domain[1] - domain[0])/(nPivots-1);
  const pivots = Array.from(Array(nPivots), (_, i) => domain[0] + i*size);
  return pivots;
}

/**
 * Collect all possible categories - "ribbons within a stream(tree)" - by looping
 * over all nodes in the stream. The order here reflects the order of ripples in the streamtree.
 */
function observedCategories(nodes: ReduxNode[], colorScale: any): ReduxNode['streamCategories'] {
  const colorBy: string = colorScale.colorBy;

  if (colorScale.continuous) {
    /* NOTE: plenty of speed-ups here if it's a bottleneck */
    const categories = Object.entries(colorScale.legendBounds)
      .map(([name, bounds], i) => [name, bounds[0], bounds[1], colorScale.scale(colorScale.legendValues[i]), []])
    for (const n of nodes) {
      const v = getTraitFromNode(n, colorBy);
      for (const c of categories) {
        if (v <= c[2] && v >= c[1]) {
          c[4].push(n.arrayIdx)
          break;
        }
      }
    }
    return categories
      .filter((c) => c[4].length>0)
      .map((c) => ({name: c[0], color: c[3], nodes: c[4]}));
  }

  const getter: (n: ReduxNode) => [number, string] = colorScale.genotype ? (n) => [n.arrayIdx, n.currentGt] : (n) => [n.arrayIdx, getTraitFromNode(n, colorBy)];
  const nodesAndCategories: [number, string][] = nodes.map(getter);
  const orderedCategories = Array.from(new Set(nodesAndCategories.map((el) => el[1])))
    .sort((a,b) => colorScale.legendValues.indexOf(a) - colorScale.legendValues.indexOf(b));
  return orderedCategories.map((name) => ({
    name,
    color: colorScale.scale(name),
    nodes: nodesAndCategories.filter(([_, catName]) => catName===name).map(([nodeIdx,]) => nodeIdx)
  }));
}


/**
 * Returns a matrix of data intended for visualisation by d3 as a stream graph
 * The outer dimensions correspond to categories, i.e. the ribbons of a stream
 * The inner dimensions correspond to pivots.
 * 
 * Each visible node for a given category is represented by a gaussian centered
 * on the node's num_date or divergence value, and the probability mass is computed
 * for each pivot and summed together for all nodes.
 */
function computeStreamDimensions(nodes: ReduxNode[], pivots: number[], metric, categories: ReduxNode['streamCategories'], visibility: true|Visibility[]):
  {dimensions: StreamDimensions, streamNodeCountsTotal: number, streamNodeCountsVisible: number} {
  let [streamNodeCountsTotal, streamNodeCountsVisible] = [0,0];
  const span = Math.abs(pivots.at(-1) - pivots[0]);
  const sigma = span/10; // 5% of the pivot span - TODO XXX
  const scalar = 1/pdf.factory(0, sigma)(0); // max weight supplied by a single KDE (at a single KDE)
  const dimensions = categories.map((categoryInfo) => {
    const mass = pivots.map(() => 0);
    
    const categoryNodes = nodes.filter((node) => categoryInfo.nodes.includes(node.arrayIdx))
    streamNodeCountsTotal += categoryNodes.length;
    const visibleCategoryNodes = categoryNodes.filter((node) => visibility===true || visibility[node.arrayIdx]===NODE_VISIBLE);
    streamNodeCountsVisible += visibleCategoryNodes.length;

    for (const node of visibleCategoryNodes) {
      const mu = metric==='div' ? getDivFromNode(node) : getTraitFromNode(node, 'num_date');
      const kde = pdf.factory(mu, sigma);
      pivots.forEach((pivot, idx) => {
        mass[idx]+=kde(pivot)*scalar;
      })
    }
    return mass;
  })
  return {dimensions, streamNodeCountsTotal, streamNodeCountsVisible};
}

function computeStreamMaxHeight(dimensions: StreamDimensions): number {
  const nPivots = dimensions[0].length;
  return Array.from(Array(nPivots), undefined)
    .map((_, pivotIdx) => _sum(dimensions.map((weightsPerPivot) => weightsPerPivot[pivotIdx])))
    .reduce((maxValue, cv) => cv > maxValue ? cv : maxValue, 0)
}

function ladderiseConnectedStreams(streams: Record<string,StreamSummary>, root: ReduxNode):void {
  // const streamOrigins = Object.keys(streams).filter((streamName) => streams[streamName].parentStreamName===false);
  console.log("Ladderizing streams descendant from stream", root.streamName, "(start node name:", root.name);

  /** Essentially duplicate a bare-bones display order calculation to allow us to work out the
   * median (mean?) of the stream in a typical rectangular layout (so we can ladderise them)
   */
  const nodeIdxLadderPoisition: Map<number,number> = new Map();
  const streamNames = []; /* all connected streams, including the start stream */
  function _recurse(node: ReduxNode, yCounter: number):number {
    if (node.streamName in streams) streamNames.push(node.streamName)
    if (node?.children?.length) {
      for (let i = node.children.length - 1; i >= 0; i--) {
        yCounter = _recurse(node.children[i], yCounter);
      }
    } else {
      nodeIdxLadderPoisition.set(node.arrayIdx, yCounter++);
    }
    return yCounter;
  }
  _recurse(root, 0);
  // const streamMedianPosition: Record<string,number> = {};

  const ladderisedStreams = streamNames
    .map((streamName) => {
      const yVals = streams[streamName].members
        .map((arrayIdx) => nodeIdxLadderPoisition.get(arrayIdx))
        .sort();
      return [streamName, yVals.at(Math.floor(yVals.length/2))]
    })
    .sort((a, b) => a[1]-b[1])
    .map(([streamName,]) => streamName);

  streams[root.streamName].connectedStreamsLadderised = ladderisedStreams;
}


function _pick<T>(arr:T[], idxs: number[]):T[] {
  return idxs.map((idx) => arr[idx])
}

function _sum(arr: number[]): number {
  return arr.reduce((acc, cv) => acc+cv, 0)
}

export function isNodeWithinAnotherStream(node: ReduxNode, branchLabelKey: string): boolean {
  // if the current node is a stream start then it's not _within_ another stream, for this definition of _within_
  if (node?.branch_attrs?.labels?.[branchLabelKey]) return false;
  let n = node.parent;
  while (true) { // eslint-disable-line no-constant-condition
    if (n?.branch_attrs?.labels?.[branchLabelKey]) return true;
    if (n.parent===n) return false;
    n = n.parent;
  }
}