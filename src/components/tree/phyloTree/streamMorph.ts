/**
 * Area-morph for streamtree re-partitions.
 *
 * When the auto-partition changes (zoom / filter / date), a coarse stream splits into finer child
 * streams (or the reverse merges). Rather than cross-fading the old ripples out and the new ones in,
 * we morph: each new child ripple starts as its slice of the parent's *already-rendered* pixel band
 * and tweens to its own final shape (and vice-versa for a merge).
 *
 * The key trick (keeps it "visually continuous" without reconstructing KDE densities): we carve the
 * parent's rendered pixel envelope into child sub-slices by each child's display-order band position.
 * Because display-order is partition-invariant, children bands tile the parent band, so the slices
 * refill the parent's silhouette exactly at t=0 regardless of the per-stream weight/scaleFactor.
 */

import { StreamSummary, Streams } from "../../../reducers/tree/types";
import { PhyloNode, PhyloTreeType } from "./types";

type Pt = { x: number; y0: number; y1: number };

interface RippleSnapshot {
  categoryName: string | undefined;
  /** the d3 join key (`<categoryName>_<colorBy>`) so merge targets can match the exiting DOM ripples */
  key: string;
  pts: Pt[];
}

export interface OldStreamSnapshot {
  name: string;
  startNodeIdx: number;
  members: Set<number>;
  /** the stream's own pivot values (x domain), aligned 1:1 with ripple pts and `envelope` */
  pivots: number[];
  ripples: RippleSnapshot[];
  /** display-order band [min,max] spanned by the stream's member tips */
  band: [number, number];
  /** per-pivot [minY,maxY] pixel envelope of the whole stacked stream */
  envelope: [number, number][];
}

export interface StreamMorphSnapshot {
  byName: Map<string, OldStreamSnapshot>;
  byStartNode: Map<number, string>;
}

type MorphPlan =
  | { kind: "1:1" }
  | { kind: "split"; parent: OldStreamSnapshot }
  | { kind: "merge"; children: OldStreamSnapshot[] }
  | { kind: "none" };

export interface PreparedMorph {
  /** SPLIT: newStreamName -> (rippleKey -> t=0 point array); entering child tweens from this to its shape */
  t0ByStreamAndKey: Map<string, Map<string, Pt[]>>;
  /** new streams that are morphing (their entering group should NOT also opacity-fade) */
  morphingNewNames: Set<string>;
  /** old streams whose area is handed off into a morphing new stream (remove immediately, no fade) */
  handedOffOldNames: Set<string>;
  /** MERGE: oldChildName -> (rippleKey -> target shape); exiting child tweens its shape into this */
  mergeExit: Map<string, Map<string, Pt[]>>;
  /** old streams that are merging into a new parent (morph + fade on exit rather than a plain fade) */
  mergingOldNames: Set<string>;
}

/** Per-pivot [minY,maxY] pixel envelope of a stacked stream (all its category ripples). */
function computeEnvelope(ripplePts: readonly (readonly Pt[])[]): [number, number][] {
  const nP = ripplePts.length ? ripplePts[0].length : 0;
  const env: [number, number][] = new Array(nP);
  for (let p = 0; p < nP; p++) {
    let lo = Infinity, hi = -Infinity;
    for (const pts of ripplePts) {
      const pt = pts[p];
      if (!pt) continue;
      if (pt.y0 < lo) lo = pt.y0;
      if (pt.y1 < lo) lo = pt.y1;
      if (pt.y0 > hi) hi = pt.y0;
      if (pt.y1 > hi) hi = pt.y1;
    }
    env[p] = [lo, hi];
  }
  return env;
}

/** The display-order band [min,max] spanned by a stream's member tips. */
function computeBand(members: Iterable<number>, nodes: PhyloNode[]): [number, number] {
  let lo = Infinity, hi = -Infinity;
  for (const m of members) {
    const d = nodes[m]?.displayOrder;
    if (d === undefined) continue;
    if (d < lo) lo = d;
    if (d > hi) hi = d;
  }
  return [lo, hi];
}

