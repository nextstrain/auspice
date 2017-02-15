
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
  ** Zoom and rescale from tree (will be completely rewritten)
  **********************************
  **********************************
  **********************************
  *********************************/

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
