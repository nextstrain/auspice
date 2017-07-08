import {averageColors} from "./colorHelpers";
import {getTipColorAttribute} from "./treeHelpers";

/* interchange. this is a leaflet method that will tell d3 where to draw.
-Note (A) we MAY have to do this every time rather than just once */
const leafletLatLongToLayerPoint = (lat, long, map) => {
  return map.latLngToLayerPoint(new L.LatLng(lat, long))
}

const aggregated = (nodes, visibility, geoResolution, nodeColors) => {
  const aggregatedLocations = {}; /* demes */
  const aggregatedLocationsWraparoundCopy = {}; /* edges, animation paths */
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
  // first pass to initialize empty vectors
  nodes.forEach((n, i) => {
    if (!n.children) {
      if (!aggregatedLocations[n.attr[geoResolution]]) {
        aggregatedLocations[n.attr[geoResolution]] = [];
        aggregatedLocationsWraparoundCopy[n.attr[geoResolution]] = [];
      }
    }
    if (n.children) {
      n.children.forEach((child) => {
        if (n.attr[geoResolution] !== child.attr[geoResolution]) {
          const transmission = n.attr[geoResolution] + "|" + child.attr[geoResolution] + "@" +
                               n.strain + "|" + child.strain + "@" +
                               n.arrayIdx + "|" + child.arrayIdx;
          if (!aggregatedTransmissions[transmission]) {
            aggregatedTransmissions[transmission] = [];
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
      aggregatedLocations[n.attr[geoResolution]].push(nodeColors[i]);
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
          // make this a pair of indices that point to nodes
          // this is flatter and self documenting
          const transmission = n.attr[geoResolution] + "|" + child.attr[geoResolution] + "@" +
                               n.strain + "|" + child.strain + "@" +
                               n.arrayIdx + "|" + child.arrayIdx;
          aggregatedTransmissions[transmission] = [nodeColors[i]];
        }
      });
    }
  });
  return {
    aggregatedLocations,
    aggregatedLocationsWraparoundCopy,
    aggregatedTransmissions
  }
}

export const getLatLongs = (nodes, visibility, metadata, map, geoResolution, triplicate, nodeColors) => {

  let offsets = triplicate ? [-360, 0, 360] : [0]

  // longs of original map are -180 to 180
  // longs of fully triplicated map are -540 to 540
  // restrict to longs between -360 to 360
  const westBound = -360;
  const eastBound = 360;

  const {
    aggregatedLocations,
    aggregatedTransmissions
  } = aggregated(nodes, visibility, geoResolution, nodeColors);
  const geo = metadata.geo;
  const demesAndTransmissions = {
    demes: [],
    transmissions: []
  };

  offsets.forEach((OFFSET) => {
    /* count DEMES */
    _.forOwn(aggregatedLocations, (value, key) => {
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


  offsets.forEach((OFFSET) => {

    /* count TRANSMISSIONS for line thickness */
    _.forOwn(aggregatedTransmissions, (value, key) => {

      const locs = key.split("@")[0].split("|");

      // /* we already know the path for china to us because we've already done us to china */
      // if (
      //   knownShortestPaths[countries[0] + "/" + countries[1]] ||
      //   knownShortestPaths[countries[1] + "/" + countries[0]]
      // ) {
      //   /* use the one we already know about from knownShortestPaths. */
      // } else {
      //   /* figure out the new one, insert it AND ITS REVERSE into the knownShortestPaths map above */
      // }

      let longOrig;
      let longDest;
      let latOrig;
      let latDest;
      try {
        longOrig = geo[geoResolution][locs[0]].longitude;
        longDest = geo[geoResolution][locs[1]].longitude;
        latOrig = geo[geoResolution][locs[0]].latitude;
        latDest = geo[geoResolution][locs[1]].latitude;
      } catch (e) {
        // console.log("No transmission lat/longs for ", countries[0], " -> ", countries[1])
        return;
      }

      let pairs = [];

      // if either origin or destination are inside bounds, include
      // transmission must be less than 180 lat difference
      if (
        (longOrig + OFFSET > westBound || longDest > westBound) &&
        (longOrig + OFFSET < eastBound || longDest < eastBound) &&
        (Math.abs( (longOrig + OFFSET) - (longDest) ) < 180)
      ) {
        const middleDest = [
          leafletLatLongToLayerPoint(latOrig, longOrig + OFFSET, map),
          leafletLatLongToLayerPoint(latDest, longDest, map)
        ];
        pairs.push(middleDest);
      }

      // if either origin or destination are inside bounds, include
      // transmission must be less than 180 lat difference
      if (
        (longOrig + OFFSET > westBound || longDest - 360 > westBound) &&
        (longOrig + OFFSET < eastBound || longDest - 360 < eastBound) &&
        (Math.abs( (longOrig + OFFSET) - (longDest - 360) ) < 180)
      ) {
        const westDest = [
          leafletLatLongToLayerPoint(latOrig, longOrig + OFFSET, map),
          leafletLatLongToLayerPoint(latDest, longDest - 360, map)
        ];
        pairs.push(westDest);
      }

      // if either origin or destination are inside bounds, include
      // transmission must be less than 180 lat difference
      if (
        (longOrig + OFFSET > westBound || longDest + 360 > westBound) &&
        (longOrig + OFFSET < eastBound || longDest + 360 < eastBound) &&
        (Math.abs( (longOrig + OFFSET) - (longDest + 360) ) < 180)
      ) {
        const eastDest = [
          leafletLatLongToLayerPoint(latOrig, longOrig + OFFSET, map),
          leafletLatLongToLayerPoint(latDest, longDest + 360, map)
        ];
        pairs.push(eastDest);
      }

      if (pairs.length === 0) { return; }

      /* this gives us an index for both demes in the transmission pair with which we will access the node array */
      const winningPair = _.minBy(pairs, (pair) => { return Math.abs(pair[1].x - pair[0].x) });

      const transmission = {
        demePairIndices: key.split("@")[2].split("|"), /* this has some weird values occassionally that do not presently break anything. created/discovered during animation work. */
        originToDestinationXYs: winningPair,
        total: value.length, /* changes over time */
        color: averageColors(value), /* changes over time */
      }

      demesAndTransmissions.transmissions.push({data: transmission})
    });

  }) /* End OFFSET */

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
