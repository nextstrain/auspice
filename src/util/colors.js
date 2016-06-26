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

const colors = [
  [],
  ["#8EBC66"],
  ["#4D92BF", "#E4662E"],
  ["#4B8FC1", "#AABD52", "#E3612D"],
  ["#4A8BC3", "#82BA72", "#CFB541", "#E25B2C"],
  ["#4988C5", "#6EB389", "#AABD52", "#DEA73C", "#E2562B"],
  ["#4785C7", "#64AD99", "#90BC65", "#C3BA46", "#E39A39", "#E1512A"],
  ["#4682C9", "#5CA7A4", "#7FB975", "#AABD52", "#D2B340", "#E68F36", "#E04C29"],
  ["#457FCB", "#57A1AD", "#73B584", "#96BD5F", "#BDBB49", "#DBAC3D", "#E68334", "#DF4628"],
  ["#447BCD", "#539CB4", "#6AB090", "#88BB6C", "#AABD52", "#CBB842", "#E0A23A", "#E67A32", "#DF4127"],
  ["#4377CD", "#5097BA", "#63AC9A", "#7CB879", "#9ABE5C", "#B9BC4A", "#D4B13F", "#E49938", "#E67030", "#DE3C26"],
  ["#4273CE", "#4D93BE", "#5DA8A3", "#73B584", "#8DBC68", "#AABD52", "#C6B945", "#DBAC3D", "#E69036", "#E4672E", "#DD3725"],
  ["#426FCE", "#4B8DC2", "#59A3AA", "#6BB18D", "#82BA71", "#9CBE5B", "#B7BD4B", "#CFB541", "#DFA43B", "#E68735", "#E35E2D", "#DD3124"]
];

const genotypeColors = [
  "#60AA9E",
  "#D9AD3D",
  "#5097BA",
  "#E67030",
  "#8EBC66",
  "#E59637",
  "#AABD52",
  "#DF4327",
  "#C4B945",
  "#75B681"
];

const epitopeColorScale = d3.scale.linear().clamp([true])
  .domain(epiColorDomain)
  .range(colors[10]);

const nonepitopeColorScale = d3.scale.linear().clamp([true])
  .domain(nonEpiColorDomain)
  .range(colors[10]);

const receptorBindingColorScale = d3.scale.linear().clamp([true])
  .domain(rbsColorDomain)
  .range(colors[4]);

const lbiColorScale = d3.scale.linear()
  .domain([0.0, 0.02, 0.04, 0.07, 0.1, 0.2, 0.4, 0.7, 0.9, 1.0])
  .range(colors[10]);

const dfreqColorScale = d3.scale.linear()
  .domain(dfreqColorDomain)
  .range(colors[10]);

const HIColorScale = d3.scale.linear()
  .domain(HIColorDomain)
  .range(colors[10]);

const cHIColorScale = d3.scale.linear()
  .domain(HIColorDomain)
  .range(colors[10]);

const dHIColorScale = d3.scale.linear().clamp([true])
  .domain(genericDomain.map((d) => { return 1.5 * d ;}))
  .range(colors[10]);

const regionColorScale = d3.scale.ordinal()
  .domain(regions.map((d) => { return d[0]; }))
  .range(regions.map((d) => { return d[1]; }));

const dateColorScale = d3.scale.linear().clamp([true])
  .domain(dateColorDomain)
  .range(colors[10]);

const fitnessColorScale = d3.scale.linear().clamp([true])
  .domain(fitnessColorDomain)
  .range(colors[10]);

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

