import { NODE_NOT_VISIBLE, NODE_VISIBLE_TO_MAP_ONLY, NODE_VISIBLE } from "../../../util/globals";
import { PhyloTree } from "./phyloTree";


export type Layout = "rect" | "radial" | "unrooted" | "clock" | "scatter"

export type Distance = "num_date" | "div"

export type TreeElement = 
  ".branch.S" |
  ".branch.T" |
  ".branch" |
  ".branchLabel" |
  ".conf" |
  ".grid" |
  ".regression" |
  ".tip" |
  ".tipLabel" |
  ".vaccineCross" |
  ".vaccineDottedLine"

export type Visibility = typeof NODE_NOT_VISIBLE | typeof NODE_VISIBLE_TO_MAP_ONLY | typeof NODE_VISIBLE

export interface ReduxNode {
  arrayIdx?: number
  children?: ReduxNode[]
  currentGt?: number
  hasChildren: boolean
  inView?: boolean
  name: string
  node_attrs?: {
    hidden?: "always" | "timetree" | "divtree"
  }
  parent: ReduxNode
  shell: PhyloNode
}

/** Properties can be any property on PhyloNode but as an array for multiple nodes */
export interface PropsForPhyloNodes {
  branchStroke?: string[]
  fill?: string[]
  r?: number[]
  tipStroke?: (string | undefined)[]
  visibility?: Visibility[]
}

// Workaround for CSSStyleDeclaration having strokeWidth instead of stroke-width.
// https://github.com/microsoft/TypeScript/issues/17827#issuecomment-861847433
export interface CSSStyleDeclarationWithHyphens extends CSSStyleDeclaration {
  "stroke-width": string
}

// Workaround for CSSStyleDeclaration having generic string types.
// Potentially related issue: https://github.com/Microsoft/TypeScript/issues/17827
interface CustomCSSStyleDeclaration {
  r?: number
  "stroke-width"?: number
  visibility?: Visibility
  x: number
  y: number
}

export interface PhyloNode extends Partial<Omit<CSSStyleDeclarationWithHyphens, keyof CustomCSSStyleDeclaration>>, CustomCSSStyleDeclaration {
  angle?: number
  arrayIdx?: number
  branch?: [string, string]
  branchStroke?: string
  children?: Node[]
  conf?: [number, number]

  /** SVG path */
  confLine?: string

  crossDepth?: number
  depth?: number
  displayOrder?: number
  displayOrderRange?: number[]
  fill?: string
  fullTipCount?: number
  hasChildren?: boolean
  inView: boolean
  n: ReduxNode
  name?: string
  parent?: Node
  pDepth?: number
  px?: number
  py?: number
  rot?: number
  shell?: Node
  smallBigArc?: boolean
  tau?: number
  that: PhyloTree
  tipCount?: number
  tipStroke?: string
  update?: boolean

  /** SVG path */
  vaccineCross?: string

  w?: number
  xBase?: number
  xCBarEnd?: number
  xCBarStart?: number
  xCross?: number
  xTip?: number
  yBase?: number
  yCBarEnd?: number
  yCBarStart?: number
  yCross?: number
  yTip?: number
}

export interface ScatterVariables {
  showBranches?: boolean
  showRegression?: boolean
  x?: string
  xContinuous?: boolean
  xDomain?: number[]
  xTemporal?: boolean
  y?: string
  yContinuous?: boolean
  yDomain?: number[]
  yTemporal?: boolean
}

export interface Params {
  branchLabelFill: string
  branchLabelFont: string
  branchLabelFontWeight: number
  branchLabelKey: string | false
  branchLabelPadX: number
  branchLabelPadY: number
  branchStroke: string
  branchStrokeWidth: number
  confidence?: boolean
  fillSelected: string
  fontFamily: string
  grid?: boolean
  majorGridStroke: string
  majorGridWidth: number
  mapToScreenDebounceTime: number
  minorGridStroke: string
  minorGridWidth: number
  minorTicks: number
  orientation: [number, number]
  radiusSelected: number
  regressionStroke: string
  regressionWidth: number
  showAllBranchLabels?: boolean
  showGrid: boolean
  showTipLabels?: boolean
  tickLabelFill: string
  tickLabelSize: number
  tipFill: string
  tipLabelBreakL1: number
  tipLabelBreakL2: number
  tipLabelBreakL3: number
  tipLabelFill: string
  tipLabelFont: string
  tipLabelFontSizeL1: number
  tipLabelFontSizeL2: number
  tipLabelFontSizeL3: number
  tipLabelPadX: number
  tipLabelPadY: number
  tipLabels: boolean
  tipRadius: number
  tipStroke: string
  tipStrokeWidth: number
}

export interface Callbacks {
  onTipHover: (d: PhyloNode) => void
  onTipLeave: (d: PhyloNode) => void
  onTipClick: (d: PhyloNode) => void
  onBranchHover: (d: PhyloNode) => void
  onBranchLeave: (d: PhyloNode) => void
  onBranchClick: (d: PhyloNode) => void
  tipLabel: (d: PhyloNode) => void
}
