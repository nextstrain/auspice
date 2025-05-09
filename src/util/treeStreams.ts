import { ReduxNode, StreamDimensions, Visibility, Streams, sigma, weightToDisplayOrderScaleFactor,
  colorBySymbol, streamLabelSymbol } from "../reducers/tree/types";
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
*/
export function labelStreamMembership(tree: ReduxNode, branchLabelKey): Streams {
  console.groupCollapsed("labelStreamMembership")
  console.log(`Branch label: ${branchLabelKey}`)
  const streams: Streams = {};
  streams[streamLabelSymbol] = branchLabelKey;

  const stack: [ReduxNode, false|string][] = tree.children.map((subtreeRootNode) => [subtreeRootNode, false]);

  while (stack.length) {
    const [node, parentStreamMembership] = stack.pop();
    let newStreamMembership = node?.branch_attrs?.labels?.[branchLabelKey];

    if (newStreamMembership && newStreamMembership in streams) {
      console.error(`Stream label ${newStreamMembership} seen more than once. Ignoring all but the first.`)
      newStreamMembership = undefined;
    }

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

      streams[newStreamMembership] = {
        name: newStreamMembership,
        startNode: node.arrayIdx,
        members: [], // terminals only
        streamChildren: [], // direct children only
        parentStreamName: parentStreamMembership,
        domains: {
          num_date: [Infinity, -Infinity],
          div: [Infinity, -Infinity],
        }
      };
      node.streamName = newStreamMembership;

      if (parentStreamMembership) {
        if (!(parentStreamMembership in streams)) throw new Error("labelStreamMembership fatal error II");
        streams[parentStreamMembership].streamChildren.push(newStreamMembership);
      }
    }

    const currentStreamMembership = newStreamMembership || parentStreamMembership;
    node.inStream = !!currentStreamMembership;
    if (currentStreamMembership && !node.hasChildren) {
      streams[currentStreamMembership].members.push(node.arrayIdx);
      // update domains
      const domains = streams[currentStreamMembership].domains;
      const div = getDivFromNode(node);
      const num_date = getTraitFromNode(node, 'num_date');
      if (div<domains.div[0]) {domains.div[0]=div}
      if (div>domains.div[1]) {domains.div[1]=div}
      if (num_date<domains.num_date[0]) {domains.num_date[0]=num_date}
      if (num_date>domains.num_date[1]) {domains.num_date[1]=num_date}
    }

    for (const child of node.children || []) {
      stack.push([child, currentStreamMembership])
    }
  }

  console.log("streams", streams)
  console.groupEnd();
  return streams;
}


