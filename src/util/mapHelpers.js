import d3 from "d3";

/* util */

const Bernstein = (n, k) => {
  var binom = require('binomial')
  const coeff = binom.get(n, k) // calculate binomial coefficient

  const _bpoly = (x) => {
    return coeff * Math.pow(x,k) * Math.pow(1-x,n-k)
  }
  return _bpoly //return Bernstein polynomial
}

function zeros(dimensions) {
    var array = [];

    for (var i = 0; i < dimensions[0]; ++i) {
        array.push(dimensions.length == 1 ? 0 : zeros(dimensions.slice(1)));
    }
    return array
}

const Bezier = (pathControl,start=0.0,end=1.0,num=15) => { // returns Bezier curve starting at first point in pair, curving towards the second point in pair and
  const N = _.range(pathControl.length) // number of points in [start, mid, end] that will be used to compute the curve
  var linspace = require('linspace')
  var outerProducts = require('outer-product')
  const t = linspace(start,end,num) // num points spaced evenly between fractions of the total curve path (0 = beginning, 1 = end)
  let curve = zeros([num,2]) // empty vector that will become the curve

  for (var i in _.range(curve.length)){ // convert curve to an (x:,y:) format
    curve[i] = {x: curve[i][0], y: curve[i][1]}
  }

  for (var ii in N){ // iterate over provided points
    const B_func = Bernstein(N.length - 1, ii) // get Bernstein polynomial
    const tB = t.map(B_func) // apply Bernstein polynomial to linspace
    const P = [pathControl[ii].x,pathControl[ii].y]
    const prod_idx = outerProducts([_.range(tB.length), _.range(P.length)]) // get indices for outer product

    for (var j in _.range(curve.length)){ // iterate over future curve, adjust each point's coordinate
      curve[j].x += tB[prod_idx[j][0]] * P[prod_idx[j][1]] // update x coordinate for curve with outer product
      curve[j].y += tB[prod_idx[Number(j)+num][0]] * P[prod_idx[Number(j)+num][1]] // update y coordinate for curve with outer product
      }
    }
  return curve
}

const computeMidpoint = (pair, height) => {
  /* Equation derived by Luiz Max Fagundes de Carvalho (University of Edinburgh). */
  const [pointA,pointB] = pair
  const x1 = pointA.x
  const y1 = pointA.y
  const x2 = pointB.x
  const y2 = pointB.y

  const sign = Math.sign(x2-x1) // induce asymmetry in transitions
  const slope = (y2-y1) / (x2-x1)
  const d = Math.sqrt(Math.pow((y2-y1),2) + Math.pow((x2-x1),2)) // distance between points

  let H = 1/height || Math.log(Math.pow(d,0.05))*200 // define height of control point
  const h = Math.sqrt(Math.pow(H,2)+ Math.pow(d,2)/4.0)  // mathemagics

  const xm = x1 + h * Math.cos(Math.atan(2*H/d) + Math.atan(slope)) * sign
  const ym = y1 + h * Math.sin(Math.atan(2*H/d) + Math.atan(slope)) * sign

  return {x: xm, y: ym}
}

export const pathStringGenerator = d3.svg.line()
  .x((d) => { return d.x })
  .y((d) => { return d.y })
  .interpolate("basis");

