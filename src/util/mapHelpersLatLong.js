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

const setupDemeData = (nodes, visibility, geoResolution, nodeColors, triplicate, metadata, map) => {

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

  let offsets = triplicate ? [-360, 0, 360] : [0]
  const geo = metadata.geo;

  offsets.forEach((OFFSET) => {
    /* count DEMES */
    _.forOwn(demeMap, (value, key) => { // value: hash color array, key: deme name
      let lat = geo[geoResolution][key].latitude;
      let long = geo[geoResolution][key].longitude + OFFSET;

      if (long > westBound && long < eastBound) {

        const deme = {
          name: key,
          coords: leafletLatLongToLayerPoint(lat, long, map),
          count: value.length,
          color: averageColors(value)
        }
        demeData.push(deme);

      }
    });
  });

  return demeData;

}

const maybeConstructTransmissionEvent = (
  node,
  child,
  metadataGeoLookupTable,
  geoResolution,
  nodeColors,
  visibility,
  map,
  offsetOrig,
  offsetDest
) => {

  let latOrig, longOrig, latDest, longDest;
  let transmission = null;

  /* checking metadata for lat longs name match - ie., does the metadata list a latlong for Thailand?*/
  try {
    // node.attr[geoResolution] is the node's location, we're looking that up in the metadata lookup table
    latOrig = metadataGeoLookupTable[geoResolution][node.attr[geoResolution]].latitude;
    longOrig = metadataGeoLookupTable[geoResolution][node.attr[geoResolution]].longitude;
    latDest = metadataGeoLookupTable[geoResolution][child.attr[geoResolution]].latitude;
    longDest = metadataGeoLookupTable[geoResolution][child.attr[geoResolution]].longitude;
  } catch (e) {
    // console.warn("No transmission lat/longs for ", countries[0], " -> ", countries[1], "If this wasn't fired in the context of a dataset change, it's probably a bug.")
    return;
  }

  const validLatLongPair = maybeGetTransmissionPair(
    latOrig,
    longOrig + offsetOrig,
    latDest,
    longDest + offsetDest,
    map
  );

  if (validLatLongPair) {
    /* build up transmissions object */
    transmission = {
      originNode: node,
      destinationNode: child,
      originLatLong: validLatLongPair[0],
      destinationLatLong: validLatLongPair[1],
      originName: node.attr[geoResolution],
      destinationName: child.attr[geoResolution],
      originNumDate: node.attr["num_date"],
      destinationNumDate: child.attr["num_date"],
      color: nodeColors[node.arrayIdx],
      visible: visibility[node.arrayIdx] === "visible" && visibility[child.arrayIdx] === "visible",
    }
  }

  return transmission;
}

const maybeGetClosestTransmissionEvent = (
  node,
  child,
  metadataGeoLookupTable,
  geoResolution,
  nodeColors,
  visibility,
  map,
  offsetOrig
) => {
  const possibleEvents = [];
  let closestEvent;

  // iterate over offsets applied to transmission destination
  // even if map is not tripled - ie., don't let a line go across the whole world
  [-360, 0, 360].forEach((offsetDest) => {
    const t = maybeConstructTransmissionEvent(
      node,
      child,
      metadataGeoLookupTable,
      geoResolution,
      nodeColors,
      visibility,
      map,
      offsetOrig,
      offsetDest
    );
    if (t) { possibleEvents.push(t); }
  });

  if (possibleEvents.length === 0) { return; }

  closestEvent = _.minBy(possibleEvents, (event) => {
    return Math.abs(event.destinationLatLong.x - event.originLatLong.x)
  });

  return closestEvent;
}

const setupTransmissionData = (
  nodes,
  visibility,
  geoResolution,
  nodeColors,
  triplicate,
  metadata,
  map
) => {

  let offsets = triplicate ? [-360, 0, 360] : [0]
  const metadataGeoLookupTable = metadata.geo;
  const transmissionData = []; /* edges, animation paths */

  nodes.forEach((n, i) => {
    if (n.children) {
      n.children.forEach((child) => {
        if (
          n.attr[geoResolution] &&
          child.attr[geoResolution] &&
          n.attr[geoResolution] !== child.attr[geoResolution]
        ) {
          // offset is applied to transmission origin
          offsets.forEach((offsetOrig) => {
            const t = maybeGetClosestTransmissionEvent(
              n,
              child,
              metadataGeoLookupTable,
              geoResolution,
              nodeColors,
              visibility,
              map,
              offsetOrig,
            );
            if (t) { transmissionData.push(t) }
          });
        }
      });
    }
  });

  return transmissionData;
}

export const createDemeAndTransmissionData = (nodes, visibility, geoResolution, nodeColors, triplicate, metadata, map) => {

  /*
    walk through nodes and collect a bunch of arrays...
    can count how many times observe a tip and make an array of an attribute,
    which in this case will be color,
    could be an array of hexes which would be enough,
    similar operation for each transmission -
    for each deme pair observe how many and record a hex value from the from deme and
    count them for width and average to get color
  */

  const t = setupTransmissionData(nodes, visibility, geoResolution, nodeColors, triplicate, metadata, map)
  let minTransmissionDate;

  // console.log("This is a transmission from mapHelpersLatLong.js: ", demesAndTransmissions)
  if (t.length) {
    minTransmissionDate = t.map((x) => {
      return x.originNumDate;
    }).reduce((prev, cur) => {
      return cur < prev ? cur : prev;
    });
  }

  return {
    demeData: setupDemeData(nodes, visibility, geoResolution, nodeColors, triplicate, metadata, map),
    transmissionData: t,
    minTransmissionDate,
  }
}
