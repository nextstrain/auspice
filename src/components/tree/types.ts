import { WithTranslation } from "react-i18next"
import { ColorScale, Focus, Layout, PerformanceFlags, ScatterVariables, SelectedNode, TemporalConfidence } from "../../reducers/controls";
import { TreeState, TreeTooState } from "../../reducers/tree/types";
import { AppDispatch } from "../../store";
import { Distance, PhyloNode, PhyloTreeType } from "./phyloTree/types";

export interface TreeComponentOwnProps {
  dispatch: AppDispatch
  height: number
  width: number
}

export interface TreeComponentProps extends WithTranslation, TreeComponentStateProps, TreeComponentOwnProps {}

// This is duplicated from RootState, but good to be explicit about what's
// expected here.
export interface TreeComponentStateProps {
  animationPlayPauseButton: "Play" | "Pause"
  canRenderBranchLabels: boolean
  colorBy: string
  colorByConfidence: boolean
  colorings: unknown
  colorScale: ColorScale
  dateMaxNumeric: number
  dateMinNumeric: number
  distanceMeasure: Distance
  explodeAttr: string
  filters: Record<string, Array<{ value: string, active: boolean }>>
  focus: Focus
  genomeMap: unknown
  layout: Layout
  narrativeMode: boolean
  panelsToDisplay: string[]
  performanceFlags: PerformanceFlags
  quickdraw: boolean
  scatterVariables: ScatterVariables
  selectedBranchLabel: string
  selectedNode: SelectedNode | null
  showAllBranchLabels: boolean
  showOnlyPanels: boolean
  showTangle: boolean
  showTreeToo: boolean
  showStreamTrees: boolean
  temporalConfidence: TemporalConfidence
  tipLabelKey: string | symbol
  tree: TreeState
  treeToo: TreeTooState
}

export interface TreeComponentState {
  hoveredNode: {
    node: PhyloNode
    isBranch: boolean
    streamDetails?: {x: number; y: number; categoryIndex: number;}
  } | null
  tree: PhyloTreeType | null
  treeToo: PhyloTreeType | null
  geneSortFn?: (a: number, b: number) => number | (() => 0)
}
