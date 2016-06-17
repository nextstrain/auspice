export const visualization = (root, sequences, frequencies, vaccineStrains) => {

  /*********************************
  **********************************
  **********************************
  **********************************
  ** GLOBALS
  **********************************
  **********************************
  **********************************
  *********************************/

  /*

  	this is a bypass to get Zika working now (in part because it loads quickly for dev).
  	we'll load and pass in vaccineStrains metadata for H3N2 & others with metadata and sera

  */
  const d3 = window.d3;
  const document = window.document;

  const date_select = true;
  let file_prefix = "Zika_";
  let	vaccineChoice = {};
  var vaccineStrains = Object.keys(vaccineChoice);
  let reference_viruses = {};
  let branchLabels = false;
  const restrictTo = {"region": "all"};
  let time_window = 3.0;
  const fullDataTimeWindow = 1.5;
  let time_ticks = [2013.0, 2013.5, 2014.0, 2014.5, 2015.0, 2015.5, 2016.0];
  let dfreq_dn = 2;
  let LBItime_window = 0.5;
  const LBItau = 0.0005;
  var regions = [
    ["french_polynesia", "#3E58CF"],
    ["american_samoa", "#426FCE"],
    ["china", "#4784C8"],
    ["brazil", "#72B485"],
    ["colombia", "#81BA72"],
    ["venezuela", "#92BC63"],
    ["suriname", "#A4BE56"],
    ["guatemala", "#B6BD4C"],
    ["haiti", "#C6B944"],
    ["martinique", "#D4B13F"],
    ["puerto_rico", "#DEA63B"],
    ["mexico", "#E59637"],
    ["dominican_republic", "#E67E33"],
    ["panama", "#E4632E"]
  ];

  var mutType = 'nuc';
  var default_gene = 'nuc';
  var plot_frequencies = false;
  /*

  	end bypass

  */

  const genericDomain = [
    0,
    0.111,
    0.222,
    0.333,
    0.444,
    0.555,
    0.666,
    0.777,
    0.888,
    1.0
  ];

  const path = "/data/";
  const tip_labels = true;

  let cladeToSeq = {};
  let globalDate;

  if (typeof globalDate === "undefined") {
    globalDate = new Date();
  }

  let width, height, nodes, tips, rootNode, links, vaccines, sera;

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

  const legend = d3.select("#legend")
    .attr("width", 280)
    .attr("height", 100);

  /*
  	there is a bypass in the tree component - this is hardcoded to region
  */
  let colorBy = document.getElementById("coloring").value;
  /*
  	end bypass
  */

  let colorScale;
  const serumSymbol = "\uf0fe";
  const epiColorDomain = genericDomain;
  const nonEpiColorDomain = genericDomain;
  const rbsColorDomain = genericDomain;
  let dateColorDomain = genericDomain;
  const HIColorDomain = genericDomain.map((d) => {
    return Math.round(100 * (d * 3.6)) / 100;
  });
  const dfreqColorDomain = genericDomain.map((d) => {
    return Math.round(100 * (0.2 + d * 1.8)) / 100;
  });
  const fitnessColorDomain = genericDomain.map((d) => {
    return Math.round(100 * ((d - 0.5) * 16.0)) / 100;
  });
  let time_step;


  // d3.json(path + file_prefix + "meta.json", function(error, json) {
  //     if (error) return console.warn(error);
      // d3.select("#updated").text(json['updated']);
      // commit_id = json['commit'];
      // short_id = commit_id.substring(0, 6);
      // d3.select("#commit")
      //     .append("a")
      //     .attr("href", "http://github.com/blab/nextflu/commit/" + commit_id)
      //     .text(short_id);

  // });

  /*********************************
  **********************************
  **********************************
  **********************************
  ** HI
  **********************************
  **********************************
  **********************************
  *********************************/

  let HImodel = "measured";
  let correctVirus = true;
  let correctPotency = true;
  let focusNode;
  let activeSera = {};
  // /**
  //  * for each node, accumulate HI difference along branches
  // **/
  // function calcHIsubclade(node){
  // 	node.HI_dist_tree = node.parent.HI_dist_tree+node.dHI;
  // 	if (typeof node.children != "undefined") {
  // 		for (var i=0; i<node.children.length; i++) {
  // 		calcHIsubclade(node.children[i]);
  // 		}
  // 	}else{
  // 		if (typeof node.avidity != "undefined" && correctVirus==false){
  // 			node.HI_dist_tree+=node.avidity;
  // 		}
  // 	}
  // };
  //
  // function calcHItree(node, rootNode){
  // 	if (correctPotency){
  // 		node.HI_dist_tree = 0;
  // 	}else{
  // 		node.HI_dist_tree=node.mean_potency_tree;
  // 	}
  // 	if (typeof node.children != "undefined") {
  // 		for (var i=0; i<node.children.length; i++) {
  // 		calcHIsubclade(node.children[i]);
  // 		}
  // 	}
  // 	var tmp_node = node;
  // 	var pnode = tmp_node.parent;
  // 	while (tmp_node.clade != rootNode.clade){
  // 		pnode.HI_dist_tree=tmp_node.HI_dist_tree + tmp_node.dHI;
  // 		if (typeof pnode.children != "undefined") {
  // 			for (var i=0; i<pnode.children.length; i++) {
  // 				if (tmp_node.clade!=pnode.children[i].clade){
  // 					calcHIsubclade(pnode.children[i]);
  // 				}
  // 			}
  // 		}
  // 		tmp_node = pnode;
  // 		pnode = tmp_node.parent;
  // 	}
  // 	if (correctVirus==false){
  // 		node.HI_dist_tree += node.avidity_tree;
  // 	}
  // };
  //
  // function calcHImeasured(node, rootNode){
  // 	console.log(node.strain+ ', mean_potency: '+node.mean_potency_mut);
  // 	console.log("correcting for virus effect: "+correctVirus);
  // 	console.log("correction for serum effect: "+correctPotency);
  // 	for (var i=0; i<tips.length; i+=1){
  // 		d = tips[i];
  // 		if (typeof(node.HI_titers[d.clade])!="undefined"){
  // 			var tmp_HI=0;
  // 			var serum_count=0;
  // 			for (var tmp_serum in node.HI_titers[d.clade]){
  // 				if (activeSera[tmp_serum]){
  // 					if (correctPotency&&(d.strain!=focusNode.strain)){
  // 						tmp_HI += node.HI_titers[d.clade][tmp_serum]-node.potency_mut[tmp_serum];
  // 					}else{
  // 						tmp_HI += node.HI_titers[d.clade][tmp_serum];
  // 					}
  // 					serum_count+=1;
  // 				}
  // 			}
  // 			if (serum_count){
  // 				d.HI_dist_meas = tmp_HI/serum_count
  // 				if (correctVirus){
  // 					d.HI_dist_meas -= d.avidity_mut;
  // 				}
  // 			}else{
  // 				d.HI_dist_meas = 'NaN';
  // 			}
  // 		}else{
  // 			d.HI_dist_meas = 'NaN';
  // 		}
  // 	}
  // };
  //
  // function get_mutations(node1, node2){
  // 	var gt1, gt2,muts=[];
  // 	for (var gene in cladeToSeq[node1.clade]){
  // 		var gene_length = cladeToSeq["root"][gene].length;
  // 		if (gene!='nuc'){
  // 			for (var pos=0; pos<gene_length; pos+=1){
  // 				gt1 = stateAtPosition(node1.clade, gene, pos)
  // 				gt2 = stateAtPosition(node2.clade, gene, pos)
  // 				if (gt1!=gt2){
  // 					muts.push(gene+':'+gt1+(pos+1)+gt2);
  // 				}
  // 			}
  // 		}
  // 	}
  // 	return muts;
  // }
  //
  // function calcHImutations(node){
  // 	console.log(node.strain+ ', mean_potency:'+node.mean_potency_mut);
  // 	nodes.map(function(d){
  // 		var mutations = get_mutations(node, d);
  // 		if (correctPotency){
  // 			d.HI_dist_mut=0;
  // 		}else{
  // 			d.HI_dist_mut=node.mean_potency_mut;
  // 		}
  // 		for (var mi=0; mi<=mutations.length; mi++){
  // 			var mut = mutations[mi];
  // 			if ((typeof mut != "undefined")&&(typeof HI_model[mut]!="undefined")){
  // 				d.HI_dist_mut += HI_model[mut];
  // 			}
  // 		}
  // 		if ((correctVirus==false)&&(typeof d.avidity != "undefined")){
  // 			d.HI_dist_mut += d.avidity_mut;
  // 		}
  // 	});
  // };
  //
  // function getSera(tree_tips){
  // 	return tree_tips.filter(function (d){return d.serum;})
  // }

  // d3.select("#serum")
  // 	.on("change", colorByHIDistance);
  //
  // d3.select("#virus")
  // 	.on("change", colorByHIDistance);
  //
  // d3.select("#HImodel_measured")
  // 	.on("click", colorByHIDistance);
  // d3.select("#HImodel_mutation")
  // 	.on("click", colorByHIDistance);
  // d3.select("#HImodel_tree")
  // 	.on("click", colorByHIDistance);

  // var HI_model;
  // var structure_HI_mutations;
  // d3.json(path + file_prefix + "HI.json", function(error, json){
  // 	HI_model = json;
  // 	var positions = {};
  // 	var tmp;
  // 	for (var mut in HI_model){
  // 		tmp = mut.split(':')[1]
  // 		tmp = mut.split(':')[0]+':'+tmp.substring(1,tmp.length-1);
  // 		if (typeof positions[tmp] == "undefined"){
  // 			positions[tmp] = [HI_model[mut]];
  // 		}else{
  // 			positions[tmp].push(HI_model[mut]);
  // 		}
  // 	}
  // 	for (var mut in positions){
  // 		tmp = positions[mut];
  // 		var avg=0;
  // //		for (var i=0; i<tmp.length; i+=1){avg+=tmp[i];}
  // //		positions[mut] = avg/tmp.length;
  // 		positions[mut] = d3.max(tmp);
  // 	}
  // 	console.log(Object.keys(positions));
  // 	structure_HI_mutations = ""
  // 	for (var key in positions){
  // 		var gene = key.split(':')[0];
  // 		var pos = key.split(':')[1];
  // 		console.log(positions[key]);
  // 		var c = '[x'+dHIColorScale(positions[key]).substring(1,7).toUpperCase()+']';
  // 		var chain = (gene=='HA1')?'a':'b';
  // 		structure_HI_mutations += 'select '+pos+':'+chain+'; spacefill 200; color ' +c+';';//' '+pos+':c, '+pos+':e,';
  // 	}
  //
  // 	console.log(structure_HI_mutations);
  // 	d3.select('#structurebtn')
  // 		.on("click", function(d) {
  // 			make_structure();
  // 			document.getElementById("HA_struct").style.display='block';
  // 			document.getElementById("structurebtn").style.display='none';
  // 		});
  // });

  /*********************************
  **********************************
  **********************************
  **********************************
  ** Ordinal colormaps
  **********************************
  **********************************
  **********************************
  *********************************/

var regions = [
  ["Africa",  		"#5097BA"],
  ["SouthAmerica",  	"#60AA9E"],
  ["WestAsia",  		"#75B681"],
  ["Oceania",  		"#8EBC66"],
  ["Europe",  		"#AABD52"],
  ["JapanKorea",  	"#C4B945"],
  ["NorthAmerica",  	"#D9AD3D"],
  ["SoutheastAsia",  	"#E59637"],
  ["SouthAsia",  		"#E67030"],
  ["China",  			"#DF4327"]
];


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

  /*********************************
  **********************************
  **********************************
  **********************************
  ** Date
  **********************************
  **********************************
  **********************************
  *********************************/

  const ymd_format = d3.time.format("%Y-%m-%d");
  let dateValues;
  let earliestDate;
  let dateScale;
  let niceDateScale;
  let counterData;

  const adjust_freq_by_date = () => {
    calcTipCounts(rootNode);
    const tipCount = rootNode.tipCount;
    nDisplayTips = displayRoot.tipCount;
    nodes.forEach((d) => {
      d.frequency = (d.tipCount) / tipCount;
    });
  };

  var drag = d3.behavior.drag()
  .on("drag", dragged)
  .on("dragstart", () => {
    d3.selectAll(".date-input-text").style("fill", "#5DA8A3");
    d3.selectAll(".date-input-marker").style("fill", "#5DA8A3");
    d3.selectAll(".date-input-window").style("stroke", "#5DA8A3");
    d3.selectAll(".date-input-edge").style("stroke", "#5DA8A3");
  })
  .on("dragend", () => {
    d3.selectAll(".date-input-text").style("fill", "#CCC");
    d3.selectAll(".date-input-marker").style("fill", "#CCC");
    d3.selectAll(".date-input-window").style("stroke", "#CCC");
    d3.selectAll(".date-input-edge").style("stroke", "#CCC");
    dragend();
  });

  const dragMin = d3.behavior.drag()
  .on("drag", draggedMin)
  .on("dragstart", () => {
    d3.selectAll(".date-input-text").style("fill", "#5DA8A3");
    d3.selectAll(".date-input-marker").style("fill", "#5DA8A3");
    d3.selectAll(".date-input-window").style("stroke", "#5DA8A3");
    d3.selectAll(".date-input-edge").style("stroke", "#5DA8A3");
  })
  .on("dragend", () => {
    d3.selectAll(".date-input-text").style("fill", "#CCC");
    d3.selectAll(".date-input-marker").style("fill", "#CCC");
    d3.selectAll(".date-input-window").style("stroke", "#CCC");
    d3.selectAll(".date-input-edge").style("stroke", "#CCC");
    dragend();
  });


  const calcNodeAges = (tw) => {
    tips.forEach((d) => {
      const date = new Date(d.date.replace(/XX/g, "01"));
      const oneYear = 365.25 * 24 * 60 * 60 * 1000; // days*hours*minutes*seconds*milliseconds
      const diffYears = (globalDate.getTime() - date.getTime()) / oneYear;
      d.diff = diffYears;
      if (d.diff > 0 && d.diff < tw) {
        d.current = true;
      } else {
        d.current = false;
      }
      for (let k in restrictTo) {
        if (d[k] !== restrictTo[k] && restrictTo[k] !== "all") {
          d.current = false;
        }
      }
    });
  };

  function dragged(d) {

    d.date = dateScale.invert(d3.event.x);
    d.x = dateScale(d.date);
    const startDate = new Date(d.date);
    startDate.setDate(startDate.getDate() - (time_window * 365.25));
    d.x2 = dateScale(startDate);

    d3.selectAll(".date-input-text")
      .attr("dx", (dd) => {return 0.5 * dd.x;})
      .text((dd) => {
        const format = d3.time.format("%Y %b %-d");
        return format(dd.date);
      });
    d3.selectAll(".date-input-marker")
      .attr("cx", (dd) => {
        return dd.x;
      });
    d3.selectAll(".date-input-window")
      .attr("x1", (dd) => {return dd.x;})
      .attr("x2", (dd) => {return dd.x2;});
    d3.selectAll(".date-input-edge")
      .attr("x1", (dd) => {return dd.x2;})
      .attr("x2", (dd) => {return dd.x2;});

      globalDate = d.date;

      calcNodeAges(time_window);
  //	treeplot.selectAll(".link")
  //		.style("stroke", function(d){return "#ccc";})

  treeplot.selectAll(".tip")
      .style("visibility", tipVisibility);
  //		.style("fill", "#CCC")
  //		.style("stroke", "#AAA");

  treeplot.selectAll(".vaccine")
      .style("visibility", (dd) => {
        const date = new Date(dd.choice);
        const oneYear = 365.25 * 24 * 60 * 60 * 1000; // days*hours*minutes*seconds*milliseconds
        const diffYears = (globalDate.getTime() - date.getTime()) / oneYear;

        if (diffYears > 0) {
          return "visible";
        } else {
          return "hidden";
        }
      });

  }

  const draggedMin = (d) => {
    d.date = dateScale.invert(d3.event.x);
    d.x2 = dateScale(d.date);

    // days * hours * minutes * seconds * milliseconds
    const oneYear = 365.25 * 24 * 60 * 60 * 1000;
    time_window = (globalDate.getTime() - d.date.getTime()) / oneYear;

    d3.selectAll(".date-input-window")
      .attr("x2", (dd) => {return dd.x2;});
    d3.selectAll(".date-input-edge")
      .attr("x1", (dd) => {return dd.x2;})
      .attr("x2", (dd) => {return dd.x2;});

    calcNodeAges(time_window);

    treeplot.selectAll(".tip")
      .style("visibility", tipVisibility);

    treeplot.selectAll(".vaccine")
      .style("visibility", (dd) => {
        const date = new Date(dd.choice);

        const diffYears = (globalDate.getTime() - date.getTime()) / oneYear;

        if (diffYears > 0) {
          return "visible";
        } else {
          return "hidden";
        }
      });
  };

  const dragend = () => {
    const num_date = globalDate / 1000 / 3600 / 24 / 365.25 + 1970;
    //	updateColorDomains(num_date);
    //	initHIColorDomain();
    for (let ii = 0; ii < rootNode.pivots.length - 1; ii++) {
      if (rootNode.pivots[ii] < num_date && rootNode.pivots[ii + 1] >= num_date) {
        freq_ii = Math.max(dfreq_dn, ii + 1);
      }
    }

    calcNodeAges(time_window);
    adjust_coloring_by_date();
    adjust_freq_by_date();

    if (typeof calcDfreq === "function") {
      calcDfreq(rootNode, freq_ii);
    }

    if (colorBy === "genotype") {
      colorByGenotype();
    }

    if ((colorBy === "date")||(colorBy === "cHI")) {
      removeLegend();
      makeLegend();
    }

    treeplot.selectAll(".link")
      .transition().duration(500)
      .attr("points", branchPoints)
      .style("stroke-width", branchStrokeWidth)
      .style("stroke", branchStrokeColor);

    treeplot.selectAll(".tip")
      .transition().duration(500)
      .style("visibility", tipVisibility)
      .style("fill", tipFillColor)
      .style("stroke", tipStrokeColor);


    if ((typeof tip_labels !== "undefined") && (tip_labels)) {
      nDisplayTips = displayRoot.fullTipCount;
      treeplot.selectAll(".tipLabel")
        .transition().duration(1000)
        .style("font-size", tipLabelSize);
    }
  };

  const date_init = () => {
    nodes.forEach((d) => { d.dateval = new Date(d.date); });
    dateValues = nodes.filter((d) => {
      return (typeof d.date === 'string') & (typeof vaccineChoice[d.strain] === "undefined") & (typeof reference_viruses[d.strain] === "undefined");
    }).map((d) => {
      return new Date(d.date);
    });

    let time_back = 1.0;
    if (typeof time_window !== "undefined") {
      time_back = time_window;
    }
    if (typeof fullDataTimeWindow !== "undefined") {
      time_back = fullDataTimeWindow;
    }

    var earliestDate = new Date(globalDate);
    earliestDate.setDate(earliestDate.getDate() - (time_back * 365.25));

    dateScale = d3.time.scale()
      .domain([earliestDate, globalDate])
      .range([5, 205])
      .clamp([true]);

    niceDateScale = d3.time.scale()
      .domain([earliestDate, globalDate])
      .range([5, 205])
      .clamp([true])
      .nice(d3.time.month);

    counterData = {};
    counterData.date = globalDate;
    counterData.x = dateScale(globalDate);
    const startDate = new Date(globalDate);
    startDate.setDate(startDate.getDate() - (time_window * 365.25));
    counterData.x2 = dateScale(startDate);

    d3.select("#date-input")
      .attr("width", 240)
      .attr("height", 65);

    const counter = d3.select("#date-input").selectAll(".date-input-text")
      .data([counterData])
      .enter()
      .append("text")
      .attr("class", "date-input-text")
      .attr("text-anchor", "left")
      .attr("dx", (d) => { return 0.5 * d.x; })
      .attr("dy", "1.0em")
      .text((d) => {
        const format = d3.time.format("%Y %b %-d");
        return format(d.date);
      })
      .style("cursor", "pointer")
      .call(drag);

    const customTimeFormat = d3.time.format.multi([
      [".%L", (d) => { return d.getMilliseconds(); }],
      [":%S", (d) => { return d.getSeconds(); }],
      ["%I:%M", (d) => { return d.getMinutes(); }],
      ["%I %p", (d) => { return d.getHours(); }],
      ["%a %d", (d) => { return d.getDay() && d.getDate() !== 1; }],
      ["%b %d", (d) => { return d.getDate() !== 1; }],
      ["%b", (d) => { return d.getMonth(); }],
      ["%Y", (d) => { return true; }]
    ]);

    const dateAxis = d3.svg.axis()
      .scale(niceDateScale)
      .orient("bottom")
      .ticks(5)
      .tickFormat(customTimeFormat)
      .outerTickSize(2)
      .tickPadding(8);

    d3.select("#date-input").selectAll(".date-input-axis")
      .data([counterData])
      .enter()
      .append("g")
      .attr("class", "date-input-axis")
      .attr("transform", "translate(0,35)")
      .call(dateAxis);

    const window = d3.select("#date-input").selectAll(".date-input-window")
      .data([counterData])
      .enter()
      .append("line")
      .attr("class", "date-input-window")
      .attr("x1", (d) => { return d.x; })
      .attr("x2", (d) => { return d.x2; })
      .attr("y1", 35)
      .attr("y2", 35)
      .style("stroke", "#CCC")
      .style("stroke-width", 5);

  	const edge = d3.select("#date-input").selectAll(".date-input-edge")
      .data([counterData])
      .enter()
      .append("line")
      .attr("class", "date-input-edge")
      .attr("x1", (d) => { return d.x2; })
      .attr("x2", (d) => { return d.x2; })
      .attr("y1", 30)
      .attr("y2", 40)
      .style("stroke", "#CCC")
      .style("stroke-width", 3)
      .style("cursor", "pointer")
      .call(dragMin);

    const marker = d3.select("#date-input").selectAll(".date-input-marker")
      .data([counterData])
      .enter()
      .append("circle")
      .attr("class", "date-input-marker")
      .attr("cx", (d) => {return d.x; })
      .attr("cy", 35)
      .attr("r", 6)
      .style("fill", "#CCC")
      .style("stroke", "#777")
      .style("cursor", "pointer")
      .call(drag);

  };


    /*********************************
    **********************************
    **********************************
    **********************************
    ** Legend
    **********************************
    **********************************
    **********************************
    *********************************/

  const legendRectSize = 15;
  const legendSpacing = 4;
  const makeLegend = () => {

    d3.select("#legend-title").html((d) => {
      if (colorBy === "ep") {
        return "Epitope mutations";
      }
      if (colorBy === "ne") {
        return "Non-epitope mutations";
      }
      if (colorBy === "rb") {
        return "Receptor binding mutations";
      }
      if (colorBy === "lbi") {
        return "Local branching index";
      }
      if (colorBy === "region") {
        return "Region";
      }
      if (colorBy === "genotype") {
        return "Genotype";
      }
      if (colorBy === "date") {
        return "Date";
      }
      if (colorBy === "cHI") {
        return "log<sub>2</sub> titer distance from root";
      }
      if (colorBy === "HI_dist") {
        return "log<sub>2</sub> titer distance from " + focusNode.strain;
      }
      if (colorBy === "dfreq") {
        const tmp_nmonth = Math.round(12 * dfreq_dn * time_step);
        let tmp_text = "Freq. change (" + tmp_nmonth + " month";
        if (tmp_nmonth > 1) {
          tmp_text += "s";
        }
        return tmp_text + ")";
      }
      if (colorBy === "fitness") {
        return "Relative fitness";
      }
    });

  // construct a dictionary that maps a legend entry to the preceding interval
    const lower_bound = {};
    const upper_bound = {};
    lower_bound[colorScale.domain()[0]] = -100000000;
    upper_bound[colorScale.domain()[0]] = colorScale.domain()[0];
    for (let i = 1; i < colorScale.domain().length; i++) {
      lower_bound[colorScale.domain()[i]] = colorScale.domain()[i - 1];
      upper_bound[colorScale.domain()[i]] = colorScale.domain()[i];
    }
    upper_bound[colorScale.domain()[colorScale.domain().length - 1]] = 10000000;
    // function that equates a tip and a legend element
    // exact match is required for categorical qunantities such as genotypes, regions
    // continuous variables need to fall into the interal (lower_bound[leg], leg]
    const legend_match = (leg, tip) => {
      if (
        (colorBy === "lbi") ||
        (colorBy === "date") ||
        (colorBy === "dfreq") ||
        (colorBy === "HI_dist") ||
        (colorBy === "cHI")
      ) {
        return (tip.coloring <= upper_bound[leg]) && (tip.coloring > lower_bound[leg]);
      } else {
        return tip.coloring === leg;
      }
    };

    const count = colorScale.domain().length;
    const stack = Math.ceil(count / 2);
    d3.select("#legend")
      .attr("height", stack * (legendRectSize + legendSpacing) + legendSpacing);

    const tmp_leg = legend.selectAll(".legend")
      .data(colorScale.domain())
      .enter().append("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => {
        const fromRight = Math.floor(i / stack);
        const fromTop = i % stack;
        const horz = fromRight * 145 + 5;
        const vert = fromTop * (legendRectSize + legendSpacing) + 5;
        return "translate(" + horz + "," + vert + ")";
      });

    tmp_leg.append("rect")
      .attr("width", legendRectSize)
      .attr("height", legendRectSize)
      .style("fill", (d) => {
        const col = colorScale(d);
        return d3.rgb(col).brighter([0.35]).toString();
      })
      .style("stroke", (d) => {
        const col = colorScale(d);
        return d3.rgb(col).toString();
      })
      .on("mouseover", (leg) => {
        treeplot.selectAll(".tip") //highlight all tips corresponding to legend
          .filter((d) => { return legend_match(leg, d); })
          .attr("r", (d) => { return tipRadius(d) * 1.7; })
          .style("fill", (t) => {
            return d3.rgb(tipFillColor(t)).brighter();
          });
      })
      .on("mouseout", (leg) => {
        treeplot.selectAll(".tip") //undo highlight
          .filter((d) => { return legend_match(leg, d);})
          .attr("r", (d) => { return tipRadius(d); })
          .style("fill", (t) => {
            return d3.rgb(tipFillColor(t));
          });
      });

    tmp_leg.append("text")
      .attr("x", legendRectSize + legendSpacing + 5)
      .attr("y", legendRectSize - legendSpacing)
      .text((d) => {
        let label = d.toString().replace(/([a-z])([A-Z])/g, "$1 $2").replace(/,/g, ", ");
        if (colorBy === "dfreq") {
          label += "\u00D7";
        }
        return label;
      })
      .on("mouseover", (leg) => {
        treeplot.selectAll(".tip")
          .filter((d) => {return legend_match(leg, d);})
          .attr("r", (d) => {return tipRadius(d) * 1.7;})
          .style("fill", (t) => {
            return d3.rgb(tipFillColor(t)).brighter();
          });
      })
      .on("mouseout", (leg) => {
        treeplot.selectAll(".tip")
          .filter((d) => {return legend_match(leg, d);})
          .attr("r", (d) => {return tipRadius(d); })
          .style("fill", (t) => {
            return d3.rgb(tipFillColor(t));
          });
      });
    return tmp_leg;
  };

  const removeLegend = () => {
    legend.selectAll(".legend")
    .remove();
  };

  /*********************************
  **********************************
  **********************************
  **********************************
  ** Locate viruses
  **********************************
  **********************************
  **********************************
  *********************************/

  /* possible bug - what is ii? */
  const addSequence = (current_seq, current_seq_name, seqs, all_names) => {
    if (current_seq_name === "") {
      current_seq_name = "input sequence";
    }

    let name_count = 0;
    let suffix;

    for (let tmpii = 0; tmpii < all_names; tmpii++) {
      if (all_names[ii] === current_seq_name) {
        name_count++;
      }
    }
    if (name_count) {
      suffix = " " + (name_count + 1);
    } else {
      suffix = "";
    }
    all_names.push(current_seq_name);
    seqs[current_seq_name + suffix] = current_seq;
  };

  const parseSequences = () => {
    const lines = document.getElementById("seqinput").value.split("\n");
    const seqs = {};
    const unmatched = [];
    const closest_nodes = {};
    let current_seq_name = "";
    let current_seq = "";
    const seq_names = [];

    for (let li = 0; li < lines.length; li++) {
      if (lines[li][0] === ">") {
        if (current_seq.length) {
          addSequence(current_seq, current_seq_name, seqs, seq_names);
        }
        current_seq_name = lines[li].substring(1, lines[li].length);
        current_seq = "";
      } else {
        current_seq += lines[li].toUpperCase().replace(/[^ACGTWRN]/g, "");
      }
    }

    if (current_seq.length) {
      addSequence(current_seq, current_seq_name, seqs, seq_names);
    }

    for (current_seq_name in seqs) {
      const tmpclade = locateSequence(current_seq_name, seqs[current_seq_name]);
      if (tmpclade !== null) {
        if (typeof closest_nodes[tmpclade] === "undefined") {
          closest_nodes[tmpclade] = [current_seq_name];
        } else {
          closest_nodes[tmpclade].push(current_seq_name);
        }
      } else {
        unmatched.push(current_seq_name);
      }
    }

    markInTreeSeqSearch(closest_nodes);

    if (unmatched.length) {
      let tmp_str = "";
      for (let ii = 0; ii < unmatched.length; ii++) {
        tmp_str += unmatched[ii].substring(0, 30) + "\n";
      }
      window.alert(
        "No close match was found for \n" +
        tmp_str +
        "\nMaybe gapped or not recent isolate from current lineage?"
      );
    }
  };

  const findClosestClade = (mutations) => {
    let bestClade = -1;
    let bestScore = 0;
    let tmpScore = 0;
    const searchClades = tips.map((d) => { return d.clade; });

    for (let ci = 0; ci < searchClades.length; ci++) {
      const clade = searchClades[ci];
      tmpScore = 0;
      for (const mut in mutations) {
        if (stateAtPosition(clade, "nuc", mut) === mutations[mut]) {
          tmpScore++;
        }
      }
      if (clade !== "root") {
        tmpScore -= 0.5 * Object.keys(cladeToSeq[clade].nuc).length;
      }
      if (tmpScore > bestScore) {
        bestScore = tmpScore;
        bestClade = clade;
      }
    }
    return bestClade;
  };


  function alignToRoot(seq) {
    const rootSeq = cladeToSeq.root.nuc;
    let shift = 0;
    let max_score = 0.0;
    let max_shift;

    for (shift = 0; shift < seq.length - 30; shift++) {
      let tmp_score = 0;
      const olaplen = Math.min(seq.length - shift, rootSeq.length);
      for (let pos = 0; pos < olaplen; pos++) {
        if (seq[pos + shift] === rootSeq[pos]) {
          tmp_score++;
        }
      }
      tmp_score *= 1.0 / olaplen;
      if (tmp_score > max_score){
        max_score = tmp_score;
        max_shift = -shift;
      }
    }

    /* possible bug - redeclaration of shift */
    for (let shift = 0; shift < rootSeq.length - 30; shift++) {
      let tmp_score = 0;
      const olaplen = Math.min(rootSeq.length - shift, seq.length);
      for (let pos = 0; pos < olaplen; pos++) {
        if (seq[pos] === rootSeq[shift + pos]) {
          tmp_score++;
        }
      }
      tmp_score *= 1.0 / olaplen;
      if (tmp_score > max_score) {
        max_score = tmp_score;
        max_shift = shift;
      }
    }

    if (max_score > 0.9) {

      const mutations = {};

      let olaplen;
      let olap_start;
      let olap_end;

      if (max_shift < 0) {
        olaplen = Math.min(seq.length + max_shift, rootSeq.length);
        olap_start = 0;
        olap_end = olaplen;
      } else {
        olaplen = Math.min(rootSeq.length - max_shift, seq.length);
        olap_start = max_shift;
        olap_end = max_shift + olaplen;
      }

      for (let pos = olap_start; pos < olap_end; pos++) {
        if (rootSeq[pos] !== seq[pos - max_shift]) {
          mutations[pos] = seq[pos - max_shift];
        }
      }
      return [olap_start, olap_end, mutations];
    } else {
      return [null, null, null];
    }
  }


  const locateSequence = (name, seq) => {

    const tmp = alignToRoot(seq);

    const mutations = tmp[2];
    const olap_start = tmp[0];
    // let olap_end = tmp[1];

    if (olap_start === null) {
      return null;
    } else {
      const bestClade = findClosestClade(mutations);
      return bestClade;
    }
  };


  // highlight clades in tree
  const markInTreeSeqSearch = (clades) => {
    const userSeqs = nodes.filter((d) => {
      let tmp = 0;
      for (const clade in clades) {
        tmp += (d.clade === clade);
      }
      return tmp > 0;
    });

    for (let mi = 0; mi < userSeqs.length; mi++) {
      userSeqs[mi].matches = clades[userSeqs[mi].clade];
    }

    treeplot.selectAll(".seqmatch").data(userSeqs)
      .enter()
      .append("text")
      .attr("class", "seqmatch")
      .text((d) => {
        return "\uf069";
      });
      // .on("mouseover", function(d) {
      //     matchTooltip.show(d, this);
      // })
      // .on("mouseout", matchTooltip.hide);
    styleHighlight();
  };

  const markInTreeStrainSearch = (tip) => {
    treeplot.selectAll(".strainmatch").data([tip])
      .enter()
      .append("text")
      .attr("class", "strainmatch")
      .text((d) => {
        return "\uf069";
      });
      // .on('mouseover', function(d) {
      //     virusTooltip.show(d, this);
      // })
      // .on('mouseout', virusTooltip.hide);
    styleHighlight();
  };

  const styleHighlight = () => {
    treeplot.selectAll(".seqmatch")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .style("font-size", "24px")
      .style("font-family", "FontAwesome")
      .style("fill", "#555555")
      .attr("x", (d) => { return d.x; })
      .attr("y", (d) => { return d.y; })
      .style("cursor", "default");
    treeplot.selectAll(".strainmatch")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .style("font-size", "24px")
      .style("font-family", "FontAwesome")
      .style("fill", "#555555")
      .attr("x", (d) => { return d.x; })
      .attr("y", (d) => { return d.y; })
      .style("cursor", "default");
  };

  // callback to highlight the result of a search by strain name
  /* bug duplicate */
  var searchEvent;

  const highlightStrainSearch = (tip) => {
    const strainName = (tip.strain).replace(/\//g, "");
    d3.select("#" + strainName)
      .call((d) => {
        markInTreeStrainSearch(tip);
        // virusTooltip.show(tip, d[0][0]);
      });
  };

  let strainSearchEvent;

  d3.select("#seqinput").on("keyup", () => {
    if (typeof strainSearchEvent !== "undefined") {
      clearTimeout(strainSearchEvent);
    }
    strainSearchEvent = setTimeout(parseSequences, 100);
  });

  d3.select("#searchinputclear").on("click", () => {
      treeplot.selectAll(".seqmatch").data([]).exit().remove();
      treeplot.selectAll(".strainmatch").data([]).exit().remove();
      document.getElementById("seqinput").value = "";
      document.getElementById("bp-input").value = "";
	// virusTooltip.hide();
  });

  /*********************************
  **********************************
  **********************************
  **********************************
  ** Tree functions
  **********************************
  **********************************
  **********************************
  *********************************/

  const gatherTips = (node, tips) => {
    if (typeof node.children !== "undefined") {
      for (let i = 0, c = node.children.length; i < c; i++) {
        gatherTips(node.children[i], tips);
      }
    } else {
      tips.push(node);
    }
    return tips;
  };

  const getVaccines = (tips) => {
    const v = [];
    tips.forEach((tip) => {
      if (vaccineStrains.indexOf(tip.strain) !== -1) {
        tip.choice = vaccineChoice[tip.strain];
        v.push(tip);
      }
    });
    return v;
  };

  const minimumAttribute = (node, attr, min) => {
    if (typeof node.children !== "undefined") {
      for (let i = 0, c = node.children.length; i < c; i++) {
        min = minimumAttribute(node.children[i], attr, min);
      }
    } else if (node[attr] < min) {
      min = node[attr];
    }
    return min;
  };

  const maximumAttribute = (node, attr, max) => {
    if (typeof node.children !== "undefined") {
      for (let i = 0, c = node.children.length; i < c; i++) {
        max = maximumAttribute(node.children[i], attr, max);
      }
    } else if (node[attr] > max) {
      max = node[attr];
    }
    return max;
  };

  const calcBranchLength = (node) => {
    if (typeof node.children !== "undefined") {
      for (let i = 0, c = node.children.length; i < c; i++) {
        calcBranchLength(node.children[i]);
        node.children[i].branch_length = node.children[i].xvalue - node.xvalue;
      }
    }
  };

  /**
   * for each node, calculate the number of subtending tips (alive or dead)
  **/
  const calcFullTipCounts = (node) => {
    node.fullTipCount = 0;
    if (typeof node.children !== "undefined") {
      for (let i = 0; i < node.children.length; i++) {
        calcFullTipCounts(node.children[i]);
        node.fullTipCount += node.children[i].fullTipCount;
      }
    } else {
      node.fullTipCount = 1;
    }
  };

  /**
   * for each node, calculate the number of tips in the currently selected time window.
  **/
  const calcTipCounts = (node) => {
    node.tipCount = 0;
    if (typeof node.children !== "undefined") {
      for (let i = 0; i < node.children.length; i++) {
        calcTipCounts(node.children[i]);
        node.tipCount += node.children[i].tipCount;
      }
    } else if (node.current) {
      node.tipCount = 1;
    }
  };

  /**
  sets each node in the tree to alive=true if it has at least one descendent with current=true
  **/
  const setNodeAlive = (node) => {
    if (typeof node.children !== "undefined") {
      let aliveChildren = false;
      for (let i = 0, c = node.children.length; i < c; i++) {
        setNodeAlive(node.children[i]);
        aliveChildren = aliveChildren || node.children[i].alive;
      }
      node.alive = aliveChildren;
    } else {
      node.alive = node.current;
    }
  };

  /**
   * for each node, calculate the exponentially attenuated tree length below the node
   * the polarizer is send "up", i.e. to parents
  **/
  const calcUpPolarizers = (node) => {
    node.up_polarizer = 0;
    if (typeof node.children !== "undefined") {
      for (let i = 0; i < node.children.length; i++) {
        calcUpPolarizers(node.children[i]);
        node.up_polarizer += node.children[i].up_polarizer;
      }
    }
    const bl = node.branch_length / LBItau;
    node.up_polarizer *= Math.exp(-bl);
    if (node.alive) { // only alive branches contribute anything
      node.up_polarizer += LBItau * (1 - Math.exp(-bl));
    }
  };

  /**
   * for each node, calculate the exponentially attenuated tree length above the node,
   * that is "outside" the clade defined by this node. this down polarizer is send to children
  **/
  const calcDownPolarizers = (node) => {
    if (typeof node.children !== "undefined") {
      for (let i1 = 0; i1 < node.children.length; i1++) {
        node.children[i1].down_polarizer = node.down_polarizer;
        for (let i2 = 0; i2 < node.children.length; i2++) {
          if (i1 !== i2) {
            node.children[i1].down_polarizer += node.children[i2].up_polarizer;
          }
        }
        // account for the attenuation over the branch_length
        const bl = node.children[i1].branch_length / LBItau;
        node.children[i1].down_polarizer *= Math.exp(-bl);
        if (node.children[i1].alive) { //the branch contributes only when the node is alive
          node.children[i1].down_polarizer += LBItau * (1 - Math.exp(-bl));
        }
        calcDownPolarizers(node.children[i1]);
      }
    }
  };

  const calcPolarizers = (node) => {
    calcUpPolarizers(node);
    node.down_polarizer = 0; // set the down polarizer of the root to 0
    calcDownPolarizers(node);
  };

  /**
   * calculate the LBI for all nodes downstream of node
   * allnodes is provided for easy normalization at the end
  **/
  const calcLBI = (node, allnodes) => {
    setNodeAlive(node);
    calcPolarizers(node);
    allnodes.forEach((d) => {
      d.LBI = 0;
      d.LBI += d.down_polarizer;
      if (typeof d.children !== "undefined") {
        for (let i = 0; i < d.children.length; i++) {
          d.LBI += d.children[i].up_polarizer;
        }
      }
    });
    // normalize the LBI to range [0,1]
    /* possible bug - where does maxLBI get used? is this attaching to window? */
    maxLBI = d3.max(allnodes.map((d) => { return d.LBI; }));
    allnodes.forEach((d) => { d.LBI /= maxLBI;});
  };

    /*********************************
    **********************************
    **********************************
    **********************************
    ** Tooltips
    **********************************
    **********************************
    **********************************
    *********************************/

    // var virusTooltip = d3.tip()
    // 	.direction('se')
    // 	.attr('class', 'd3-tip')
    // 	.offset([0, 12])
    // 	.html(function(d) {
    //
    // 		string = "";
    //
    // 		// safe to assume the following attributes
    // 		if (typeof d.strain != "undefined") {
    // 			string += d.strain;
    // 		}
    // 		string += "<div class=\"smallspacer\"></div>";
    //
    // 		string += "<div class=\"smallnote\">";
    //
    // 		// check if vaccine strain
    // 		if (vaccineStrains.indexOf(d.strain) != -1) {
    // 			string += "Vaccine strain<br>";
    // 			var vaccine_date = new Date(vaccineChoice[d.strain]);
    //
    // 			string += "First chosen " + vaccine_date.toLocaleString("en-us", { month: "short" }) + " " + vaccine_date.getFullYear() + "<br>";
    // 			string += "<div class=\"smallspacer\"></div>";
    // 		}
    //
    // 		if (typeof d.country != "undefined") {
    // 			string += d.country.replace(/([A-Z])/g, ' $1');
    // 		}
    // 		else if (typeof d.region != "undefined") {
    // 			string += d.region.replace(/([A-Z])/g, ' $1');
    // 		}
    // 		if (typeof d.date != "undefined") {
    // 			string += ", " + d.date;
    // 		}
    // 		if ((typeof d.db != "undefined") && (typeof d.accession != "undefined") && (d.db == "GISAID")) {
    // 			string += "<br>GISAID ID: EPI" + d.accession;
    // 		}
    // 		if ((typeof d.db != "undefined") && (typeof d.accession != "undefined") && (d.db == "Genbank")) {
    // 			string += "<br>Accession: " + d.accession;
    // 		}
    // 		if (typeof d.lab != "undefined") {
    // 			if (d.lab != "") {
    // 				string += "<br>Source: " + d.lab.substring(0,25);
    // 				if (d.lab.length>25) string += '...';
    // 			}
    // 		}
    // 		if (typeof d.authors != "undefined") {
    // 			if (d.authors != "") {
    // 				string += "<br>Authors: " + d.authors.substring(0,25);
    // 				if (d.authors.length>25) string += '...';
    // 			}
    // 		}
    // 		string += "</div>";
    // 		// following may or may not be present
    // 		if ((typeof focusNode != "undefined")){
    // 			string += "<div class=\"smallspacer\"></div>";
    // 			string += "HI against serum from "+focusNode.strain;
    // 			string += "<div class=\"smallspacer\"></div>";
    // 			string += "<div class=\"smallnote\">"
    // 			string += '<table class="table table-condensed"><thead><tr><td>Serum</td><td>&#916log<sub>2</sub></td><td>heterol.</td><td>homol.</td></tr></thead><tbody>';
    // 			if (typeof focusNode.HI_titers[d.clade] != "undefined"){
    // 				for (var tmp_serum in focusNode.HI_titers[d.clade]){
    // 					var autoHI = focusNode.autologous_titers[tmp_serum];
    // 					var rawHI = focusNode.HI_titers_raw[d.clade][tmp_serum];
    // 					var logHI = focusNode.HI_titers[d.clade][tmp_serum];
    // 					if (correctVirus){logHI-=d.avidity_mut;}
    // 					if (correctPotency){logHI-=focusNode.potency_mut[tmp_serum];}
    // 					var serum_name;
    // 					if (tmp_serum.length<20){
    // 						serum_name = tmp_serum;
    // 					}else{
    // 						serum_name = tmp_serum.substring(0,17)+'...';
    // 					}
    // 					string += '<tr><td>' + serum_name + '</td><td>' +  logHI.toFixed(2) + '</td><td>' + rawHI.toFixed(0)+ '</td><td>' + autoHI.toFixed(0) +"</td></tr>";
    // 				}
    // 			}
    // 			string += '<tr><td>' + 'Tree model' + '</td><td>' +  d.HI_dist_tree.toFixed(2) + '</td><td> --- </td><td>---</td></tr>';
    // 			string += '<tr><td>' + 'Subs. model ' + '</td><td>' +  d.HI_dist_mut.toFixed(2) + '</td><td> --- </td><td>---</td></tr>';
    // 			string += "</tbody></table></div>";
    // 		}
    //
    // 		string += "<div class=\"smallspacer\"></div>";
    // 		// following may or may not be present
    // 		string += "<div class=\"smallnote\">";
    // 		if (typeof d.cHI != "undefined") {
    // 			string += "Antigenic adv: " + d.cHI.toFixed(1) + "<br>";
    // 		}
    // 		if (typeof d.ep != "undefined") {
    // 			string += "Epitope distance: " + d.ep + "<br>";
    // 		}
    // 		if (typeof d.rb != "undefined") {
    // 			string += "Receptor binding distance: " + d.rb + "<br>";
    // 		}
    // 		if (typeof d.LBI != "undefined") {
    // 			string += "Local branching index: " + d.LBI.toFixed(3) + "<br>";
    // 		}
    // 		if (typeof d.dfreq != "undefined") {
    // 			string += "Freq. change: " + d.dfreq.toFixed(3) + "<br>";
    // 		}
    // 		if (typeof d.fitness != "undefined") {
    // 			string += "Fitness: " + d.fitness.toFixed(3) + "<br>";
    // 		}
    // 		if (typeof d.pred_distance != "undefined") {
    // 			string += "Predicted distance: " + d.pred_distance.toFixed(3) + "<br>";
    // 		}
    // 		string += "</div>";
    // 		return string;
    // 	});


    /* may be problematic in react */
    // treeplot.call(virusTooltip);


    // var linkTooltip = d3.tip()
    // 	.direction('e')
    // 	.attr('class', 'd3-tip')
    // 	.offset([0, 12])
    // 	.html(function(d) {
    // 		string = ""
    // 		if (typeof d.frequency != "undefined") {
    // 			string += "Frequency: " + (100 * d.frequency).toFixed(1) + "%"
    // 		}
    // 		if (typeof d.dHI != "undefined") {
    // 			string += "<br>Titer drop: " + d.dHI.toFixed(2)
    // 		}
    // 		string += "<div class=\"smallspacer\"></div>";
    // 		string += "<div class=\"smallnote\">";
    // 		if ((typeof d.aa_muts !="undefined")&&(mutType=='aa')){
    // 			var ncount = 0;
    // 			for (tmp_gene in d.aa_muts) {ncount+=d.aa_muts[tmp_gene].length;}
    // 			if (ncount) {string += "<b>Mutations:</b><ul>";}
    // 			for (tmp_gene in d.aa_muts){
    // 				if (d.aa_muts[tmp_gene].length){
    // 					string+="<li>"+tmp_gene+":</b> "+d.aa_muts[tmp_gene].replace(/,/g, ', ') + "</li>";
    // 				}
    // 			}
    // 		}
    // 		else if ((typeof d.nuc_muts !="undefined")&&(mutType=='nuc')&&(d.nuc_muts.length)){
    // 			var tmp_muts = d.nuc_muts.split(',');
    // 			var nmuts = tmp_muts.length;
    // 			tmp_muts = tmp_muts.slice(0,Math.min(10, nmuts))
    // 			string += "<li>"+tmp_muts.join(', ');
    // 			if (nmuts>10) {string+=' + '+ (nmuts-10) + ' more';}
    // 			string += "</li>";
    // 		}
    // 		string += "</ul>";
    // 		if (typeof d.fitness != "undefined") {
    // 			string += "Fitness: " + d.fitness.toFixed(3) + "<br>";
    // 		}
    // 		string += "click to zoom into clade"
    // 		string += "</div>";
    // 		return string;
    // 	});
    // treeplot.call(linkTooltip);
    //
    //
    // var matchTooltip = d3.tip()
    // 	.direction('e')
    // 	.attr('class', 'd3-tip')
    // 	.offset([0, 12])
    // 	.html(function(d) {
    // 		string = d.strain+ "<i> is closest match of:</i><ul>";
    // 		string += "<div class=\"smallspacer\"></div>";
    // 		for (var mi=0; mi<d.matches.length;mi++){
    // 			string+="<li>" +d.matches[mi].substring(0,Math.min(30,d.matches[mi].length))+'</li>';
    // 		}
    // 		string += "</ul>";
    // 		return string;
    // 	});
    // treeplot.call(matchTooltip);

  /*********************************
  **********************************
  **********************************
  **********************************
  ** Tree
  **********************************
  **********************************
  **********************************
  *********************************/

  const dHIScale = d3.scale.linear()
    .domain([0, 1])
    .range([2.0, 4.5]);

  const freqScale = d3.scale.sqrt()
    .domain([0, 1])
    .range([1, 10]);

  const distanceScale = d3.scale.sqrt()
    .domain([3, 20])
    .range([9, 3])
    .clamp([true]);

  const tipRadius = (d) => {
    if (typeof d.pred_distance !== "undefined" && colorBy === "fitness") {
      return distanceScale(d.pred_distance);
    } else {
      return 4.0;
    }
  };

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

  const tree_init = () => {
    calcFullTipCounts(rootNode);
    calcBranchLength(rootNode);
    rootNode.branch_length = 0.01;
    rootNode.dfreq = 0.0;
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
    calcNodeAges(time_window);
    colorByTrait();
    adjust_freq_by_date();
    if (typeof calcDfreq === "function") {
      calcDfreq(rootNode, freq_ii);
    }
    tree_legend = makeLegend();
    nDisplayTips = displayRoot.fullTipCount;
  };


  const addBranchLabels = () => {
    /* bug mutations is not necessary just execute treeplot.selectAll */
    const mutations = treeplot.selectAll(".branchLabel")
      .data(nodes)
      .enter()
      .append("text")
      .attr("class", "branchLabel")
      .style("font-size", branchLabelSize)
      .style("text-anchor", "end")
      .text(branchLabelText)
      .style("visibility", "hidden");
  };


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

	const xValues = nodes.map((d) => {
		return +d.xvalue;
	});

	const yValues = nodes.map((d) => {
		return +d.yvalue;
	});

	let clade_freq_event;
	let link = treeplot.selectAll(".link")
		.data(links)
		.enter().append("polyline")
		.attr("class", "link")
		.style("stroke-width", branchStrokeWidth)
		.style("stroke", branchStrokeColor)
		.style("stroke-linejoin", "round")
		.style("cursor", "pointer")
		.style("fill", "none")
		.on("mouseover", (d) => {
      if ((colorBy !== "genotype") & (typeof addClade !== "undefined")) {
        clade_freq_event = setTimeout(addClade, 1000, d);
      }
		})
		.on("mouseout", (d) => {
			// linkTooltip.hide(d);
			if (typeof addClade !== "undefined") {
        clearTimeout(clade_freq_event);
      };
    })
		.on("click", zoom);

    if ((typeof tip_labels !== "undefined") && (tip_labels)) {
      treeplot.selectAll(".tipLabel").data(tips)
        .enter()
        .append("text")
        .attr("class", "tipLabel")
        .style("font-size", (d) => {return tipLabelSize(d) + "px"; })
        .text(tipLabelText);
    }

    var tipCircles = treeplot.selectAll(".tip")
      .data(tips)
      .enter()
      .append("circle")
      .attr("class", "tip")
      .attr("id", (d) => { return (d.strain).replace(/\//g, ""); })
      .attr("r", tipRadius)
      .style("visibility", tipVisibility)
      .style("fill", tipFillColor)
      .style("stroke", tipStrokeColor);

      // .on('mouseover', function(d) {
      // 	virusTooltip.show(d, this);
      // })
      // .on('dblclick', function(d) {
      // 	if ((typeof d.db != "undefined") && (d.db == "GISAID") && (typeof d.accession != "undefined")) {
      // 		var url = "http://gisaid.org/EPI/"+d.accession;
      // 		console.log("opening url "+url);
      // 		var win = window.open(url, '_blank');
      // 			win.focus();
      // 		}
      // 	if ((typeof d.db != "undefined") && (d.db == "Genbank") && (typeof d.accession != "undefined")) {
      // 		var url = "http://www.ncbi.nlm.nih.gov/nuccore/"+d.accession;
      // 		console.log("opening url "+url);
      // 		var win = window.open(url, '_blank');
      // 			win.focus();
      // 		}
      // 	})
      // .on('mouseout', virusTooltip.hide);


  	var vaccineCircles = treeplot.selectAll(".vaccine")
      .data(vaccines)
      .enter()
      .append("text")
      .attr("class", "vaccine")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .style("font-size", "28px")
      .style("font-family", "FontAwesome")
      .style("fill", "#555555")
      .text(() => { return "\uf00d"; })
      .style("cursor", "default");
      // .on('mouseover', function(d) {
      // 	virusTooltip.show(d, this);
      // })
      // .on('mouseout', virusTooltip.hide);

  const serumWidth = 10;
  const serumCircles = treeplot.selectAll(".serum") /* bug does this need to be stored or just executed? */
    .data(sera)
    .enter()
    .append("text")
    .attr("class", "serum")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "central")
    .style("font-family", "FontAwesome")
    .style("fill", (d) => {if (d === focusNode) {return "#FF3300";} else {return "#555555";}})
    .style("font-size", (d) => {if (d === focusNode) {return "30px";} else {return "12px";}})
    .text((d) => {
      if (d === focusNode) {return "\uf05b";} else {return serumSymbol;}
    })
    .style("visibility", serumVisibility)
    .style("cursor", "crosshair");
    // .on('mouseover', function(d) {
    // 	virusTooltip.show(d, this);
    // })
    // .on('mouseout', virusTooltip.hide)
    // .on('click', function (d){
    // 	focusNode = d;
    // 	document.getElementById("coloring").value = "HI_dist";
    // 	newFocus();
    // });

    /*
  	 * zoom into the tree upon click onto a branch
  	 */
  const zoom = (d) => {
    if ((colorBy !== "genotype") && (typeof addClade !== "undefined")) {
      addClade(d);
    }
    const dy = yScale.domain()[1] - yScale.domain()[0];
    displayRoot = d.target;
    let dMin = 0.5 * (
      minimumAttribute(
        d.target,
        "xvalue",
        d.target.xvalue) +
      minimumAttribute(
        d.source,
        "xvalue",
        d.source.xvalue
      )
    );
    let dMax = maximumAttribute(d.target, "xvalue", d.target.xvalue);
    let lMin = minimumAttribute(d.target, "yvalue", d.target.yvalue);
    let lMax = maximumAttribute(d.target, "yvalue", d.target.yvalue);
    if (dMax === dMin || lMax === lMin) {
      displayRoot = d.source;
      /* bug discuss scoped assignments here */
      dMin = minimumAttribute(d.source, "xvalue", d.source.xvalue),
      dMax = maximumAttribute(d.source, "xvalue", d.source.xvalue),
      lMin = minimumAttribute(d.source, "yvalue", d.source.yvalue),
      lMax = maximumAttribute(d.source, "yvalue", d.source.yvalue);
    }

    if ((lMax - lMin) > 0.999 * dy) {
      lMin = lMax - dy * 0.7;
    }

    const visibleXvals = tips.filter((dd) => {
      return (dd.yvalue >= lMin) && (dd.yvalue < lMax);
    }).map((dd) => {
      return +dd.xvalue;
    });
    nDisplayTips = visibleXvals.length;
    dMax = Math.max.apply(Math, visibleXvals);
    rescale(dMin, dMax, lMin, lMax);
  };

  	/*
  	 * adjust margins such that the tip labels show
  	 */
    const setMargins = () => {
      containerWidth = parseInt(d3.select(".treeplot-container").style("width"), 10);
      treeWidth = containerWidth;
      treeHeight = treePlotHeight(treeWidth);
      d3.select("#treeplot")
        .attr("width", treeWidth)
        .attr("height", treeHeight);
      if ((typeof tip_labels !== "undefined") && (tip_labels)) {
        let maxTextWidth = 0;
        /* bug this probably just needs to be executed not stored as labels */
        let labels = treeplot.selectAll(".tipLabel")
          .data(tips)
          .each((d) => {
            const textWidth = 0.5 * tipLabelWidth(d);
            if (textWidth > maxTextWidth) {
              maxTextWidth = textWidth;
            }
          });
        right_margin = maxTextWidth + 10;
      }
      xScale.range([left_margin, treeWidth - right_margin]);
      yScale.range([top_margin, treeHeight - bottom_margin]);
    }

  /*
	 * rescale the tree to a window defined by the arguments
	 * dMin, dMax  -- minimal and maximal horizontal dimensions
	 * lMin, lMax  -- minimal and maximal vertical dimensions
	 */
  const rescale = (dMin, dMax, lMin, lMax) => {
    setMargins();
    xScale.domain([dMin,dMax]);
    yScale.domain([lMin,lMax]);
    // virusTooltip.hide();
    // linkTooltip.hide();
    // matchTooltip.hide();
    transform(1500)
  }

  /*
	 *move all svg items to their new location
	 *dt -- the duration of the transition
	 */
  const transform = (dt) => {
    nodes.forEach((d) => {
      d.x = xScale(d.xvalue);
      d.y = yScale(d.yvalue);
    });

    treeplot.selectAll(".tip")
      .transition().duration(dt)
      .attr("cx", (d) => { return d.x; })
      .attr("cy", (d) => { return d.y; });

    treeplot.selectAll(".vaccine")
      .transition().duration(dt)
      .attr("x", (d) => { return d.x; })
      .attr("y", (d) => { return d.y; });

    treeplot.selectAll(".serum").data(sera)
      .transition().duration(dt)
      .attr("x", (d) => {return d.x;})
      .attr("y", (d) => {return d.y;});

    treeplot.selectAll(".seqmatch")
      .transition().duration(dt)
      .attr("x", (d) => { return d.x; })
      .attr("y", (d) => { return d.y; });

    treeplot.selectAll(".strainmatch")
      .transition().duration(dt)
      .attr("x", (d) => { return d.x; })
      .attr("y", (d) => { return d.y; });

    treeplot.selectAll(".link")
      .transition().duration(dt)
      .attr("points", branchPoints);

    if ((typeof tip_labels !== "undefined") && (tip_labels)) {
      treeplot.selectAll(".tipLabel")
      .transition().duration(dt)
			.style("font-size", (d) => {return tipLabelSize(d) + "px"; })
			.attr("x", (d) => { return d.x + 10; })
			.attr("y", (d) => { return d.y + 4; });
    }

		if ((typeof branchLabels !== "undefined") && (branchLabels)) {
      treeplot.selectAll(".branchLabel")
				.transition().duration(dt)
				.style("font-size", branchLabelSize)
				.attr("x", (d) => { return d.x - 9;})
				.attr("y", (d) => { return d.y - 6;});
		}

    if (typeof clades !== "undefined") {
			treeplot.selectAll(".annotation")
				.transition().duration(dt)
				.attr("x", (d) => {
					return xScale(d[1]) - 10;
				})
				.attr("y", (d) => {
					return yScale(d[2]) - 6;
				});
		}
	}

    const resize = () => {
      setMargins();
      transform(0);
    };

    const resetLayout = () => {
      displayRoot = rootNode;
      nDisplayTips = displayRoot.fullTipCount;
      let dMin = d3.min(xValues);
      const dMax = d3.max(xValues);
      const lMin = d3.min(yValues);
      const lMax = d3.max(yValues);
      rescale(dMin, dMax, lMin, lMax);
      removeClade();
    };

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

  d3.select("#branchlabels")
    .on("change", (d) => {
      branchLabels = document.getElementById("branchlabels").checked;
      treeplot.selectAll(".branchLabel").data(nodes)
        .text(branchLabelText)
        .style("visibility", (branchLabels) ? "visible" : "hidden");
      treeplot.selectAll(".annotation").data(clades)
        .style("visibility", (branchLabels) ? "hidden" : "visible");
    });


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
  const xScale = d3.scale.linear()
    .domain([d3.min(xValues), d3.max(xValues)]);
  const yScale = d3.scale.linear()
    .domain([d3.min(yValues), d3.max(yValues)]);
  resize();

  const exportTreeSVG = () => {
    const tmp = document.getElementById("treeplot-container");
    const svg_tmp = tmp.getElementsByTagName("svg")[0];
    // Extract the data as SVG text string
    const svg_xml = (new XMLSerializer).serializeToString(svg_tmp).replace(/cursor: pointer;/g, "");
    const blob = new Blob([svg_xml], {type: "text/plain;charset=utf-8"});
    saveAs(blob,'tree.svg');
  };

  d3.select("#svgexport")
    .on("click", exportTreeSVG);

  // });

  // d3.json(path + file_prefix + "sequences.json", function(error, sequences) {
  cladeToSeq = sequences;
  // });


    /*********************************
    **********************************
    **********************************
    **********************************
    ** Frequencies
    **********************************
    **********************************
    **********************************
    *********************************/

    // var frequencies, pivots;
    // var gene = 'nuc';
    // var mutType = 'aa';
    // var plot_frequencies = true;

    // /**
    //  * for each node, calculate the derivative of the frequency tranjectory. if none exists, copy parent
    // **/
    // function calcDfreq(node, freq_ii){
    // 	if (typeof node.children != "undefined") {
    // 		for (var i1=0; i1<node.children.length; i1++) {
    // 			if (typeof node.children[i1].freq != "undefined") {
    // 				if (node.children[i1].freq["global"] != "undefined"){
    // 					var tmp_freq = node.children[i1].freq["global"]
    // 					//node.children[i1].dfreq = 0.5*(tmp_freq[freq_ii] - tmp_freq[freq_ii-dfreq_dn])/(tmp_freq[freq_ii] + tmp_freq[freq_ii-dfreq_dn] + 0.2);
    // 					node.children[i1].dfreq = (tmp_freq[freq_ii] + 0.01)/(tmp_freq[freq_ii-dfreq_dn] + 0.01);
    // 				} else {
    // 					node.children[i1].dfreq = node.dfreq;
    // 				}
    // 			}
    // 			calcDfreq(node.children[i1], freq_ii);
    // 		}
    // 	}
    // };

    // /**
    // loops over all genotypes from a certain region and sums the frequency contributions
    // of the genotype matches at the specified positions
    // **/
    // function get_frequencies(region, gt){
    // 	var freq = [];
    // 	for (var pi=0; pi<pivots.length; pi++){freq[freq.length]=0;}
    // 	console.log("searching for "+region+' ' + gt);
    // 	if (frequencies["clades"][region][gt.toLowerCase()]!=undefined) {
    // 		console.log(gt+" found as clade");
    // 		for (var pi=0; pi<freq.length; pi++){
    // 			freq[pi]+=frequencies["clades"][region][gt.toLowerCase()][pi];
    // 		}
    // 	}else if ((typeof frequencies["genotypes"] !="undefined") && (frequencies["genotypes"][region][gt]!=undefined)) {
    // 		console.log(gt+" found as genotype");
    // 		for (var pi=0; pi<freq.length; pi++){
    // 			freq[pi]+=frequencies["genotypes"][region][gt][pi];
    // 		}
    // 	}else if (frequencies["mutations"] !== undefined){
    // 		var tmp_mut = gt.split(':');
    // 		var mut ="";
    // 		if (tmp_mut.length==1){
    // 			mut = default_gene+":"+gt;
    // 		}else{
    // 			mut = gt;
    // 		}
    // 		if (frequencies["mutations"][region][mut]!==undefined) {
    // 			console.log(gt+" found as mutation");
    // 			for (var pi=0; pi<freq.length; pi++){
    // 				freq[pi]+=frequencies["mutations"][region][mut][pi];
    // 			}
    // 		}else{
    // 			console.log("not found "+gt);
    // 		}
    // 	}else{
    // 		console.log("not found "+gt);
    // 	}
    // 	return freq.map(function (d) {return Math.round(d*100)/100;});
    // };

    // var freqDataString = "";
    // function make_gt_chart(gt){
    // 	var tmp_data = [];
    // 	var tmp_trace = ['x'];
    // 	var tmp_colors = {};
    // 	tmp_data.push(tmp_trace.concat(pivots));
    // 	gt.forEach(function (d, i) {
    // 		var region = d[0];
    // 		var genotype = d[1];
    // 		var freq = get_frequencies(region, genotype);
    // 		console.log(region+' '+genotype);
    // 		if (d3.max(freq)>0) {
    // 			var tmp_trace = genotype.toString().replace(/,/g, ', ');
    // 			if (region != "global") {
    // 				tmp_trace = region + ':\t' + tmp_trace;
    // 			}
    // 			tmp_data.push([tmp_trace].concat(freq));
    // 			tmp_colors[tmp_trace] = genotypeColors[i];
    // 		}
    // 	});
    // 	console.log(tmp_colors);
    // 	gt_chart.load({
    //        	columns: tmp_data,
    //        	unload: true
    // 	});
    // 	gt_chart.data.colors(tmp_colors);
    // 	// construct a tab separated string the frequency data
    // 	freqDataString="";
    // 	for (var ii=0; ii<tmp_data[0].length; ii+=1){
    // 		for (var jj=0; jj<tmp_data.length; jj+=1){
    // 			freqDataString += "" + tmp_data[jj][ii] + ((jj<tmp_data.length-1)?"\t":"\n");
    // 		}
    // 	}
    // }

    // function addClade(d) {
    // 	if (typeof gt_chart != "undefined"){
    // 		var plot_data = [['x'].concat(rootNode["pivots"])];
    // 		var reg = "global";
    // 		if ((typeof d.target.freq !="undefined" )&&(d.target.freq[reg] != "undefined")){
    // 			plot_data[plot_data.length] = [reg].concat(d.target.freq[reg]);
    // 		}
    // 		if (plot_data.length > 1) {
    // 			if (plot_data[1][0] == "global") {
    // 				plot_data[1][0] = "clade";
    // 			}
    // 		}
    // 		gt_chart.load({
    // 	       	columns: plot_data
    // 		});
    // 	}
    // }

    // function removeClade() {
    // 	if (typeof gt_chart != "undefined"){
    // 		gt_chart.unload({
    // 	       	ids: ["clade"]
    // 		});
    // 	}
    // }

    // width = parseInt(d3.select(".freqplot-container").style("width"), 10);
    // height = 250;
    // var position = "inset";

    // var gt_chart = c3.generate({
    // 	bindto: '#gtchart',
    // 	size: {width: width-10, height: height},
    // 	onresize: function() {
    // 		width = parseInt(d3.select(".freqplot-container").style("width"), 10);
    // 		height = 250;
    // 		gt_chart.resize({height: height, width: width});
    // 	},
    // 	legend: {
    // 		position: position,
    // 		inset: {
    //     		anchor: 'top-right',
    //     		x: 10,
    //     		y: -15,
    //     		step: 1
    //     	}
    // 	},
    //   	color: {
    //         pattern: genotypeColors
    //     },
    // 	axis: {
    // 		y: {
    // 			label: {
    // 				text: 'frequency',
    // 				position: 'outer-middle'
    // 			},
    // 			tick: {
    // 				values: [0.0, 0.2, 0.4, 0.6, 0.8, 1.0],
    // 				outer: false
    // 			},
    //             min: 0,
    // 			max: 1
    // 		},
    // 		x: {
    // 			label: {
    // 				text: 'time',
    // 				position: 'outer-center'
    // 			},
    // 			tick: {
    // 				values: time_ticks,
    // 				outer: false
    // 			}
    // 		}
    // 	},
    // 	data: {
    // 		x: 'x',
    // 		columns: [],
    // 	}
    // });

    // // d3.json(path + file_prefix + "frequencies.json", function(error, json){
    // 	// console.log(error);
    // 	// frequencies = json;
    // 	pivots = frequencies["mutations"]["global"]["pivots"].map(function (d) {
    // 		return Math.round(parseFloat(d)*100)/100;
    // 	});
    // 	var ticks = [Math.round(pivots[0])];
    // 	var tick_step = Math.round((pivots[pivots.length-1]-pivots[0])/6*10)/10;
    // 	while (ticks[ticks.length-1]<pivots[pivots.length-1]){
    // 		ticks.push(Math.round((ticks[ticks.length-1]+tick_step)*10)/10);
    // 	}
    // 	//gt_chart.axis.x.values = ticks;
    // 	/**
    // 		parses a genotype string into region and positions
    // 	**/

    // 	var chart_data = {}
    // 	var chart_types = {}
    // 	var chart_xaxis = {}
    // 	var posToAA = {};
    // 	var ymin = 0;
    // 	var xmax = 0;
    // 	if (typeof genome_annotation !== 'undefined') {
    // 		for (x in genome_annotation){
    // 			chart_data['x'+x+'anno'] = genome_annotation[x][1];
    // 			chart_data[x+'anno'] = genome_annotation[x][0].map(function(d) {return -0.1*d;});
    // 			if (ymin>chart_data[x+'anno'][0]){
    // 				ymin = chart_data[x+'anno'][0];
    // 			}
    // 			chart_types[x+'anno'] = 'line';
    // 			chart_xaxis[x+'anno'] = 'x'+x+'anno';
    // 		}
    // 		ymin-=0.08;
    // 	}

    // 	for (gene in frequencies["entropy"]){
    // 		chart_data[gene]=[];
    // 		chart_data['x'+gene]=[];
    // 		chart_types[gene]='bar';
    // 		chart_xaxis[gene]='x'+gene;
    // 		var offset = frequencies['location'][gene][0];
    // 		for (var ii=0;ii<frequencies["entropy"][gene].length;ii+=1){
    // 			if (Math.round(10000*frequencies["entropy"][gene][ii][1])/10000>0.05){
    // 				chart_data[gene].push(Math.round(10000*frequencies["entropy"][gene][ii][1])/10000);
    // 				chart_data['x'+gene].push(ii*3+offset);
    // 				posToAA[ii*3+offset] = [gene, ii];
    // 				if ((ii*3+offset)>xmax) {xmax = (ii*3+offset);}
    // 			}
    // 		}
    // 	}
    // 	var entropy_chart = c3.generate({
    // 		bindto: '#entropy',
    // 		size: {width: width-10, height: height},
    // 		onresize: function() {
    // 			width = parseInt(d3.select(".entropy-container").style("width"), 10);
    // 			height = 250;
    // 			entropy_chart.resize({height: height, width: width});
    // 		},
    // 		legend: {show: false},
    // 		color: {pattern: ["#AAA"]},
    // 		axis: {
    // 			y: {
    // 				label: {
    // 					text: 'variability',
    // 					position: 'outer-middle'
    // 				},
    // 				tick: {
    // 					values: [0.0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6],
    // 					outer: false
    // 				},
    // 				min:ymin,
    // 			},
    // 			x: {
    // 				label: {
    // 					text: 'position',
    // 					position: 'outer-center'
    // 				},
    // 				tick: {
    // 					outer: false,
    // 					values: ([1,2,3,4,5]).map(function (d){
    // 						var dec = Math.pow(10,Math.floor(Math.log10(xmax/5)))
    // 						var step = dec*Math.floor(xmax/5/dec);
    // 						return d*step;
    // 					})
    // 				}
    // 			},
    // 		},
    // 		data: {
    // 			xs: chart_xaxis,
    // 			json: chart_data,
    // 			types: chart_types,
    // 			onclick: function (d,i) {
    //             	gene = posToAA[d.x][0];
    //             	var pos = posToAA[d.x][1];
    // 				if (frequencies["entropy"][gene][pos][2].length>1){
    // 					var tmp = [];
    // 					for (var ii=0;ii<frequencies["entropy"][gene][pos][2].length;ii+=1){
    // 						tmp.push(["global",d.x+frequencies["entropy"][gene][pos][2][ii]]);
    // 					}
    // 					colorBy = "genotype";
    // 					console.log("color by genotype: "+gene + ' ' + pos)
    // 					colorByGenotypePosition([[gene, pos]]);
    // 					d3.select("#gt-color").property("value", gene + ':' + (pos+1));
    // 				}
    // 		    },
    // 		    onmouseover: function (d){
    // 		    	document.body.style.cursor = "pointer";
    // 		    },
    // 		    onmouseout: function (d){
    // 		    	document.body.style.cursor = "default";
    // 		    },
    // 			labels:{
    // 				format:function (v, id, i, j){
    // 					if ((typeof id !="undefined")&&(id.substring(id.length-4)=='anno')&&(i==1)){
    // 						return id.substring(0,id.length-4);
    // 					}else{return '';}
    // 				}
    // 			},
    // 		},
    // 		bar: {width: 2},
    // 	    grid: {
    //     	    y: {
    //         	    lines: [{value: 0}]
    //         	},
    //         	focus:{
    //         		show:false
    //         	}
    //     	},
    // 	    tooltip: {
    // 	        format: {
    // 	            title: function (d) {
    // 	            	if (typeof posToAA[d] != "undefined"){
    // 		            	var gene = posToAA[d][0];
    // 		            	var pos = posToAA[d][1];
    // 		            	return gene + ' codon ' + (pos+1) + frequencies["entropy"][gene][pos][2].join(",");
    // 		            }else{ return d;}},
    // 	            value: function (value, ratio, id) {
    // 	                return id.substring(id.length-4)=='anno'?"start/stop":"Variability: "+value;
    // 	            }
    // 	        }
    // 		},
    // 	});

    // 	d3.select("#plotfreq")
    // 		.on("click", function (){
    // 			gt = parse_gt_string(document.getElementById("gtspec").value);
    // 			make_gt_chart(gt);
    // 		});
    // 	d3.select("#downloadfreq")
    // 		.on("click", function (){
    // 			gt = parse_gt_string(document.getElementById("gtspec").value);
    // 			make_gt_chart(gt);
    // 			var blob = new Blob([freqDataString], {type: "text/plain;charset=utf-8"});
    // 			saveAs(blob,'frequencies.tsv');
    // 		});
    // 	make_gt_chart(parse_gt_string(document.getElementById("gtspec").value));
    // // });

    /*********************************
    **********************************
    **********************************
    **********************************
    ** Structure
    **********************************
    **********************************
    **********************************
    *********************************/

    //var options = {
    //  width: 500,
    //  height: 500,
    //  antialias: true,
    //  quality : 'medium'
    //};
    //
    //function make_structure(){
    //	// insert the viewer under the Dom element with id 'gl'.
    //	var parent = document.getElementById('HA_struct')
    //	var viewer = pv.Viewer(parent, options);
    //
    //	function setColorForAtom(go, atom, color) {
    //	    var view = go.structure().createEmptyView();
    //	    view.addAtom(atom);
    //	    go.colorBy(pv.color.uniform(color), view);
    //	}
    //
    //	// variable to store the previously picked atom. Required for resetting the color
    //	// whenever the mouse moves.
    //	var prevPicked = null;
    //	// add mouse move event listener to the div element containing the viewer. Whenever
    //	// the mouse moves, use viewer.pick() to get the current atom under the cursor.
    //	parent.addEventListener('mousemove', function(event) {
    //	    var rect = viewer.boundingClientRect();
    //	    var picked = viewer.pick({ x : event.clientX - rect.left,
    //	                               y : event.clientY - rect.top });
    //	    if (prevPicked !== null && picked !== null &&
    //	        picked.target() === prevPicked.atom) {
    //	      return;
    //	    }
    //	    if (prevPicked !== null) {
    //	      // reset color of previously picked atom.
    //	      setColorForAtom(prevPicked.node, prevPicked.atom, prevPicked.color);
    //	    }
    //	    if (picked !== null) {
    //	      var atom = picked.target();
    //	      document.getElementById('residue_name').innerHTML = atom.qualifiedName();
    //	      // get RGBA color and store in the color array, so we know what it was
    //	      // before changing it to the highlight color.
    //	      var color = [0,0,0,0];
    //	      picked.node().getColorForAtom(atom, color);
    //	      prevPicked = { atom : atom, color : color, node : picked.node() };
    //
    //	      setColorForAtom(picked.node(), atom, 'red');
    //	    } else {
    //	      document.getElementById('residue_name').innerHTML = '&nbsp;';
    //	      prevPicked = null;
    //	    }
    //	    viewer.requestRedraw();
    //	});
    //	pv.io.fetchPdb("/data/"+structure, function(structure) {
    //	  // display the protein as cartoon, coloring the secondary structure
    //	  // elements in a rainbow gradient.
    //	  viewer.cartoon('protein', structure); //, { color : color.ssSuccession() });
    //	  viewer.centerOn(structure);
    //	  viewer.on('viewerReady', function() {
    //    	  var go = viewer.cartoon('structure', structure);
    //      	// adjust center of view and zoom such that all structures can be seen.
    //      	viewer.autoZoom();
    //	   });o
    //	});
    //}
    //
    //var myapplett;
    //

    // function make_structure(){
    // 	console.log('drawing structure');
    // 	var jsmolscript =  "load /data/"+structure+"; cpk off; wireframe off; cartoon ONLY; trace;zoom on;"
    // 					   +"zoom 115;set showhydrogens off; color background white;"
    // 					   +" select ligand; trace off; spin off; set frank off; "
    // 					   +"set echo bottom left; color echo gray; font echo 14 arial;"
    // 					   +structure_HI_mutations
    // 					   +" select (chain==C); color [xFFFFFF]; select (chain==D); color [xFFFFFF];"
    // 					   +" select (chain==E); color [xFFFFFF]; select (chain==F); color [xFFFFFF];";
    // 	console.log(jsmolscript);
    // 	Info = {
    // 		width: 500,
    // 		height: 500,
    // 		debug: false,
    // 		j2sPath: "/js/j2s",
    // 		color: "white",
    // 		disableJ2SLoadMonitor: true,
    // 		disableInitialConsole: true,
    // 		addSelectionOptions: false,
    // 		use: "HTML5",
    // 		readyFunction: null,
    // 		script:	jsmolscript}
    //
    // 	myapplett = $("#HA_struct").html(Jmol.getAppletHtml("jmolApplet0",Info));
    // 	var structCaption = document.getElementById('struct_caption');
    // 	struct_caption.innerHTML='JSmol rendering of <a target="_blank" href="http://www.rcsb.org/pdb/explore/explore.do?structureId='+structure.substring(0,4)+'">'+structure.substring(0,4)+'</a>';
    // }

};
