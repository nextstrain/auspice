import React from "react";
import { ticks } from "d3-array";
import { dataFont, darkGrey } from "../../globalStyles";
import { Background } from "./legend";

/** Gap (px) between the circles and the start of the leader line / labels */
const LABEL_GAP = 8;
/** Keep labels for overflowing circles this far below the top clip edge */
const TOP_PAD = 6;

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
  const values = _pickDemeValues(maxDemeCount, demeRadiusFn, availableWidth, availableHeight); // descending
  console.log("<Demes>", maxDemeCount, values);
  
  const maxRadius = demeRadiusFn(values[0]);
  const cx = maxRadius; // all circles share this centre-x
  const labelX = 2 * maxRadius + LABEL_GAP;
  const height = maxRadius * 2 + LABEL_GAP;

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
          {values.map((value) => {
            const radius = demeRadiusFn(value);
            return (
              <circle
                key={value}
                cx={cx}
                cy={height - radius}
                r={radius}
                fill="none"
                stroke={darkGrey}
              />
            );
          })}
        </g>
        {/* Leader lines + labels. For a circle that fits, the line leaves the top
            of the circle; for one taller than the available height, it sits near
            the top edge and points at the circle's edge at that height. Computing
            the circle edge at labelY reduces to the top point (dx=0) when it fits. */}
        {values.map((value) => {
          const radius = demeRadiusFn(value);
          const cy = height - radius;
          const naturalTopY = cy - radius; // topmost point of the circle
          const labelY = Math.max(naturalTopY, TOP_PAD);
          const dy = labelY - cy;
          const dx = Math.sqrt(Math.max(0, radius * radius - dy * dy));
          const lineStartX = cx + dx; // circle's right edge at labelY
          return (
            <g key={value}>
              <line
                x1={lineStartX}
                y1={labelY}
                x2={labelX}
                y2={labelY}
                stroke={darkGrey}
                strokeWidth={0.5}
              />
              <text
                x={labelX + 2}
                y={labelY}
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


/**
 * Pick a small set of nice-number values to display, spanning the data range
 * but bounded so the largest circle fits within MAX_DEME_RADIUS
 */
function _pickDemeValues(
  maxDemeCount: number,
  demeRadiusFn: (value: number) => number,
  availableWidth: number,
  availableHeight: number,
): number[] {
  const candidates = ticks(0, maxDemeCount * 1.33, 6)
    .filter((v) => {
      const r = demeRadiusFn(v);
      return v >= 1 &&
        r <= availableHeight &&    // diameter can overflow vertically, that's ok
        r * 2 <= (availableWidth - 50) // diameter fits in horizontal space with room for labels
    });
  // Fallback: even the smallest nice tick overflows — just show the count.
  if (candidates.length === 0) return [1, 10, 50];

  // Top of the scale (largest circle that fits) plus a middle tick to bridge
  // the gap down to the low-end anchors.
  const largest = candidates[candidates.length - 1];
  const middle = candidates[Math.floor((candidates.length - 1) / 2)];
  const smallest = candidates[0];
  
  const anchors = [1, 10, 50].filter((v) => v < smallest);

  return [...new Set([largest, middle, smallest, ...anchors])].sort((a, b) => b - a);
}
