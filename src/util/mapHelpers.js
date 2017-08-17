import d3 from "d3";
import _ from "lodash";

/* util */

export const pathStringGenerator = d3.svg.line()
  .x((d) => { return d.x })
  .y((d) => { return d.y })
  .interpolate("basis");

const extractLineSegmentForAnimationEffect = (
  numDateMin,
  numDateMax,
  originCoords,
  destinationCoords,
  originNumDate,
  destinationNumDate,
  visible,
  bezierCurve,
  bezierDates
) => {

  if (visible === "hidden") {
    return [];
  }

  // want to slice out all points that lie between numDateMin and numDateMax
  // and append interpolated start and end points
  // initial data
  // bezierDates = [ 2015.1    2015.2    2015.3    2015.4    2015.5 ]
  // bezierCurve = [ x0,y0     x1,y1     x2,y2     x3,y3     x4,y4  ]
  //
  // scenario A: numDateMin = 2015.25, numDateMax = 2015.45
  // bezierDates = [ 2015.25  2015.3    2015.4  2015.45 ]
  // bezierCurve = [ x12,y12  x2,y2     x3,y3   x34,y34 ]
  // startIndex is 2 in scenario A
  // endIndex is 3 in scenario A
  //
  // scenario B: numDateMin = 2014.5, numDateMax = 2015.45
  // bezierDates = [ 2015.1    2015.2    2015.3    2015.4  2015.45 ]
  // bezierCurve = [ x0,y0     x1,y1     x2,y2     x3,y3   x34,y34 ]
  // startIndex is 0 in scenario B
  // endIndex is 3 in scenario B
  //
  // scenario C: numDateMin = 2015.25, numDateMax = 2015.7
  // bezierDates = [ 2015.25  2015.3    2015.4    2015.5 ]
  // bezierCurve = [ x12,y12  x2,y2     x3,y3     x4,y4  ]
  // startIndex is 2 in scenario C
  // endIndex is 4 in scenario C
  //
  // scenario D: numDateMin = 2015.6, numDateMax = 2015.9
  // bezierDates = [ ]
  // bezierCurve = [ ]
  // startIndex is -1 in scenario D
  // endIndex is 4 in scenario D

  // find start
  const startIndex = _.findIndex(bezierDates, function (d) { return d > numDateMin; });

  // find end
  const endIndex = _.findLastIndex(bezierDates, function (d) { return d < numDateMax; });

  // startIndex and endIndex is -1 if not found
  // this indicates a slice of time that lies outside the bounds of BCurve
  // return empty array
  if (startIndex === -1 || endIndex === -1) {
    return [];
  }

  // get curve
  // slice takes index at begin
  // slice extracts up to but not including end
  const curve = bezierCurve.slice(startIndex, endIndex + 1);

  // if possible construct and prepend interpolated start
  let newStart;
  if (startIndex > 0) {
    // determine weighting of positions at startIndex and startIndex-1
    const dateDiff = bezierDates[startIndex] - bezierDates[startIndex - 1];
    const weightRight = (numDateMin - bezierDates[startIndex - 1]) / dateDiff;
    const weightLeft = (bezierDates[startIndex] - numDateMin) / dateDiff;
    // construct interpolated new start
    newStart = {
      x: weightLeft * bezierCurve[startIndex - 1].x + weightRight * bezierCurve[startIndex].x,
      y: weightLeft * bezierCurve[startIndex - 1].y + weightRight * bezierCurve[startIndex].y
    };
    // will break indexing, so wait to prepend
  }

  // if possible construct and prepend interpolated start
  let newEnd;
  if (endIndex < bezierCurve.length - 1) {
    // determine weighting of positions at startIndex and startIndex-1
    const dateDiff = bezierDates[endIndex + 1] - bezierDates[endIndex];
    const weightRight = (numDateMax - bezierDates[endIndex]) / dateDiff;
    const weightLeft = (bezierDates[endIndex + 1] - numDateMax) / dateDiff;
    // construct interpolated new end
    newEnd = {
      x: weightLeft * bezierCurve[endIndex].x + weightRight * bezierCurve[endIndex + 1].x,
      y: weightLeft * bezierCurve[endIndex].y + weightRight * bezierCurve[endIndex + 1].y
    };
    // will break indexing, so wait to append
  }

  // prepend / append interpolated points if they exist
  if (newStart) {
    curve.unshift(newStart);
  }
  if (newEnd) {
    curve.push(newEnd);
  }
  return curve;
};

