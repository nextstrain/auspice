import React from "react";
import { ticks } from "d3-array";
import { dataFont, darkGrey } from "../../globalStyles";
import { Background } from "./legend";

/** Gap (px) between the circles and the start of the leader line / labels */
const LABEL_GAP = 8;
/** Keep labels for overflowing circles this far below the top clip edge */
const TOP_PAD = 6;
const BOTTOM_PAD = 8;
const LEFT_PAD = 8;
const LABEL_SPACE = 50;
/** Minimum vertical gap (px) between adjacent labels; closer ones are dropped */
const MIN_LABEL_GAP = 12;

interface DemesProps {
  maxDemeCount: number;
  demeRadiusFn: (value: number) => number;
  availableWidth: number;
  availableHeight: number;
}

/**
 * Renders a proportional-symbol legend for the map demes: a set of nested
 * (concentric) circles sharing a common bottom tangent, largest behind, each
 * annotated by a nice-number value via a leader line to labels on the right.
 *
 * Coordinate system is from the top,left of the containing <g>.
 */
const Demes = ({ maxDemeCount, demeRadiusFn, availableWidth, availableHeight }: DemesProps): JSX.Element => {
  const maxAllowableRadius = Math.min(
    (availableWidth - LABEL_SPACE) / 2,
    (availableHeight - BOTTOM_PAD - TOP_PAD) / 2
  );
  const values = _pickDemeValues(maxDemeCount, demeRadiusFn, maxAllowableRadius); // descending

  const maxRadius = demeRadiusFn(values[0]);
  const cx = LEFT_PAD + maxRadius; // all circles share this centre-x
  const labelX = 2 * maxRadius + LABEL_GAP;
  const height = maxRadius * 2 + TOP_PAD + BOTTOM_PAD;
  const bottomY = height - BOTTOM_PAD; // common bottom tangent of all circles

  // Drop circles/labels whose labels would crowd the one kept above them.
  const circles = _dropCrowdedLabels(values, demeRadiusFn, bottomY, MIN_LABEL_GAP);

  return (
    <svg width={availableWidth} height={height} style={{ display: "block" }}>
      <Background width={availableWidth} height={height} />
      <g id="LegendDemesContainer">
        {/* Circles, drawn largest-first so smaller ones sit "in front". They're
            clipped to the available height, so a circle taller than the space is
            cut off at the top edge rather than drawing over the legend items. */}
        <clipPath id="demesClip">
          <rect x={0} y={0} width={2 * maxRadius} height={height} />
        </clipPath>
        <g clipPath="url(#demesClip)">
          {circles.map(({ value, radius }) => (
            <circle
              key={value}
              cx={cx}
              cy={bottomY - radius}
              r={radius}
              fill="none"
              stroke={darkGrey}
            />
          ))}
        </g>
        {/* Leader lines + labels. For a circle that fits, the line leaves the top
            of the circle; for one taller than the available height, it sits near
            the top edge and points at the circle's edge at that height. Computing
            the circle edge at labelY reduces to the top point (dx=0) when it fits. */}
        {circles.map(({ value, radius, yPosition }) => {
          const cy = bottomY - radius;
          const dy = yPosition - cy;
          const dx = Math.sqrt(Math.max(0, radius * radius - dy * dy));
          const lineStartX = cx + dx; // circle's right edge at labelY
          return (
            <g key={value}>
              <line
                x1={lineStartX}
                y1={yPosition}
                x2={labelX}
                y2={yPosition}
                stroke={darkGrey}
                strokeWidth={0.5}
              />
              <text
                x={labelX + 2}
                y={yPosition}
                textAnchor="start"
                dominantBaseline="central"
                style={{ fontSize: 12, fill: darkGrey, fontFamily: dataFont }}
              >
                {value}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};

export default Demes;


interface DemeCircle {
  value: number;
  radius: number;
  /** y-coordinate of the label (= the circle's top, clamped for overflow) */
  yPosition: number;
}

/**
 * Keep labels (and their circles) spaced at least `minGap` px apart vertically,
 * dropping any whose label would sit too close to the one kept above it. Expects
 * `values` descending (largest first, i.e. topmost label); since labels move
 * downward as the value shrinks a single greedy pass suffices. Returns each kept
 * value together with its radius and label y-position so callers needn't recompute.
 */
function _dropCrowdedLabels(
  values: number[],
  demeRadiusFn: (value: number) => number,
  bottomY: number,
  minGap: number,
): DemeCircle[] {
  const kept: DemeCircle[] = [];
  let lastY: number | undefined;
  for (const value of values) {
    const radius = demeRadiusFn(value);
    const yPosition = Math.max(bottomY - 2 * radius, TOP_PAD);
    if (lastY === undefined || yPosition - lastY >= minGap) {
      kept.push({ value, radius, yPosition });
      lastY = yPosition;
    }
  }
  return kept;
}

/**
 * Pick a small set of nice-number values to display, spanning the data range
 * but bounded so the largest circle fits within MAX_DEME_RADIUS
 */
function _pickDemeValues(
  maxDemeCount: number,
  demeRadiusFn: (value: number) => number,
  maxAllowableRadius: number,
): number[] {

  const maxCount = _findMax(maxDemeCount, demeRadiusFn, maxAllowableRadius);

  const candidates = ticks(0, maxCount, 3)
    .filter((v) => v > 10); // values 10 and below added below

  const anchors = [1, 5, 10];

  if (candidates.length === 0) return anchors.sort((a, b) => b - a)
  
  // Top of the scale (largest circle that fits) plus a middle tick to bridge
  // the gap down to the low-end anchors.
  const largest = candidates[candidates.length - 1];
  const middle = candidates[Math.floor((candidates.length - 1) / 2)];
  const smallest = candidates[0];

  return [...new Set([largest, middle, smallest, ...anchors.filter((v) => v < smallest)])]
    .sort((a, b) => b - a);
}

/**
 * Find the largest count whose radius fits in `maxR`. Returned values will
 * always be multiples of 10.
 */
function _findMax(
  count: number,
  demeRadiusFn: (value: number) => number,
  maxR: number,
): number | undefined {
  // Values are 10*i for i in [1, n]
  const n = Math.floor(count / 10);
  if (n < 1 || demeRadiusFn(10) >= maxR) return 10;

  let lo = 1;         // 10*lo is known to fit
  let hi = n + 1;     // 10*hi is assumed not to fit
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (demeRadiusFn(mid * 10) < maxR) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return lo * 10;
}
