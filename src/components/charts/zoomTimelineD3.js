import d3 from "d3"

function drawTimeline(data, colors, chartWidth, chartHeight) {

data = _.map(data, parse)

// sizing information, including margins so there is space for labels, etc
var margin =  { top: 20, right: 20, bottom: 100, left: 20 },
		width = chartWidth - margin.left - margin.right,
		height = chartHeight - margin.top - margin.bottom,
		marginOverview = { top: chartHeight-70, right: margin.right, bottom: 20,  left: margin.left },
		heightOverview = chartHeight - marginOverview.top - marginOverview.bottom;

// mathematical scales for the x and y axes
var x = d3.time.scale()
								.range([0, width]);
var y = d3.scale.linear()
								.range([height, 0]);
var xOverview = d3.time.scale()
								.range([0, width]);
var yOverview = d3.scale.linear()
								.range([heightOverview, 0]);

// rendering for the x and y axes
var xAxis = d3.svg.axis()
								.scale(x)
								.orient("bottom");
var yAxis = d3.svg.axis()
								.scale(y)
								.orient("left");
var xAxisOverview = d3.svg.axis()
								.scale(xOverview)
								.orient("bottom");

// something for us to render the chart into
var svg = d3.select("#timelineAttachPointD3")
								.append("svg") // the overall space
										.attr("width", width + margin.left + margin.right)
										.attr("height", height + margin.top + margin.bottom);
var main = svg.append("g")
								.attr("class", "main")
								.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
var overview = svg.append("g")
										.attr("class", "overview")
										.attr("transform", "translate(" + marginOverview.left + "," + marginOverview.top + ")");

// brush tool to let us zoom and pan using the overview chart
var brush = d3.svg.brush()
										.x(xOverview)
										.on("brush", brushed);

// setup complete, let's get some data!
		// data ranges for the x and y axes
		x.domain(d3.extent(data, function(d) { return d.x; }));
		y.domain([0, d3.max(data, function(d) { return d.total; })]);
		xOverview.domain(x.domain());
		yOverview.domain(y.domain());

		// data range for the bar colours
		// (essentially maps attribute names to colour values)

		// draw the axes now that they are fully set up
		main.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + height + ")")
				.call(xAxis);
		main.append("g")
				.attr("class", "y axis")
				.call(yAxis);
		overview.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + heightOverview + ")")
				.call(xAxisOverview);

		// draw the bars
		main.append("g")
						.attr("class", "bars")
				// a group for each stack of bars, positioned in the correct x position
				.selectAll(".bar.stack")
				.data(data)
				.enter().append("g") // for each bin
						.attr("class", "bar stack")
						.attr("transform", function(d) {
							return "translate(" + x(d.x) + ",0)";
						})
				// a bar for each value in the stack, positioned in the correct y positions
				.selectAll("rect")
				.data(function(d) {return d.counts}) // for each category
				.enter().append("rect")
						.attr("class", "bar")
						.attr("width", 18) // make top level later on
						.attr("y", function(d) { return y(d.y1); })
						.attr("height", function(d) { return y(d.y0) - y(d.y1); })
						.style("fill", function(d) { return d.color; });

		overview.append("g")
								.attr("class", "bars")
				.selectAll(".bar")
				.data(data)
				.enter().append("rect")
						.attr("class", "bar")
						.attr("x", function(d) { return xOverview(d.date) - 3; })
						.attr("width", 6)
						.attr("y", function(d) { return yOverview(d.total); })
						.attr("height", function(d) { return heightOverview - yOverview(d.total); });

		// add the brush target area on the overview chart
		overview.append("g")
								.attr("class", "x brush")
								.call(brush)
								.selectAll("rect")
										// -6 is magic number to offset positions for styling/interaction to feel right
										.attr("y", -6)
										// need to manually set the height because the brush has
										// no y scale, i.e. we should see the extent being marked
										// over the full height of the overview chart
										.attr("height", heightOverview + 7);  // +7 is magic number for styling

// });

// by habit, cleaning/parsing the data and return a new object to ensure/clarify data object structure
function parse(d) {
		var value = { 'x': d.x, 'total': d.total}; // turn the date string into a date object

		// adding calculated data to each count in preparation for stacking
		var y0 = 0; // keeps track of where the "previous" value "ended"
		value.counts = colors.map(function(color) {
				return { color: color,
								 y0: y0,
								 // add this count on to the previous "end" to create a range, and update the "previous end" for the next iteration
								 y1: y0 += +d[color]
							 };
		});
		return value;
}

// zooming/panning behaviour for overview chart
function brushed() {
		// update the main chart's x axis data range
		x.domain(brush.empty() ? xOverview.domain() : brush.extent());
		// redraw the bars on the main chart
		main.selectAll(".bar.stack")
						.attr("transform", function(d) { return "translate(" + x(d.date) + ",0)"; })
		// redraw the x axis of the main chart
		main.select(".x.axis").call(xAxis);
}

}
export default drawTimeline
