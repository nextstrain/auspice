import {averageColors} from "./colorHelpers";
import {getTipColorAttribute} from "./treeHelpers";

// longs of original map are -180 to 180
// longs of fully triplicated map are -540 to 540
// restrict to longs between -360 to 360
const westBound = -360;
const eastBound = 360;

/* interchange. this is a leaflet method that will tell d3 where to draw.
-Note (A) we MAY have to do this every time rather than just once */
const leafletLatLongToLayerPoint = (lat, long, map) => {
  return map.latLngToLayerPoint(new L.LatLng(lat, long))
}

/* if transmission pair is legal, return a leaflet LatLng origin / dest pair
otherwise return null */
const maybeGetTransmissionPair = (latOrig, longOrig, latDest, longDest, map) => {

  // if either origin or destination are inside bounds, include
  // transmission must be less than 180 lat difference
  if (
    (longOrig > westBound || longDest > westBound) &&
    (longOrig < eastBound || longDest < eastBound) &&
    (Math.abs(longOrig - longDest) < 180)
  ) {
    return [
      leafletLatLongToLayerPoint(latOrig, longOrig, map),
      leafletLatLongToLayerPoint(latDest, longDest, map)
    ];
  }
  else {
    return null;
  }
}

export const createDemeAndTransmissionData = (nodes, visibility, geoResolution, nodeColors) => {
  const demeData = {}; /* demes */
  const transmissionData = {}; /* edges, animation paths */

  /*
    walk through nodes and collect a bunch of arrays...
    can count how many times observe a tip and make an array of an attribute,
    which in this case will be color,
    could be an array of hexes which would be enough,
    similar operation for each transmission -
    for each deme pair observe how many and record a hex value from the from deme and
    count them for width and average to get color
  */

  /*
    aggregate locations for demes
  */
  // first pass to initialize empty vectors
  nodes.forEach((n, i) => {
    if (!n.children) {
      if (n.attr[geoResolution]) { // check for undefined
        if (!demeData[n.attr[geoResolution]]) {
          demeData[n.attr[geoResolution]] = [];
        }
      }
    }
    if (n.children) {
      n.children.forEach((child) => {
        if (n.attr[geoResolution] && child.attr[geoResolution]) { // check for undefined
          if (n.attr[geoResolution] !== child.attr[geoResolution]) {
            const transmission = n.attr[geoResolution] + "|" + child.attr[geoResolution] + "@" +
                                 n.strain + "|" + child.strain + "@" +
                                 n.arrayIdx + "|" + child.arrayIdx;
            if (!transmissionData[transmission]) {
              transmissionData[transmission] = [];
            }
          }
        }
      });
    }
  });
  // second pass to fill vectors
  nodes.forEach((n, i) => {
    /* demes only count terminal nodes */
    if (!n.children && visibility[i] === "visible") {
      // if tip and visible, push
      if (n.attr[geoResolution]) { // check for undefined
        demeData[n.attr[geoResolution]].push(nodeColors[i]);
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
        if (n.attr[geoResolution] && child.attr[geoResolution]) { // check for undefined
          if (n.attr[geoResolution] !== child.attr[geoResolution] &&
            visibility[child.arrayIdx] === "visible") {
            // make this a pair of indices that point to nodes
            // this is flatter and self documenting
            const transmission = n.attr[geoResolution] + "|" + child.attr[geoResolution] + "@" +
                                 n.strain + "|" + child.strain + "@" +
                                 n.arrayIdx + "|" + child.arrayIdx;
            transmissionData[transmission] = [nodeColors[i]];
          }
        }
      });
    }
  });
  return {
    demeData,
    transmissionData
  }
}

export const getLatLongs = (
  nodes,
  visibility,
  metadata,
  map,
  geoResolution,
  triplicate,
  nodeColors,
  demeData,
  transmissionData,
) => {

  let offsets = triplicate ? [-360, 0, 360] : [0]

  const geo = metadata.geo;
  const demesAndTransmissions = {
    demes: [],
    transmissions: []
  };

  offsets.forEach((OFFSET) => {
    /* count DEMES */
    _.forOwn(demeData, (value, key) => {
      let lat = geo[geoResolution][key].latitude;
      let long = geo[geoResolution][key].longitude + OFFSET;
      if (long > westBound && long < eastBound) {
        demesAndTransmissions.demes.push({
          location: key, // Thailand:
          total: value.length, // 20, this is an array of all demes of a certain type
          color: averageColors(value),
          coords: leafletLatLongToLayerPoint(lat, long, map)
        });
      }
    });
  })

  /* Expensive because hundreds of transmisions */
  // offset is applied to transmission origin
  offsets.forEach((offsetOrig) => {

    _.forOwn(transmissionData, (value, key) => {

      const locs = key.split("@")[0].split("|");

      let latOrig, longOrig, latDest, longDest;
      try {
        latOrig = geo[geoResolution][locs[0]].latitude;
        longOrig = geo[geoResolution][locs[0]].longitude;
        latDest = geo[geoResolution][locs[1]].latitude;
        longDest = geo[geoResolution][locs[1]].longitude;
      } catch (e) {
        // console.log("No transmission lat/longs for ", countries[0], " -> ", countries[1])
        return;
      }

      // origin to destination
      let pairs = [];

      // iterate over offsets applied to transmission destination
      // even if map is not tripled
      [-360, 0, 360].forEach((offsetDest) => {
        const pair = maybeGetTransmissionPair(latOrig, longOrig + offsetOrig, latDest, longDest + offsetDest, map);
        if (pair) {
          pairs.push(pair);
        }
      })

      if (pairs.length === 0) { return; }

      /* this gives us an index for both demes in the transmission pair with which we will access the node array */
      const closestPair = _.minBy(pairs, (pair) => { return Math.abs(pair[1].x - pair[0].x) });

      const transmission = {
        demePairIndices: key.split("@")[2].split("|"), /* this has some weird values occassionally that do not presently break anything. created/discovered during animation work. */
        originToDestinationXYs: closestPair,
        total: value.length, /* changes over time */
        color: averageColors(value), /* changes over time */
        /* visibility */
      }

      demesAndTransmissions.transmissions.push({data: transmission})
    });

  }) /* End offsetOrig */

  // console.log("This is a transmission from mapHelpersLatLong.js: ", demesAndTransmissions)
  if (demesAndTransmissions.transmissions.length) {
    demesAndTransmissions.minTransmissionDate = demesAndTransmissions.transmissions.map((x) => {
      return nodes[x.data.demePairIndices[0]].attr.num_date;
    }).reduce((prev, cur) => {
      return cur < prev ? cur : prev;
    });
  }
  return demesAndTransmissions;
}