/**
 * Snapshot the OLD streams + their rendered pixel shapes BEFORE they're overwritten in place by the
 * next `mapStreamsToScreen`. Deep-copies the point arrays (mandatory — they're mutated in place).
 */
export function buildStreamMorphSnapshot(phylotree: PhyloTreeType, oldStreams: Streams): StreamMorphSnapshot {
  const byName = new Map<string, OldStreamSnapshot>();
  const byStartNode = new Map<number, string>();
  for (const stream of Object.values(oldStreams)) {
    const node = phylotree.nodes[stream.startNode];
    if (!node) continue;
    const catNames = node.n.streamCategories ? node.n.streamCategories.map((c) => c.name) : [];
    const ripples: RippleSnapshot[] = (node.streamRipples || []).map((rip, i) => ({
      categoryName: catNames[i],
      key: String(rip.key),
      pts: rip.map((pt) => ({ x: pt.x, y0: pt.y0, y1: pt.y1 })),
    }));

    const snap: OldStreamSnapshot = {
      name: stream.name,
      startNodeIdx: stream.startNode,
      members: new Set(stream.members),
      pivots: node.n.streamPivots ? [...node.n.streamPivots] : [],
      ripples,
      band: computeBand(stream.members, phylotree.nodes),
      envelope: computeEnvelope(ripples.map((r) => r.pts)),
    };
    byName.set(stream.name, snap);
    byStartNode.set(stream.startNode, stream.name);
  }
  return { byName, byStartNode };
}

/** Walk up the parent chain from `startIdx` (strict ancestors only) to the first node whose arrayIdx ∈ idxSet. */
function firstAncestorInSet(nodes: PhyloNode[], startIdx: number, idxSet: Set<number>): number | undefined {
  let n = nodes[startIdx]?.n?.parent;
  while (n && n.arrayIdx !== undefined) {
    if (idxSet.has(n.arrayIdx)) return n.arrayIdx;
    if (n.parent === n) break; // auspice's root is self-referential (root.parent === root) — stop here
    n = n.parent;
  }
  return undefined;
}

function computeMorphPlans(newStreams: Streams, snapshot: StreamMorphSnapshot, nodes: PhyloNode[]): Map<string, MorphPlan> {
  const plans = new Map<string, MorphPlan>();
  const newStreamList = Object.values(newStreams);

  const oldStartIdxSet = new Set(snapshot.byStartNode.keys());
  const newStartIdxSet = new Set<number>();
  const newNameByStartNode = new Map<number, string>();
  for (const s of newStreamList) {
    newStartIdxSet.add(s.startNode);
    newNameByStartNode.set(s.startNode, s.name);
  }

  /* group each OLD stream under the NEW stream that now contains it (for merge detection) */
  const oldChildrenByNewName = new Map<string, OldStreamSnapshot[]>();
  for (const [oldStartIdx, oldName] of snapshot.byStartNode) {
    if (newStartIdxSet.has(oldStartIdx)) continue; // 1:1, not a merge child
    const ancNew = firstAncestorInSet(nodes, oldStartIdx, newStartIdxSet);
    if (ancNew === undefined) continue;
    const newName = newNameByStartNode.get(ancNew);
    const snap = snapshot.byName.get(oldName);
    if (!newName || !snap) continue;
    const arr = oldChildrenByNewName.get(newName);
    if (arr) arr.push(snap);
    else oldChildrenByNewName.set(newName, [snap]);
  }

  for (const s of newStreamList) {
    if (snapshot.byStartNode.has(s.startNode)) { plans.set(s.name, { kind: "1:1" }); continue; }
    const ancOld = firstAncestorInSet(nodes, s.startNode, oldStartIdxSet);
    if (ancOld !== undefined) {
      const parentName = snapshot.byStartNode.get(ancOld);
      const parent = parentName !== undefined ? snapshot.byName.get(parentName) : undefined;
      plans.set(s.name, parent && parent.ripples.length ? { kind: "split", parent } : { kind: "none" });
      continue;
    }
    const children = oldChildrenByNewName.get(s.name);
    plans.set(s.name, children && children.length ? { kind: "merge", children } : { kind: "none" });
  }
  return plans;
}

