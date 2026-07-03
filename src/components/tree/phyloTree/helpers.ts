/* eslint-disable no-param-reassign */
import { max } from "d3-array";
import {getTraitFromNode, getDivFromNode, getBranchMutations} from "../../../util/treeMiscHelpers";
import { NODE_VISIBLE } from "../../../util/globals";
import { timerStart, timerEnd } from "../../../util/perf";
import { ReduxNode, Streams, weightToDisplayOrderScaleFactor } from "../../../reducers/tree/types";
import { Focus } from "../../../reducers/controls";
import { Distance, PhyloNode } from "./types";
import { ScaleContinuousNumeric } from "d3-scale";

/** get a string to be used as the DOM element ID
 * Note that this cannot have any "special" characters
 */
export const getDomId = (
  type: string,
  strain: string,
): string => {
  // Replace non-alphanumeric characters with dashes (probably unnecessary)
  const name = `${type}_${strain}`.replace(/(\W+)/g, '-');
  return CSS.escape(name);
};

/**
 * this function takes a call back and applies it recursively
 * to all child nodes, including internal nodes
 */
export const applyToChildren = (
  phyloNode: PhyloNode,

  /** function to apply to each child. Is passed a single argument, the <PhyloNode> of the children. */
  func: (node: PhyloNode) => void,
): void => {
  func(phyloNode);
  const node = phyloNode.n;
  if ((!node.hasChildren) || (node.children === undefined)) { // in case clade set by URL, terminal hasn't been set yet!
    return;
  }
  for (const child of node.children) {
    applyToChildren(child.shell, func);
  }
};


/** setDisplayOrderRecursively
 * Postorder traversal to calculate the display order of nodes
 * @sideeffect modifies node.displayOrder and node.displayOrderRange
 * Returns the current yCounter after assignment to the tree originating from `node`
 */
/**
 * The stream layout mode threaded through the traversal:
 *  - `false`      → streams off (ordinary display order)
 *  - `"inPlace"`  → current render-in-place (stream start sits at its member-tip band midpoint, so the
 *                   tree is xy-concordant and doesn't move)
 *  - `StreamInfo` → the original ("v3") layout (each stream gets a fresh KDE-sized band; toggled on via
 *                   the "Update layout" control)
 */
type StreamMode = false | "inPlace" | StreamInfo;

export const setDisplayOrderRecursively = (
  node: PhyloNode,
  incrementer: (node: PhyloNode) => number,
  yCounter: number,
  streamMode: StreamMode = false,
): number => {
  const yEntry = yCounter;
  const children = node.n.children;

  if (children && children.length) {
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i];
      /* v3 mode (streamMode is a StreamInfo object): a stream child is laid out in its own band via
       * traverseConnectedStreams rather than descended into. */
      yCounter = (typeof streamMode === "object" && child.streamName) ?
        traverseConnectedStreams(yCounter, child, streamMode) :
        setDisplayOrderRecursively(child.shell, incrementer, yCounter, streamMode);
    }
  } else {
    // terminal node
    if (node.n.fullTipCount !== 0) {
      yCounter += incrementer(node);
    }
    node.displayOrder = yCounter;
    node.displayOrderRange = [yCounter, yCounter];
    return yCounter;
  }
  if (streamMode === "inPlace" && node.n.streamName) {
    /* Stream start: place it at the midpoint of the display-order band its member tips occupy (the
     * subtree spans yEntry..yCounter). Doing this *here* — rather than overriding after the fact —
     * means every spine ancestor derives its displayOrder/range from this in-place value, so the
     * connecting tees reach the streams (and streams render in place without moving the tree). */
    const mid = (yEntry + yCounter) / 2;
    node.displayOrder = mid;
    node.displayOrderRange = [mid, mid];
  } else {
    /* if here, then all children have displayOrders, but we don't. */
    node.displayOrder = children.reduce((acc, d) => acc + d.shell.displayOrder, 0) / children.length;
    node.displayOrderRange = [children[0].shell.displayOrder, children[children.length - 1].shell.displayOrder];
  }
  return yCounter;
};

