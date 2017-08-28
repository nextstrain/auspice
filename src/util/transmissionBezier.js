import _range from "lodash/range";
import linspace from "linspace";
import outerProducts from "outer-product";

function zeros(dimensions) {
    var array = [];

    for (var i = 0; i < dimensions[0]; ++i) {
        array.push(dimensions.length == 1 ? 0 : zeros(dimensions.slice(1)));
    }
    return array
}

const Bernstein = (n, k) => {
  var binom = require('binomial')
  const coeff = binom.get(n, k) // calculate binomial coefficient

  const _bpoly = (x) => {
    return coeff * Math.pow(x,k) * Math.pow(1-x,n-k)
  }
  return _bpoly //return Bernstein polynomial
}

/* Equation derived by Luiz Max Fagundes de Carvalho (University of Edinburgh).
   This function computes the coordinate of a point that is at a distance `height`
   perpendicular to the center of the line connecting the two points define in `pair`. */
export const computeMidpoint = (pointA, pointB) => {
  const x1 = pointA.x
  const y1 = pointA.y
  const x2 = pointB.x
  const y2 = pointB.y

  const sign = Math.sign(x2-x1) // induce asymmetry in transitions
  const slope = (y2-y1) / (x2-x1)
  const d = Math.sqrt(Math.pow((y2-y1),2) + Math.pow((x2-x1),2)) // distance between points

  let H = Math.log(Math.pow(d,0.05))*200 // +modify // define height of control point
  const h = Math.sqrt(Math.pow(H,2)+ Math.pow(d,2)/4.0)  // mathemagics

  const xm = x1 + h * Math.cos(Math.atan(2*H/d) + Math.atan(slope)) * sign
  const ym = y1 + h * Math.sin(Math.atan(2*H/d) + Math.atan(slope)) * sign

  return {x: xm, y: ym}
}

export const Bezier = (pathControl, start=0.0, end=1.0, num=15) => { // returns Bezier curve starting at first point in pair, curving towards the second point in pair and
  const N = _range(pathControl.length) // number of points in [start, mid, end] that will be used to compute the curve
  const t = linspace(start,end,num) // num points spaced evenly between fractions of the total curve path (0 = beginning, 1 = end)
  let curve = zeros([num,2]) // empty vector that will become the curve

  for (var i in _range(curve.length)){ // convert curve to an (x:,y:) format
    curve[i] = {x: curve[i][0], y: curve[i][1]}
  }

  for (var ii in N) { // iterate over provided points
    const B_func = Bernstein(N.length - 1, ii) // get Bernstein polynomial
    const tB = t.map(B_func) // apply Bernstein polynomial to linspace
    const P = [pathControl[ii].x,pathControl[ii].y]
    const prod_idx = outerProducts([_range(tB.length), _range(P.length)]) // get indices for outer product

    for (var j in _range(curve.length)){ // iterate over future curve, adjust each point's coordinate
      curve[j].x += tB[prod_idx[j][0]] * P[prod_idx[j][1]] // update x coordinate for curve with outer product
      curve[j].y += tB[prod_idx[Number(j)+num][0]] * P[prod_idx[Number(j)+num][1]] // update y coordinate for curve with outer product
      }
    }
  return curve
}
