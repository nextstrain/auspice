import getLatLongs from "./mapHelpersLatLong";
import d3 from "d3";

export const setupTipsAndTransmissions = (nodes, metadata, colorScale, map, responsive) => {

  // console.log("setup", colorScale("asdf"))

  /* data structures to feed to d3 latLongs = { tips: [{}, {}], transmissions: [{}, {}] } */
  const latLongs = getLatLongs(nodes, metadata, map);

  /* add circles and lines to map, add event listeners for leaflet zooming */
  const mapSVG = d3.select(map.getPanes().overlayPane).append("svg").attr("width", responsive.width).attr("height", responsive.height);
  const g = mapSVG.append("g").attr("class", "leaflet-zoom-hide");

  const tips = g.selectAll("tips")
    .data(latLongs.tips)
    .enter().append("circle")
    .style("stroke", "none")
    .style("fill-opacity", .6)
    .style("fill", (d) => { return colorScale(d.country) })
    .attr("r", (d) => { return 2 + Math.sqrt(d.total) * 4 });

  const pathStringGenerator = d3.svg.line()
    .x((d) => { return d.x })
    .y((d) => { return d.y })
    .interpolate("basis");

  const transmissionPaths = [];

  latLongs.transmissions.forEach((transmission) => { /* for each transmission */
    transmission.geodesics.forEach((partialTransmission) => { /* and for each part of a lines split across dateline in each */

      const elem = g.append("path") /* append a geodesic path from the leaflet plugin data */
        .datum(partialTransmission)
        .attr("d", pathStringGenerator) /* with the interpolation in the function above */
        .attr("fill","none")
        .attr("stroke", "rgba(255,0,0,.3)")
        .attr("stroke-width", "1px")

      transmissionPaths.push({ /* and add it to an array, which we'll map over to create our missiles */
        elem,
        partialTransmission,
        transmission
      });
    })
  })

  const translateAlong = (path) => {
    var l = path.getTotalLength();
    return (d, i, a) => {
      return (t) => {
        var p = path.getPointAtLength(t * l);
        return "translate(" + p.x + "," + p.y + ")";
      };
    };
  }

  const missiles = transmissionPaths.map((transmissionPath) => {

    // console.log(transmissionPath)

    const missile = g.append("circle")
      .attr("r", 3)
      .attr("fill", (d) => { return colorScale(transmissionPath.transmission.to) })
      .attr("transform", `translate(
        ${transmissionPath.partialTransmission[0].x},
        ${transmissionPath.partialTransmission[0].y}
      )`) /* begin the missile on the start of the line */
      .transition()
      .duration(5000)
      .attrTween("transform", translateAlong(transmissionPath.elem.node()));

    return missile;
  })



  const setTipCoords = () => {
    tips.attr("transform", (d) => {
      return "translate(" + d.coords.x + "," + d.coords.y + ")";
    });
  };

  const animateTransmissions = () => {
    /* point along path interpolation https://bl.ocks.org/mbostock/1705868 */

  }

  // setTipCoords();
  // map.on("viewreset", setTipCoords); /* search: -Note (A) for an idea as to why this might not be working properly */
  animateTransmissions();
  // return {}; this will probably return tips & transmissions to store in state, so that we can pass them to whatever helper animates them

}


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

/* this will need to be scaled if transmissions is high */
// const arrowSizeMultiplier = value > 1 ? value * 2 : 0;

// this decorator adds arrows to the lines.
// since we're now using d3 we'll probably do something like http://stackoverflow.com/questions/11808860/arrow-triangles-on-my-svg-line/11809868#11809868
// decorator docs: https://github.com/bbecquet/Leaflet.PolylineDecorator
// for (let i = 0; i < geodesicPath._latlngs.length; i++) {
//   L.polylineDecorator(geodesicPath._latlngs[i], {
//     patterns: [{
//       offset: 25,
//       repeat: 50,
//       symbol: L.Symbol.arrowHead({
//         pixelSize: 8 + arrowSizeMultiplier,
//         pathOptions: {
//           fillOpacity: .5,
//           color: colorScale(countries[0]),
//           weight: 0
//         }
//       })
//     }]
//   }).addTo(map);
// }
