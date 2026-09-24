import React from "react";
import { ticks } from "d3-array";
import { dataFont, darkGrey, lightGrey } from "../../globalStyles";
import { Background } from "./legend";
import type { HoveredDeme } from "../../reducers/controls";

/** Gap (px) between the circles and the start of the leader line / labels */
const LABEL_GAP = 8;
/** Keep labels for overflowing circles this far below the top clip edge */
const TOP_PAD = 6;
const BOTTOM_PAD = 8;
const LEFT_PAD = 8;

interface DemesProps {
  maxDemeCount: number;
  demeRadiusFn: (value: number) => number;
  availableWidth: number;
  availableHeight: number;
  /** the map deme currently being hovered, or undefined when none */
  hoveredDeme?: HoveredDeme;
}

/**
 * Renders a proportional-symbol legend for the map demes: a set of nested
 * (concentric) circles sharing a common bottom tangent, largest behind, each
 * annotated by a nice-number value via a leader line to labels on the right.
 *
 * When a map deme is being hovered (`hoveredDeme`) we de-emphasise the
 * reference circles (grey stroke, no labels) and draw a single black circle
 * sized to the hovered deme, labelled with its tip count and name. A pie-chart
 * deme is treated as a single circle representing the whole deme (see the map's
 * hover handlers), not an individual arc.
 *
 * Coordinate system is from the top,left of the containing <g>.
 */
const Demes = ({ maxDemeCount, demeRadiusFn, availableWidth, availableHeight, hoveredDeme }: DemesProps): JSX.Element => {
  const values = _pickDemeValues(maxDemeCount, demeRadiusFn, availableWidth, availableHeight); // descending

  const hovering = hoveredDeme !== undefined && hoveredDeme.demeCount >= 1;
  const hoveredRadius = hovering && hoveredDeme ? demeRadiusFn(hoveredDeme.demeCount) : 0;

  /* The reference circles fix the geometry, but when hovering a large deme the
     hovered circle may be bigger than any of them, so grow the box to fit it. */
  const maxRadius = Math.max(demeRadiusFn(values[0]), hoveredRadius);
  const cx = LEFT_PAD + maxRadius; // all circles share this centre-x
  const labelX = 2 * maxRadius + LABEL_GAP;
  const baseline = maxRadius * 2 + TOP_PAD;
  const height = baseline + BOTTOM_PAD;
  
  const Circle = ({ r, fill, stroke }: { r: number, fill: string, stroke: string }): JSX.Element => (
    <circle cx={cx} cy={baseline - r} r={r} fill={fill} stroke={stroke} />
  );

  return (
    <svg width={availableWidth} height={height} style={{ display: "block" }}>
      <Background width={availableWidth} height={height} />
      <g id="LegendDemesContainer">
        {/* Reference circles, drawn largest-first so smaller ones sit "in front".
            They're clipped to the available height, so a circle taller than the
            space is cut off at the top edge rather than drawing over the legend
            items. When hovering they're de-emphasised to grey. */}
        <clipPath id="demesClip">
          <rect x={0} y={0} width={2 * maxRadius + LEFT_PAD} height={height} />
        </clipPath>
        <g clipPath="url(#demesClip)">
          {values.map((value) =>
            <Circle key={value} r={demeRadiusFn(value)} fill={"none"} stroke={hovering ? lightGrey : darkGrey} />
          )}
          {/* the hovered deme, drawn on top in black */}
          {hovering && <Circle r={hoveredRadius} fill={darkGrey} stroke={darkGrey} />}
        </g>
        {hovering && hoveredDeme ?
          /* When hovered, only show a single label */
          <LineAndLabel cx={cx} baseline={baseline} radius={hoveredRadius} labelX={labelX} text={`${hoveredDeme.demeCount} ${hoveredDeme.demeName}`} bold /> :
          /* otherwise show a label per circle */
          values.map((value) =>
            <LineAndLabel key={value} cx={cx} baseline={baseline} radius={demeRadiusFn(value)} labelX={labelX} text={value} bold={false} />
          )
        }
      </g>
    </svg>
  );
};

export default Demes;


/** Leader line + label pointing at a circle of the given radius/value. For a
    circle that fits, the line touches the top of the circle; for one taller than
    the available height, it touches the circle as high as possible */
function LineAndLabel(
  { cx, baseline, labelX, radius, bold, text }: { cx: number, baseline: number, labelX: number, radius: number, bold: boolean, text: string | number }
): JSX.Element {
  const cy = baseline - radius;
  const naturalTopY = cy - radius; // topmost point of the circle
  const labelY = Math.max(naturalTopY, TOP_PAD);
  const dy = labelY - cy;
  const dx = Math.sqrt(Math.max(0, radius * radius - dy * dy));
  const lineStartX = cx + dx; // circle's right edge at labelY
  const colour = bold ? '#000' : darkGrey;
  return (
    <g>
      <line x1={lineStartX} y1={labelY} x2={labelX} y2={labelY} stroke={colour} strokeWidth={0.5} />
      <text
        x={labelX + 2}
        y={labelY}
        textAnchor="start"
        dominantBaseline="central"
        style={{ fontSize: 12, fill: colour, fontFamily: dataFont }}
      >
        {text}
      </text>
    </g>
  );
}

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