interface StreamInfo {
  streams: Streams,
  startNodes: Record<string, ReduxNode>,
}

/**
 * v3 layout: traverse a set of connected streams (originating from `streamStartNode`), allocating a
 * fresh contiguous display-order band per stream (sized by the KDE, not by tip count) and blanking the
 * member tips so they don't render. Returns the incremented `yCounter`.
 */
function traverseConnectedStreams(yCounter: number, streamStartNode: ReduxNode, streamInfo: StreamInfo): number {
  if (!(streamStartNode.streamName in streamInfo.streams)) {
    console.error(`BUG! - found (old?) stream name ${streamStartNode.streamName} on nodes but no longer in (new?) 'streams'`);
    return yCounter;
  }
  _setDisplayOrderToUndefined(streamStartNode.shell);
  for (const streamName of streamInfo.streams[streamStartNode.streamName].renderingOrder) {
    yCounter = setDisplayOrdersForStream(yCounter, streamName, streamInfo);
  }
  return yCounter;
}

/**
 * v3 layout: give one stream a band of `2 + streamMaxHeight * weightToDisplayOrderScaleFactor` display
 * orders above `yCounter`, setting the start node's `displayOrder` (band midpoint) and `displayOrderRange`.
 */
function setDisplayOrdersForStream(yCounter: number, streamName: string, streamInfo: StreamInfo): number {
  const spaceAround = 1; // 1 display order unit
  const n = streamInfo.startNodes[streamName];
  const totalStreamHeight = spaceAround * 2 + n.streamMaxHeight * streamInfo.streams[weightToDisplayOrderScaleFactor];
  n.shell.displayOrder = yCounter + totalStreamHeight / 2;
  n.shell.displayOrderRange = [yCounter, yCounter + totalStreamHeight];
  return yCounter + totalStreamHeight;
}

/**
 * heuristic function to return the appropriate spacing between subtrees for a given tree
 * the returned value is to be interpreted as a count of the number of tips that would
 * otherwise fit in the gap
 */
function _getSpaceBetweenSubtrees(
  numSubtrees: number,
  numTips: number,
): number {
  if (numSubtrees===1 || numTips<10) {
    return 0;
  }
  if (numSubtrees*2 > numTips) {
    return 0;
  }
  return numTips/20; /* note that it's not actually 5% of vertical space,
                     as the final max yCount = numTips + numSubtrees*numTips/20 */
}

/**
 * Sets the `displayOrder` and `displayOrderRange` for each node by traversing the (ladderized) tree.
 * For internal nodes the range represents the range of the children display orders.
 * 
 * For streams we set these properties on the stream start node. The values correspond to the
 * midpoint of the stream and the range of the stream at its maximum (i.e. at some pivot).
 * We then (separately) compute the display orders for each ripple (at each pivot) via
 * `rippleDisplayOrders()`.
 * 
 * Nodes must have parent child links established (via createChildrenAndParents) before running this.
 */
