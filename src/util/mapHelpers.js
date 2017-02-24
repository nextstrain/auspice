import d3 from "d3";

/* util */

export const pathStringGenerator = d3.svg.line()
  .x((d) => { return d.x })
  .y((d) => { return d.y })
  .interpolate("basis");

const translateAlong = (path) => {
  var l = path.getTotalLength();
  return (d, i, a) => {
    return (t) => {
      var p = path.getPointAtLength(t * l);
      return "translate(" + p.x + "," + p.y + ")";
    };
  };
};

/*
  If d3 shapes are getting mysteriously cut off while zooming and dragging around leaflet...
  https://github.com/Leaflet/Leaflet/issues/2814
  or possibly...
  https://github.com/Leaflet/Leaflet/issues/2282 check the css in our index.js

*/

export const drawDemesAndTransmissions = (latLongs, colorScale, g, map) => {

  const demes = g.selectAll("demes")
    .data(latLongs.demes)
    .enter().append("circle")
    .style("stroke", "none")
    .style("fill-opacity", .6)
    .style("fill", (d) => { return d.color })
    .attr("r", (d) => { return 2 + Math.sqrt(d.total) * 4 })
    .attr("transform", (d) => {
      return "translate(" + d.coords.x + "," + d.coords.y + ")";
    });

  const transmissions = g.selectAll("transmissions")
    .data(latLongs.transmissions)
    .enter()
    .append("path") /* append a geodesic path from the leaflet plugin data */
    .attr("d", (d) => { return pathStringGenerator(d.coords) }) /* with the interpolation in the function above pathStringGenerator */
    .attr("fill","none")
    .attr("stroke", (d) => { return d.data.color }) /* colorScale(d.data.from); color path by contry in which the transmission arrived */
    .attr("stroke-opacity", .6)
    .attr("stroke-width", (d) => { return d.data.total }) /* scale line by total number of transmissions */

  /* this will need to be scaled if transmissions is high */
  // const arrowSizeMultiplier = value > 1 ? value * 2 : 0;

  /* this decorator adds arrows to the lines. */
  latLongs.transmissions.forEach((transmission, i) => {
    const arrows = L.polylineDecorator(transmission.data.rawGeodesic._latlngs[transmission.wraparoundKey], {
      patterns: [{
        offset: 25,
        repeat: 75,
        symbol: L.Symbol.arrowHead({
          pixelSize: 14 /*+ arrowSizeMultiplier*/,
          pathOptions: {
            fillOpacity: .5,
            color: transmission.data.color,
            weight: 0
          }
        })
      }]
    }).addTo(map)
  });

  return {
    demes,
    transmissions
  };

}

export const updateOnMoveEnd = (d3elems, latLongs) => {
  /* map has moved or rescaled, make demes and transmissions line up */
  d3elems.demes
    .data(latLongs.demes)
    .attr("transform", (d) => {
      return "translate(" + d.coords.x + "," + d.coords.y + ")";
    })

  d3elems.transmissions
    .data(latLongs.transmissions)
    .attr("d", (d) => { return pathStringGenerator(d.coords) })

}

// averaging colors https://github.com/nextstrain/auspice/commit/0b1f2c90f7d45732935c88e60e2c854a42213d9c

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