export const drawDemesAndTransmissions = (latLongs, colorScale, g, map, nodes) => {

  // define markers that are appended to the definition part of the group
  let markerCount=0;
  const makeMarker = function (d){
    markerCount++;
    // console.log(markerCount, d);
    const mID = "marker"+markerCount.toString();
    g.append("defs").selectAll("marker")
      .data([mID])
      .enter().append("marker")
        .attr("id", mID)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 0)
        .attr("refY", 0)
        // the next two lines set the marker size relative to the stroke-width
        .attr("markerWidth",  (x) => { return Math.max(1.5, 7.0 / d.data.total); })
        .attr("markerHeight", (x) => { return Math.max(1.5, 7.0 / d.data.total); })
        .attr("orient", "auto")
      .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("stroke-width",0)
        .attr("fill-opacity",0.5)
        .attr("fill", function(){return d.data.color;});
    return "url(#"+mID+")";
  }

  /* we're ditching geodesic. That means we don't have inner parts anymore.
    538 actually solved that... http://bl.ocks.org/bycoffe/18441cddeb8fe147b719fab5e30b5d45
    then we want to deeplink to animation state... which this may help with: http://jsfiddle.net/henbox/b4bbgdnz/5/
  */
  // add transmission lines with mid markers at each inner point of the path

  const transmissions = g.selectAll("transmissions")
    .data(latLongs.transmissions)
    .enter()
    .append("path") /* instead of appending a geodesic path from the leaflet plugin data, we now draw a line directly between two points */
    .attr("d", (d) => {
      return pathStringGenerator(
        // extractLineSegmentForAnimationEffect(d.data.originToDestinationXYs)
        d.data.originToDestinationXYs
      )
    }) /* with the interpolation in the function above pathStringGenerator */
    .attr("fill","none")
    .attr("stroke-opacity", .6)
    .attr("stroke-linecap", "round")
    .attr("stroke", (d) => { return d.data.color }) /* colorScale(d.data.from); color path by contry in which the transmission arrived */
    .attr("stroke-width", (d) => { return d.data.total }) /* scale line by total number of transmissions */
    // .attr("marker-mid", makeMarker);

    let transmissionPathLengths = [];
    transmissions[0].forEach((d, i) => {

      /* https://developer.mozilla.org/en-US/docs/Web/API/SVGGeometryElement/getTotalLength */
      const totalPathLength = d.getTotalLength();

      /*
        1. Here, we make a mapping between time and geographic position for the transmission.
        2. In short, make the line visible in proportion to the user selected date range, which
            may not include the entire length of the line.
        3. .clamp(true)
            never return a value outside the date range
            this would put the transmission path outside the geographic target
      */

      const pathScale = d3.scale.linear()
                                .domain([
                                  nodes[latLongs.transmissions[i].data.demePairIndices[0]].attr.num_date, /* origin date */
                                  nodes[latLongs.transmissions[i].data.demePairIndices[1]].attr.num_date /* destination date */
                                ])
                                .range([0, totalPathLength])
                                .clamp(true);

      transmissionPathLengths.push({
        totalPathLength,
        pathScale,
      })
    })

  const demes = g.selectAll("demes")
    .data(latLongs.demes)
    .enter().append("circle")
    .style("stroke", "none")
    .style("fill-opacity", .6)
    .style("fill", (d) => { return d.color })
    .attr("r", (d) => { return 0 + Math.sqrt(d.total) * 4 })
    .attr("transform", (d) => {
      return "translate(" + d.coords.x + "," + d.coords.y + ")";
    });

  return {
    demes,
    transmissions,
    transmissionPathLengths
  };

}

export const updateOnMoveEnd = (d3elems, latLongs) => {
  /* map has moved or rescaled, make demes and transmissions line up */
  if (d3elems) {
    d3elems.demes
      .data(latLongs.demes)
      .attr("transform", (d) => {
        return "translate(" + d.coords.x + "," + d.coords.y + ")";
      })

    d3elems.transmissions
      .data(latLongs.transmissions)
      .attr("d", (d) => { return pathStringGenerator(d.data.originToDestinationXYs) })
  }
}

const extractLineSegmentForAnimationEffect = (pair, controls, d, nodes, d3elems, i) => {
  const originDate = nodes[d.data.demePairIndices[0]].attr.num_date;
  const destinationDate = nodes[d.data.demePairIndices[1]].attr.num_date;
  const userDateMin = controls.dateScale(controls.dateFormat.parse(controls.dateMin));
  const userDateMax = controls.dateScale(controls.dateFormat.parse(controls.dateMax));

  /* manually find the points along a Bezier curve at which we should be given the user date selection */
  const start = Math.max(0.0,(userDateMin-originDate)/(destinationDate-originDate)) // clamp start at 0.0 if userDateMin gives a number <0
  const end = Math.min(1.0,(userDateMax-originDate)/(destinationDate-originDate)) // clamp end at 1.0 if userDateMax gives a number >1
  const Bcurve = Bezier([pair[0],computeMidpoint(pair),pair[1]],start,end,10) // calculate Bezier

  return Bcurve
}