export const drawDemesAndTransmissions = (
  demeData,
  transmissionData,
  g,
  map,
  nodes,
  numDateMin,
  numDateMax
) => {

  // define markers that are appended to the definition part of the group
  let markerCount=0;
  const makeMarker = function (d){
    markerCount++;
    // console.log(markerCount, d);
    const mID = "marker"+markerCount.toString();
    g.append("defs").selectAll("marker")
      .data([mID])
      .enter().append("marker")
        .attr("id", mID)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 0)
        .attr("refY", 0)
        // the next two lines set the marker size relative to the stroke-width
        .attr("markerWidth",  (x) => { return Math.max(1.5, 7.0 / d.data.total); })
        .attr("markerHeight", (x) => { return Math.max(1.5, 7.0 / d.data.total); })
        .attr("orient", "auto")
      .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("stroke-width",0)
        .attr("fill-opacity",0.5)
        .attr("fill", function(){return d.data.color;});
    return "url(#"+mID+")";
  }

  /*
    we're ditching geodesic. That means we don't have inner parts anymore.
    538 actually solved that... http://bl.ocks.org/bycoffe/18441cddeb8fe147b719fab5e30b5d45
    then we want to deeplink to animation state... which this may help with: http://jsfiddle.net/henbox/b4bbgdnz/5/
  */

  // add transmission lines with mid markers at each inner point of the path

  const transmissions = g.selectAll("transmissions")
    .data(transmissionData)
    .enter()
    .append("path") /* instead of appending a geodesic path from the leaflet plugin data, we now draw a line directly between two points */
    .attr("d", (d, i) => {
      return pathStringGenerator(
        extractLineSegmentForAnimationEffect(
          numDateMin,
          numDateMax,
          d.originCoords,
          d.destinationCoords,
          d.originNumDate,
          d.destinationNumDate,
          d.visible,
          d.bezierCurve,
          d.bezierDates
        )
      );
    }) /* with the interpolation in the function above pathStringGenerator */
    .attr("fill","none")
    .attr("stroke-opacity", .6)
    .attr("stroke-linecap", "round")
    .attr("stroke", (d) => { return d.color }) /* colorScale(d.data.from); color path by contry in which the transmission arrived */
    .attr("stroke-width", 1) /* scale line by total number of transmissions */
    // .attr("marker-mid", makeMarker);

  // let transmissionPathLengths = [];
  // transmissions[0].forEach((d, i) => {
  //
  //   /* https://developer.mozilla.org/en-US/docs/Web/API/SVGGeometryElement/getTotalLength */
  //   const totalPathLength = d.getTotalLength();
  //
  //   /*
  //     1. Here, we make a mapping between time and geographic position for the transmission.
  //     2. In short, make the line visible in proportion to the user selected date range, which
  //         may not include the entire length of the line.
  //     3. .clamp(true)
  //         never return a value outside the date range
  //         this would put the transmission path outside the geographic target
  //   */
  //
  //   const pathScale = d3.scale.linear()
  //                             .domain([
  //                               nodes[latLongs.transmissions[i].data.demePairIndices[0]].attr.num_date, /* origin date */
  //                               nodes[latLongs.transmissions[i].data.demePairIndices[1]].attr.num_date /* destination date */
  //                             ])
  //                             .range([0, totalPathLength])
  //                             .clamp(true);
  //
  //   transmissionPathLengths.push({
  //     totalPathLength,
  //     pathScale,
  //   })
  // })

  const demes = g.selectAll("demes")
    .data(demeData)
    .enter().append("circle")
    .style("stroke", "none")
    .style("fill-opacity", 0.65)
    .style("fill", (d) => { return d.color })
    .attr("r", (d) => { return 0 + Math.sqrt(d.count) * 4 })
    .attr("transform", (d) => {
      return "translate(" + d.coords.x + "," + d.coords.y + ")";
    });

  return {
    demes,
    transmissions,
    // transmissionPathLengths
  };

}

