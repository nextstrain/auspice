import d3 from "d3";

/* util */

export const pathStringGenerator = d3.svg.line()
  .x((d) => { return d.x })
  .y((d) => { return d.y })
  .interpolate("basis");

export const drawDemesAndTransmissions = (latLongs, colorScale, g, map, nodes) => {

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
    .data(latLongs.transmissions)
    .enter()
    .append("path") /* instead of appending a geodesic path from the leaflet plugin data, we now draw a line directly between two points */
    .attr("d", (d) => {
      return pathStringGenerator(
        // extractLineSegmentForAnimationEffect(d.data.originToDestinationXYs)
        d.data.originToDestinationXYs
      )
    }) /* with the interpolation in the function above pathStringGenerator */
    .attr("fill","none")
    .attr("stroke-opacity", .6)
    .attr("stroke-linecap", "round")
    .attr("stroke", (d) => { return d.data.color }) /* colorScale(d.data.from); color path by contry in which the transmission arrived */
    .attr("stroke-width", (d) => { return d.data.total }) /* scale line by total number of transmissions */
    // .attr("marker-mid", makeMarker);

    let transmissionPathLengths = [];
    transmissions[0].forEach((d, i) => {

      /* https://developer.mozilla.org/en-US/docs/Web/API/SVGGeometryElement/getTotalLength */
      const totalPathLength = d.getTotalLength();

      /*
        1. Here, we make a mapping between time and geographic position for the transmission.
        2. In short, make the line visible in proportion to the user selected date range, which
            may not include the entire length of the line.
        3. .clamp(true)
            never return a value outside the date range
            this would put the transmission path outside the geographic target
      */
      console.log(totalPathLength)
      const pathScale = d3.scale.linear()
                                .domain([
                                  nodes[latLongs.transmissions[i].data.demePairIndices[0]].attr.num_date, /* origin date */
                                  nodes[latLongs.transmissions[i].data.demePairIndices[1]].attr.num_date /* destination date */
                                ])
                                .range([0, totalPathLength])
                                .clamp(true);

      transmissionPathLengths.push({
        totalPathLength,
        pathScale,
      })
    })

  const demes = g.selectAll("demes")
    .data(latLongs.demes)
    .enter().append("circle")
    .style("stroke", "none")
    .style("fill-opacity", .6)
    .style("fill", (d) => { return d.color })
    .attr("r", (d) => { return 0 + Math.sqrt(d.total) * 4 })
    .attr("transform", (d) => {
      return "translate(" + d.coords.x + "," + d.coords.y + ")";
    });

  return {
    demes,
    transmissions,
    transmissionPathLengths
  };

}

export const updateOnMoveEnd = (d3elems, latLongs) => {
  /* map has moved or rescaled, make demes and transmissions line up */
  if (d3elems) {
    d3elems.demes
      .data(latLongs.demes)
      .attr("transform", (d) => {
        return "translate(" + d.coords.x + "," + d.coords.y + ")";
      })

    d3elems.transmissions
      .data(latLongs.transmissions)
      .attr("d", (d) => { return pathStringGenerator(d.data.originToDestinationXYs) })
  }
}

const extractLineSegmentForAnimationEffect = (pair, controls, d, nodes, d3elems, i) => {

  if (!nodes[d.data.demePairIndices[0]]) { console.warn("No node found for this index, which is needed to compare user dates to transmission origin/destination dates, so we're returning the default x y pair. No smaller, interior line will appear. This occurred because the index accessor for the node array returned from getLatLongs was not a valid value. Try a console log upstream of where demePairIndices is returned from src/util/mapHelpersLatLong.js"); return pair; } /* handle weird data */

  const originDate = nodes[d.data.demePairIndices[0]].attr.num_date;
  const destinationDate = nodes[d.data.demePairIndices[1]].attr.num_date;
  const userDateMin = controls.dateScale(controls.dateFormat.parse(controls.dateMin));
  const userDateMax = controls.dateScale(controls.dateFormat.parse(controls.dateMax));

  /*
    entire line is either visible or invisible, so return pair
  */
  if (
    userDateMin < originDate && userDateMax > destinationDate || /* visible ie., user: jan-dec 2015 origin/dest june-july 2015, so completely within */
    userDateMin > destinationDate || /* invisible ie., user: jan-dec 2015 dest: feb 1980 */
    userDateMax < originDate /* invisibile ie., user: jan-dec 2015 origin: feb 2017 */
  ) {
    return pair;
  } else {

    console.log(i + "---" + originDate + "---" + userDateMin + "---" + userDateMax + "---" + destinationDate);
    console.log(i + "=== totalPathLength ==== " + d3elems.transmissionPathLengths[i].totalPathLength)
    console.log(i + "=== origin =============", pair[0].x, pair[0].y)
    console.log(i + "=== destination ========", pair[1].x, pair[1].y)
    console.log(i + "=== scaled origin ======", d3elems.transmissionPathLengths[i].pathScale(userDateMin))
    console.log(i + "=== scaled destination =", d3elems.transmissionPathLengths[i].pathScale(userDateMax))

    /*
      1. input user dates to the scale which knows about origin/dest dates and total path length, derive proportion
      2. feed scaled number into get point at length
    */

    console.log("origin getPointAtlength ::::::: ", d3elems.transmissions[0][i].getPointAtLength(d3elems.transmissionPathLengths[i].pathScale(userDateMin)))
    console.log("dest getPointAtlength ::::::::: ", d3elems.transmissions[0][i].getPointAtLength(d3elems.transmissionPathLengths[i].pathScale(userDateMax)))

    return [
      d3elems.transmissions[0][i].getPointAtLength(d3elems.transmissionPathLengths[i].pathScale(userDateMin)),
      d3elems.transmissions[0][i].getPointAtLength(d3elems.transmissionPathLengths[i].pathScale(userDateMax))
    ]
  }
}

export const updateVisibility = (d3elems, latLongs, controls, nodes) => {

  d3elems.demes
    .data(latLongs.demes)
    .transition(5)
    .style("fill", (d) => { return d.total > 0 ? d.color : "white" })
    .attr("r", (d) => {
      return 0 + Math.sqrt(d.total) * 4
    });

    console.log("UPDATING ====================================================")

  d3elems.transmissions
    .data(latLongs.transmissions)
    // .transition(5)
    .attr("d", (d, i) => {
      return pathStringGenerator(
        extractLineSegmentForAnimationEffect(
          d.data.originToDestinationXYs,
          controls,
          d,
          nodes,
          d3elems,
          i
        )
      )
    }) /* with the interpolation in the function above pathStringGenerator */
    .attr("stroke", (d) => { return d.data.total > 0 ? d.data.color : "white" })
    .attr("stroke-width", (d) => {
      return d.data.total
    })

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
