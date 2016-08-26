import React from "react";
import Radium from "radium";
// import _ from "lodash";
// import Flex from "./framework/flex";
// import { connect } from "react-redux";
// import { FOO } from "../actions";


// @connect(state => {
//   return state.FOO;
// })
@Radium
class FrequenciesGraph extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

    };
  }
  static propTypes = {
    /* react */
    // dispatch: React.PropTypes.func,
    params: React.PropTypes.object,
    routes: React.PropTypes.array,
    /* component api */
    style: React.PropTypes.object,
    // foo: React.PropTypes.string
  }
  static defaultProps = {
    // foo: "bar"
  }
  getStyles() {
    return {
      base: {

      }
    };
  }
  render() {
    const styles = this.getStyles();
    return (
      <div style={[
        styles.base,
        this.props.style
      ]}>
        {"FrequenciesGraph"}
      </div>
    );
  }
}

export default FrequenciesGraph;


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
