


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

  /* this was in tree but leaving here for now as feels seperate */

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
