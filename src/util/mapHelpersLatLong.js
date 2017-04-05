import {averageColors} from "./colorHelpers";
import {getTipColorAttribute} from "./treeHelpers";

const aggregated = (nodes, visibility, geoResolution, colorScale, sequences) => {
  const aggregatedLocations = {}; /* demes */
  const aggregatedTransmissions = {}; /* edges, animation paths */
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
  return {
    aggregatedLocations,
    aggregatedTransmissions
  }
}

export const getLatLongs = (nodes, visibility, metadata, map, colorBy, geoResolution, colorScale, sequences, include) => {

  const {aggregatedLocations, aggregatedTransmissions} = aggregated(nodes, visibility, geoResolution, colorScale, sequences);
  const geo = metadata.geo;
  const demesAndTransmissions = {
    demes: [],
    transmissions: []
  };

  /* count DEMES */
  _.forOwn(aggregatedLocations, (value, key) => {
    demesAndTransmissions.demes.push({
      location: key, // Thailand:
      total: value.length, // 20, this is an array of all demes of a certain type
      color: averageColors(value),
      coords: map.latLngToLayerPoint( /* interchange. this is a leaflet method that will tell d3 where to draw. -Note (A) we MAY have to do this every time rather than just once */
        new L.LatLng(
          metadata.geo[geoResolution][key].latitude,
          metadata.geo[geoResolution][key].longitude
        )
      )
    });
  });

  /* count TRANSMISSIONS for line thickness */
  _.forOwn(aggregatedTransmissions, (value, key) => {

    const countries = key.split("/");
    const originToDestinationXYs = [
      map.latLngToLayerPoint( /* interchange. this is a leaflet method that will tell d3 where to draw. -Note (A) We may have to do this every time */
        new L.LatLng(
          geo[geoResolution][countries[0]].latitude,
          geo[geoResolution][countries[0]].longitude
        )
      ),
      map.latLngToLayerPoint( /* interchange. this is a leaflet method that will tell d3 where to draw. -Note (A) We may have to do this every time */
        new L.LatLng(
          geo[geoResolution][countries[1]].latitude,
          geo[geoResolution][countries[1]].longitude
        )
      )
    ];

    const transmission = {
      originToDestinationXYs,
      total: value.length, /* changes over time */
      color: averageColors(value), /* changes over time */
    }

    demesAndTransmissions.transmissions.push({data: transmission})
  });

  return demesAndTransmissions;
}

/* we used to return this in transmission */
// create new leaflet LatLong objects
// const start = new L.LatLng(lat0, long0)
// const end = new L.LatLng(lat1, long1)
// start, /* changes with zoom level */
// end, /* changes with zoom level */
// from: countries[0],
// to: countries[1]

/* we used to compute this... likely with geodesic from leaflet */
// const dlambda = Math.abs((long1-long0)%360)*Math.PI/180.0;
// const angle = Math.acos(Math.sin(lat1*Math.PI/180.0)*Math.sin(lat0*Math.PI/180.0)
//                         + Math.cos(lat1*Math.PI/180.0)*Math.cos(lat0*Math.PI/180.0)*Math.cos(dlambda));
// // this sets the number of segments of the path, min 4, max 36 for half way around the globe
// const nSteps = Math.ceil(Math.max(4,angle*36/Math.PI));
