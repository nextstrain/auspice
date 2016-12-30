export const addAllTipsToMap = (nodes, metadata, colorScale, map) => {
  const aggregatedLocations = {};
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
    L.circleMarker([
      metadata.geo.country[key].latitude,
      metadata.geo.country[key].longitude
    ], {
      stroke:	false,
      radius: value * 2,

      // color: ""
      // weight:	5	Stroke width in pixels.
      // opacity:	0.5	Stroke opacity.
      // fill:
      fillColor: colorScale(key),
      fillOpacity: .6
    }).addTo(map);
  });
}

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
    for (let i = 0; i < geodesicPath._latlngs.length; i++) {
      L.polylineDecorator(geodesicPath._latlngs[i], {
        patterns: [{
          offset: 25,
          repeat: 50,
          symbol: L.Symbol.arrowHead({
            pixelSize: 8 + arrowSizeMultiplier,
            pathOptions: {
              fillOpacity: .5,
              color: colorScale(countries[0]),
              weight: 0
            }
          })
        }]
      }).addTo(map);
    }

  });
}
