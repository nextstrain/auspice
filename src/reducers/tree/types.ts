import { NODE_NOT_VISIBLE, NODE_VISIBLE, NODE_VISIBLE_TO_MAP_ONLY } from "../../util/globals";
import { PhyloNode } from "../../components/tree/phyloTree/types";

/**
 * Maps mutation strings (in format gene:fromPosTo, e.g. 'nuc:A123T')
 * to their occurrence count in the tree
 */
export type Mutations = Record<string, number>

/** An index in the overall `nodes` array */
export type NodeIdx = number;

/** Nodes focused "on" (when focus mode selected) */
export type FocusNodes = {
  nodes: number[];
  roots: number[];
}


interface ReduxNodeBase {
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

  /**
   * The JSON structure of `node_attrs` is a mixture of many types. This is ~impossible to express
   * in TS (as the index signature needs to encompass the known value types) and is also hard to
   * reason with in code. We would be wise to (when parsing the JSON) convert the simple types (div,
   * hidden, url, accession) into `NodeAttr` types, and store the `author` and `vaccine` structures
   * somewhere else.
   */
  node_attrs?: {
    div?: number
    hidden?: "always" | "timetree" | "divtree"
    num_date?: NodeAttr<number>;
    author?: NodeAttrAuthor;
    url?: string;
    accession?: string;
    vaccine?: NodeAttrVaccine;
    [node_attr: string]: NodeAttr | number | string | NodeAttrAuthor | NodeAttrVaccine;
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
}


export interface NodeAttr<
  T extends number | string | boolean = number | string | boolean,
> {
  value: T;
  confidence?: T extends number ?
    [number, number] :
    T extends string ?
    Record<string, number> :
    never;
  entropy?: number;
  url?: string;
}

interface NodeAttrAuthor {
  /** unique value for this publication */
  value: string;
  /** Publication title */
  title?: string;
  /** Journal title (including year, if applicable) */
  journal?: string;
  /** URL link to paper */
  paper_url?: string;
}

interface NodeAttrVaccine {
  /** selection_date */
  selection_date?: string;
  /** Vaccine usage start date */
  start_date: string;
  /** When the vaccine was stopped */
  end_date: string;
  /** strain used to raise sera */
  serum?: boolean;
}


export type StreamDimensions = Array<Array<number>>

interface StreamStartNode {
    /** Name of the stream (represents a branch label value for this node) */
  streamName: string

  /** the pivots for the stream originating from this node */
  streamPivots: Array<number>

  /** the categories for the stream originating from this node */
  streamCategories: Array<{
    name: string|undefined
    color: string
    nodes: NodeIdx[]
  }>

  /** the dimensions (KDE-weights per category per pivot) for the stream originating from this node */
  streamDimensions: StreamDimensions

  /** the maximum weight observed in streamDimensions when summing across categories */
  streamMaxHeight: number

  streamNodeCounts: {total: number; visible: number}

  unexplodedChildren: ReduxNode[]
}

/** Helper type for creating type intersections */
type AllOrNone<T> = T | { [K in keyof T]?: never };

export type ReduxNode = ReduxNodeBase & AllOrNone<StreamStartNode>;

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
  /**
   * Order to render the connected series of streams (which originate from this stream, i.e. this property
   * only exists if parentStreamName=false) such that the connectors don't cross other streams.
   * Each element is the name of a stream (e.g. renderingOrder.at(-1) will be this stream's name)
   */
  renderingOrder?: string[];
  parentStreamName: string|false;
  domains: Record<'num_date'|'div', [number, number]>;
}


export const sigma = Symbol("sigma");
export const colorBySymbol = Symbol("colorBy");
export const weightToDisplayOrderScaleFactor = Symbol("weightToDisplayOrderScaleFactor");
export const streamLabelSymbol = Symbol("streamLabel");
export type Streams = Record<string, StreamSummary> & {
  /**
   * Gaussian kernel sigma (std dev)
   */
  [sigma]?: number
  /**
   * Scale factor to use when mapping kernel-weight space to display-order space
   */
  [weightToDisplayOrderScaleFactor]?: number
  /**
   * the color-by used to generate ribbons
   */
  [colorBySymbol]?: string
  /**
   * the branch label key used to define streams
   */
  [streamLabelSymbol]?: string
}

export interface TreeState {
  availableBranchLabels: string[]
  branchThickness: number[] | null
  branchThicknessVersion: number
  idxOfFilteredRoot?: number
  idxOfInViewRootNode: number
  loaded: boolean
  name?: string
  nodeAttrKeys?: Set<string>
  nodeColors: string[] | null
  nodeColorsVersion: number
  nodes: ReduxNode[] | null
  observedMutations: Mutations
  tipRadii: number[] | null
  tipRadiiVersion: number
  hoveredLegendSwatch: string|number|false
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
  streams: Streams

  focusNodes?: FocusNodes
}

export interface TreeTooState extends TreeState {
  tangleTipLookup?: unknown[][]
}

export type Visibility = typeof NODE_NOT_VISIBLE | typeof NODE_VISIBLE_TO_MAP_ONLY | typeof NODE_VISIBLE
