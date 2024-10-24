import { createDefaultParams } from "./defaultParams";
import { change, modifySVG, modifySVGInStages } from "./change";
import { NODE_NOT_VISIBLE, NODE_VISIBLE_TO_MAP_ONLY, NODE_VISIBLE } from "../../../util/globals";

/* PROTOTYPES */
import * as renderers from "./renderers";
import * as layouts from "./layouts";
import * as grid from "./grid";
import * as confidence from "./confidence";
import * as labels from "./labels";
import * as regression from "./regression";


export type Layout = "rect" | "radial" | "unrooted" | "clock" | "scatter"

export type Visibility = typeof NODE_NOT_VISIBLE | typeof NODE_VISIBLE_TO_MAP_ONLY | typeof NODE_VISIBLE

export interface ReduxNode {
  inView?: boolean
  name: string
  shell: PhyloNode
  hasChildren: boolean
  parent: ReduxNode
}

export interface PhyloNode {
  that: PhyloTree
  n: ReduxNode
  x: number
  y: number
  inView: boolean
  visibility?: Visibility
  update?: boolean
}

export interface Params {
  regressionStroke: string
  regressionWidth: number
  majorGridStroke: string
  majorGridWidth: number
  minorGridStroke: string
  minorGridWidth: number
  tickLabelSize: number
  tickLabelFill: string
  minorTicks: number
  orientation: [number, number]
  showGrid: boolean
  fillSelected: string
  radiusSelected: number
  branchStroke: string
  branchStrokeWidth: number
  tipStroke: string
  tipFill: string
  tipStrokeWidth: number
  tipRadius: number
  fontFamily: string

  branchLabelKey: boolean
  branchLabelFont: string
  branchLabelFill: string
  branchLabelFontWeight: number
  branchLabelPadX: number
  branchLabelPadY: number

  tipLabels: boolean
  tipLabelFont: string
  tipLabelFill: string
  tipLabelPadX: number
  tipLabelPadY: number
  mapToScreenDebounceTime: number
  tipLabelFontSizeL1: number
  tipLabelFontSizeL2: number
  tipLabelFontSizeL3: number
  tipLabelBreakL1: number
  tipLabelBreakL2: number
  tipLabelBreakL3: number

  showAllBranchLabels?: boolean
  confidence?: boolean
}

export interface PhyloTree {
  grid: boolean
  attributes: string[]
  params: Params
  groups: Record<string, any>
  id: string
  nodes: PhyloNode[]
  zoomNode: PhyloNode
  strainToNode: Record<string, PhyloNode>
  change: typeof change
  modifySVG: typeof modifySVG
  modifySVGInStages: typeof modifySVGInStages
  render: typeof renderers.render
  clearSVG: typeof renderers.clearSVG
  setClipMask: typeof renderers.setClipMask
  drawTips: typeof renderers.drawTips
  drawBranches: typeof renderers.drawBranches
  drawVaccines: typeof renderers.drawVaccines
  drawRegression: typeof renderers.drawRegression
  removeRegression: typeof renderers.removeRegression
  updateColorBy: typeof renderers.updateColorBy
  setDistance: typeof layouts.setDistance
  setLayout: typeof layouts.setLayout
  rectangularLayout: typeof layouts.rectangularLayout
  scatterplotLayout: typeof layouts.scatterplotLayout
  unrootedLayout: typeof layouts.unrootedLayout
  radialLayout: typeof layouts.radialLayout
  setScales: typeof layouts.setScales
  mapToScreen: typeof layouts.mapToScreen
  calculateRegression: typeof regression.calculateRegression
  removeConfidence: typeof confidence.removeConfidence
  drawConfidence: typeof confidence.drawConfidence
  drawSingleCI: typeof confidence.drawSingleCI
  drawBranchLabels: typeof labels.drawBranchLabels
  removeBranchLabels: typeof labels.removeBranchLabels
  updateBranchLabels: typeof labels.updateBranchLabels
  updateTipLabels: typeof labels.updateTipLabels
  removeTipLabels: typeof labels.removeTipLabels
  hideGrid: typeof grid.hideGrid
  addGrid: typeof grid.addGrid
  showTemporalSlice: typeof grid.showTemporalSlice
  hideTemporalSlice: typeof grid.hideTemporalSlice

  confidencesInSVG: boolean
  regression: regression.Regression
  layout: Layout
}

