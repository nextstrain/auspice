import { NODE_NOT_VISIBLE, NODE_VISIBLE, NODE_VISIBLE_TO_MAP_ONLY } from "../../util/globals";
import { PhyloNode } from "../../components/tree/phyloTree/types";

/**
 * Maps mutation strings (in format gene:fromPosTo, e.g. 'nuc:A123T')
 * to their occurrence count in the tree
 */
export type Mutations = Record<string, number>

export interface ReduxNode {
  /** the index of the node in the nodes array. set so that we can access visibility / nodeColors if needed */
  arrayIdx?: number

  branch_attrs?: {
    mutations?: {
      [gene: string]: string[]
    }
    labels?: Record<string, unknown>
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

  unexplodedChildren?: ReduxNode[]
}

/**
 * Keys: the traits
 * Values: a Map of trait values to count
 */
export type TraitCounts = Record<string, Map<string, number>>

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
}

export interface TreeTooState extends TreeState {
  tangleTipLookup?: unknown[][]
}

export type Visibility = typeof NODE_NOT_VISIBLE | typeof NODE_VISIBLE_TO_MAP_ONLY | typeof NODE_VISIBLE
