/* eslint-disable space-infix-ops */
import { min, max } from "d3-array";
import { applyToChildren } from "./helpers";

/**
 * zoom such that a particular clade fills the svg
 * @param  clade -- branch/node at the root of the clade to zoom into
 * @param  dt -- time of the transition in milliseconds
 * @return {null}
 */
export const zoomIntoClade = function zoomIntoClade(clade, dt) {
  // assign all nodes to inView false and force update
  this.zoomNode = clade;
  this.nodes.forEach((d) => {
    d.inView = false;
    d.update = true;
  });
  // assign all child nodes of the chosen clade to inView=true
  // if clade is terminal, apply to parent
  if (clade.terminal) {
    applyToChildren(clade.parent, (d) => {d.inView = true;});
  } else {
    applyToChildren(clade, (d) => {d.inView = true;});
  }
  // redraw
  this.mapToScreen();
  this.updateGeometry(dt);
  if (this.grid) this.addGrid(this.layout);
  this.svg.selectAll(".regression").remove();
  if (this.layout === "clock" && this.distance === "num_date") this.drawRegression();
  if (this.params.branchLabels) {
    this.updateBranchLabels(dt);
  }
  this.updateTipLabels(dt);
};

/**
 * zoom out a little by using the parent of the current clade
 * as a zoom focus.
 * @param  {int} dt [transition time]
 */
export const zoomToParent = function zoomToParent(dt) {
  if (this.zoomNode) {
    this.zoomIntoClade(this.zoomNode.parent, dt);
  }
};


/**
* this function sets the xScale, yScale domains and maps precalculated x,y
* coordinates to their places on the screen
* @return {null}
*/
export const mapToScreen = function mapToScreen() {
  this.setScales(this.params.margins);
  // determine x,y values of visibile nodes
  const tmp_xValues = this.nodes.filter((d) => {return d.inView;}).map((d) => d.x);
  const tmp_yValues = this.nodes.filter((d) => {return d.inView;}).map((d) => d.y);
  this.nNodesInView = this.nodes.filter((d) => {return d.inView && d.terminal;}).length;

  if (this.layout === "radial" || this.layout === "unrooted") {
    // handle "radial and unrooted differently since they need to be square
    // since branch length move in x and y direction
    // TODO: should be tied to svg dimensions
    const minX = min(tmp_xValues);
    const minY = min(tmp_yValues);
    const spanX = max(tmp_xValues)-minX;
    const spanY = max(tmp_yValues)-minY;
    const maxSpan = max([spanY, spanX]);
    const ySlack = (spanX>spanY) ? (spanX-spanY)*0.5 : 0.0;
    const xSlack = (spanX<spanY) ? (spanY-spanX)*0.5 : 0.0;
    this.xScale.domain([minX-xSlack, minX+maxSpan-xSlack]);
    this.yScale.domain([minY-ySlack, minY+maxSpan-ySlack]);
  } else if (this.layout==="clock") {
    // same as rectangular, but flipped yscale
    this.xScale.domain([min(tmp_xValues), max(tmp_xValues)]);
    this.yScale.domain([max(tmp_yValues), min(tmp_yValues)]);
  } else { // rectangular
    this.xScale.domain([min(tmp_xValues), max(tmp_xValues)]);
    this.yScale.domain([min(tmp_yValues), max(tmp_yValues)]);
  }

  // pass all x,y through scales and assign to xTip, xBase
  const tmp_xScale=this.xScale;
  const tmp_yScale=this.yScale;
  this.nodes.forEach((d) => {d.xTip = tmp_xScale(d.x);});
  if (this.vaccines) this.vaccines.forEach((d) => {d.xTipCross = tmp_xScale(d.xCross);});
  this.nodes.forEach((d) => {d.yTip = tmp_yScale(d.y);});
  this.nodes.forEach((d) => {d.xBase = tmp_xScale(d.px);});
  this.nodes.forEach((d) => {d.yBase = tmp_yScale(d.py);});
  if (this.params.confidence && this.layout==="rect") {
    this.nodes.forEach((d) => {d.xConf = [tmp_xScale(d.conf[0]), tmp_xScale(d.conf[1])];});
  }

  // assign the branches as path to each node for the different layouts
  if (this.layout==="clock" || this.layout==="unrooted") {
    this.nodes.forEach((d) => {
      d.branch = [" M "+d.xBase.toString()+","+d.yBase.toString()+" L "+d.xTip.toString()+","+d.yTip.toString(), ""];
    });
  } else if (this.layout==="rect") {
    this.nodes.forEach((d) => {d.cBarStart = tmp_yScale(d.yRange[0]);});
    this.nodes.forEach((d) => {d.cBarEnd = tmp_yScale(d.yRange[1]);});
    const stem_offset = this.nodes.map((d) => {return (0.5*(d.parent["stroke-width"] - d["stroke-width"]) || 0.0);});
    this.nodes.forEach((d, i) => {
      d.branch =[" M "+(d.xBase - stem_offset[i]).toString()
      +","+d.yBase.toString()+
      " L "+d.xTip.toString()+","+d.yTip.toString(),
      " M "+d.xTip.toString()+","+d.cBarStart.toString()+
      " L "+d.xTip.toString()+","+d.cBarEnd.toString()];
    });
    if (this.params.confidence) {
      this.nodes.forEach((d) => {
        d.confLine =" M "+d.xConf[0].toString()+","+d.yBase.toString()+" L "+d.xConf[1].toString()+","+d.yTip.toString();
      });
    }
  } else if (this.layout==="radial") {
    const offset = this.nodes[0].depth;
    const stem_offset_radial = this.nodes.map((d) => {return (0.5*(d.parent["stroke-width"] - d["stroke-width"]) || 0.0);});
    this.nodes.forEach((d) => {d.cBarStart = tmp_yScale(d.yRange[0]);});
    this.nodes.forEach((d) => {d.cBarEnd = tmp_yScale(d.yRange[1]);});
    this.nodes.forEach((d, i) => {
      d.branch =[
        " M "+(d.xBase-stem_offset_radial[i]*Math.sin(d.angle)).toString()
        + " "+(d.yBase-stem_offset_radial[i]*Math.cos(d.angle)).toString()
        + " L "+d.xTip.toString()+" "+d.yTip.toString(), ""
      ];
      if (!d.terminal) {
        d.branch[1] =[" M "+tmp_xScale(d.xCBarStart).toString()+" "+tmp_yScale(d.yCBarStart).toString()+
        " A "+(tmp_xScale(d.depth)-tmp_xScale(offset)).toString()+" "
        +(tmp_yScale(d.depth)-tmp_yScale(offset)).toString()
        +" 0 "+(d.smallBigArc?"1 ":"0 ") +" 1 "+
        " "+tmp_xScale(d.xCBarEnd).toString()+","+tmp_yScale(d.yCBarEnd).toString()];
      }
    });
  }
};