export const setDisplayOrder = ({
  nodes,
  focus,
  streams,
}: {
  nodes: PhyloNode[]
  focus: Focus
  streams: false|Streams,
}): void => {
  timerStart("setDisplayOrder");
  const numSubtrees = nodes[0].n.children.filter((n) => n.fullTipCount!==0).length;
  const numTips = focus ? nodes[0].n.tipCount : nodes[0].n.fullTipCount;
  const spaceBetweenSubtrees = _getSpaceBetweenSubtrees(numSubtrees, numTips);

  // No focus: 1 unit per node
  let incrementer = (_node): number => 1;

  if (focus === "selected") {
    const nVisible = nodes[0].n.tipCount;
    const nTotal = nodes[0].n.fullTipCount;

    let yProportionFocused = 0.8;
    // Adjust for a small number of visible tips (n<4)
    yProportionFocused = Math.min(yProportionFocused, nVisible / 5);
    // Adjust for a large number of visible tips (>80% of all tips)
    yProportionFocused = Math.max(yProportionFocused, nVisible / nTotal);

    const yPerFocused = (yProportionFocused * nTotal) / nVisible;
    const yPerUnfocused = ((1 - yProportionFocused) * nTotal) / (nTotal - nVisible);

    incrementer = ((): ((_node) => number) => {
      let previousWasVisible = false;
      return (node) => {
        // Focus if the current node is visible or if the previous node was visible (for symmetric padding)
        const y = (node.visibility === NODE_VISIBLE || previousWasVisible) ? yPerFocused : yPerUnfocused;

        // Update for the next node
        previousWasVisible = node.visibility === NODE_VISIBLE;

        return y;
      }
    })();
  }

  let yCounter = 0;
  const streamsOn = !!(nodes[0].that.params.showStreamTrees && streams);
  /* "Update layout" toggle: when on, use the original ("v3") layout where each stream gets its own
   * KDE-sized band (the tree re-flows); when off, streams render in place (xy-concordant). */
  const v3Layout = streamsOn && !!nodes[0].that.params.streamTreeUpdateLayout;
  const streamInfo: StreamInfo | false = (v3Layout && streams) ? {
    streams,
    startNodes: Object.fromEntries(Object.entries(streams).map(([name, s]) => [name, nodes[s.startNode].n])),
  } : false;
  const streamMode: StreamMode = streamInfo ? streamInfo : (streamsOn ? "inPlace" : false);

  /* iterate through each subtree, and add padding between each. Nodes get their natural display
   * order via the postorder traversal; the only exception is stream START nodes — in-place mode
   * places them at the midpoint of their member-tip band (see setDisplayOrderRecursively), while v3
   * mode routes them through traverseConnectedStreams for their own KDE-sized band. */
  for (const subtree of nodes[0].n.children) {
    if (subtree.fullTipCount===0) { // don't use screen space for this subtree
      _setDisplayOrderToUndefined(nodes[subtree.arrayIdx])
    } else if (streamInfo && subtree.streamName) {
      yCounter = traverseConnectedStreams(yCounter, subtree, streamInfo) + spaceBetweenSubtrees;
    } else {
      yCounter = setDisplayOrderRecursively(nodes[subtree.arrayIdx], incrementer, yCounter, streamMode);
      yCounter+=spaceBetweenSubtrees;
    }
  }
  /* note that nodes[0] is a dummy node holding each subtree */
  nodes[0].displayOrder = undefined;
  nodes[0].displayOrderRange = [undefined, undefined];

  /**
   * The traversal above set the stream-start display orders (member-tip band midpoint in-place, or a
   * KDE-sized band in v3); setRippleDisplayOrders now lays out the ripples (per pivot) accordingly.
   */
  if (nodes[0].that.params.showStreamTrees) {
    if (!streams) {
      console.error("setDisplayOrder bug - streams toggled on but no stream data")
    } else {
      setRippleDisplayOrders(nodes, streams, v3Layout)
    }
  }

  timerEnd("setDisplayOrder");
};


export const formatDivergence = (divergence: number): string | number => {
  return divergence > 1 ?
    Math.round((divergence + Number.EPSILON) * 1000) / 1000 :
    divergence > 0.01 ?
      Math.round((divergence + Number.EPSILON) * 10000) / 10000 :
      divergence.toExponential(3);
};


/** get the idx of the zoom node (i.e. the in-view root node).
 * This differs depending on which tree is in view so it's helpful to access it
 * by reaching into phyotree to get it
 */
export const getIdxOfInViewRootNode = (node: ReduxNode): number => {
  return node.shell.that.zoomNode.n.arrayIdx;
};

/**
 * Are the provided nodes within some divergence / time of each other?
 * NOTE: `otherNode` is always closer to the root in the tree than `node`
 */
