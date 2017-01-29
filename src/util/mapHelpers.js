import getLatLongs from "./mapHelpersLatLong";

export const setupTipsAndTransmissions = (nodes, metadata, colorScale, map, responsive) => {

  /*
    data structures to feed to d3
    latLongs = {
      tips: [{}, {}],
      transmissions: [{}, {}]
    }
  */
  const latLongs = getLatLongs(nodes, metadata, map);


  /*
    add circles and lines to map, add event listeners for leaflet zooming
  */

    const mapSVG = d3.select(map.getPanes().overlayPane).append("svg").attr("width", responsive.width).attr("height", responsive.height);
    const g = mapSVG.append("g").attr("class", "leaflet-zoom-hide");

    const tips = g.selectAll("tips")
      .data(latLongs.tips)
      .enter().append("circle")
      .style("stroke", "none")
      .style("fill-opacity", .6)
      .style("fill", (d) => { return colorScale(d.country) })
      .attr("r", (d) => { console.log('adf', d); return 2 + Math.sqrt(d.total) * 4 });

      console.log(1243214, latLongs)

    const transmissions = g.append("path")
      .datum({
        type: "LineString",
        coordinates: []
      })
      .attr("d", d3.geo.path())
      .attr("fill","none")
      .attr("stroke", "red")
      .attr("stroke-width", "3px")

      /*

      http://gis.stackexchange.com/questions/49114/d3-geo-path-to-draw-a-path-from-gis-coordinates
      https://bl.ocks.org/mbostock/3916621
      http://bl.ocks.org/mbostock/5851933
      http://bl.ocks.org/mbostock/5928813
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

    const setTipCoords = () => {
      tips.attr("transform", (d) => {
        return "translate(" + d.coords.x + "," + d.coords.y + ")";
      });
    };

    setTipCoords();
    map.on("viewreset", setTipCoords); /* search: -Note (A) for an idea as to why this might not be working properly */

  // return {}; this will probably return tips & transmissions to store in state, so that we can pass them to whatever helper animates them

}

export const animateTransmissions = (nodes, metadata, colorScale, map) => {

  /* projection tween http://bl.ocks.org/mbostock/3711652 */
  /* point along path interpolation https://bl.ocks.org/mbostock/1705868 */

}