const colorByTrait = () => {

  colorBy = document.getElementById("coloring").value;

  if (colorBy === "--") {
    document.getElementById("coloring").value = "ep";
    colorBy = document.getElementById("coloring").value;
  }

  d3.selectAll(".serum")
    .style("visibility", serumVisibility);

  let vis = (colorBy === "HI_dist") ? "block" : "none";

  if (document.getElementById("HIcontrols") !== null) {
    document.getElementById("HIcontrols").style.display = vis;
  }

  if (colorBy === "ep") {
    colorScale = epitopeColorScale;
    nodes.map((d) => { d.coloring = d.ep; });
  } else if (colorBy === "ne") {
    colorScale = nonepitopeColorScale;
    nodes.map((d) => { d.coloring = d.ne; });
  } else if (colorBy === "rb") {
    colorScale = receptorBindingColorScale;
    nodes.map((d) => { d.coloring = d.rb; });
  } else if (colorBy === "lbi") {
    colorScale = lbiColorScale;
    adjust_coloring_by_date();
  } else if (colorBy === "dfreq") {
    colorScale = dfreqColorScale;
    nodes.map((d) => { d.coloring = d.dfreq;});
  } else if (colorBy === "region") {
    colorScale = regionColorScale;
    nodes.map((d) => { d.coloring = d.region; });
  } else if (colorBy === "cHI") {
    colorScale = cHIColorScale;
    nodes.map((d) => { d.coloring = d.cHI; });
  } else if (colorBy === "HI_dist") {
    newFocus();
    return;
  } else if (colorBy === "date") {
    colorScale = dateColorScale;
    nodes.map((d) => { d.coloring = d.num_date; });
  } else if (colorBy === "fitness") {
    colorScale = fitnessColorScale;
    nodes.map((d) => { d.coloring = d.fitness; });
  }

  treeplot.selectAll(".link")
    .style("stroke", branchStrokeColor);

  d3.selectAll(".tip")
    .attr("r", tipRadius)
    .style("visibility", tipVisibility)
    .style("fill", tipFillColor)
    .style("stroke", tipStrokeColor);

  if (typeof tree_legend !== undefined) {
    removeLegend();
  }
  tree_legend = makeLegend();
};

const tipStrokeColor = (d) => {
  const col = colorScale(d.coloring);
  return d3.rgb(col).toString();
};

const tipFillColor = (d) => {
  const col = colorScale(d.coloring);
  return d3.rgb(col).brighter([0.65]).toString();
};

const branchStrokeColor = (d) => {

  let col;

  if (colorBy === "region" || colorBy === "date") {
    col = "#AAA";
  } else if (typeof d.target.coloring !== "undefined") {
    col = colorScale(d.target.coloring);
  } else {
    col = "#AAA";
  }

  const modCol = d3.interpolateRgb(col, "#BBB")(0.6);

  return d3.rgb(modCol).toString();
};

const contains = (arr, obj) => {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === obj) { return true; }
  }
};

