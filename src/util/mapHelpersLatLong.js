import {averageColors} from "./colorHelpers";
import {getTipColorAttribute} from "./treeHelpers";
import {computeMidpoint, Bezier} from "./transmissionBezier";


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

  const demeData = []; /* deme array */
  const demeIndices = {}; /* map of name to indices in array */

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

  let index = 0;
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

        if (!demeIndices[key]) {
          demeIndices[key] = [index];
        } else{
          demeIndices[key].push(index);
        }
        index += 1;

      }
    });
  });

  return {
    demeData: demeData,
    demeIndices: demeIndices
  }

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
  offsetDest,
  minTransmissionDate
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

    let Bcurve;
    let Bdates = [];

    if (minTransmissionDate) {
      Bcurve = Bezier(
        [
          validLatLongPair[0],
          computeMidpoint(
            validLatLongPair,
            (child.attr["num_date"] - minTransmissionDate) * 25.0
          ),
          validLatLongPair[1]
        ]
      );

      /* set up interpolator with origin and destination numdates */
      const interpolator = d3.interpolateNumber(node.attr.num_date, child.attr.num_date)

      /* make a Bdates array as long as Bcurve */
      Bcurve.forEach((d, i) => {
        /* fill it with interpolated dates */
        Bdates.push(
          interpolator(i / (Bcurve.length - 1)) /* ie., 5 / 15ths of the way through = 2016.3243 */
        )
      });

    }

    /* build up transmissions object */
    transmission = {
      id: node.arrayIdx.toString() + "-" + child.arrayIdx.toString(),
      originNode: node,
      destinationNode: child,
      bezierCurve: Bcurve,
      bezierDates: Bdates,
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
  offsetOrig,
  minTransmissionDate,
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
      offsetDest,
      minTransmissionDate
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
  map,
  minTransmissionDate
) => {

  let offsets = triplicate ? [-360, 0, 360] : [0]
  const metadataGeoLookupTable = metadata.geo;
  const transmissionData = []; /* edges, animation paths */
  const transmissionIndices = {}; /* map of transmission id to array of indices */

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
              minTransmissionDate,
            );
            if (t) { transmissionData.push(t) }
          });
        }
      });
    }
  });

  transmissionData.forEach((transmission, index) => {
    if (!transmissionIndices[transmission.id]) {
      transmissionIndices[transmission.id] = [index];
    } else {
      transmissionIndices[transmission.id].push(index);
    }
  })

  return {
    transmissionData: transmissionData,
    transmissionIndices: transmissionIndices
  }

}

export const createDemeAndTransmissionData = (
  nodes,
  visibility,
  geoResolution,
  nodeColors,
  triplicate,
  metadata,
  map
) => {

  /*
    walk through nodes and collect all data
    for demeData we have:
      name, coords, count, color
    for transmissionData we have:
      originNode, destinationNode, originCoords, destinationCoords, originName, destinationName
      originNumDate, destinationNumDate, color, visible
  */

  const {
    demeData,
    demeIndices
  } = setupDemeData(nodes, visibility, geoResolution, nodeColors, triplicate, metadata, map);


  const getMinTransmissionDate = () => {
    /* first time in a scope so that we can run minTransmissionDate */
    const { transmissionData } = setupTransmissionData(
      nodes,
      visibility,
      geoResolution,
      nodeColors,
      triplicate,
      metadata,
      map
    );

    let minTransmissionDate;
    // console.log("This is a transmission from mapHelpersLatLong.js: ", demesAndTransmissions)
    if (transmissionData.length) {
      minTransmissionDate = transmissionData.map((x) => {
        return x.originNumDate;
      }).reduce((prev, cur) => {
        return cur < prev ? cur : prev;
      });
    }

    return minTransmissionDate;
  }

  const minTransmissionDate = getMinTransmissionDate();


  /* second time so that we can get Bezier */
  const { transmissionData, transmissionIndices } = setupTransmissionData(
    nodes,
    visibility,
    geoResolution,
    nodeColors,
    triplicate,
    metadata,
    map,
    minTransmissionDate
  );

  return {
    demeData: demeData,
    transmissionData: transmissionData,
    demeIndices: demeIndices,
    transmissionIndices: transmissionIndices,
    minTransmissionDate
  }
}

