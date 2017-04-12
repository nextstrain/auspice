import {averageColors} from "./colorHelpers";
import {getTipColorAttribute} from "./treeHelpers";

const getLatLongs = (nodes, visibility, metadata, map, colorBy, geoResolution, colorScale, sequences) => {
  const aggregatedLocations = {}; /* demes */
  const aggregatedTransmissions = {}; /* edges, animation paths */
  const demesToColors = {};
  const transmissionsToColors = {};

  const nestedTransmissions = [];
  const demesAndTransmissions = {
    demes: [],
    transmissions: []
  };
  const geo = metadata.geo;

  /*
    walk through nodes and collect a bunch of arrays...
    can count how many times observe a tip and make an array of an attribute,
    which in this case will be color,
    could be an array of hexes which would be enough,
    similar operation for each transmissino -
    for each deme pair observe how many and record a hex value from the from deme and
    count them for width and average to get color
  */

  /*
    aggregate locations for demes
  */
  nodes.forEach((n, i) => {
    /* demes only count terminal nodes */
    const tipColorAttribute = getTipColorAttribute(n, colorScale, sequences);
    if (!n.children && visibility[i] === "visible") {
      // look up geo1 geo2 geo3 do lat longs differ
      if (aggregatedLocations[n.attr[geoResolution]]) {
        aggregatedLocations[n.attr[geoResolution]].push(colorScale.scale(tipColorAttribute));
      } else {
        // if we haven't added this pair, add it
        aggregatedLocations[n.attr[geoResolution]] = [colorScale.scale(tipColorAttribute)];
      }
    }
    /* transmissions count internal node transitions as well
    they are from the parent of the node to the node itself
    */
    if (n.children) {
      n.children.forEach((child) => {
        /* only draw transmissions if
        (1) the node & child aren't the same location and
        (2) if child is visibile
        */
        if (n.attr[geoResolution] !== child.attr[geoResolution] &&
          visibility[child.arrayIdx] === "visible") {
          const transmission = n.attr[geoResolution] + "/" + child.attr[geoResolution];
          if (aggregatedTransmissions[transmission]) {
            aggregatedTransmissions[transmission].push(colorScale.scale(tipColorAttribute));
          } else {
            aggregatedTransmissions[transmission] = [colorScale.scale(tipColorAttribute)];
          }
        }
      });
    }
  });

  /*
    create a latlong pair for each country's location and push them all to a common array
  */
  _.forOwn(aggregatedLocations, (value, key) => {
    // console.log("value:", value, "key:", key)
    demesAndTransmissions.demes.push({
      location: key, // Thailand:
      total: value.length, // 20
      color: averageColors(value),
      coords: map.latLngToLayerPoint( /* interchange. this is a leaflet method that will tell d3 where to draw. -Note (A) we MAY have to do this every time rather than just once */
        new L.LatLng(
          metadata.geo[geoResolution][key].latitude,
          metadata.geo[geoResolution][key].longitude
        )
      )
    });
  });

  /*
    count transmissions for line thickness
  */

  // for each item in the object produced above...
  _.forOwn(aggregatedTransmissions, (value, key) => {

    // go from "brazil/cuba" to ["brazil", "cuba"]
    const countries = key.split("/");
    // go from "brazil" to lat0 = -14.2350
    let long0 = geo[geoResolution][countries[0]].longitude;
    let long1 = geo[geoResolution][countries[1]].longitude;
    let lat0 = geo[geoResolution][countries[0]].latitude;
    let lat1 = geo[geoResolution][countries[1]].latitude;

    // create new leaflet LatLong objects
    const start = new L.LatLng(lat0, long0)
    const end = new L.LatLng(lat1, long1)
    const dlambda = Math.abs((long1-long0)%360)*Math.PI/180.0;
    const angle = Math.acos(Math.sin(lat1*Math.PI/180.0)*Math.sin(lat0*Math.PI/180.0)
                            + Math.cos(lat1*Math.PI/180.0)*Math.cos(lat0*Math.PI/180.0)*Math.cos(dlambda));
    // this sets the number of segments of the path, min 4, max 36 for half way around the globe
    const nSteps = Math.ceil(Math.max(4,angle*36/Math.PI));

    /*
      add a polyline to the map for current country pair iteratee
      store the computation. access _latlngs to show where each segment is on the map
    */
    const rawGeodesic = L.geodesic([[start,end]], {
      // stroke:	value,
      // radius: value,
      // color: colorScale(countries[0]), /* this will go up above in d3 rather than in leaflet now */
      // opacity: .5,
      steps: nSteps,
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
      total: value.length,
      color: averageColors(value),
      rawGeodesic,
      geodesics, /* incomplete for dev, will need to grab BOTH lines when there is wraparound */
      from: countries[0],
      to: countries[1]
    })
  });

  /* flatter data structure */
  nestedTransmissions.forEach((transmission, i) => { /* for each transmission */
    transmission.geodesics.forEach((geodesic, j) => { /* and for each part of a lines split across dateline in each */
      demesAndTransmissions.transmissions.push({ /* and add it to an array, which we'll map over to create our paths. */ /* not optimized for missiles here. we could check index of for each and if it's greater than one add a flag for partials, and their order? so that we can animate around the map */
        data: transmission,
        coords: geodesic,
        wraparoundKey: j,
      });
    });
  });
  return demesAndTransmissions;
}

export default getLatLongs;
