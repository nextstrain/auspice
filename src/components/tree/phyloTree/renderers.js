/**
 * @param  svg    -- the svg into which the tree is drawn
 * @param  layout -- the layout to be used, e.g. "rect"
 * @param  distance   -- the property used as branch length, e.g. div or num_date
 * @param  options    -- an object that contains options that will be added to this.params
 * @param  callbacks  -- an object with call back function defining mouse behavior
 * @param  branchThickness (OPTIONAL) -- array of branch thicknesses
 * @param  visibility (OPTIONAL) -- array of "visible" or "hidden"
 * @return {null}
 */
export const render = function render(svg, layout, distance, options, callbacks, branchThickness, visibility, drawConfidence, vaccines) {
  if (branchThickness) {
    this.nodes.forEach((d, i) => {
      d["stroke-width"] = branchThickness[i];
    });
  }
  this.svg = svg;
  this.params = Object.assign(this.params, options);
  this.callbacks = callbacks;
  this.vaccines = vaccines ? vaccines.map((d) => d.shell) : undefined;

  this.clearSVG();
  this.setDistance(distance);
  this.setLayout(layout);
  this.mapToScreen();
  if (this.params.showGrid) {this.addGrid();}
  if (this.params.branchLabels) {this.drawBranches();}
  this.drawTips();
  if (this.params.showVaccines) {this.drawVaccines();}
  this.drawCladeLabels();
  if (visibility) {
    this.nodes.forEach((d, i) => {
      d["visibility"] = visibility[i];
    });
    this.svg.selectAll(".tip").style("visibility", (d) => d["visibility"]);
  }

  // setting branchLabels and tipLabels to false above in params is not working for some react-dimensions
  // hence the commenting here
  // if (this.params.branchLabels){
  //   this.drawBranchLabels();
  // }
  /* don't even bother initially - there will be too many! */
  // if (this.params.tipLabels){
  //   this.updateTipLabels(100);
  // }

  this.updateGeometry(10);

  this.svg.selectAll(".regression").remove();
  if (this.layout === "clock" && this.distance === "num_date") {
    this.drawRegression();
  }
  this.removeConfidence();
  if (drawConfidence) {
    this.drawConfidence();
  }
};