function isWithinBranchTolerance(
  node: ReduxNode,
  otherNode: ReduxNode,
  distanceMeasure: Distance,
): boolean {
  if (distanceMeasure === "num_date") {
    /* We calculate the threshold by reaching into phylotree to extract the date range of the dataset
    and then split the data into ~50 slices. This could be refactored to not reach into phylotree. */
    const tolerance = (node.shell.that.dateRange[1]-node.shell.that.dateRange[0])/50;
    return (getTraitFromNode(node, "num_date") - tolerance < getTraitFromNode(otherNode, "num_date"));
  }

  /* If mutations aren't defined, we fallback to calculating divergence tolerance similarly to temporal.
  This uses the approach used to compute the x-axis grid within phyotree, and could be refactored into a
  helper function. Note that we don't store the maximum divergence on the tree so we use the in-view max instead */
  const tolerance = (node.shell.that.xScale.domain()[1] - node.shell.that.nodes[0].depth)/50;
  return (getDivFromNode(node) - tolerance < getDivFromNode(otherNode));
}

/**
 * Walk up the tree from node until we find either a node which has a nucleotide mutation or we
 * reach the root of the (sub)tree. Gaps, deletions and undeletions do not count as mutations here.
 */
function findFirstBranchWithAMutation(node: ReduxNode): ReduxNode {
  if (node.parent === node) {
    return node;
  }
  const categorisedMutations = getBranchMutations(node, {}); // 2nd param of `{}` means we skip homoplasy detection
  if (categorisedMutations?.nuc?.unique?.length>0) {
    return node.parent;
  }

  return findFirstBranchWithAMutation(node.parent);
}

/**
 * Given a `node`, get the parent, grandparent etc node which is beyond some
 * branch length threshold (either divergence or time). This is useful for finding the node
 * beyond a polytomy, or polytomy-like structure. If nucleotide mutations are defined on
 * the tree (and distanceMeasure=div) then we find the first branch with a mutation.
 */
export const getParentBeyondPolytomy = (
  node: ReduxNode,
  distanceMeasure: Distance,
  observedMutations: Record<string, number>,
): ReduxNode => {
  let potentialNode = node.parent;
  if (distanceMeasure==="div" && areNucleotideMutationsPresent(observedMutations)) {
    return findFirstBranchWithAMutation(node);
  }
  while (isWithinBranchTolerance(node, potentialNode, distanceMeasure)) {
    if (potentialNode === potentialNode.parent) break; // root node of tree
    potentialNode = potentialNode.parent;
  }
  return potentialNode;
};

export function getParentStream(node: ReduxNode): ReduxNode {
  let n = node.parent;
  while (true) { // eslint-disable-line no-constant-condition
    if (n.streamName) return n;
    if (n.parent===n) throw new Error("getParentStream failed to find parent stream before reaching the tree root");
    n = n.parent;
  }
}

function areNucleotideMutationsPresent(observedMutations): boolean {
  const mutList = Object.keys(observedMutations);
  for (let idx=mutList.length-1; idx>=0; idx--) { // start at end, as nucs come last in the key-insertion order
    if (mutList[idx].startsWith("nuc:")) {
      return true;
    }
  }
  return false;
}

/**
 * Prior to Jan 2020, the divergence measure was always "subs per site per year"
 * however certain datasets changed this to "subs per year" across entire sequence.
 * This distinction is not set in the JSON, so in order to correctly display the rate
 * we will "guess" this here. A future augur update will export this in a JSON key,
 * removing the need to guess.
 */
export function guessAreMutationsPerSite(
  scale: ScaleContinuousNumeric<number, number>,
): boolean {
  const maxDivergence = max(scale.domain());
  return maxDivergence <= 5;
}

/**
 * Is the node a subtree root node? (implies that we have either exploded trees or
 * the dataset has multiple subtrees to display)
 */
const isSubtreeRoot = (n: ReduxNode): boolean => (n.parent.name === "__ROOT" && n.parentInfo.original !== undefined);

/**
 * Gets the parent node to be used for stem / branch calculation.
 * Most of the time this is the same as `d.n.parent` however it is not in the
 * case of the root nodes for subtrees (e.g. exploded trees).
 */
export const stemParent = (n: ReduxNode): ReduxNode => {
  return isSubtreeRoot(n) ? n.parentInfo.original : n.parent;
};


/**
 * Returns a function which itself gets the order of the node and that of its parent.
 * This is not strictly the same as the `displayOrder` the scatterplot axis
 * renders increasing values going upwards (i.e. from the bottom to top of screen)
 * whereas the rectangular tree renders zero at the top and goes downwards
 */
