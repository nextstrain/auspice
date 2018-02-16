/* eslint-disable space-infix-ops */
import { min, max } from "d3-array";
import { applyToChildren } from "./helpers";
import { timerStart, timerEnd } from "../../../util/perf";

/**
 * zoom such that a particular clade fills the svg
 * @param  clade -- branch/node at the root of the clade to zoom into
 * @param  dt -- time of the transition in milliseconds
 * @return {null}
 */
export const zoomIntoClade = function zoomIntoClade(clade, dt) {
  console.warn("zoomIntoClade is deprecated. Please use phylotree.change()");
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
  console.warn("TODO: zoomToParent functionality needs to be built into phylotree.change()");
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
  console.log("mapToScreen")
  timerStart("mapToScreen");
  /* set the range of the x & y scales */
  this.setScales(this.params.margins);

  /* find minimum & maximum x & y values, as well as # tips in view */
  this.nNodesInView = 0;
  let [minY, maxY, minX, maxX] = [1000000, 0, 1000000, 0];
  this.nodes.filter((d) => d.inView).forEach((d) => {
    if (d.x > maxX) maxX = d.x;
    if (d.y > maxY) maxY = d.y;
    if (d.x < minX) minX = d.x;
    if (d.y < minY) minY = d.y;
    if (d.terminal) this.nNodesInView++;
  });

  /* set the domain of the x & y scales */
  if (this.layout === "radial" || this.layout === "unrooted") {
    // handle "radial and unrooted differently since they need to be square
    // since branch length move in x and y direction
    // TODO: should be tied to svg dimensions
    const spanX = maxX-minX;
    const spanY = maxY-minY;
    const maxSpan = max([spanY, spanX]);
    const ySlack = (spanX>spanY) ? (spanX-spanY)*0.5 : 0.0;
    const xSlack = (spanX<spanY) ? (spanY-spanX)*0.5 : 0.0;
    this.xScale.domain([minX-xSlack, minX+maxSpan-xSlack]);
    this.yScale.domain([minY-ySlack, minY+maxSpan-ySlack]);
  } else if (this.layout==="clock") {
    // same as rectangular, but flipped yscale
    this.xScale.domain([minX, maxX]);
    this.yScale.domain([maxY, minY]);
  } else { // rectangular
    this.xScale.domain([minX, maxX]);
    this.yScale.domain([minY, maxY]);
  }

  // pass all x,y through scales and assign to xTip, xBase
  this.nodes.forEach((d) => {
    d.xTip = this.xScale(d.x);
    d.yTip = this.yScale(d.y);
    d.xBase = this.xScale(d.px);
    d.yBase = this.yScale(d.py);
  });
  if (this.vaccines) {
    this.vaccines.forEach((d) => {
      const n = 5; /* half the number of pixels that the cross will take up */
      const xTipCross = this.xScale(d.xCross); /* x position of the center of the cross */
      const yTipCross = this.yScale(d.yCross); /* x position of the center of the cross */
      d.vaccineCross = ` M ${xTipCross-n},${yTipCross-n} L ${xTipCross+n},${yTipCross+n} M ${xTipCross-n},${yTipCross+n} L ${xTipCross+n},${yTipCross-n}`;
      d.vaccineLine = ` M ${d.xTip},${d.yTip} L ${xTipCross},${yTipCross}`;
    });
  }
  if (this.params.confidence && this.layout==="rect") {
    this.nodes.forEach((d) => {d.xConf = [this.xScale(d.conf[0]), this.xScale(d.conf[1])];});
  }

  // assign the branches as path to each node for the different layouts
  if (this.layout==="clock" || this.layout==="unrooted") {
    this.nodes.forEach((d) => {
      d.branch = [" M "+d.xBase.toString()+","+d.yBase.toString()+" L "+d.xTip.toString()+","+d.yTip.toString(), ""];
    });
  } else if (this.layout==="rect") {
    this.nodes.forEach((d) => {
      const stem_offset = 0.5*(d.parent["stroke-width"] - d["stroke-width"]) || 0.0;
      const childrenY = [this.yScale(d.yRange[0]), this.yScale(d.yRange[1])];
      d.branch =[` M ${d.xBase - stem_offset},${d.yBase} L ${d.xTip},${d.yTip} M ${d.xTip},${childrenY[0]} L ${d.xTip},${childrenY[1]}`];
      if (this.params.confidence) d.confLine =` M ${d.xConf[0]},${d.yBase} L ${d.xConf[1]},${d.yTip}`;
    });
  } else if (this.layout==="radial") {
    const offset = this.nodes[0].depth;
    const stem_offset_radial = this.nodes.map((d) => {return (0.5*(d.parent["stroke-width"] - d["stroke-width"]) || 0.0);});
    this.nodes.forEach((d) => {d.cBarStart = this.yScale(d.yRange[0]);});
    this.nodes.forEach((d) => {d.cBarEnd = this.yScale(d.yRange[1]);});
    this.nodes.forEach((d, i) => {
      d.branch =[
        " M "+(d.xBase-stem_offset_radial[i]*Math.sin(d.angle)).toString()
        + " "+(d.yBase-stem_offset_radial[i]*Math.cos(d.angle)).toString()
        + " L "+d.xTip.toString()+" "+d.yTip.toString(), ""
      ];
      if (!d.terminal) {
        d.branch[1] =[" M "+this.xScale(d.xCBarStart).toString()+" "+this.yScale(d.yCBarStart).toString()+
        " A "+(this.xScale(d.depth)-this.xScale(offset)).toString()+" "
        +(this.yScale(d.depth)-this.yScale(offset)).toString()
        +" 0 "+(d.smallBigArc?"1 ":"0 ") +" 1 "+
        " "+this.xScale(d.xCBarEnd).toString()+","+this.yScale(d.yCBarEnd).toString()];
      }
    });
  }
  timerEnd("mapToScreen");
};