export const updateOnMoveEnd = (demeData, transmissionData, d3elems, numDateMin, numDateMax, nodes) => {
  /* map has moved or rescaled, make demes and transmissions line up */
  if (d3elems) {
    d3elems.demes
      .data(demeData)
      .attr("transform", (d) => {
        return "translate(" + d.coords.x + "," + d.coords.y + ")";
      })

    d3elems.transmissions
      .data(transmissionData)
      .attr("d", (d, i) => {
        return pathStringGenerator(
          extractLineSegmentForAnimationEffect(
            numDateMin,
            numDateMax,
            d.originCoords,
            d.destinationCoords,
            d.originNumDate,
            d.destinationNumDate,
            d.visible,
            d.bezierCurve,
            d.bezierDates
          )
        );
      }) /* with the interpolation in the function above pathStringGenerator */
  }
}

export const updateVisibility = (
  demeData,
  transmissionData,
  d3elems,
  map,
  nodes,
  numDateMin,
  numDateMax
) => {

  d3elems.demes
    .data(demeData)
    .transition(5)
    .style("fill", (d) => { return d.count > 0 ? d.color : "white"; })
    .attr("r", (d) => { return 0 + Math.sqrt(d.count) * 4; });

  d3elems.transmissions
    .data(transmissionData)
    .attr("d", (d) => {
      return pathStringGenerator(
        extractLineSegmentForAnimationEffect(
          numDateMin,
          numDateMax,
          d.originCoords,
          d.destinationCoords,
          d.originNumDate,
          d.destinationNumDate,
          d.visible,
          d.bezierCurve,
          d.bezierDates
        )
      );
    }) /* with the interpolation in the function above pathStringGenerator */
    .attr("stroke", (d) => { return d.color; });
};

/* template for an update helper */
export const updateFoo = (d3elems, latLongs) => {
  d3elems.demes
    .data(latLongs.demes)

  d3elems.transmissions
    .data(latLongs.transmissions)
}




// const translateAlong = (path) => {
//   var totalPathLength = path.getTotalLength();
//   return (datum, index) => {
//     return (t) => {
//       var p = path.getPointAtLength(t * totalPathLength);
//       return "translate(" + p.x + "," + p.y + ")";
//     };
//   };
// };

// const missiles = transmissionPaths.map((transmissionPath) => {
//
//   // console.log(transmissionPath)
//
//   const missile = g.append("circle")
//     .attr("r", 0)
//     .attr("fill", (d) => { return colorScale(transmissionPath.transmission.to) })
//     .attr("transform", `translate(
//       ${transmissionPath.partialTransmission[0].x},
//       ${transmissionPath.partialTransmission[0].y}
//     )`) /* begin the missile on the start of the line */
//     // .transition()
//     // .duration(5000)
//     // .attrTween("transform", translateAlong(transmissionPath.elem.node()));
//
//   return missile;
// })

// const setTipCoords = () => {
//   demes.attr("transform", (d) => {
//     return "translate(" + d.coords.x + "," + d.coords.y + ")";
//   });
// };

// const animateTransmissions = () => {
//   /* point along path interpolation https://bl.ocks.org/mbostock/1705868 */
//
// }

// setTipCoords();
// map.on("viewreset", setTipCoords); /* search: -Note (A) for an idea as to why this might not be working properly */
// animateTransmissions();

/*
  http://gis.stackexchange.com/questions/49114/d3-geo-path-to-draw-a-path-from-gis-coordinates
  https://bl.ocks.org/mbostock/3916621  // Compute point-interpolators at each distance.
  http://bl.ocks.org/mbostock/5851933 // draw line on map
  https://gist.github.com/mikeatlas/0b69b354a8d713989147 // polyline split if we don't use leaflet
  http://bl.ocks.org/mbostock/5928813
  http://bl.ocks.org/duopixel/4063326 // animate path in
  https://bl.ocks.org/mbostock/1705868 // point along path interpolation
  https://bl.ocks.org/mbostock/1313857 // point along path interpolation
  https://github.com/d3/d3-shape/blob/master/README.md#curves
  https://github.com/d3/d3-shape/blob/master/README.md#lines
*/

// since we're now using d3 we'll probably do something like http://stackoverflow.com/questions/11808860/arrow-triangles-on-my-svg-line/11809868#11809868
// decorator docs: https://github.com/bbecquet/Leaflet.PolylineDecorator