export function processStreams(
  streams: Streams,
  nodes: ReduxNode[],
  visibility: Visibility[],
  metric: "num_date"|"div",
  colorScale,
  { skipPivots=false, skipCategories=false }: {skipPivots?: boolean, skipCategories?: boolean} = {},
):void {
  console.groupCollapsed("processStreams")
  console.log(`color: ${colorScale.colorBy} metric: ${metric} skipPivots: ${skipPivots} skipCategories: ${skipCategories}`)

  /**
   * Pivots often don't need to be recalculated. Sigma is also recalculated.
   */
  if (!skipPivots || !Object.values(streams).every((s) => Object.hasOwn(s, 'streamPivots'))) {
    // entire domain spanning all streams
    const domain = (Object.values(streams)).reduce((dd, stream) => {
      if (dd[0] > stream.domains[metric][0]) dd[0] = stream.domains[metric][0];
      if (dd[1] < stream.domains[metric][1]) dd[1] = stream.domains[metric][1];
        return dd;
    }, [Infinity, -Infinity]);
    const nPivots = 500 ; // which will represent the entire domain
    const nExtend = 2;
    // use (nPivots-2*nExtend) to span the domain into pieces (of a constant size), then extend the domain either side by nExtend pieces
    const size = Math.abs(domain[1] - domain[0])/(nPivots-1-2*nExtend);
    const pivots = Array.from(Array(nPivots), (_, i) => domain[0]-nExtend*size + i*size);
    /** Sigma calculation This seems really hard to get right over every dataset
     * the following seems to work nicely over the dozen or so testing datasets
     * I used, but there may be a better way to compute this, e.g. relative to
     * the density of tips across the pivots etc.
     */
    streams[sigma] = (pivots.at(-1)-pivots.at(0))/nPivots*5;
    console.log("Entire domain (considering all streams):", domain, "sigma", streams[sigma])
    // Each stream sees a filtered version of these pivots
    for (const stream of Object.values(streams)) {
      const startNode = nodes[stream.startNode];
      const parentPosition: number = metric==='div' ? getDivFromNode(startNode.parent) : getTraitFromNode(startNode.parent, 'num_date');
      startNode.streamPivots = restrictPivots(pivots, stream.domains[metric], parentPosition, streams[sigma], 5);
    }

    /**
     * We define a scale factor here which is applied later on when we convert kde-weight space into display-order space.
     * This is needed because the display order (for non-stream tips) is 1 unit = 1 tip. Since kernel PDF values can be huge
     * (or tiny, depending on STDEV) the kde-weight space can be very large and thus streams take up all the display order space
     * and normal tips are all squashed together.
     * 
     * The scale factor is the PDF evaluated at x=0, i.e. the max height of an individual kernel in display order space will be
     * equivalent to what a single tip would have occupied. Because kernels aren't all stacked on top of each other we add a
     * fudge factor here (can be improved).
     */
    streams[weightToDisplayOrderScaleFactor] =  1 / pdf.factory(0, streams[sigma])(0) * 5;
    streams[colorBySymbol] = colorScale.colorBy;

    /** we want to ladderize each time we change metric, which is also when we need to recalculate pivots */
    Object.values(streams)
      .filter((s) => s.parentStreamName===false) // filter to the streams which represent the start of connected series of streams
      .forEach((stream) => {
        stream.renderingOrder = calcRenderingOrder(stream.name, streams, nodes, metric);
      })

  }

  for (const stream of Object.values(streams)) {
    const startNode = nodes[stream.startNode];
    const nodesThisStream = _pick(nodes, stream.members)

    /**
     * Categories only need to be recalculated when the colouring changes (or upon stream creation)
     */
    if (!skipCategories) {
      startNode.streamCategories = observedCategories(nodesThisStream, colorScale);
    }

    /**
     * When a stream is being instantiated for the first time we need to compute the max height.
     * Importantly this considers all candidate nodes to be visible. We also need to recalculate this
     * when the pivots have changed (because values in weight space are evaluated at pivots)
     */
    let dimensions: StreamDimensions;
    let everythingIsVisibleAnyway = false;
    let streamNodeCountsTotal: number;
    let streamNodeCountsVisible: number;

    if (!Object.hasOwn(startNode, "streamMaxHeight") || !skipPivots) {
      ({dimensions, streamNodeCountsTotal, streamNodeCountsVisible} = computeStreamDimensions(nodesThisStream, startNode.streamPivots, metric, startNode.streamCategories, true, streams[sigma]));
      startNode.streamMaxHeight = dimensions.length ? computeStreamMaxHeight(dimensions) : 0;
      /**
       * NOTE: the heights of these (i.e. in KDE weight space) can be huge if we have finely spaced pivots such that the PDFs are evaluated a large number
       * of times. We must perform some normalization of this when we go to display order space, otherwise our typical approach to spacing tips (tips
       * separated by 1 unit of display order space) means tips are right on top of each other if the display order space occupied by streams is very large.
       * (by large, I've seen examples of 10e6...)
       */
      const visibilityValues = new Set(visibility);
      if (visibilityValues.size===1 && visibilityValues.has(NODE_VISIBLE)) {
        everythingIsVisibleAnyway = true;
      }
    }

    /**
     * Compute the dimensions of the stream, taking into account visibility
     */
    if (!everythingIsVisibleAnyway) {
      ({dimensions, streamNodeCountsTotal, streamNodeCountsVisible} = computeStreamDimensions(nodesThisStream, startNode.streamPivots, metric, startNode.streamCategories, visibility, streams[sigma]));
    }

    startNode.streamDimensions = dimensions;
    startNode.streamNodeCounts = {total: streamNodeCountsTotal, visible: streamNodeCountsVisible};
  }
  console.log(streams);
  console.groupEnd()
}


/**
 * Collect all possible categories - "ribbons within a stream(tree)" - by looping
 * over all nodes in the stream. The order here reflects the order of ripples in the streamtree.
 */