/** Sample a per-pivot pixel envelope at the `dst` pivot VALUES (shared master grid → align by value). */
function resampleEnvelope(srcPivots: number[], srcEnv: [number, number][], dst: number[]): [number, number][] {
  const out: [number, number][] = new Array(dst.length);
  const n = srcPivots.length;
  if (!n) { for (let i = 0; i < dst.length; i++) out[i] = [0, 0]; return out; }
  for (let i = 0; i < dst.length; i++) {
    const v = dst[i];
    if (v <= srcPivots[0]) { out[i] = srcEnv[0]; continue; }
    if (v >= srcPivots[n - 1]) { out[i] = srcEnv[n - 1]; continue; }
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (srcPivots[mid] <= v) lo = mid; else hi = mid; }
    const t = (v - srcPivots[lo]) / (srcPivots[hi] - srcPivots[lo]);
    out[i] = [
      srcEnv[lo][0] + t * (srcEnv[hi][0] - srcEnv[lo][0]),
      srcEnv[lo][1] + t * (srcEnv[hi][1] - srcEnv[lo][1]),
    ];
  }
  return out;
}

/**
 * Carve one stream ("child") into its display-order sub-slice of another stream's ("parent") rendered
 * envelope, keeping the child's own x + per-category height proportions. Used both ways: for a SPLIT
 * this is the child's t=0 (its slice of the OLD parent, morphing out to its own shape); for a MERGE
 * it's the child's target (its slice of the NEW parent, morphing in from the child's own shape). The
 * children's slices tile the parent band (display-order is partition-invariant), so together they
 * refill the parent silhouette.
 */
function carveSlice(
  childRipples: readonly { key: string; pts: Pt[] }[],
  childPivots: number[],
  childBand: [number, number],
  parentBand: [number, number],
  parentEnvelope: [number, number][],
  parentPivots: number[],
): Map<string, Pt[]> {
  const [pMin, pMax] = parentBand;
  const bandLen = pMax - pMin;
  const [cMin, cMax] = childBand;
  const fracLo = bandLen > 0 ? (cMin - pMin) / bandLen : 0;
  const fracHi = bandLen > 0 ? (cMax - pMin) / bandLen : 1;

  const env = resampleEnvelope(parentPivots, parentEnvelope, childPivots);
  const nP = childPivots.length;
  const nCat = childRipples.length;
  const arrays: Pt[][] = childRipples.map(() => new Array(nP));

  for (let p = 0; p < nP; p++) {
    const [envLo, envHi] = env[p];
    const sliceLo = envLo + fracLo * (envHi - envLo);
    const span = (envLo + fracHi * (envHi - envLo)) - sliceLo;
    let total = 0;
    const h = new Array(nCat);
    for (let k = 0; k < nCat; k++) { const q = childRipples[k].pts[p]; const hk = Math.abs(q.y1 - q.y0); h[k] = hk; total += hk; }
    let cum = 0;
    for (let k = 0; k < nCat; k++) {
      const y0 = total > 0 ? sliceLo + (cum / total) * span : sliceLo;
      cum += h[k];
      const y1 = total > 0 ? sliceLo + (cum / total) * span : sliceLo;
      arrays[k][p] = { x: childRipples[k].pts[p].x, y0, y1 };
    }
  }

  const out = new Map<string, Pt[]>();
  childRipples.forEach((rip, k) => out.set(rip.key, arrays[k]));
  return out;
}

/**
 * Build the t=0 shapes for a SPLIT child: its slice of the OLD parent's rendered envelope, keyed by
 * the child's (new) ripple keys, resampled to the child's final pivots so it can tween to its shape.
 */