/* phylogenetic tree drawing function - the actual tree is rendered by the render prototype */
const PhyloTree = function PhyloTree(this: PhyloTree, reduxNodes: ReduxNode[], id: string, idxOfInViewRootNode: number) {
  this.grid = false;
  this.attributes = ['r', 'cx', 'cy', 'id', 'class', 'd'];
  this.params = createDefaultParams();
  this.groups = {};
  /* by storing DOM <g> elements, we can quickly refer to groups here rather than scanning the DOM.
  It also helps preserve the initial order of groups in the DOM as we are not creating new ones upon updates */
  this.id = id; /* super useful when one is trying to debug multiple trees! */
  /* create this.nodes, which is an array of nodes with properties used by phylotree for drawing.
   this.nodes is the same length as reduxNodes such that this.nodes[i] is related to reduxNodes[i]
   Furthermore, these objects are linked:
   -- this.nodes[i].n = reduxNodes[i]
   -- reduxNodes[i].shell = this.nodes[i] */
  this.nodes = reduxNodes.map((d) => {
    const phyloNode: PhyloNode = {
      that: this,
      n: d,
      x: 0,
      y: 0,
      inView: d.inView !== undefined ? d.inView : true /* each node is visible, unless set earlier! */
    };
    d.shell = phyloNode;
    return phyloNode;
  });
  this.zoomNode = this.nodes[idxOfInViewRootNode]!;
  this.strainToNode = {};
  this.nodes.forEach((phylonode) => {this.strainToNode[phylonode.n.name] = phylonode;});
  /* debounced functions (AFAIK you can't define these as normal prototypes as they need "this") */
  // this.debouncedMapToScreen = _debounce(this.mapToScreen, this.params.mapToScreenDebounceTime,
  //   {leading: false, trailing: true, maxWait: this.params.mapToScreenDebounceTime});
};

/* C H A N G E */
PhyloTree.prototype.change = change;
PhyloTree.prototype.modifySVG = modifySVG;
PhyloTree.prototype.modifySVGInStages = modifySVGInStages;

/* I N I T I A L        R E N D E R       E T C */
PhyloTree.prototype.render = renderers.render;
PhyloTree.prototype.clearSVG = renderers.clearSVG;

/* D R A W I N G    F U N C T I O N S */
PhyloTree.prototype.setClipMask = renderers.setClipMask;
PhyloTree.prototype.drawTips = renderers.drawTips;
PhyloTree.prototype.drawBranches = renderers.drawBranches;
PhyloTree.prototype.drawVaccines = renderers.drawVaccines;
PhyloTree.prototype.drawRegression = renderers.drawRegression;
PhyloTree.prototype.removeRegression = renderers.removeRegression;
PhyloTree.prototype.updateColorBy = renderers.updateColorBy;

/* C A L C U L A T E    G E O M E T R I E S  E T C   ( M O D I F I E S    N O D E S ,    N O T    S V G ) */
PhyloTree.prototype.setDistance = layouts.setDistance;
PhyloTree.prototype.setLayout = layouts.setLayout;
PhyloTree.prototype.rectangularLayout = layouts.rectangularLayout;
PhyloTree.prototype.scatterplotLayout = layouts.scatterplotLayout;
PhyloTree.prototype.unrootedLayout = layouts.unrootedLayout;
PhyloTree.prototype.radialLayout = layouts.radialLayout;
PhyloTree.prototype.setScales = layouts.setScales;
PhyloTree.prototype.mapToScreen = layouts.mapToScreen;
PhyloTree.prototype.calculateRegression = regression.calculateRegression;

/* C O N F I D E N C E    I N T E R V A L S */
PhyloTree.prototype.removeConfidence = confidence.removeConfidence;
PhyloTree.prototype.drawConfidence = confidence.drawConfidence;
PhyloTree.prototype.drawSingleCI = confidence.drawSingleCI;

/* L A B E L S    ( T I P ,    B R A N C H ,   C O N F I D E N C E ) */
PhyloTree.prototype.drawBranchLabels = labels.drawBranchLabels;
PhyloTree.prototype.removeBranchLabels = labels.removeBranchLabels;
PhyloTree.prototype.updateBranchLabels = labels.updateBranchLabels;
PhyloTree.prototype.updateTipLabels = labels.updateTipLabels;
PhyloTree.prototype.removeTipLabels = labels.removeTipLabels;

/* G R I D */
PhyloTree.prototype.hideGrid = grid.hideGrid;
PhyloTree.prototype.addGrid = grid.addGrid;
PhyloTree.prototype.showTemporalSlice = grid.showTemporalSlice;
PhyloTree.prototype.hideTemporalSlice = grid.hideTemporalSlice;

export default PhyloTree;
