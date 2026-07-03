import { ReduxNode, StreamDimensions, Visibility, Streams, sigma, weightToDisplayOrderScaleFactor,
  colorBySymbol, streamLabelSymbol } from "../reducers/tree/types";
import { getTraitFromNode, getDivFromNode } from "./treeMiscHelpers"
import { NODE_VISIBLE } from "./globals";
import { timerStart, timerEnd } from "./perf";
import pdf from '@stdlib/stats-base-dists-normal-pdf';

/**
 * Sentinel "branch label" signifying the automatic (tip-count based) stream partition
 * rather than a dataset-defined branch label.
 */
export const AUTO_STREAM_LABEL = "__auto__";

/** Default target number of streams for the automatic partition (the greedy split keeps splitting the
 * largest clade until it reaches ~this many streams). Tunable "X" — larger → more, smaller streams.
 * Parameterising by stream count gives a consistent on-screen density across trees of very different
 * sizes, with no per-tree tuning. The user can change this at runtime via the FINE/MEDIUM/COARSE
 * granularity control; this constant is the MEDIUM default. */
export const AUTO_STREAM_TARGET_COUNT = 100;

/** The three granularity presets offered by the FINE/MEDIUM/COARSE sidebar control. */
export const AUTO_STREAM_TARGET_COUNTS = { fine: 150, medium: 100, coarse: 50 };

/** Minimum visible tips a clade must exceed to be split further. Prevents over-splitting when the
 * on-screen tip count is small (e.g. zoomed into a little clade): rather than degenerating into
 * many ~single-tip streams (which just look like the raw tree), the partition yields fewer, chunkier
 * streams. Effectively caps the stream count at ~onScreenTips / this value. */
export const AUTO_STREAM_MIN_TIPS = 10;

/**
* Side effects:
*  - sets node.streamMembership -> false | stream name
*  - sets node.streamStart -> boolean
* Returns
*  "streams": each key -> object
*  "connectedStreamOrdering" (or a tree structure? This seems hard...)
*/
export function labelStreamMembership(tree: ReduxNode, branchLabelKey): Streams {
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

  return streams;
}


/**
 * Automatically partition the tree into ~`targetStreamCount` streams via a greedy top-down split,
 * as an alternative to `labelStreamMembership` (which keys off a dataset-defined branch label).
 * Starting from the root's children, we repeatedly split the largest clade (by *visible* `tipCount`)
 * into its children until ~`targetStreamCount` clades HAVE visible tips; each resulting clade root is
 * a stream start and its whole subtree becomes members. Splitting by on-screen (visible) tip count
 * makes the partition track whatever is currently in view / passing filters — coarse when zoomed
 * out, finer when zoomed/filtered in. The frontier still covers every non-empty clade
 * (`fullTipCount > 0`), so 0-visible regions become coarse, invisible streams rather than a mass of
 * thin branches. Nodes above the frontier (the "spine") render as normal branches via the existing
 * `!d.n.inStream` filter. On an unfiltered full-tree load `tipCount === fullTipCount`, so this
 * reduces to a plain count-based split. Same output contract as `labelStreamMembership`; auto streams
 * never nest, so `parentStreamName` is always false and `streamChildren` stays empty.
 */
