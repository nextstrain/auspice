import _range from "lodash/range";
import linspace from "linspace";
import outerProducts from "outer-product";
import binom from "binomial";
import { transmissionThickness } from "../../util/globals";

const bernstein = (n, k) => {
  const coeff = binom.get(n, k); // calculate binomial coefficient
  const _bpoly = (x) => {
    return coeff * x**k * (1-x)**(n-k);
  };
  return _bpoly; // return Bernstein polynomial
};

/* Equation derived by Luiz Max Fagundes de Carvalho (University of Edinburgh).
   This function computes the coordinate of a point that is at a distance `height`
   perpendicular to the center of the line connecting the two points define in `pair`.
   Extend by an supplied number of pixels, modified by transmissionThickness */
export const computeMidpoint = (pointA, pointB, extend) => {
  const x1 = pointA.x;
  const y1 = pointA.y;
  const x2 = pointB.x;
  const y2 = pointB.y;

  const sign = Math.sign(x2-x1); // induce asymmetry in transitions
  const slope = (y2-y1) / (x2-x1);
  const d = Math.sqrt(((y2-y1)**2) + ((x2-x1)**2)); // distance between points

  const H = Math.log(d**0.05)*200 + extend * transmissionThickness; // define height of control point
  const h = Math.sqrt(H**2 + (d**2)/4.0);  // mathemagics

  const xm = x1 + h * Math.cos(Math.atan(2*H/d) + Math.atan(slope)) * sign;
  const ym = y1 + h * Math.sin(Math.atan(2*H/d) + Math.atan(slope)) * sign;

  return {x: xm, y: ym};
};

export const bezier = (startPoint, endPoint, extend, num=15) => { // returns Bezier curve starting at first point in pair, curving towards the second point in pair and
  const midPoint = computeMidpoint(startPoint, endPoint, extend);
  const pathControl = [startPoint, midPoint, endPoint];
  const N = _range(pathControl.length); // number of points in [start, mid, end] that will be used to compute the curve
  const t = linspace(0.0, 1.0, num); // num points spaced evenly between fractions of the total curve path (0 = beginning, 1 = end)

  const curve = [];
  _range(num).forEach((i) => {
    curve[i] = {x: 0, y: 0};
  });

  N.forEach((ii) => { // iterate over provided points
    const B_func = bernstein(N.length - 1, ii); // get Bernstein polynomial
    const tB = t.map(B_func); // apply Bernstein polynomial to linspace
    const P = [pathControl[ii].x, pathControl[ii].y];
    const prod_idx = outerProducts([_range(tB.length), _range(P.length)]); // get indices for outer product

    _range(curve.length).forEach((j) => { // iterate over future curve, adjust each point's coordinate
      curve[j].x += tB[prod_idx[j][0]] * P[prod_idx[j][1]]; // update x coordinate for curve with outer product
      curve[j].y += tB[prod_idx[j+num][0]] * P[prod_idx[j+num][1]]; // update y coordinate for curve with outer product
    });
  });

  return curve;

};
