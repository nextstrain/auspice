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
        if (!demeMap[n.attr[geoResolution]]) {
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
          count: value.length,
          color: averageColors(value),
          latitude: lat, // raw latitude value
          longitude: long, // raw longitude value
          coords: leafletLatLongToLayerPoint(lat, long, map) // coords are x,y plotted via d3
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
      id: node.arrayIdx.toString() + "-" + child.arrayIdx.toString(),
      originNode: node,
      destinationNode: child,
      originName: node.attr[geoResolution],
      destinationName: child.attr[geoResolution],
      originCoords: validLatLongPair[0], // after interchange
      destinationCoords: validLatLongPair[1], // after interchange
      originLatitude: latOrig, // raw latitude value
      destinationLatitude: latDest, // raw latitude value
      originLongitude: longOrig + offsetOrig, // raw longitude value
      destinationLongitude: longDest + offsetDest, //raw longitude value
      originNumDate: node.attr["num_date"],
      destinationNumDate: child.attr["num_date"],
      color: nodeColors[node.arrayIdx],
      visible: visibility[child.arrayIdx] === "visible" ? "visible" : "hidden", // transmission visible if child is visible
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
    return Math.abs(event.destinationCoords.x - event.originCoords.x)
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
    walk through nodes and collect all data
    for demeData we have:
      name, coords, count, color
    for transmissionData we have:
      originNode, destinationNode, originCoords, destinationCoords, originName, destinationName
      originNumDate, destinationNumDate, color, visible
  */

  const dData = setupDemeData(nodes, visibility, geoResolution, nodeColors, triplicate, metadata, map);
  const tData = setupTransmissionData(nodes, visibility, geoResolution, nodeColors, triplicate, metadata, map);

  let minTransmissionDate;
  // console.log("This is a transmission from mapHelpersLatLong.js: ", demesAndTransmissions)
  if (tData.length) {
    minTransmissionDate = tData.map((x) => {
      return tData.originNumDate;
    }).reduce((prev, cur) => {
      return cur < prev ? cur : prev;
    });
  }

  return {
    demeData: dData,
    transmissionData: tData,
    minTransmissionDate,
  }
}

const updateDemeDataColAndVis = (demeData, nodes, visibility, geoResolution, nodeColors) => {

  // do aggregation as intermediate step
  let demeMap = {};
  nodes.forEach((n, i) => {
    if (!n.children) {
      if (n.attr[geoResolution]) { // check for undefined
        if (!demeMap[n.attr[geoResolution]]) {
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

  // update demeData, for each deme, update all elements whose name matches
  _.forOwn(demeMap, (value, key) => { // value: hash color array, key: deme name
    demeData.forEach((deme,i) => {
      if (deme.name === key) {
        deme.count = value.length;
        deme.color = averageColors(value);
      }
    })
  });

}

const updateTransmissionDataColAndVis = (transmissionData, nodes, visibility, geoResolution, nodeColors) => {

  // index transmissions by node.arrayIdx
  // map node.arrayIdx to [color, visibility]

  let transmissionMap = {};

  nodes.forEach((node, i) => {
    if (node.children) {
      node.children.forEach((child) => {
        if (
          node.attr[geoResolution] &&
          child.attr[geoResolution] &&
          node.attr[geoResolution] !== child.attr[geoResolution]
        ) {

          // this is a transmission event from n to child
          const id = node.arrayIdx.toString() + "-" + child.arrayIdx.toString();
          const col = nodeColors[node.arrayIdx];
          const vis = visibility[child.arrayIdx] === "visible" ? "visible" : "hidden"; // transmission visible if child is visible
          transmissionMap[id] = [col, vis];
        }
      });
    }
  });

  _.forOwn(transmissionMap, (value, key) => { // value: [color, visibility], key: transmission id
    transmissionData.forEach((transmission,i) => {
      if (transmission.id === key) {
        transmission.color = value[0],
        transmission.visible = value[1]
      }
    })
  });

}

export const updateDemeAndTransmissionDataColAndVis = (demeData, transmissionData, nodes, visibility, geoResolution, nodeColors) => {

  /*
    walk through nodes and update attributes that can mutate
    for demeData we have:
      count, color
    for transmissionData we have:
      color, visible
  */

  updateDemeDataColAndVis(demeData, nodes, visibility, geoResolution, nodeColors);
  updateTransmissionDataColAndVis(transmissionData, nodes, visibility, geoResolution, nodeColors);

}

const updateDemeDataLatLong = (demeData, map) => {

  // interchange for all demes
  demeData.forEach((d,i) => {
    d.coords = leafletLatLongToLayerPoint(d.latitude, d.longitude, map);
  });

}

const updateTransmissionDataLatLong = (transmissionData, map) => {

  // interchange for all transmissions
  transmissionData.forEach((transmission,i) => {
    transmission.originCoords = leafletLatLongToLayerPoint(transmission.originLatitude, transmission.originLongitude, map);
    transmission.destinationCoords = leafletLatLongToLayerPoint(transmission.destinationLatitude, transmission.destinationLongitude, map);
  });

}

export const updateDemeAndTransmissionDataLatLong = (demeData, transmissionData, map) => {

  /*
    walk through nodes and update attributes that can mutate
    for demeData we have:
      count, color
    for transmissionData we have:
      color, visible
  */

  updateDemeDataLatLong(demeData, map);
  updateTransmissionDataLatLong(transmissionData, map);

}