/*******************************
********************************
  UPDATE DEMES & TRANSMISSIONS
********************************
********************************/

const updateDemeDataColAndVis = (demeData, demeIndices, nodes, visibility, geoResolution, nodeColors) => {

  let demeDataCopy = demeData.slice();

  // initialize empty map
  let demeMap = {};
  _.forOwn(demeIndices, (value, key) => { // value: array of indices, key: deme name
    demeMap[key] = [];
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

  // update demeData, for each deme, update all elements via demeIndices lookup
  _.forOwn(demeMap, (value, key) => { // value: hash color array, key: deme name
    const name = key;
    demeIndices[name].forEach((index) => {
      demeDataCopy[index].count = value.length;
      demeDataCopy[index].color = averageColors(value);
    })
  });


  return demeDataCopy;

}

const updateTransmissionDataColAndVis = (transmissionData, transmissionIndices, nodes, visibility, geoResolution, nodeColors) => {

  let transmissionDataCopy = transmissionData.slice(); /* basically, instead of _.map() since we're not mapping over the data we're mutating */

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

          // update transmissionData via index lookup
          transmissionIndices[id].forEach((index) => {
            transmissionDataCopy[index].color = col;
            transmissionDataCopy[index].visible = vis;
          })

        }
      });
    }
  });
  return transmissionDataCopy;
}

export const updateDemeAndTransmissionDataColAndVis = (demeData, transmissionData, demeIndices, transmissionIndices, nodes, visibility, geoResolution, nodeColors) => {

  /*
    walk through nodes and update attributes that can mutate
    for demeData we have:
      count, color
    for transmissionData we have:
      color, visible
  */

  let newDemes;
  let newTransmissions;

  if (demeData && transmissionData) {
    newDemes = updateDemeDataColAndVis(demeData, demeIndices, nodes, visibility, geoResolution, nodeColors);
    newTransmissions = updateTransmissionDataColAndVis(transmissionData, transmissionIndices, nodes, visibility, geoResolution, nodeColors);
  }

  return {
    newDemes,
    newTransmissions,
  }

}

/*********************
**********************
  ZOOM LEVEL CHANGE
**********************
**********************/

const updateDemeDataLatLong = (demeData, map) => {

  // interchange for all demes
  return _.map(demeData, (d,i) => {
    d.coords = leafletLatLongToLayerPoint(d.latitude, d.longitude, map);
    return d;
  });

}

const updateTransmissionDataLatLong = (transmissionData, map) => {

  let transmissionDataCopy = transmissionData.slice(); /* basically, instead of _.map() since we're not mapping over the data we're mutating */

  // interchange for all transmissions
  transmissionDataCopy.forEach((transmission,i) => {
    transmission.originCoords = leafletLatLongToLayerPoint(transmission.originLatitude, transmission.originLongitude, map);
    transmission.destinationCoords = leafletLatLongToLayerPoint(transmission.destinationLatitude, transmission.destinationLongitude, map);
  });

  return transmissionDataCopy;

}

export const updateDemeAndTransmissionDataLatLong = (demeData, transmissionData, map) => {

  /*
    walk through nodes and update attributes that can mutate
    for demeData we have:
      count, color
    for transmissionData we have:
      color, visible
  */

  let newDemes;
  let newTransmissions;

  if (demeData && transmissionData) {
    newDemes = updateDemeDataLatLong(demeData, map);
    newTransmissions = updateTransmissionDataLatLong(transmissionData, map);
  }

  return {
    newDemes,
    newTransmissions,
  }

}
