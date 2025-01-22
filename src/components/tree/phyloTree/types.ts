import { Selection } from "d3-selection";
import { Layout, PerformanceFlags, ScatterVariables } from "../../../reducers/controls";
import { ReduxNode, Visibility } from "../../../reducers/tree/types";
import { change, modifySVG, modifySVGInStages } from "./change";

import * as confidence from "./confidence";
import * as grid from "./grid";
import * as labels from "./labels";
import * as layouts from "./layouts";
import * as regression from "./regression";
import * as renderers from "./renderers";

// ---------- Basics ---------- //

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

export interface Regression {
  intercept?: number
  r2?: number
  slope?: number
}

// ---------- Callbacks ---------- //

type NodeCallback = (d: PhyloNode) => void // See <https://github.com/nextstrain/auspice/issues/1900>

export interface Callbacks {
  onBranchClick: NodeCallback
  onBranchHover: NodeCallback
  onBranchLeave: NodeCallback
  onTipClick: NodeCallback
  onTipHover: NodeCallback
  onTipLeave: NodeCallback
  tipLabel: NodeCallback
}

// ---------- PhyloNode ---------- //

/**
 * This is a subset of CSSStyleDeclaration. Reasons for not using that directly:
 * 1. CSSStyleDeclaration has generic string types for all properties. We allow a number type on many.
 * 2. We do not use most CSSStyleDeclaration properties.
 * 3. CSSStyleDeclaration uses strokeWidth instead of stroke-width.
 *    <https://github.com/microsoft/TypeScript/issues/17827#issuecomment-861847433>
 */
// TODO: consider extending existing interfaces such as SVGCircleElement for cx/cy/r
interface SVG {
  cursor?: unknown
  cx?: number
  cy?: number
  d?: unknown
  fill?: unknown
  opacity?: unknown
  r?: number
  stroke?: unknown
  "stroke-width"?: number
  visibility?: Visibility

  // TODO: This should be `string | number`, conditional on layout
  x?: any

  // TODO: This should be `string | number`, conditional on layout
  y?: any
}

export type SVGProperty = keyof SVG

export interface PhyloNode extends SVG {
  angle?: number
  branch?: [string, string]
  branchStroke?: string
  conf?: [number, number]

  /** SVG path */
  confLine?: string

  crossDepth?: number
  depth?: number
  displayOrder?: number
  displayOrderRange?: [number, number]
  fill?: string
  inView: boolean
  n: ReduxNode
  pDepth?: number

  // TODO: This should be `string | number`, conditional on layout
  px?: any

  // TODO: This should be `string | number`, conditional on layout
  py?: any

  rot?: number
  smallBigArc?: boolean
  tau?: number
  that: PhyloTreeType
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

/**
 * Properties can be any property on PhyloNode but as an array for multiple nodes.
 * These are the ones that are used in the code.
 */
export interface PropsForPhyloNodes {
  branchStroke?: string[]
  fill?: string[]
  r?: number[]
  tipStroke?: (string | undefined)[]
  visibility?: Visibility[]
}

// ---------- PhyloTree ---------- //

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

export interface ChangeParams {
  // booleans for what should be changed //
  changeColorBy?: boolean
  changeVisibility?: boolean
  changeTipRadii?: boolean
  changeBranchThickness?: boolean
  showConfidences?: boolean
  removeConfidences?: boolean
  zoomIntoClade?: false | PhyloNode
  svgHasChangedDimensions?: boolean
  animationInProgress?: boolean
  changeNodeOrder?: boolean
  focus?: boolean

  // change these things to provided value (unless undefined) //
  newDistance?: Distance
  newLayout?: Layout
  updateLayout?: boolean // todo - this seems identical to `newLayout`
  newBranchLabellingKey?: string
  showAllBranchLabels?: boolean
  newTipLabelKey?: string | symbol
  newMeasurementsColorGrouping?: string | undefined

