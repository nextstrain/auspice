const setupLatLong = (nodes, metadata, map, colorBy) => {

  const aggregatedLocations = {}; /* tips */
  const aggregatedTransmissions = {}; /* edges, animation paths */
  const nestedTransmissions = [];
  const tipsAndTransmissions = {
    tips: [],
    transmissions: []
  };
  const geo = metadata.geo;

  /*
    aggregate locations for tips
  */
  nodes.forEach((n) => {
    if (n.children) { return; }
    // look up geo1 geo2 geo3 do lat longs differ
    if (aggregatedLocations[n.attr[colorBy]]) {
      aggregatedLocations[n.attr[colorBy]]++;
    } else {
      // if we haven't added this pair, add it
      aggregatedLocations[n.attr[colorBy]] = 1;
    }
  });

  /*
    create a latlong pair for each country's location and push them all to a common array
  */
  _.forOwn(aggregatedLocations, (value, key) => {
    tipsAndTransmissions.tips.push({
      country: key, // Thailand:
      total: value, // 20
      coords: map.latLngToLayerPoint( /* interchange. this is a leaflet method that will tell d3 where to draw. -Note (A) we MAY have to do this every time rather than just once */
        new L.LatLng(
          metadata.geo[colorBy][key].latitude,
          metadata.geo[colorBy][key].longitude
        )
      )
    });
  });

  /*
    count transmissions for line thickness
  */
  nodes.forEach((parent) => {
    if (!parent.children) { return; }
    // if (parent.attr.country !== "china") { return; } // remove me, example filter
    parent.children.forEach((child) => {
      if (parent.attr[colorBy] === child.attr[colorBy]) { return; }
      // look up in transmissions dictionary
      if (aggregatedTransmissions[parent.attr[colorBy] + "/" + child.attr[colorBy]]) {
        aggregatedTransmissions[parent.attr[colorBy] + "/" + child.attr[colorBy]]++;
      } else {
        // we don't have it, add it
        aggregatedTransmissions[parent.attr[colorBy] + "/" + child.attr[colorBy]] = 1;
      }
    });
  });

  // for each item in the object produced above, add a line
  _.forOwn(aggregatedTransmissions, (value, key) => {

    // go from "brazil/cuba" to ["brazil", "cuba"]
    const countries = key.split("/");
    // go from "brazil" to lat0 = -14.2350
    let long0 = geo[colorBy][countries[0]].longitude;
    let long1 = geo[colorBy][countries[1]].longitude;
    let lat0 = geo[colorBy][countries[0]].latitude;
    let lat1 = geo[colorBy][countries[1]].latitude;

    // create new leaflet LatLong objects
    const start = new L.LatLng(lat0, long0)
    const end = new L.LatLng(lat1, long1)

    /*
      add a polyline to the map for current country pair iteratee
      store the computation. access _latlngs to show where each segment is on the map
    */
    const rawGeodesic = L.geodesic([[start,end]], {
      // stroke:	value,
      // radius: value,
      // color: colorScale(countries[0]), /* this will go up above in d3 rather than in leaflet now */
      // opacity: .5,
      steps: 25,
      // weight:	value	/* Stroke width in pixels.*/
      // opacity:	0.5	Stroke opacity.
      // fill:
      // fillColor: randomColor
      // fillOpacity:
    })

    const geodesics = [];

    rawGeodesic._latlngs.forEach((arr) => {
      geodesics.push(arr.map((pair) => {
        return map.latLngToLayerPoint( /* interchange. this is a leaflet method that will tell d3 where to draw. -Note (A) We may have to do this every time */
          new L.LatLng(
            pair.lat,
            pair.lng
          )
        );
      }));
    })

    nestedTransmissions.push({
      start,
      end,
      count: value,
      rawGeodesic,
      geodesics, /* incomplete for dev, will need to grab BOTH lines when there is wraparound */
      from: countries[0],
      to: countries[1]
    })
  });

  /* flatter data structure */
  nestedTransmissions.forEach((transmission, i) => { /* for each transmission */
    transmission.geodesics.forEach((geodesic, j) => { /* and for each part of a lines split across dateline in each */
      tipsAndTransmissions.transmissions.push({ /* and add it to an array, which we'll map over to create our paths. */ /* not optimized for missiles here. we could check index of for each and if it's greater than one add a flag for partials, and their order? so that we can animate around the map */
        data: transmission,
        coords: geodesic,
        wraparoundKey: j,
      });
    });
  });
  return tipsAndTransmissions;
}

export default setupLatLong
