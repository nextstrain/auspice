/* was globals */

export const vaccineChoice = {};
export const reference_viruses = {};

var vaccineStrains = Object.keys(vaccineChoice);

const path = "/data/";
const tip_labels = true;

let cladeToSeq = {};
let globalDate;

if (typeof globalDate === "undefined") {
  globalDate = new Date();
}

// let width, height, nodes, tips, rootNode, links, vaccines, sera;

let nDisplayTips;
let displayRoot;
let freqdefault;
let freq_ii;

if (document.getElementById("gtspec") !== null) {
  freqdefault = document.getElementById("gtspec").value;
} else {
  freqdefault = "";
}

const treePlotHeight = (width) => {
  return 400 + 0.30 * width;
};

let containerWidth = parseInt(d3.select(".treeplot-container").style("width"), 10);
let treeWidth = containerWidth;
let treeHeight = treePlotHeight(treeWidth);
let tree = d3.layout.tree()
  .size([treeHeight, treeWidth]);


const treeplot = d3.select("#treeplot")
  .attr("width", treeWidth)
  .attr("height", treeHeight);



/*
  there is a bypass in the tree component - this is hardcoded to region
*/
let colorBy = document.getElementById("coloring").value;
/*
  end bypass
*/

const serumSymbol = "\uf0fe";



/* time_step and freq_ii was in tree init */
let time_step;
if (typeof rootNode.pivots !== "undefined") {
  time_step = rootNode.pivots[1] - rootNode.pivots[0];
} else {
  time_step = 1.0 / 12;
}
//setting index of frequency trajectory to use for calculating frequency change
/* bug upper scope def freq_ii */
let freq_ii = 1;
if (typeof rootNode.pivots !== "undefined") {
  if (typeof rootNode.pivots.length !== "undefined") {
    freq_ii = rootNode.pivots.length - 1;
  }
}
nDisplayTips = displayRoot.fullTipCount;

/*********************************
**********************************
**********************************
**********************************
** Tree
**********************************
**********************************
**********************************
*********************************/



const left_margin = 10;
let right_margin = 10;
const bottom_margin = 10;

const branchLabelVisFraction = 0.05;
let top_margin = 35;
if ((typeof branchLabels !== "undefined")&&(branchLabels)) {
  top_margin += 5;
}

const initDateColorDomain = (intAttributes) => {
  const numDateValues = tips.map((d) => {return d.num_date;});
  const maxDate = d3.max(numDateValues.filter((d) => {return d !== "undefined";}));
  let time_back = 1.0;
  if (typeof time_window !== "undefined") {
    time_back = time_window;
  }
  if (typeof fullDataTimeWindow !== "undefined") {
    time_back = fullDataTimeWindow;
  }
  if (time_back > 1) {
    dateColorDomain = genericDomain.map((d) => {
      return Math.round(10 * (maxDate - (1.0 - d) * time_back)) / 10;
    });
  } else {
    dateColorDomain = genericDomain.map((d) => {
      return Math.round(100 * (maxDate - (1.0 - d) * time_back)) / 100;
    });
  }

  dateColorScale.domain(dateColorDomain);

};

const initColorDomain = (attr, tmpCS) => {
  // only measure recent tips
  const numDateValues = tips.map((d) => {return d.num_date;});
  const maxDate = d3.max(numDateValues.filter((d) => {return d !== "undefined";}));
  let time_back = 1.0;
  if (typeof time_window !== "undefined") {
    time_back = time_window;
  }
  if (typeof fullDataTimeWindow !== "undefined") {
    time_back = fullDataTimeWindow;
  }
  const minimum_date = maxDate - time_back;

  // find attribute values
  const vals = [];
  for (let i = 0; i < tips.length; i++) {
    const tip = tips[i];
    if (tip.num_date > minimum_date && tip[attr] !== "undefined") {
      vals.push(tip[attr]);
    }
  }
//	var vals = tips.map(function(d) {return d[attr];});
  // var minval = Math.floor(d3.min(vals)); /* bug duplicate def. */
  // var maxval = Math.ceil(d3.max(vals)); /* bug duplicate def. */
  const minval = Math.floor(2 * d3.min(vals)) / 2;
  const maxval = Math.ceil(2 * d3.max(vals)) / 2;
  const domain = [];
  if (maxval - minval < 5) {
    for (let i = minval; i <= maxval; i += 0.5) { domain.push(i);}
  } else if (maxval - minval < 10) {
    for (let i = minval; i <= maxval; i += 1) { domain.push(i); }
  } else if (maxval - minval < 20) {
    for (let i = minval; i <= maxval; i += 2) { domain.push(i); }
  } else {
    for (let i = minval; i <= maxval; i += 3) { domain.push(i); }
  }
  const rangeIndex = domain.length;
  tmpCS.range(colors[rangeIndex]);
  tmpCS.domain(domain);
};

const updateColorDomains = (num_date) => {
  dateColorDomain = genericDomain.map((d) => {
    return Math.round(10 * (num_date - time_window * (1.0 - d))) / 10;
  });
  dateColorScale.domain(dateColorDomain);
};

const serumVisibility = () => {
  return (colorBy === "HI_dist") ? "visible" : "hidden";
};

const tipVisibility = (d) => {
  if ((d.diff < 0 || d.diff > time_window) & (date_select === true)) {
    return "hidden";
  }
  for (const k in restrictTo) {
    if (d[k] !== restrictTo[k] && restrictTo[k] !== "all") {
      return "hidden";
    }
  }
  if ((colorBy === "HI_dist") && (HImodel === "measured") && (d.HI_dist_meas === "NaN")) {
    return "hidden";
  }
  return "visible";
};

