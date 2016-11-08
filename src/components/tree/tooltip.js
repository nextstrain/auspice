import React from "react";
import Radium from "radium";
import * as globals from "../../util/globals";

@Radium
class Tooltip extends React.Component {
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
    node: React.PropTypes.object.isRequired
  }
  static defaultProps = {
    // foo: "bar"
  }
  createText() {
    const d = this.props.node;
    let string = "";

    if (typeof d.frequency !== "undefined") {
      string += "Frequency: " + (100 * d.frequency).toFixed(1) + "%";
    }
    // if (typeof d.dHI !== "undefined") {
    //   string += "<br>Titer drop: " + d.dHI.toFixed(2);
    // }
    // if ((typeof d.aa_muts !== "undefined") && (globals.mutType === "aa")) {
    //   let ncount = 0;
    //   for (tmp_gene in d.aa_muts) {
    //     ncount += d.aa_muts[tmp_gene].length;
    //   }
    //   if (ncount) {
    //     string += "<b>Mutations:</b><ul>";
    //   }
    //   for (tmp_gene in d.aa_muts) {
    //     if (d.aa_muts[tmp_gene].length) {
    //       string+="<li>"+tmp_gene+":</b> "+d.aa_muts[tmp_gene].replace(/,/g, ', ') + "</li>";
    //     }
    //   }
    // } else
    if ((typeof d.muts !== "undefined") && (globals.mutType == "nuc") && (d.muts.length)) {
      let tmp_muts = d.muts;
      const nmuts = tmp_muts.length;
      tmp_muts = tmp_muts.slice(0, Math.min(10, nmuts));
      string += tmp_muts.join(", ");
      if (nmuts>10) {
        string+=" + "+ (nmuts-10) + " more";
      }
    }
    if (typeof d.fitness !== "undefined") {
      string += "Fitness: " + d.fitness.toFixed(3);
    }
    // string += "click to zoom into clade";

    return string;
  }
  render() {
    return (
      <g transform={
          "translate(" +
          5 +
          "," +
          5 +
          ")"
        }>
        <rect
          rx={2}
          ry={2}
          strokeWidth={1}
          fill="rgba(255,255,255,.5)"
          width={globals.width}
          height={50}></rect>
        <text
          style={{
            fontFamily: "Helvetica",
            fontSize: 16,
            fontWeight: 300,
          }}
          fill={"rgb(130,130,130)"}
          dx={10}
          dy={23}
          textAnchor={"start"}>
          {this.createText()}
        </text>
      </g>
    );
  }
}

export default Tooltip;

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
