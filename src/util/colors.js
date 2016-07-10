/*********************************
**********************************
**********************************
**********************************
** Colors
**********************************
**********************************
**********************************
*********************************/

// 2 color	["#5097BA", "#DF4327"]

// "ep", "ne" and "rb" need no adjustments
const adjust_coloring_by_date = () => {
  if (colorBy === "lbi") {
    calcLBI(rootNode, nodes, false);
    nodes.forEach((d) => {
      d.coloring = d.LBI;
    });
  } else if (colorBy === "date") {
    nodes.forEach((d) => {
      d.coloring = d.num_date;
    });
  }
};

const stateAtPosition = (clade, gene, pos) => {
  if (typeof cladeToSeq[clade][gene][pos] === "undefined") {
    return cladeToSeq.root.gene.pos;
  } else {
    return cladeToSeq.clade.gene.pos;
  }
};





const tipStrokeColor = (d) => {
  const col = colorScale(d.coloring);
  return d3.rgb(col).toString();
};

const tipFillColor = (d) => {
  const col = colorScale(d.coloring);
  return d3.rgb(col).brighter([0.65]).toString();
};

d3.selectAll(".tip")
  .attr("r", tipRadius)
  .style("visibility", tipVisibility)
  .style("fill", tipFillColor)
  .style("stroke", tipStrokeColor);

