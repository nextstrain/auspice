import _debounce from "lodash/debounce";
import { max } from "d3-array";
import { scaleLinear } from "d3-scale";
import { flattenTree, appendParentsToTree } from "../treeHelpers";
import { defaultParams } from "./defaultParams";
import { addLeafCount, createChildrenAndParents } from "./helpers";

/* PROTOTYPES */
import * as renderers from "./renderers";
import * as layouts from "./layouts";
import * as zoom from "./zoom";
import * as grid from "./grid";
import * as confidence from "./confidence";
import * as labels from "./labels";
import * as generalUpdates from "./generalUpdates";


/* phylogenetic tree drawing function - the actual tree is rendered by the render prototype */
const PhyloTree = function PhyloTree(reduxNodes) {
  this.grid = false;
  this.attributes = ['r', 'cx', 'cy', 'id', 'class', 'd'];
  this.params = defaultParams;

  /* create this.nodes, which is an array of nodes with properties used by phylotree for drawing.
   this.nodes is the same length as reduxNodes such that this.nodes[i] is related to reduxNodes[i]
   Furthermore, these objects are linked:
   -- this.nodes[i].n = reduxNodes[i]
   -- reduxNodes[i].shell = this.nodes[i] */
  this.nodes = reduxNodes.map((d) => {
    const phyloNode = {
      n: d, /* a back link to the redux node */
      x: 0,
      y: 0,
      terminal: (typeof d.children === "undefined"),
      inView: true, /* each node is visible */
      r: this.params.tipRadius /* default */
    };
    d.shell = phyloNode; /* set the link from the redux node to the phylotree node */
    return phyloNode;
  });
  this.numberOfTips = max(this.nodes.map((d) => d.n.yvalue)); // total number of tips (we kinda cheat by finding the maximal yvalue, made by augur)
  createChildrenAndParents(this.nodes);
  this.xScale = scaleLinear();
  this.yScale = scaleLinear();
  this.zoomNode = this.nodes[0];
  addLeafCount(this.nodes[0]);

  /* debounced functions (AFAIK you can't define these as normal prototypes as they need "this") */
  this.debouncedMapToScreen = _debounce(this.mapToScreen, this.params.mapToScreenDebounceTime,
    {leading: false, trailing: true, maxWait: this.params.mapToScreenDebounceTime});
};

/* I N I T I A L        R E N D E R       E T C */
PhyloTree.prototype.render = renderers.render;
PhyloTree.prototype.rerenderAllElements = renderers.rerenderAllElements;
PhyloTree.prototype.clearSVG = renderers.clearSVG;

/* D R A W I N G    F U N C T I O N S */
PhyloTree.prototype.drawTips = renderers.drawTips;
PhyloTree.prototype.drawBranches = renderers.drawBranches;
PhyloTree.prototype.drawVaccines = renderers.drawVaccines;
PhyloTree.prototype.drawRegression = renderers.drawRegression;

/* C A L C U L A T E    G E O M E T R I E S  E T C   ( M O D I F I E S    N O D E S ,    N O T    S V G ) */
PhyloTree.prototype.setDistance = layouts.setDistance;
PhyloTree.prototype.setLayout = layouts.setLayout;
PhyloTree.prototype.rectangularLayout = layouts.rectangularLayout;
PhyloTree.prototype.timeVsRootToTip = layouts.timeVsRootToTip;
PhyloTree.prototype.unrootedLayout = layouts.unrootedLayout;
PhyloTree.prototype.radialLayout = layouts.radialLayout;
PhyloTree.prototype.setScales = layouts.setScales;

/* C O N F I D E N C E    I N T E R V A L S */
PhyloTree.prototype.removeConfidence = confidence.removeConfidence;
PhyloTree.prototype.drawConfidence = confidence.drawConfidence;
PhyloTree.prototype.drawSingleCI = confidence.drawSingleCI;
PhyloTree.prototype.updateConfidence = confidence.updateConfidence;

/* G E N E R A L    U P D A T E S */
PhyloTree.prototype.updateDistance = generalUpdates.updateDistance;
PhyloTree.prototype.updateLayout = generalUpdates.updateLayout;
PhyloTree.prototype.updateGeometry = generalUpdates.updateGeometry;
PhyloTree.prototype.updateGeometryFade = generalUpdates.updateGeometryFade;
PhyloTree.prototype.updateTimeBar = (d) => {};
PhyloTree.prototype.updateMultipleArray = generalUpdates.updateMultipleArray;
PhyloTree.prototype.updateStyleOrAttribute = generalUpdates.updateStyleOrAttribute;
PhyloTree.prototype.updateStyleOrAttributeArray = generalUpdates.updateStyleOrAttributeArray;
PhyloTree.prototype.redrawAttribute = generalUpdates.redrawAttribute;
PhyloTree.prototype.redrawStyle = generalUpdates.redrawStyle;

/* L A B E L S    ( T I P ,    B R A N C H ,   C O N F I D E N C E ) */
PhyloTree.prototype.drawCladeLabels = labels.drawCladeLabels;
PhyloTree.prototype.updateBranchLabels = labels.updateBranchLabels;
PhyloTree.prototype.updateTipLabels = labels.updateTipLabels;
PhyloTree.prototype.hideBranchLabels = labels.hideBranchLabels;
PhyloTree.prototype.showBranchLabels = labels.showBranchLabels;

/* G R I D */
PhyloTree.prototype.hideGrid = grid.hideGrid;
PhyloTree.prototype.removeGrid = grid.removeGrid;
PhyloTree.prototype.addGrid = grid.addGrid;

/* Z O O M ,    F I T     TO     S C R E E N ,     E T C */
PhyloTree.prototype.zoomIntoClade = zoom.zoomIntoClade;
PhyloTree.prototype.zoomToParent = zoom.zoomToParent;
PhyloTree.prototype.mapToScreen = zoom.mapToScreen;

export default PhyloTree;
