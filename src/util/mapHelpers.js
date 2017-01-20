export const addAllTipsToMap = (nodes, metadata, colorScale, map) => {

  const aggregatedLocations = {};

  setTimeout(() => {
    const mapSVG = d3.select("#map").select("svg").append("g");

    const latLongs = [];

    nodes.forEach((n) => {
      if (n.children) { return; }
      // look up geo1 geo2 geo3 do lat longs differ
      if (aggregatedLocations[n.attr.country]) {
        aggregatedLocations[n.attr.country]++;
      } else {
        // if we haven't added this pair, add it
        aggregatedLocations[n.attr.country] = 1;
      }
    });

    _.forOwn(aggregatedLocations, (value, key) => {
      latLongs.push({
        country: key, // Thailand:
        total: value, // 20
        coords: map.latLngToLayerPoint( /* interchange. this is a leaflet method that will tell d3 where to draw. */
          new L.LatLng(
            metadata.geo.country[key].latitude,
            metadata.geo.country[key].longitude
          )
        )
      });
    });

    const tips = mapSVG.selectAll("tips")
      .data(latLongs)
      .enter().append("circle")
      .style("stroke", "none")
      .style("fill-opacity", .6)
      .style("fill", (d) => { return colorScale(d.country) })
      .attr("r", (d) => { return 2 + Math.sqrt(d.total) * 4 });

    const setTipCoords = () => {
      // tips.attr("cx", (d) => { return d.coords.x })
      //   .attr("cy", (d) => { return d.coords.y })

      tips.attr("transform",
        (d) => {
          return "translate(" +
            d.coords.x + ","+
            d.coords.y + ")";
        }
      )
    }

    setTipCoords();
    map.on("viewreset", setTipCoords);

  }, 0) // end setTimout to wait for leaflet in the DOM

}


// var start = null;
// var element = document.getElementById("SomeElementYouWantToAnimate");
// element.style.position = 'absolute';
//
// function step(timestamp) {
//   if (!start) start = timestamp;
//   var progress = timestamp - start;
//   element.style.left = Math.min(progress/10, 200) + "px";
//   if (progress < 2000) {
//     window.requestAnimationFrame(step);
//   }
// }
//
// window.requestAnimationFrame(step);



export const addTransmissionEventsToMap = (nodes, metadata, colorScale, map) => {
  const transmissions = {};
  const geo = metadata.geo;

  // count transmissions for line thickness
  nodes.forEach((parent) => {
    if (!parent.children) { return; }
    // if (parent.attr.country !== "china") { return; } // remove me, example filter
    parent.children.forEach((child) => {
      if (parent.attr.country === child.attr.country) { return; }
      // look up in transmissions dictionary
      if (transmissions[parent.attr.country + "/" + child.attr.country]) {
        transmissions[parent.attr.country + "/" + child.attr.country]++;
      } else {
        // we don't have it, add it
        transmissions[parent.attr.country + "/" + child.attr.country] = 1;
      }
    });
  });

  // for each item in the object produced above, add a line
  _.forOwn(transmissions, (value, key) => {

    // go from "brazil/cuba" to ["brazil", "cuba"]
    const countries = key.split("/");
    // go from "brazil" to lat0 = -14.2350
    let long0 = geo.country[countries[0]].longitude;
    let long1 = geo.country[countries[1]].longitude;
    let lat0 = geo.country[countries[0]].latitude;
    let lat1 = geo.country[countries[1]].latitude;

    // create new leaflet LatLong objects
    const start = new L.LatLng(lat0, long0)
    const end = new L.LatLng(lat1, long1)

    // remove me! temporary random colors in lieu of scale.

    /*
      add a polyline to the map for current country pair iteratee
      store the computation. access _latlngs to show where each segment is on the map
    */
    const geodesicPath = L.geodesic([[start,end]], {
      // stroke:	value,
      // radius: value,
      color: colorScale(countries[0]),
      opacity: .5,
      steps: 25,
      weight:	value	/* Stroke width in pixels.*/
      // opacity:	0.5	Stroke opacity.
      // fill:
      // fillColor: randomColor
      // fillOpacity:
    }).addTo(map)

    /* this will need to be scaled if transmissions is high */
    const arrowSizeMultiplier = value > 1 ? value * 2 : 0;

    // this decorator adds arrows to the lines.
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

  });
}