const branchPoints = (d) => {
  const mod = 0.5 * freqScale(d.target.frequency) - freqScale(0);
  return (d.source.x - mod).toString() + "," + d.source.y.toString() + " "
    + (d.source.x - mod).toString() + "," + d.target.y.toString() + " "
    + (d.target.x).toString() + "," + d.target.y.toString();
};

const branchStrokeWidth = (d) => {
  return freqScale(d.target.frequency);
};

const branchLabelText = (d) => {
  let tmp_str = "";
  if (branchLabels && mutType === "aa") {
    for (const tmp_gene in d.aa_muts) {
      if (d.aa_muts[tmp_gene].length) {
        if (tmp_str !== "") {
          tmp_str += ", ";
        }
        tmp_str += tmp_gene + ":" + d.aa_muts[tmp_gene].replace(/,/g, ", ");
      }
    }
    if (tmp_str.length > 50) {
      tmp_str = tmp_str.substring(0, 45) + "...";
    }
  }
  if (branchLabels && mutType === "nuc") {
    if (d.nuc_muts.length) {
      if (tmp_str !== "") {
        tmp_str += ", ";
      }
      tmp_str += d.nuc_muts.replace(/,/g, ", ");
    }
    if (tmp_str.length > 50) {
      tmp_str = tmp_str.substring(0, 45) + "...";
    }
  }
  return tmp_str;
};

const tipLabelText = (d) => {
  if (d.strain.length > 32) {
    return d.strain.substring(0, 30) + "...";
  } else {
    return d.strain;
  }
};

const branchLabelSize = (d) => {
  const n = nDisplayTips;
  if (d.fullTipCount > n * branchLabelVisFraction) {
    return "10px";
  } else {
    return "0px";
  }
};

const tipLabelSize = (d) => {
  if (tipVisibility(d) !== "visible") {
    return 0;
  }
  const n = nDisplayTips;
  if (n < 25) {
    return 16;
  } else if (n < 50) {
    return 12;
  } else if (n < 75) {
    return 8;
  } else {
    return 0;
  }
};

const tipLabelWidth = (d) => {
  return tipLabelText(d).length * tipLabelSize(d) * 0.5;
};

tree_legend = makeLegend();

// d3.json(path + file_prefix + "tree.json", function(error, root) {

nodes = tree.nodes(root);
links = tree.links(nodes);
let tree_legend;
rootNode = nodes[0];
displayRoot = rootNode;
tips = gatherTips(rootNode, []);
vaccines = getVaccines(tips);
if (typeof getSera == "function") {
  sera = getSera(tips);
} else {
  sera = [];
}

initDateColorDomain();
// initHIColorDomain();
if (typeof rootNode.cHI !== "undefined") { initColorDomain("cHI", cHIColorScale); }
if (typeof rootNode.ep !== "undefined") { initColorDomain("ep", epitopeColorScale); }
if (typeof rootNode.ne !== "undefined") { initColorDomain("ne", nonepitopeColorScale); }
if (typeof rootNode.rb !== "undefined") { initColorDomain("rb", receptorBindingColorScale); }
date_init();
tree_init();



let clade_freq_event;





const serumWidth = 10;



const restrictToFunc = (rt) => {
  restrictTo[rt] = document.getElementById(rt).value;
  d3.selectAll(".tip")
    .style("visibility", tipVisibility);
  dragend();
};

for (const rt in restrictTo) {
  const tmp = document.getElementById(rt);
  if (tmp !== null) {
    restrictTo[rt] = tmp.value;
  } else {restrictTo[rt] = "all";}
  d3.select("#" + rt)
    .style("cursor", "pointer")
    .on("change", ((restrictor) => {
      return () => {
        return restrictToFunc(restrictor);
      };
    })(rt));
}


branchLabels = document.getElementById("branchlabels");
addBranchLabels();

/* bug duplicate definition */
var searchEvent;

const onSelect = (tip) => {
  const strainName = (tip.strain).replace(/\//g, "");
  d3.select("#" + strainName)
    .call((d) => {
      // virusTooltip.show(tip, d[0][0]);
    })
    .attr("r", (d) => { return tipRadius(d) * 1.7; })
    .style("fill", (d) => {
      searchEvent = setTimeout(() => {
        d3.select("#" + strainName)
          .attr("r", (dd) => {return tipRadius(dd);})
          .style("fill", tipFillColor);
      }, 5000, d);
      return d3.rgb(tipFillColor(d)).brighter();
    });
};

d3.select(window).on("resize", resize);

d3.select("#reset")
  .on("click", resetLayout);

d3.select("#treeplot")
  .on("dblclick", resetLayout);


const mc = autocomplete(document.getElementById("straininput"))
  .keys(tips)
  .dataField("strain")
  .placeHolder("search strains...")
  .width(800)
  .height(500)
  .onSelected(highlightStrainSearch)
  .render();


// add clade labels
const clades = rootNode.clade_annotations;
if (typeof clades !== "undefined") {
  const clade_annotations = treeplot.selectAll(".annotation")
    .data(clades)
    .enter()
    .append("text")
    .attr("class", "annotation")
    .style("text-anchor", "end")
    .style("visibility", "visible")
    .text((d) => {
      return d[0];
    });
}

resize();