const parse_gt_string = (gt) => {
  const mutations = [];
  gt.split(",").map((d) => {
    const tmp = d.split(/[\s//]/); //FIXME: make more inclusive
    let region;
    const positions = [];
    for (let i = 0; i < tmp.length; i++) {
      if (contains(["EU", "NA", "AS", "OC"], tmp[i])) {
        region = tmp[i];
      } else if (tmp[i].length > 0) {
        positions.push(tmp[i]);
      }
    }
    if (typeof region === "undefined") {
      region = "global";
    }
    // sort if this is a multi mutation genotype
    if (positions.length > 1) {
      positions.sort((a, b) => {
        return parseInt(a.substring(0, a.length - 1)) - parseInt(b.substring(0, b.length - 1));
      });
    }
    mutations.push([region, positions.join("/")]);
  });
  return mutations;
};

const colorByGenotype = () => {
  var positions_string = document.getElementById("gt-color").value.split(",");
  var positions_list = []
  positions_string.map((d) => {
    let pos_fields = d.split(":");
    let val;
    let gene;
    if (pos_fields.length === 1){
      val = parseInt(pos_fields[0]) - 1;
      gene = default_gene;
    } else if (pos_fields.length === 2){
      val = parseInt(pos_fields[1]) - 1;
      gene = pos_fields[0].replace(" ","");
    } else {
      val = parseInt("NaN");
    }
    if ((!isNaN(val)) && (typeof cladeToSeq.root.gene !== "undefined")) {
      if (val < cladeToSeq.root.gene.length) {
        positions_list.push([gene, val]);
      }
    }
  });

  if (positions_list.length > 0) {
    colorBy = "genotype";
    colorByGenotypePosition(positions_list);
  } else {
    d3.select("#coloring").each(colorByTrait);
    gt = parse_gt_string(freqdefault);
    if (plot_frequencies) {
      make_gt_chart(gt);
      document.getElementById("gtspec").value = freqdefault;
    }
  }
};

const colorByGenotypePosition = (positions) => {
  const gts = nodes.map((d) => {
    const tmp = [];
    for (let i = 0; i < positions.length; i++) {
      tmp[tmp.length] = positions[i][0] + ":" +
      (positions[i][1] + 1) + stateAtPosition(d.clade, positions[i][0], positions[i][1]);
    }
    d.coloring = tmp.join("/");
    return d.coloring;
  });

  const unique_gts = d3.set(gts).values();
  const gt_counts = {};

  for (let i = 0; i < unique_gts.length; i++) {
    gt_counts[unique_gts[i]] = 0;
  }

  gts.forEach((d) => {
    gt_counts[d] += 1;
  });

  const filtered_gts = unique_gts.filter((d) => {
    return gt_counts[d] >= 10;
  });

  filtered_gts.sort((a,b) => {
    var res;
    if (gt_counts[a] > gt_counts[b]) {
      res = -1;
    } else if (gt_counts[a] < gt_counts[b]) {
      res = 1;
    } else {
      res = 0;
    }
    return res;
  });

  colorScale = d3.scale.ordinal()
    .domain(filtered_gts)
    .range(genotypeColors);

  treeplot.selectAll(".link")
    .style("stroke", branchStrokeColor);
  treeplot.selectAll(".tip")
    .style("fill", tipFillColor)
    .style("stroke", tipStrokeColor);

  if (typeof tree_legend !== "undefined") {
    removeLegend();
  }

  tree_legend = makeLegend();

  if ((positions.length === 1) && (filtered_gts.length > 1)) {
    var tmp_gts=[];
    for (var ii = 0; ii < filtered_gts.length; ii += 1) {
      tmp_gts.push(["global", filtered_gts[ii]])
    }

    make_gt_chart(tmp_gts);

    document.getElementById("gtspec").value = tmp_gts.map((d) => {
      return d[1];
    }).join(", ");
  }
};

const newFocus = () => {
  if (typeof focusNode === "undefined") {
    let ntiters = 0;
    let ntmp;
    focusNode = sera[0];
    for (let i = 0; i < sera.length; i++) {
      ntmp = Object.keys(sera[i].mean_HI_titers).length;
      if (ntmp > ntiters) {
        ntiters = ntmp;
        focusNode = sera[i];
      }
    }
  }
  // add checkboxes to include/exclude sera
  const seraDiv = document.getElementById("sera");
  let htmlStr = "";
  activeSera = {};

  for (const serum in focusNode.potency_mut) {
    const serumID = serum.split("/").join("");
    htmlStr += '<input type="checkbox" id="' + serumID + '" name="' + serum + '" checked="checked"> ' + serum +"<br>";
    activeSera[serum] = true;
  }

  seraDiv.innerHTML = htmlStr;

  for (const serum in focusNode.potency_mut) {
    const serumID = serum.split("/").join("");
    d3.select("#" + serumID)
      .on("change", (elem) => {
        for (var tmpserum in focusNode.potency_mut) {
          const tmpserumID = tmpserum.split("/").join("");
          activeSera[tmpserum] = document.getElementById(tmpserumID).checked;
        }
        colorByHIDistance()
      });
  }

  colorByHIDistance();
};

const colorByHIDistance = () => {
  correctVirus = document.getElementById("virus").checked;
  correctPotency = document.getElementById("serum").checked;
  const HIchoices = document.getElementsByName("HImodel");

  for (let i = 0; i < HIchoices.length; i++) {
    if (HIchoices[i].checked) {
      HImodel = HIchoices[i].value;
    }
  }

  colorBy = "HI_dist";

  treeplot.selectAll(".serum")
    .style("fill", (d) => {
      if (d === focusNode) {
        return "#FF3300";
      } else {
        return "#555555";
      }
    })
    .style("font-size", (d) => {
      if (d === focusNode) {
        return "30px";
      } else {
        return "12px";
      }
    })
    .text((d) => {
      if (d === focusNode) {
        return "\uf05b";
      } else {
        return serumSymbol;
      }
    });

  calcHImeasured(focusNode, rootNode);
  calcHImutations(focusNode, rootNode);
  calcHItree(focusNode, rootNode);

  colorScale = HIColorScale;

  if (HImodel === "mutation") {
    nodes.map((d) => { d.coloring = d.HI_dist_mut;});
  } else if (HImodel === "tree") {
    nodes.map((d) => { d.coloring = d.HI_dist_tree;});
  } else {
    nodes.map((d) => { d.coloring = d.HI_dist_meas;});
  }

  treeplot.selectAll(".link")
  .style("stroke", branchStrokeColor);

  treeplot.selectAll(".tip")
  .style("visibility", tipVisibility)
  .style("fill", tipFillColor)
  .style("stroke", tipStrokeColor);

  if (typeof tree_legend != undefined){
    removeLegend();
  }
  tree_legend = makeLegend();
};

d3.select("#coloring")
  .style("cursor", "pointer")
  .on("change", colorByTrait);


let genotypeColoringEvent;

d3.select("#gt-color")
  .on("keyup", () => {
    if (typeof genotypeColoringEvent !== "undefined") {
      window.clearTimeout(genotypeColoringEvent);
    }
    genotypeColoringEvent = window.setTimeout(colorByGenotype, 200);
  });