function observedCategories(nodes: ReduxNode[], colorScale: any): ReduxNode['streamCategories'] {
  const colorBy: string = colorScale.colorBy;

  if (colorScale.continuous) {
    type ColorCategory = [ // intermediate type
      /** name */
      string,
      /** lower bound of category */
      number,
      /** upper bound of category */
      number,
      /** RGB string */
      string,
      /** indexes of nodes which are in this category */
      number[],
    ];
    /* NOTE: plenty of speed-ups here if it's a bottleneck */
    const categories: ColorCategory[] = Object.entries(colorScale.legendBounds)
      .map(([name, bounds]) => [name, bounds[0], bounds[1], colorScale.scale(parseFloat(name)), []])
    const undefinedNodes: number[] = [];
    
    for (const n of nodes) {
      const v = getTraitFromNode(n, colorBy);
      if (v===undefined) {
        undefinedNodes.push(n.arrayIdx);
        continue;
      }
      for (const c of categories) {
        if (v <= c[2] && v >= c[1]) {
          c[4].push(n.arrayIdx)
          break;
        }
      }
    }
    const streamCategories = categories
      .filter((c) => c[4].length>0)
      .map((c) => ({name: c[0], color: c[3], nodes: c[4]})); 

    if (undefinedNodes.length) {
      streamCategories.push({name: undefined, color: colorScale.scale(undefined), nodes: undefinedNodes});
    }

    return streamCategories;
  }

  const getter: (n: ReduxNode) => [number, string|undefined] = colorScale.genotype ? (n) => [n.arrayIdx, n.currentGt] : (n) => [n.arrayIdx, getTraitFromNode(n, colorBy)];
  const nodesAndCategories: [number, string|undefined][] = nodes.map(getter);
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
 * The inner dimensions correspond to pivots. These dimensions are a KDE
 * with each tip represented by a gaussian centered on the tip with some
 * constant std-dev.
 *
 * See stream-trees.md for more explanation
 */
function computeStreamDimensions(nodes: ReduxNode[], pivots: number[], metric, categories: ReduxNode['streamCategories'], visibility: true|Visibility[], sigma:number):
  {dimensions: StreamDimensions, streamNodeCountsTotal: number, streamNodeCountsVisible: number} {
  let [streamNodeCountsTotal, streamNodeCountsVisible] = [0,0];

  // per-stream weight (to increase weights of small streams)
  const w = Math.exp(-(nodes.length-4)/4)+1;

  const dimensions = categories.map((categoryInfo) => {
    const mass = pivots.map(() => 0);
    
    const categoryNodes = nodes.filter((node) => categoryInfo.nodes.includes(node.arrayIdx))
    streamNodeCountsTotal += categoryNodes.length;
    const visibleCategoryNodes = categoryNodes.filter((node) => visibility===true || visibility[node.arrayIdx]===NODE_VISIBLE);
    streamNodeCountsVisible += visibleCategoryNodes.length;

    for (const node of visibleCategoryNodes) {
      const mu = metric==='div' ? getDivFromNode(node) : getTraitFromNode(node, 'num_date');
      const kde = pdf.factory(mu, sigma);
      // We know that once \mu is 3*\sigma away from the pivot we don't really add any weight so could leverage this to
      // speed things up (we do this already for the pivots in this stream, but could also do it for the individual nodes)
      pivots.forEach((pivot, idx) => {
        mass[idx]+= w * kde(pivot);
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

/**
 * Given a set of connected streams (with `rootName` representing the initial stream) we return a list
 * of stream names which can be rendered in order such that there are no crossings (i.e. stream connector lines
 * don't go "through" other streams). Using a toy example of stream R which has 2 child streams {A,B}
 * we want to render this as
 * 
 *                 ┌ AAAAAAAAAAAAAAAAAA
 *                 │         ┌ BBBBBBBBBBBBBB
 *                 │         │
 * ─────────── RRRRRRRRRRRRRRRRRRRRRRRRRR
 * 
 * Where we want A to be drawn above B (i.e. smaller display order) based on the numeric date of the branch leaving R.
 * This approach continues to further child streams (e.g. child streams of A).  We construct this via a tree
 * structure (where nodes represent streams) and return a list of nodes ordered by a post-order traversal,
 * i.e. [A,B,R]. These streams can then be assigned display orders in a simple incremental fashion.
 * 
 * For divergence trees we do the same but using divergence values. Note that this often results in a different
 * return value! E.g. B might branch off before A in divergence space.
 */
function calcRenderingOrder(rootName: string, streams: Streams, nodes: ReduxNode[], metric: 'num_date'|'div'): string[] {

  interface Node {
    name: string,
    children: Node[],
    parent: false|Node,
    seen: boolean
  }
  const treeOfStreams: Node = {name: rootName, parent: false, children: [], seen: false}
  const stack = [treeOfStreams];

  let _counter = 100000
  while (stack.length && _counter>0) {
    _counter--
    const element = stack.pop();
    element.children = streams[element.name].streamChildren
    .map((name) => [
      name,
      metric==='div' ? getDivFromNode(nodes[streams[name].startNode].parent) : getTraitFromNode(nodes[streams[name].startNode].parent, 'num_date')
    ])
      .sort((a, b) => a[1]<b[1] ? -1 : a[1]>b[1] ? 1 : 0)
      .map(([name]) => ({name, parent: element, children: [], seen: false}))
    for (const el of element.children) {
      stack.push(el);
    }
  }

  function _topmostTerminal(n: Node): Node {
    while (n.children.length) {
      n = n.children[0];
    }
    return n;
  }

  const postOrderStartNode = _topmostTerminal(treeOfStreams)
  const postOrder = [postOrderStartNode]

  _counter=100000
  while (true && _counter>0) {
    _counter--

    const currentNode = postOrder.at(-1);
    currentNode.seen=true;
    if (currentNode.parent===false) break; // We've reached the root!
    const nextSibling = currentNode.parent.children.filter((c) => !c.seen)[0];
    if (nextSibling) {
      const topmost = _topmostTerminal(nextSibling)
      postOrder.push(topmost);
      continue;
    }
    // else no siblings, take parent!
    postOrder.push(currentNode.parent);
  }

  console.log("postOrder names", postOrder.map((el) => el.name));

  return  postOrder.map((el) => el.name);
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

/**
 * Given the dataset's pivot array, restrict this to a subset of pivots which are applicable for this stream.
 * 
 * While it's obvious that the pivots should span the stream's tips (i.e. the domain) it's a little more
 * ambiguous about how far to extend it either side. The more we extend it the more we get smooth ends to the
 * KDE however there are downsides.
 * Extending too far to the left is problematic if the pivot list ends up going over the connector branch position
 * (e.g. the pivots go back further in time than the parent node date).
 * Extending too far to the right can make it look like every stream has gradually died out.
 */
function restrictPivots(pivots: number[], domain:[number,number], parentPosition: number, sigma:number, cutoff:number): number[] {
  let min = domain[0] - sigma*cutoff;
  if (min<parentPosition) min=parentPosition; // stops pivots (and therefore streams) going to the left of the connecting branch
  const max = domain[1] + sigma*cutoff;
  return pivots.filter((value) => value>=min && value<=max);
}


export function availableStreamLabelKeys(availableBranchLabels: string[], jsonDefinedStreamLabels: undefined|string[]): string[] {

  if (jsonDefinedStreamLabels) {
    const labels = jsonDefinedStreamLabels.filter((l) => availableBranchLabels.includes(l));
    if (labels.length!==jsonDefinedStreamLabels.length) {
      console.warn("Some of the metadata-specified 'stream_labels' were not found on the tree and have been excluded: " + 
        jsonDefinedStreamLabels.filter((l) => labels.includes(l)).join(", "));
    }
    return labels;
  }

  // Use a hardcoded list to sort labels which are present so certain ones come first
  const preset = ['stream', 'streams', 'stream_label'];

  // we may want to do something here to exclude certain branch labels, e.g. ones which are repeated many times on the tree
  return ([...availableBranchLabels])
    .sort((a, b) => {
      const [ai, bi] = [preset.indexOf(a), preset.indexOf(b)];
      if (ai===-1 && bi!==-1) return 1;
      if (ai!==-1 && bi===-1) return -1;
      return ai -bi;
    })
    .filter((l) => l!=='aa' && l!=='none');
}