  // arrays of data (the same length as nodes) //
  branchStroke?: string[]
  tipStroke?: (string | undefined)[]
  fill?: string[]
  visibility?: Visibility[]
  tipRadii?: number[]
  branchThickness?: number[]

  // other data //
  scatterVariables?: ScatterVariables
  performanceFlags?: PerformanceFlags
}

export interface PhyloTreeType {
  addGrid: typeof grid.addGrid
  attributes: string[]
  calculateRegression: typeof regression.calculateRegression
  callbacks: Callbacks
  change: typeof change
  clearSVG: typeof renderers.clearSVG
  confidencesInSVG: boolean
  dateRange: [number, number]
  distance: Distance
  drawBranchLabels: typeof labels.drawBranchLabels
  drawBranches: typeof renderers.drawBranches
  drawConfidence: typeof confidence.drawConfidence
  drawMeasurementsColoringCrosshair: typeof renderers.drawMeasurementsColoringCrosshair
  drawRegression: typeof renderers.drawRegression
  drawSingleCI: typeof confidence.drawSingleCI
  drawTips: typeof renderers.drawTips
  drawVaccines: typeof renderers.drawVaccines
  grid: boolean
  groups: {
    branchGradientDefs?: Selection<SVGDefsElement, unknown, null, unknown>
    branchStem?: Selection<SVGDefsElement, unknown, null, unknown>
    branchTee?: Selection<SVGDefsElement, unknown, null, unknown>
    clipPath?: Selection<SVGDefsElement, unknown, null, unknown>
    confidenceIntervals?: Selection<SVGDefsElement, unknown, null, unknown>
    measurementsColoringCrosshair?: Selection<SVGDefsElement, unknown, null, unknown>
    regression?: Selection<SVGDefsElement, unknown, null, unknown>
    tips?: Selection<SVGDefsElement, unknown, null, unknown>
    vaccines?: Selection<SVGDefsElement, unknown, null, unknown>
  }
  hideGrid: typeof grid.hideGrid
  hideTemporalSlice: typeof grid.hideTemporalSlice
  id: string
  layout: Layout
  mapToScreen: typeof layouts.mapToScreen
  margins: {
    bottom: number
    left: number
    right: number
    top: number
  }
  measurementsColorGrouping: string | undefined
  modifySVG: typeof modifySVG
  modifySVGInStages: typeof modifySVGInStages
  nodes: PhyloNode[]
  params: Params
  radialLayout: typeof layouts.radialLayout
  rectangularLayout: typeof layouts.rectangularLayout
  regression?: Regression
  removeBranchLabels: typeof labels.removeBranchLabels
  removeConfidence: typeof confidence.removeConfidence
  removeMeasurementsColoringCrosshair: typeof renderers.removeMeasurementsColoringCrosshair
  removeRegression: typeof renderers.removeRegression
  removeTipLabels: typeof labels.removeTipLabels
  render: typeof renderers.render
  scatterVariables?: ScatterVariables
  scatterplotLayout: typeof layouts.scatterplotLayout
  setClipMask: typeof renderers.setClipMask
  setDistance: typeof layouts.setDistance
  setLayout: typeof layouts.setLayout
  setScales: typeof layouts.setScales
  showTemporalSlice: typeof grid.showTemporalSlice
  strainToNode: Record<string, PhyloNode>
  svg: Selection<SVGGElement | null, unknown, null, unknown>
  timeLastRenderRequested?: number
  unrootedLayout: typeof layouts.unrootedLayout
  updateBranchLabels: typeof labels.updateBranchLabels
  updateColorBy: typeof renderers.updateColorBy
  updateTipLabels: typeof labels.updateTipLabels
  vaccines?: PhyloNode[]
  visibility: Visibility[]

  // TODO: This should be `d3.ScalePoint<string> | d3.ScaleContinuousNumeric<number, number>`, conditional on layout
  xScale: any

  // TODO: This should be `d3.ScalePoint<string> | d3.ScaleContinuousNumeric<number, number>`, conditional on layout
  yScale: any

  zoomNode: PhyloNode
}