// if (typeof tree_legend !== undefined) {
//   removeLegend();
// }
// tree_legend = makeLegend();
//
// d3.selectAll(".serum")
//   .style("visibility", serumVisibility);
//
// treeplot.selectAll(".link")
//   .style("stroke", branchStrokeColor);
// const branchStrokeColor = (d) => {
//
//   let col;
//
//   if (colorBy === "region" || colorBy === "date") {
//     col = "#AAA";
//   } else if (typeof d.target.coloring !== "undefined") {
//     col = colorScale(d.target.coloring);
//   } else {
//     col = "#AAA";
//   }
//
//   const modCol = d3.interpolateRgb(col, "#BBB")(0.6);
//
//   return d3.rgb(modCol).toString();
// };
//
// const contains = (arr, obj) => {
//   for (let i = 0; i < arr.length; i++) {
//     if (arr[i] === obj) { return true; }
//   }
// };
//
// const parse_gt_string = (gt) => {
//   const mutations = [];
//   gt.split(",").map((d) => {
//     const tmp = d.split(/[\s//]/); //FIXME: make more inclusive
//     let region;
//     const positions = [];
//     for (let i = 0; i < tmp.length; i++) {
//       if (contains(["EU", "NA", "AS", "OC"], tmp[i])) {
//         region = tmp[i];
//       } else if (tmp[i].length > 0) {
//         positions.push(tmp[i]);
//       }
//     }
//     if (typeof region === "undefined") {
//       region = "global";
//     }
//     // sort if this is a multi mutation genotype
//     if (positions.length > 1) {
//       positions.sort((a, b) => {
//         return parseInt(a.substring(0, a.length - 1)) - parseInt(b.substring(0, b.length - 1));
//       });
//     }
//     mutations.push([region, positions.join("/")]);
//   });
//   return mutations;
// };
//
// const colorByGenotype = () => {
//   var positions_string = document.getElementById("gt-color").value.split(",");
//   var positions_list = []
//   positions_string.map((d) => {
//     let pos_fields = d.split(":");
//     let val;
//     let gene;
//     if (pos_fields.length === 1){
//       val = parseInt(pos_fields[0]) - 1;
//       gene = default_gene;
//     } else if (pos_fields.length === 2){
//       val = parseInt(pos_fields[1]) - 1;
//       gene = pos_fields[0].replace(" ","");
//     } else {
//       val = parseInt("NaN");
//     }
//     if ((!isNaN(val)) && (typeof cladeToSeq.root.gene !== "undefined")) {
//       if (val < cladeToSeq.root.gene.length) {
//         positions_list.push([gene, val]);
//       }
//     }
//   });
//
//   if (positions_list.length > 0) {
//     colorBy = "genotype";
//     colorByGenotypePosition(positions_list);
//   } else {
//     d3.select("#coloring").each(colorByTrait);
//     gt = parse_gt_string(freqdefault);
//     if (plot_frequencies) {
//       make_gt_chart(gt);
//       document.getElementById("gtspec").value = freqdefault;
//     }
//   }
// };
//
// const colorByGenotypePosition = (positions) => {
//   const gts = nodes.map((d) => {
//     const tmp = [];
//     for (let i = 0; i < positions.length; i++) {
//       tmp[tmp.length] = positions[i][0] + ":" +
//       (positions[i][1] + 1) + stateAtPosition(d.clade, positions[i][0], positions[i][1]);
//     }
//     d.coloring = tmp.join("/");
//     return d.coloring;
//   });
//
//   const unique_gts = d3.set(gts).values();
//   const gt_counts = {};
//
//   for (let i = 0; i < unique_gts.length; i++) {
//     gt_counts[unique_gts[i]] = 0;
//   }
//
//   gts.forEach((d) => {
//     gt_counts[d] += 1;
//   });
//
//   const filtered_gts = unique_gts.filter((d) => {
//     return gt_counts[d] >= 10;
//   });
//
//   filtered_gts.sort((a,b) => {
//     var res;
//     if (gt_counts[a] > gt_counts[b]) {
//       res = -1;
//     } else if (gt_counts[a] < gt_counts[b]) {
//       res = 1;
//     } else {
//       res = 0;
//     }
//     return res;
//   });
//
//   colorScale = d3.scale.ordinal()
//     .domain(filtered_gts)
//     .range(genotypeColors);
//
//   treeplot.selectAll(".link")
//     .style("stroke", branchStrokeColor);
//   treeplot.selectAll(".tip")
//     .style("fill", tipFillColor)
//     .style("stroke", tipStrokeColor);
//
//   if (typeof tree_legend !== "undefined") {
//     removeLegend();
//   }
//
//   tree_legend = makeLegend();
//
//   if ((positions.length === 1) && (filtered_gts.length > 1)) {
//     var tmp_gts=[];
//     for (var ii = 0; ii < filtered_gts.length; ii += 1) {
//       tmp_gts.push(["global", filtered_gts[ii]])
//     }
//
//     make_gt_chart(tmp_gts);
//
//     document.getElementById("gtspec").value = tmp_gts.map((d) => {
//       return d[1];
//     }).join(", ");
//   }
// };
//
// const newFocus = () => {
//   if (typeof focusNode === "undefined") {
//     let ntiters = 0;
//     let ntmp;
//     focusNode = sera[0];
//     for (let i = 0; i < sera.length; i++) {
//       ntmp = Object.keys(sera[i].mean_HI_titers).length;
//       if (ntmp > ntiters) {
//         ntiters = ntmp;
//         focusNode = sera[i];
//       }
//     }
//   }
//   // add checkboxes to include/exclude sera
//   const seraDiv = document.getElementById("sera");
//   let htmlStr = "";
//   activeSera = {};
//
//   for (const serum in focusNode.potency_mut) {
//     const serumID = serum.split("/").join("");
//     htmlStr += '<input type="checkbox" id="' + serumID + '" name="' + serum + '" checked="checked"> ' + serum +"<br>";
//     activeSera[serum] = true;
//   }
//
//   seraDiv.innerHTML = htmlStr;
//
//   for (const serum in focusNode.potency_mut) {
//     const serumID = serum.split("/").join("");
//     d3.select("#" + serumID)
//       .on("change", (elem) => {
//         for (var tmpserum in focusNode.potency_mut) {
//           const tmpserumID = tmpserum.split("/").join("");
//           activeSera[tmpserum] = document.getElementById(tmpserumID).checked;
//         }
//         colorByHIDistance()
//       });
//   }
//
//   colorByHIDistance();
// };
//
// const colorByHIDistance = () => {
//   correctVirus = document.getElementById("virus").checked;
//   correctPotency = document.getElementById("serum").checked;
//   const HIchoices = document.getElementsByName("HImodel");
//
//   for (let i = 0; i < HIchoices.length; i++) {
//     if (HIchoices[i].checked) {
//       HImodel = HIchoices[i].value;
//     }
//   }
//
//   colorBy = "HI_dist";
//
//   treeplot.selectAll(".serum")
//     .style("fill", (d) => {
//       if (d === focusNode) {
//         return "#FF3300";
//       } else {
//         return "#555555";
//       }
//     })
//     .style("font-size", (d) => {
//       if (d === focusNode) {
//         return "30px";
//       } else {
//         return "12px";
//       }
//     })
//     .text((d) => {
//       if (d === focusNode) {
//         return "\uf05b";
//       } else {
//         return serumSymbol;
//       }
//     });
//
//   calcHImeasured(focusNode, rootNode);
//   calcHImutations(focusNode, rootNode);
//   calcHItree(focusNode, rootNode);
//
//   colorScale = HIColorScale;
//
//   if (HImodel === "mutation") {
//     nodes.map((d) => { d.coloring = d.HI_dist_mut;});
//   } else if (HImodel === "tree") {
//     nodes.map((d) => { d.coloring = d.HI_dist_tree;});
//   } else {
//     nodes.map((d) => { d.coloring = d.HI_dist_meas;});
//   }
//
//   treeplot.selectAll(".link")
//   .style("stroke", branchStrokeColor);
//
//   treeplot.selectAll(".tip")
//   .style("visibility", tipVisibility)
//   .style("fill", tipFillColor)
//   .style("stroke", tipStrokeColor);
//
//   if (typeof tree_legend != undefined){
//     removeLegend();
//   }
//   tree_legend = makeLegend();
// };
//
// d3.select("#coloring")
//   .style("cursor", "pointer")
//   .on("change", colorByTrait);
//
//
// let genotypeColoringEvent;
//
// d3.select("#gt-color")
//   .on("keyup", () => {
//     if (typeof genotypeColoringEvent !== "undefined") {
//       window.clearTimeout(genotypeColoringEvent);
//     }
//     genotypeColoringEvent = window.setTimeout(colorByGenotype, 200);
//   });