function buildSplitStartRipples(
  node: PhyloNode,
  stream: StreamSummary,
  parent: OldStreamSnapshot,
  phylotree: PhyloTreeType,
): Map<string, Pt[]> | undefined {
  const t1 = node.streamRipples;
  const pivots = node.n.streamPivots;
  if (!t1 || !t1.length || !pivots || !pivots.length) return undefined;
  const childRipples = t1.map((rip) => ({ key: String(rip.key), pts: rip }));
  const childBand = computeBand(stream.members, phylotree.nodes);
  return carveSlice(childRipples, pivots, childBand, parent.band, parent.envelope, parent.pivots);
}

/**
 * Build the target shapes for a MERGE child: its slice of the NEW parent's rendered envelope, keyed
 * by the child's (old) ripple keys, over the child's old pivots so its old shape can tween into it.
 */
function buildMergeTargetRipples(
  child: OldStreamSnapshot,
  parentNode: PhyloNode,
  parentStream: StreamSummary,
  phylotree: PhyloTreeType,
): Map<string, Pt[]> | undefined {
  const parentRipples = parentNode.streamRipples;
  const parentPivots = parentNode.n.streamPivots;
  if (!parentRipples || !parentRipples.length || !parentPivots || !parentPivots.length) return undefined;
  if (!child.ripples.length) return undefined;
  const parentEnv = computeEnvelope(parentRipples);
  const parentBand = computeBand(parentStream.members, phylotree.nodes);
  return carveSlice(child.ripples, child.pivots, child.band, parentBand, parentEnv, parentPivots);
}

/** Compute all per-stream morph shapes + which groups should skip the fade / hand off / merge. */
export function prepareStreamMorph(phylotree: PhyloTreeType, snapshot: StreamMorphSnapshot): PreparedMorph {
  const t0ByStreamAndKey = new Map<string, Map<string, Pt[]>>();
  const morphingNewNames = new Set<string>();
  const handedOffOldNames = new Set<string>();
  const mergeExit = new Map<string, Map<string, Pt[]>>();
  const mergingOldNames = new Set<string>();
  const empty: PreparedMorph = { t0ByStreamAndKey, morphingNewNames, handedOffOldNames, mergeExit, mergingOldNames };
  const newStreams = phylotree.streams;
  if (!newStreams) return empty;

  const plans = computeMorphPlans(newStreams, snapshot, phylotree.nodes);
  for (const [name, plan] of plans) {
    if (plan.kind === "split") {
      const stream = newStreams[name];
      const node = phylotree.nodes[stream.startNode];
      const t0 = buildSplitStartRipples(node, stream, plan.parent, phylotree);
      if (t0) {
        t0ByStreamAndKey.set(name, t0);
        morphingNewNames.add(name);
        handedOffOldNames.add(plan.parent.name);
      }
    } else if (plan.kind === "merge") {
      /* K children → this new parent. The parent enters + fades in (default path); each exiting child
       * morphs its shape into its slice of the parent. If the parent is invisible/degenerate (e.g. its
       * tips scrolled out of view on a zoom-in) the children fall back to the plain fade. */
      const parentStream = newStreams[name];
      const parentNode = phylotree.nodes[parentStream.startNode];
      for (const child of plan.children) {
        const target = buildMergeTargetRipples(child, parentNode, parentStream, phylotree);
        if (target) {
          mergeExit.set(child.name, target);
          mergingOldNames.add(child.name);
        }
      }
    }
  }
  return empty;
}

/** Per-index linear interpolation of two equal-length point arrays; NaN-safe (falls back to `b`). */
export function interpolatePoints(a: Pt[], b: readonly Pt[], t: number): Pt[] {
  const n = Math.min(a.length, b.length);
  const out: Pt[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const p = a[i], q = b[i];
    const x = p.x + (q.x - p.x) * t;
    const y0 = p.y0 + (q.y0 - p.y0) * t;
    const y1 = p.y1 + (q.y1 - p.y1) * t;
    out[i] = (Number.isFinite(x) && Number.isFinite(y0) && Number.isFinite(y1)) ? { x, y0, y1 } : { x: q.x, y0: q.y0, y1: q.y1 };
  }
  return out;
}