export function autoPartitionStreams(tree: ReduxNode, targetStreamCount: number): Streams {
  timerStart("autoPartitionStreams");
  const streams: Streams = {};
  streams[streamLabelSymbol] = AUTO_STREAM_LABEL;

  /* Clear previous stream MEMBERSHIP (streamName / inStream) across the whole subtree. The greedy
   * "mark" pass below only visits stream subtrees, so without this the spine could retain a stale
   * membership. We deliberately DO NOT delete the render data (streamPivots / streamCategories /
   * streamDimensions / streamMaxHeight): on a dynamic re-partition, a node that is no longer a stream
   * start may still have live d3 ripple hover/leave handler closures that read
   * `node.streamCategories[categoryIndex]` — deleting it crashes them. The stale data is harmless
   * (only stream starts present in the current `streams` map are rendered/read; the rest is ignored
   * and overwritten by `processStreams` if the node becomes a stream again). */
  const clearStack: ReduxNode[] = [tree];
  while (clearStack.length) {
    const node = clearStack.pop();
    node.inStream = false;
    delete node.streamName;
    for (const child of node.children || []) clearStack.push(child);
  }

  /* Greedy split: repeatedly split the largest VISIBLE-bearing clade (by on-screen `tipCount`, with
   * `fullTipCount` fallback for an unfiltered load) until ~targetStreamCount clades have visible
   * tips. The frontier keeps every non-empty clade, so 0-visible regions stay covered by coarse
   * (invisible) streams instead of exploding into thin branches. Frontier is ~targetStreamCount
   * long, so a linear scan is cheap. */
  const visTips = (n: ReduxNode): number => n.tipCount ?? n.fullTipCount;
  const frontier: ReduxNode[] = (tree.children || []).filter((n) => n.fullTipCount > 0);
  const visibleStreamCount = (): number => frontier.reduce((c, n) => c + (visTips(n) > 0 ? 1 : 0), 0);
  while (visibleStreamCount() < targetStreamCount) {
    let bestIdx = -1;
    let bestCount = AUTO_STREAM_MIN_TIPS; // only split clades with MORE than the floor of visible tips (keeps streams chunky, avoids ~single-tip degenerates)
    for (let i = 0; i < frontier.length; i++) {
      const n = frontier[i];
      if (n.hasChildren && visTips(n) > bestCount) {
        bestCount = visTips(n);
        bestIdx = i;
      }
    }
    if (bestIdx === -1) break; // no splittable visible clade remains
    const [node] = frontier.splice(bestIdx, 1);
    for (const child of node.children || []) {
      if (child.fullTipCount > 0) frontier.push(child);
    }
  }

  /* Each frontier node is a stream start; mark its subtree (members = terminals). */
  for (const startNode of frontier) {
    const name = `auto_${startNode.arrayIdx}`;
    streams[name] = {
      name,
      startNode: startNode.arrayIdx,
      members: [], // terminals only
      streamChildren: [], // auto streams never nest
      parentStreamName: false,
      domains: {
        num_date: [Infinity, -Infinity],
        div: [Infinity, -Infinity],
      }
    };
    startNode.streamName = name;

    const markStack: ReduxNode[] = [startNode];
    while (markStack.length) {
      const node = markStack.pop();
      node.inStream = true;
      if (!node.hasChildren) {
        streams[name].members.push(node.arrayIdx);
        const domains = streams[name].domains;
        const div = getDivFromNode(node);
        const num_date = getTraitFromNode(node, 'num_date');
        if (div<domains.div[0]) {domains.div[0]=div}
        if (div>domains.div[1]) {domains.div[1]=div}
        if (num_date<domains.num_date[0]) {domains.num_date[0]=num_date}
        if (num_date>domains.num_date[1]) {domains.num_date[1]=num_date}
      }
      for (const child of node.children || []) markStack.push(child);
    }
  }

  timerEnd("autoPartitionStreams");
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
  timerStart("processStreams");
  /**
   * Pivots often don't need to be recalculated. Sigma is also recalculated.
   * NOTE: `streamPivots` is stored on the stream's START NODE, not on the StreamSummary `s`, so the
   * skip is keyed off `nodes[s.startNode]`. (Checking `s` never matched, so the block always ran.)
   */
  if (!skipPivots || !Object.values(streams).every((s) => Object.hasOwn(nodes[s.startNode], 'streamPivots'))) {
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

  /* `visibility` is shared across every stream in this call, so derive "is everything visible" once
   * rather than allocating a Set over the whole tree per stream. */
  const visibilitySet = new Set(visibility);
  const everythingVisible = visibilitySet.size===1 && visibilitySet.has(NODE_VISIBLE);

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
    let streamVisibleMax: number;

    if (!Object.hasOwn(startNode, "streamMaxHeight") || !skipPivots) {
      ({dimensions, streamNodeCountsTotal, streamNodeCountsVisible, streamVisibleMax} = computeStreamDimensions(nodesThisStream, startNode.streamPivots, metric, startNode.streamCategories, true, streams[sigma]));
      startNode.streamMaxHeight = dimensions.length ? computeStreamMaxHeight(dimensions) : 0;
      /**
       * NOTE: the heights of these (i.e. in KDE weight space) can be huge if we have finely spaced pivots such that the PDFs are evaluated a large number
       * of times. We must perform some normalization of this when we go to display order space, otherwise our typical approach to spacing tips (tips
       * separated by 1 unit of display order space) means tips are right on top of each other if the display order space occupied by streams is very large.
       * (by large, I've seen examples of 10e6...)
       */
      if (everythingVisible) {
        everythingIsVisibleAnyway = true;
      }
    }

    /**
     * Compute the dimensions of the stream, taking into account visibility
     */
    if (!everythingIsVisibleAnyway) {
      ({dimensions, streamNodeCountsTotal, streamNodeCountsVisible, streamVisibleMax} = computeStreamDimensions(nodesThisStream, startNode.streamPivots, metric, startNode.streamCategories, visibility, streams[sigma]));
    }

    startNode.streamDimensions = dimensions;
    startNode.streamNodeCounts = {total: streamNodeCountsTotal, visible: streamNodeCountsVisible};
    startNode.streamVisibleMax = streamVisibleMax;
  }
  timerEnd("processStreams");
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

  const getter: (n: ReduxNode) => [number, string|undefined] = colorScale.genotype ? (n): [number, string] => [n.arrayIdx, n.currentGt] : (n): [number, string|undefined] => [n.arrayIdx, getTraitFromNode(n, colorBy)];
  const nodesAndCategories: [number, string|undefined][] = nodes.map(getter);
  /* bucket node indexes by category in a single pass rather than re-filtering the full list per category */
  const nodeIdxsByCategory = new Map<string|undefined, number[]>();
  for (const [nodeIdx, catName] of nodesAndCategories) {
    const bucket = nodeIdxsByCategory.get(catName);
    if (bucket) bucket.push(nodeIdx);
    else nodeIdxsByCategory.set(catName, [nodeIdx]);
  }
  const orderedCategories = Array.from(nodeIdxsByCategory.keys())
    .sort((a,b) => colorScale.legendValues.indexOf(a) - colorScale.legendValues.indexOf(b));
  return orderedCategories.map((name) => ({
    name,
    color: colorScale.scale(name),
    nodes: nodeIdxsByCategory.get(name) ?? []
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
  {dimensions: StreamDimensions, streamNodeCountsTotal: number, streamNodeCountsVisible: number, streamVisibleMax: number} {
  let [streamNodeCountsTotal, streamNodeCountsVisible] = [0,0];
  let streamVisibleMax = -Infinity; // farthest-right visible tip position (in `metric`)

  // per-stream weight (to increase weights of small streams)
  const w = Math.exp(-(nodes.length-4)/4)+1;

  /* pivots are evenly spaced (a contiguous slice of the master grid), so a tip's gaussian only needs
   * evaluating over the pivot window within ±3σ of its mean — beyond that the kernel is negligible
   * (<0.3% of peak). This turns the inner loop from O(tips × allPivots) into O(tips × ~30 pivots). */
  const cutoff = 3 * sigma;
  const step = pivots.length > 1 ? pivots[1] - pivots[0] : 0;

  const dimensions = categories.map((categoryInfo) => {
    const mass = pivots.map(() => 0);

    const categoryIdxs = new Set(categoryInfo.nodes);
    const categoryNodes = nodes.filter((node) => categoryIdxs.has(node.arrayIdx))
    streamNodeCountsTotal += categoryNodes.length;
    const visibleCategoryNodes = categoryNodes.filter((node) => visibility===true || visibility[node.arrayIdx]===NODE_VISIBLE);
    streamNodeCountsVisible += visibleCategoryNodes.length;

    for (const node of visibleCategoryNodes) {
      const mu = metric==='div' ? getDivFromNode(node) : getTraitFromNode(node, 'num_date');
      if (mu > streamVisibleMax) streamVisibleMax = mu;
      const kde = pdf.factory(mu, sigma);
      if (step > 0) {
        const lo = Math.max(0, Math.ceil((mu - cutoff - pivots[0]) / step));
        const hi = Math.min(pivots.length - 1, Math.floor((mu + cutoff - pivots[0]) / step));
        for (let idx = lo; idx <= hi; idx++) {
          mass[idx] += w * kde(pivots[idx]);
        }
      } else {
        pivots.forEach((pivot, idx) => { mass[idx] += w * kde(pivot); });
      }
    }
    return mass;
  })
  return {dimensions, streamNodeCountsTotal, streamNodeCountsVisible, streamVisibleMax};
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
    // Offer the automatic (tip-count based) partition alongside any dataset-defined labels
    return [...labels, AUTO_STREAM_LABEL];
  }

  // Use a hardcoded list to sort labels which are present so certain ones come first
  const preset = ['stream', 'streams', 'stream_label'];

  // we may want to do something here to exclude certain branch labels, e.g. ones which are repeated many times on the tree
  const labels = ([...availableBranchLabels])
    .sort((a, b) => {
      const [ai, bi] = [preset.indexOf(a), preset.indexOf(b)];
      if (ai===-1 && bi!==-1) return 1;
      if (ai!==-1 && bi===-1) return -1;
      return ai -bi;
    })
    .filter((l) => l!=='aa' && l!=='none');
  // Always offer the automatic (tip-count based) partition, even when the tree has no branch labels
  return [...labels, AUTO_STREAM_LABEL];
}
