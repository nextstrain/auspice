import { sum } from "d3-array";
import { formatDivergence, guessAreMutationsPerSite} from "./helpers";


/**
 * this function calculates a regression between
 * the x and y values of terminal nodes, passing through
 * nodes[0].
 * It does not consider which tips are inView / visible.
 */
export function calculateRegressionThroughRoot(nodes) {
  const terminalNodes = nodes.filter((d) => d.terminal);
  const nTips = terminalNodes.length;
  const offset = nodes[0].x;
  const XY = sum(
    terminalNodes.map((d) => (d.y) * (d.x - offset))
  ) / nTips;
  const secondMomentTime = sum(
    terminalNodes
      .map((d) => (d.x - offset) * (d.x - offset))
  ) / nTips;
  const slope = XY / secondMomentTime;
  const intercept = -offset * slope;
  return {slope, intercept, r2: undefined};
}

/**
 * Calculate regression through terminal nodes which have both x & y values
 * set. These values must be numeric.
 * This function does not consider which tips are inView / visible.
 */
export function calculateRegressionWithFreeIntercept(nodes) {
  const terminalNodesWithXY = nodes.filter((d) => d.terminal && d.x!==undefined && d.y!==undefined);
  const nTips = terminalNodesWithXY.length;
  const meanX = sum(terminalNodesWithXY.map((d) => d.x))/nTips;
  const meanY = sum(terminalNodesWithXY.map((d) => d.y))/nTips;
  const slope = sum(terminalNodesWithXY.map((d) => (d.x-meanX)*(d.y-meanY))) /
    sum(terminalNodesWithXY.map((d) => (d.x-meanX)**2));
  const intercept = meanY - slope*meanX;
  const r2 = 1 - sum(terminalNodesWithXY.map((d) => (d.y - (intercept + slope*d.x))**2)) /
    sum(terminalNodesWithXY.map((d) => (d.y - meanY)**2));
  return {slope, intercept, r2};
}


export function makeRegressionText(regression, layout, yScale) {
  if (layout==="clock") {
    if (guessAreMutationsPerSite(yScale)) {
      return `rate estimate: ${regression.slope.toExponential(2)} subs per site per year`;
    }
    return `rate estimate: ${formatDivergence(regression.slope)} subs per year`;
  }
  return `intercept = ${regression.intercept.toPrecision(3)}, slope = ${regression.slope.toPrecision(3)}, R^2 = ${regression.r2.toPrecision(3)}`;
}
