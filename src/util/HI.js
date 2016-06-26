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
