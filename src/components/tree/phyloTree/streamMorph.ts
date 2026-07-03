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
  /** newStreamName -> (rippleKey -> t=0 point array, resampled to the final ripple's length) */
  t0ByStreamAndKey: Map<string, Map<string, Pt[]>>;
  /** new streams that are morphing (their entering group should NOT also opacity-fade) */
  morphingNewNames: Set<string>;
  /** old streams whose area is handed off into a morphing new stream (remove immediately, no fade) */
  handedOffOldNames: Set<string>;
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
      pts: rip.map((pt) => ({ x: pt.x, y0: pt.y0, y1: pt.y1 })),
    }));

    let bandMin = Infinity, bandMax = -Infinity;
    for (const m of stream.members) {
      const d = phylotree.nodes[m]?.displayOrder;
      if (d === undefined) continue;
      if (d < bandMin) bandMin = d;
      if (d > bandMax) bandMax = d;
    }

    const nP = ripples.length ? ripples[0].pts.length : 0;
    const envelope: [number, number][] = new Array(nP);
    for (let p = 0; p < nP; p++) {
      let lo = Infinity, hi = -Infinity;
      for (const r of ripples) {
        const pt = r.pts[p];
        if (!pt) continue;
        if (pt.y0 < lo) lo = pt.y0;
        if (pt.y1 < lo) lo = pt.y1;
        if (pt.y0 > hi) hi = pt.y0;
        if (pt.y1 > hi) hi = pt.y1;
      }
      envelope[p] = [lo, hi];
    }

    const snap: OldStreamSnapshot = {
      name: stream.name,
      startNodeIdx: stream.startNode,
      members: new Set(stream.members),
      pivots: node.n.streamPivots ? [...node.n.streamPivots] : [],
      ripples,
      band: [bandMin, bandMax],
      envelope,
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
 * Build the t=0 shapes for a SPLIT child: carve the parent's rendered envelope into the child's
 * display-order sub-slice, then stack the child's categories within that slice in proportion to the
 * child's own final heights (so only the band position morphs, not the internal category ratios).
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

  let cMin = Infinity, cMax = -Infinity;
  for (const m of stream.members) {
    const d = phylotree.nodes[m]?.displayOrder;
    if (d === undefined) continue;
    if (d < cMin) cMin = d;
    if (d > cMax) cMax = d;
  }
  const [pMin, pMax] = parent.band;
  const bandLen = pMax - pMin;
  const fracLo = bandLen > 0 ? (cMin - pMin) / bandLen : 0;
  const fracHi = bandLen > 0 ? (cMax - pMin) / bandLen : 1;

  const env = resampleEnvelope(parent.pivots, parent.envelope, pivots);
  const nP = pivots.length;
  const nCat = t1.length;
  const arrays: Pt[][] = t1.map(() => new Array(nP));

  for (let p = 0; p < nP; p++) {
    const [envLo, envHi] = env[p];
    const sliceLo = envLo + fracLo * (envHi - envLo);
    const span = (envLo + fracHi * (envHi - envLo)) - sliceLo;
    let total = 0;
    const h = new Array(nCat);
    for (let k = 0; k < nCat; k++) { const q = t1[k][p]; const hk = Math.abs(q.y1 - q.y0); h[k] = hk; total += hk; }
    let cum = 0;
    for (let k = 0; k < nCat; k++) {
      const y0 = total > 0 ? sliceLo + (cum / total) * span : sliceLo;
      cum += h[k];
      const y1 = total > 0 ? sliceLo + (cum / total) * span : sliceLo;
      arrays[k][p] = { x: t1[k][p].x, y0, y1 };
    }
  }

  const out = new Map<string, Pt[]>();
  t1.forEach((rip, k) => out.set(String(rip.key), arrays[k]));
  return out;
}

/** Compute all per-stream t=0 shapes + which groups should skip the fade / be handed off immediately. */
export function prepareStreamMorph(phylotree: PhyloTreeType, snapshot: StreamMorphSnapshot): PreparedMorph {
  const t0ByStreamAndKey = new Map<string, Map<string, Pt[]>>();
  const morphingNewNames = new Set<string>();
  const handedOffOldNames = new Set<string>();
  const newStreams = phylotree.streams;
  if (!newStreams) return { t0ByStreamAndKey, morphingNewNames, handedOffOldNames };

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
    }
    /* merge: added in a later step */
  }
  return { t0ByStreamAndKey, morphingNewNames, handedOffOldNames };
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