export const nodeOrdering = (
  nodes: PhyloNode[],
): ((d: PhyloNode) => [number, number]) => {
  const maxVal = nodes.map((d) => d.displayOrder)
    .reduce((acc, val) => ((val ?? 0) > acc ? val : acc), 0);
  return (d: PhyloNode) => ([
    maxVal - d.displayOrder,
    isSubtreeRoot(d.n) ? undefined : (maxVal - d.n.parent.shell.displayOrder)
  ]);
};

/**
 * Sets the `displayOrder` and `displayOrderRange` to undefined for this *node*
 * and all descendants.
 */
function _setDisplayOrderToUndefined(node: PhyloNode):void {
  node.displayOrder = undefined;
  node.displayOrderRange = [undefined, undefined];
  for (const child of node.n.children || []) {
    _setDisplayOrderToUndefined(child.shell)
  }
}

/**
 * Sets `rippleDisplayOrders` on the start node of each stream by converting `streamDimensions`
 * (KDE-weights independently for each ribbon) into stacked coordinates in displayOrder space
 * each representing a ripple. The set of ripples are centred around the (previously set)
 * `displayOrder` (stream midpoint).
 * 
 * NOTE: This function depends on the (stream start node's) `displayOrder` being up to date
 * (via `setDisplayOrder`)
 */
export function setRippleDisplayOrders(nodes: PhyloNode[], streams: Streams, v3Layout = false): void {
  for (const stream of Object.values(streams)) {
    const startingNode = nodes[stream.startNode];

    let scaleFactor: number;
    if (v3Layout) {
      /* v3 layout: use the GLOBAL weight→displayOrder scale, so each stream's height reflects its KDE
       * mass; the start node already sits at the midpoint of its (KDE-sized) band. */
      scaleFactor = streams[weightToDisplayOrderScaleFactor];
    } else {
      /* render-in-place: the stream renders within the display-order band spanned by its member tips;
       * scale the KDE so the tallest pivot fills ~90% of that band so every stream fits regardless of
       * size (the start node was set to the band midpoint in setDisplayOrder). */
      let bandMin = Infinity, bandMax = -Infinity;
      for (const memberIdx of stream.members) {
        const d = nodes[memberIdx].displayOrder;
        if (d < bandMin) bandMin = d;
        if (d > bandMax) bandMax = d;
      }
      if (bandMax < bandMin) { // empty stream (no members) — nothing to draw
        startingNode.rippleDisplayOrders = [];
        continue;
      }
      const peak = startingNode.n.streamMaxHeight;
      scaleFactor = peak > 0 ? ((bandMax - bandMin) * 0.9) / peak : 0;
    }

    /* Convert KDE weights to ribbons which start at display order zero */
    const rippleDisplayOrders = startingNode.n.streamDimensions
      .reduce((acc: [number,number][][], weightsAcrossPivot, categoryIdx) => {
        acc.push(
          weightsAcrossPivot.map((weight,  pivotIdx) => {
            const base: number = categoryIdx===0 ? 0 : acc[categoryIdx-1][pivotIdx][1];
            return [base, base + weight*scaleFactor];
          })
        );
        return acc;
      }, []);

    const displayOrderMidpoint = startingNode.displayOrder;

    /* Center the ribbons */
    for (let pivotIdx=0; pivotIdx<startingNode.n.streamPivots.length; pivotIdx++) {
      if (!rippleDisplayOrders.length) continue;
      const range = [rippleDisplayOrders.at(0).at(pivotIdx).at(0), rippleDisplayOrders.at(-1).at(pivotIdx).at(1)];
      const shift = displayOrderMidpoint - (range[0] + (range[1]-range[0])/2);
      for (const displayOrderAcrossPivots of rippleDisplayOrders) {
        displayOrderAcrossPivots[pivotIdx][0]+=shift;
        displayOrderAcrossPivots[pivotIdx][1]+=shift;
      }
    }

    startingNode.rippleDisplayOrders = rippleDisplayOrders;
  }
}