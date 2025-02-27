import { NODE_NOT_VISIBLE, NODE_VISIBLE, NODE_VISIBLE_TO_MAP_ONLY } from "../../util/globals";
import { PhyloNode } from "../../components/tree/phyloTree/types";

/**
 * Maps mutation strings (in format gene:fromPosTo, e.g. 'nuc:A123T')
 * to their occurrence count in the tree
 */
export type Mutations = Record<string, number>

/** An index in the overall `nodes` array */
export type NodeIdx = number;

export type StreamDimensions = Array<Array<number>>


export interface ReduxNode {
  /** the index of the node in the nodes array. set so that we can access visibility / nodeColors if needed */
  arrayIdx?: NodeIdx

  branch_attrs?: {
    mutations?: {
      [gene: string]: string[]
    }
    labels?: Record<string, string>
  }
  children?: ReduxNode[]
  currentGt?: string
  
  /** see the number of subtending tips (alive or dead) */
  fullTipCount?: number

  hasChildren?: boolean
  inView?: boolean
  name?: string
  node_attrs?: {
    div?: number
    hidden?: "always" | "timetree" | "divtree"
    num_date?: {
      value: number
    }
  }
  parent?: ReduxNode
  parentInfo?: {
    original: ReduxNode
  }
  shell?: PhyloNode

  /** the number of visible tips */
  tipCount?: number

  /** Is the node part of a (currently active) stream tree? */
  inStream?: boolean

  /** Name of the stream (represents a branch label value for this node) */
  streamName?: string

  /** the pivots for the stream originating from this node */
  streamPivots?: Array<number>

  /** the categories for the stream originating from this node */
  streamCategories?: Array<{
    name: string
    color: string
    nodes: NodeIdx[]
  }>

  /** the dimensions (KDE-weights per category per pivot) for the stream originating from this node */
  streamDimensions?: StreamDimensions

  /** the maximum weight observed in streamDimensions when summing across categories */
  streamMaxHeight?: number

  streamNodeCounts?: {total: number; visible: number}

  unexplodedChildren?: ReduxNode[]
}

/**
 * Keys: the traits
 * Values: a Map of trait values to count
 */
export type TraitCounts = Record<string, Map<string, number>>

export interface StreamSummary {
  name: string;
  startNode: number;
  members: number[];
  streamChildren: string[];
  connectedStreamsLadderised?: string[]; // only if parentStreamName=false
  parentStreamName: string|false;
}

export interface TreeState {
  availableBranchLabels: string[]
  branchThickness: number[] | null
  branchThicknessVersion: number
  cladeName?: string
  idxOfFilteredRoot?: number
  idxOfInViewRootNode: number
  loaded: boolean
  name?: string
  nodeAttrKeys?: Set<string>
  nodeColors: string[] | null
  nodeColorsVersion: number
  nodes: ReduxNode[] | null
  observedMutations: Mutations
  selectedClade?: string
  tipRadii: number[] | null
  tipRadiiVersion: number
  totalStateCounts: TraitCounts
  vaccines: ReduxNode[] | false
  /**
   * A version increase (i.e. props.version !== nextProps.version) necessarily implies
   * that the tree is loaded as they are set on the same action
   */
  version: number
  visibility: Visibility[] | null
  visibilityVersion: number
  
  /** A map of available streams to summary information about the stream */
  streams: Record<string, StreamSummary>
}

export interface TreeTooState extends TreeState {
  tangleTipLookup?: unknown[][]
}

export type Visibility = typeof NODE_NOT_VISIBLE | typeof NODE_VISIBLE_TO_MAP_ONLY | typeof NODE_VISIBLE
