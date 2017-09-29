import d3 from "d3"

function drawTimeline(data, width, height) {

	var causes = ["wounds", "other", "disease"];

	var parseDate = d3.time.format("%m/%Y").parse;

	var margin = {top: 20, right: 50, bottom: 30, left: 20},
	    width = width - margin.left - margin.right,
	    height = height - margin.top - margin.bottom;

	var x = d3.scale.ordinal()
	    .rangeRoundBands([0, width]);

	var y = d3.scale.linear()
	    .rangeRound([height, 0]);

	var z = d3.scale.category10();

	var xAxis = d3.svg.axis()
	    .scale(x)
	    .orient("bottom")
	    .tickFormat(d3.time.format("%b"));

	var yAxis = d3.svg.axis()
	    .scale(y)
	    .orient("right");

	const url = "https://gist.githubusercontent.com/mbostock/1134768/raw/f5e7d201ca4e27f3d09aaca752ead821880512ab/crimea.tsv"
	var svg = d3.select("#timelineAttachPointD3").append("svg")
	    .attr("width", width)
	    .attr("height", height)
	  .append("g")
	    // .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	d3.tsv(url, type, function(error, crimea) {
	  if (error) throw error;

		// console.log("step 1")

	  var layers = d3.layout.stack()(causes.map(function(c) {

			// console.log('step 2', crimea.map(function(d) {
	    //   return {x: d.date, y: d[c]};
	    // }))

	    return crimea.map(function(d) {
	      return {x: d.date, y: d[c]};
	    });
	  }));

	  x.domain(layers[0].map(function(d) { return d.x; }));
	  y.domain([0, d3.max(layers[layers.length - 1], function(d) { return d.y0 + d.y; })]).nice();

	  var layer = svg.selectAll(".layer")
	      .data(layers)
	    .enter().append("g")
	      .attr("class", "layer")
	      .style("fill", function(d, i) { return z(i); });

	  layer.selectAll("rect")
	      .data(function(d) { return d; })
	    .enter().append("rect")
	      .attr("x", function(d) { return x(d.x); })
	      .attr("y", function(d) { return y(d.y + d.y0); })
	      .attr("height", function(d) { return y(d.y0) - y(d.y + d.y0); })
	      .attr("width", x.rangeBand() - 1);

	  svg.append("g")
	      .attr("class", "axis axis--x")
	      .attr("transform", "translate(0," + height + ")")
	      .call(xAxis);

	  svg.append("g")
	      .attr("class", "axis axis--y")
	      .attr("transform", "translate(" + width + ",0)")
	      .call(yAxis);
	});

	function type(d) {
	  d.date = parseDate(d.date);
	  causes.forEach(function(c) { d[c] = +d[c]; });
	  return d;
	}
};
export default drawTimeline
