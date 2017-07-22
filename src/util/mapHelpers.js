import d3 from "d3";

/* util */

export const pathStringGenerator = d3.svg.line()
  .x((d) => { return d.x })
  .y((d) => { return d.y })
  .interpolate("basis");

const extractLineSegmentForAnimationEffect = (
  numDateMin,
  numDateMax,
  minTransmissionDate,
  originCoords,
  destinationCoords,
  originNumDate,
  destinationNumDate,
  visible
) => {

  const pair = [originCoords, destinationCoords];

  /* manually find the points along a Bezier curve at which we should be given the user date selection */
  let start = Math.max(
    0.0, // clamp start at 0.0 if userDateMin gives a number < 0
    (numDateMin - originNumDate) / (destinationNumDate - originNumDate)
  );

  let end = Math.min(
    1.0, // clamp end at 1.0 if userDateMax gives a number > 1
    (numDateMax - originNumDate) / (destinationNumDate - originNumDate)
  );

  if (!isFinite(start)){ // For 0 branch-length transmissions, (destinationDate-originDate) is 0 --> +/- Infinity values for start and end.
    start = 0.0;
  };

  if (!isFinite(end)){
    end = start + 1e-6;
  };

  if (visible === "hidden") {
    start = 0.0;
    end = 1e-6;
  }

  /* calculate Bezier from pair[0] to pair[1] with control point positioned at
  distance (destinationDate-minTransmissionDate)*25.0 perpendicular to center of the line
  between pair[0] and pair[1]. */
  const Bcurve = Bezier(
    [pair[0],
    computeMidpoint(
      pair,
      (destinationNumDate-minTransmissionDate) * 25.0
    ),
      pair[1]],
      start,
      end,
      15
  );

  return Bcurve;
};

export const drawDemesAndTransmissions = (demeData, transmissionData, g, map, nodes, numDateMin, numDateMax, minTransmissionDate) => {

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

  /* we're ditching geodesic. That means we don't have inner parts anymore.
    538 actually solved that... http://bl.ocks.org/bycoffe/18441cddeb8fe147b719fab5e30b5d45
    then we want to deeplink to animation state... which this may help with: http://jsfiddle.net/henbox/b4bbgdnz/5/
  */
  // add transmission lines with mid markers at each inner point of the path

  const transmissions = g.selectAll("transmissions")
    .data(transmissionData)
    .enter()
    .append("path") /* instead of appending a geodesic path from the leaflet plugin data, we now draw a line directly between two points */
    .attr("d", (d, i) => {
      // extractLineSegmentForAnimationEffect(
      //   numDateMin,
      //   numDateMax,
      //   minTransmissionDate,
      //   d.originCoords,
      //   d.destinationCoords,
      //   d.originNumDate,
      //   d.destinationNumDate,
      //   d.visible
      // )
      return pathStringGenerator(d.bezierCurve)
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
    .style("fill-opacity", .6)
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

export const updateOnMoveEnd = (demeData, transmissionData, minTransmissionDate, d3elems, numDateMin, numDateMax, nodes) => {
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
        return pathStringGenerator(d.bezierCurve)

        // return pathStringGenerator(
        //   extractLineSegmentForAnimationEffect(
        //     numDateMin,
        //     numDateMax,
        //     minTransmissionDate,
        //     d.originCoords,
        //     d.destinationCoords,
        //     d.originNumDate,
        //     d.destinationNumDate,
        //     d.visible
        //   )
        // )
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
  numDateMax,
  minTransmissionDate
) => {

  d3elems.demes
    .data(demeData)
    .transition(5)
    .style("fill", (d) => { return d.count > 0 ? d.color : "white" })
    .attr("r", (d) => { return 0 + Math.sqrt(d.count) * 4 });

  d3elems.transmissions
    .data(transmissionData)
    .attr("d", (d, i) => {
      try{
        return pathStringGenerator(d.bezierCurve)
        // return pathStringGenerator(
        //   extractLineSegmentForAnimationEffect(
        //     numDateMin,
        //     numDateMax,
        //     minTransmissionDate,
        //     d.originCoords,
        //     d.destinationCoords,
        //     d.originNumDate,
        //     d.destinationNumDate,
        //     d.visible
        //   )
        // );
      } catch (e) {
        console.log("Bezier error");
        // console.log(e); /* uncomment this for the stack trace */
        return "";
      }
    }) /* with the interpolation in the function above pathStringGenerator */
    .attr("stroke", (d) => { return d.color })

}

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