export const updateVisibility = (d3elems, latLongs, controls, nodes) => {

  d3elems.demes
    .data(latLongs.demes)
    .transition(5)
    .style("fill", (d) => { return d.total > 0 ? d.color : "white" })
    .attr("r", (d) => {
      return 0 + Math.sqrt(d.total) * 4
    });

  d3elems.transmissions
    .data(latLongs.transmissions)
    // .transition(5)
    .attr("d", (d, i) => {
      return pathStringGenerator(
        extractLineSegmentForAnimationEffect(
          d.data.originToDestinationXYs,
          controls,
          d,
          nodes,
          d3elems,
          i
        )
      )
    }) /* with the interpolation in the function above pathStringGenerator */
    .attr("stroke", (d) => { return d.data.total > 0 ? d.data.color : "white" })
    .attr("stroke-width", (d) => {
      return d.data.total
    })

}

/* template for an update helper */
export const updateFoo = (d3elems, latLongs) => {
  d3elems.demes
    .data(latLongs.demes)

  d3elems.transmissions
    .data(latLongs.transmissions)
}




// const translateAlong = (path) => {
//   var totalPathLength = path.getTotalLength();
//   return (datum, index) => {
//     return (t) => {
//       var p = path.getPointAtLength(t * totalPathLength);
//       return "translate(" + p.x + "," + p.y + ")";
//     };
//   };
// };

// const missiles = transmissionPaths.map((transmissionPath) => {
//
//   // console.log(transmissionPath)
//
//   const missile = g.append("circle")
//     .attr("r", 0)
//     .attr("fill", (d) => { return colorScale(transmissionPath.transmission.to) })
//     .attr("transform", `translate(
//       ${transmissionPath.partialTransmission[0].x},
//       ${transmissionPath.partialTransmission[0].y}
//     )`) /* begin the missile on the start of the line */
//     // .transition()
//     // .duration(5000)
//     // .attrTween("transform", translateAlong(transmissionPath.elem.node()));
//
//   return missile;
// })

// const setTipCoords = () => {
//   demes.attr("transform", (d) => {
//     return "translate(" + d.coords.x + "," + d.coords.y + ")";
//   });
// };

// const animateTransmissions = () => {
//   /* point along path interpolation https://bl.ocks.org/mbostock/1705868 */
//
// }

// setTipCoords();
// map.on("viewreset", setTipCoords); /* search: -Note (A) for an idea as to why this might not be working properly */
// animateTransmissions();

/*
  http://gis.stackexchange.com/questions/49114/d3-geo-path-to-draw-a-path-from-gis-coordinates
  https://bl.ocks.org/mbostock/3916621  // Compute point-interpolators at each distance.
  http://bl.ocks.org/mbostock/5851933 // draw line on map
  https://gist.github.com/mikeatlas/0b69b354a8d713989147 // polyline split if we don't use leaflet
  http://bl.ocks.org/mbostock/5928813
  http://bl.ocks.org/duopixel/4063326 // animate path in
  https://bl.ocks.org/mbostock/1705868 // point along path interpolation
  https://bl.ocks.org/mbostock/1313857 // point along path interpolation
  https://github.com/d3/d3-shape/blob/master/README.md#curves
  https://github.com/d3/d3-shape/blob/master/README.md#lines
*/

// since we're now using d3 we'll probably do something like http://stackoverflow.com/questions/11808860/arrow-triangles-on-my-svg-line/11809868#11809868
// decorator docs: https://github.com/bbecquet/Leaflet.PolylineDecorator
