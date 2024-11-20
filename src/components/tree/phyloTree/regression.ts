import { sum } from "d3-array";
import { formatDivergence, guessAreMutationsPerSite} from "./helpers";
import { NODE_VISIBLE } from "../../../util/globals";
import { PhyloNode, PhyloTreeType, Regression } from "./types";
import { ScaleContinuousNumeric } from "d3-scale";


/**
 * this function calculates a regression between
 * the x and y values of terminal nodes which are also visible.
 * The regression is forced to pass through nodes[0].
 */
function calculateRegressionThroughRoot(nodes: PhyloNode[]): Regression {
  const terminalNodes = nodes.filter((d) => !d.n.hasChildren && d.visibility === NODE_VISIBLE);
  const nTips = terminalNodes.length;
  if (nTips===0) {
    return {slope: undefined, intercept: undefined, r2: undefined};
  }
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
 * Calculate regression through visible terminal nodes which have both x & y values
 * set. These values must be numeric.
 */
function calculateRegressionWithFreeIntercept(nodes: PhyloNode[]): Regression {
  const terminalNodesWithXY = nodes.filter(
    (d) => (!d.n.hasChildren) && d.x!==undefined && d.y!==undefined && d.visibility === NODE_VISIBLE
  );
  const nTips = terminalNodesWithXY.length;
  if (nTips===0) {
    return {slope: undefined, intercept: undefined, r2: undefined};
  }
  const meanX = sum(terminalNodesWithXY.map((d) => d.x))/nTips;
  const meanY = sum(terminalNodesWithXY.map((d) => d.y))/nTips;
  const slope = sum(terminalNodesWithXY.map((d) => (d.x-meanX)*(d.y-meanY))) /
    sum(terminalNodesWithXY.map((d) => (d.x-meanX)**2));
  const intercept = meanY - slope*meanX;
  const r2 = 1 - sum(terminalNodesWithXY.map((d) => (d.y - (intercept + slope*d.x))**2)) /
    sum(terminalNodesWithXY.map((d) => (d.y - meanY)**2));
  return {slope, intercept, r2};
}

/** sets this.regression  */
export function calculateRegression(this: PhyloTreeType) {
  if (this.layout==="clock") {
    this.regression = calculateRegressionThroughRoot(this.nodes);
  } else {
    this.regression = calculateRegressionWithFreeIntercept(this.nodes);
  }
}

export function makeRegressionText(
  regression: Regression,
  layout: string,
  yScale: ScaleContinuousNumeric<number, number>,
): string {
  if (layout==="clock") {
    if (guessAreMutationsPerSite(yScale)) {
      return `rate estimate: ${regression.slope.toExponential(2)} subs per site per year`;
    }
    return `rate estimate: ${formatDivergence(regression.slope)} subs per year`;
  }
  return `intercept = ${regression.intercept.toPrecision(3)}, slope = ${regression.slope.toPrecision(3)}, R^2 = ${regression.r2.toPrecision(3)}`;
}
