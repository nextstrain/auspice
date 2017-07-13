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

const setupDemeData = (nodes, visibility, geoResolution, nodeColors) => {

  const demeData = []; /* demes */

  // do aggregation as intermediate step
  let demeMap = {};
  nodes.forEach((n, i) => {
    if (!n.children) {
      if (n.attr[geoResolution]) { // check for undefined
        if (!demeData[n.attr[geoResolution]]) {
          demeMap[n.attr[geoResolution]] = [];
        }
      }
    }
  });

  // second pass to fill vectors
  nodes.forEach((n, i) => {
    /* demes only count terminal nodes */
    if (!n.children && visibility[i] === "visible") {
      // if tip and visible, push
      if (n.attr[geoResolution]) { // check for undefined
        demeMap[n.attr[geoResolution]].push(nodeColors[i]);
      }
    }
  });

  _.forOwn(demeMap, (value, key) => { // value: hash color array, key: deme name
    const deme = {
      name: key,
      latLong: null,
      count: value.length,
      color: averageColors(value)
    }
    demeData.push(deme);
  });

  return demeData;

}

const setupTransmissionData = (nodes, visibility, geoResolution, nodeColors) => {

  const transmissionData = []; /* edges, animation paths */

  nodes.forEach((n, i) => {
    if (n.children) {
      n.children.forEach((child) => {
        if (n.attr[geoResolution] && child.attr[geoResolution]) { // check for undefined
          if (n.attr[geoResolution] !== child.attr[geoResolution]) {

            /* build up transmissions object */

            const transmission = {
              originNode: n,
              destinationNode: child,
              originLatLong: null,
              destinationLatLong: null,
              originName: n.attr[geoResolution],
              destinationName: child.attr[geoResolution],
              originNumDate: n.attr["num_date"],
              destinationNumDate: child.attr["num_date"],
              color: nodeColors[i],
              visible: visibility[i] === "visible" && visibility[child.arrayIdx] === "visible",
            }

            transmissionData.push(transmission);
          }
        }
      });
    }
  });

  return transmissionData;
}

export const createDemeAndTransmissionData = (nodes, visibility, geoResolution, nodeColors) => {

  /*
    walk through nodes and collect a bunch of arrays...
    can count how many times observe a tip and make an array of an attribute,
    which in this case will be color,
    could be an array of hexes which would be enough,
    similar operation for each transmission -
    for each deme pair observe how many and record a hex value from the from deme and
    count them for width and average to get color
  */

  return {
    demeData: setupDemeData(nodes, visibility, geoResolution, nodeColors),
    transmissionData: setupTransmissionData(nodes, visibility, geoResolution, nodeColors),
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
    demeData.forEach((deme) => {
      let lat = geo[geoResolution][deme.name].latitude;
      let long = geo[geoResolution][deme.name].longitude + OFFSET;

      if (long > westBound && long < eastBound) {
        demesAndTransmissions.demes.push({
          location: deme.name, // Thailand:
          total: deme.count, // 20, this is an array of all demes of a certain type
          color: deme.color,
          coords: leafletLatLongToLayerPoint(lat, long, map)
        });
      }
    });
  });

  /* Expensive because hundreds of transmisions */
  // offset is applied to transmission origin
  offsets.forEach((offsetOrig) => {

    transmissionData.forEach((transmission) => {

      let latOrig, longOrig, latDest, longDest;
      try {
        latOrig = geo[geoResolution][transmission.originName].latitude;
        longOrig = geo[geoResolution][transmission.originName].longitude;
        latDest = geo[geoResolution][transmission.destinationName].latitude;
        longDest = geo[geoResolution][transmission.destinationName].longitude;
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

      const t = Object.assign({}, transmission, {
        originLatLong: closestPair[0],
        destinationLatLong: closestPair[1]
      })

      demesAndTransmissions.transmissions.push({
        data: t
      })
    });

  }) /* End offsetOrig */

  // console.log("This is a transmission from mapHelpersLatLong.js: ", demesAndTransmissions)
  if (demesAndTransmissions.transmissions.length) {
    demesAndTransmissions.minTransmissionDate = demesAndTransmissions.transmissions.map((x) => {
      return x.originNumDate;
    }).reduce((prev, cur) => {
      return cur < prev ? cur : prev;
    });
  }
  return demesAndTransmissions;
}
