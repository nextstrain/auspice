/**
 * Capture and compare the rendered phyloTree SVG DOM.
 *
 * Used by renderEquivalence.mjs to assert that an incrementally-updated tree
 * (phylotree.change()) is identical to a from-scratch full render of the same
 * state. Captures the geometry/colour-critical, stable-id elements (tips, branch
 * stems/tees, confidence lines) plus label groups, reading BOTH inline style and
 * attribute (style wins, per CSS precedence) and normalizing values so cosmetic
 * draw-vs-update differences (e.g. stroke-width "2" vs "2px") don't register.
 */

/** Runs in the browser: returns a structured snapshot of the tree SVG. */
export function snapshot(page) {
  return page.evaluate(() => {
    const round = (v) => {
      const f = parseFloat(String(v).replace("px", "").trim());
      return Number.isNaN(f) ? String(v) : String(Math.round(f * 10) / 10);
    };
    // read a property from style first (wins), else attribute
    const raw = (el, name) => {
      const s = el.style.getPropertyValue(name);
      return s !== "" && s != null ? s : el.getAttribute(name) || "";
    };
    const prop = (el, name, isNum) => (isNum ? round(raw(el, name)) : raw(el, name));

    const byId = (sel, spec) => {
      const out = {};
      document.querySelectorAll(sel).forEach((el) => {
        if (!el.id) return;
        const rec = {};
        for (const [name, isNum] of spec) rec[name] = prop(el, name, isNum);
        out[el.id] = rec;
      });
      return out;
    };

    // label groups have no per-element id -> capture as a list keyed by content+pos
    const textGroup = (sel) =>
      [...document.querySelectorAll(sel)].map((el) => ({
        text: el.textContent || "",
        x: round(raw(el, "x")),
        y: round(raw(el, "y")),
        visibility: raw(el, "visibility"),
        "font-size": round(raw(el, "font-size")),
      }));

    return {
      tips: byId("circle.tip", [
        ["cx", true], ["cy", true], ["r", true],
        ["fill", false], ["stroke", false], ["visibility", false],
      ]),
      branchS: byId("path.branch.S", [
        ["d", false], ["stroke", false], ["stroke-width", true], ["visibility", false],
      ]),
      branchT: byId("path.branch.T", [
        ["d", false], ["stroke", false], ["stroke-width", true], ["visibility", false],
      ]),
      conf: byId("path.conf", [
        ["d", false], ["stroke", false], ["stroke-width", true],
      ]),
      tipLabels: textGroup("#tipLabels text.tipLabel"),
      branchLabels: textGroup("#branchLabels text.branchLabel"),
    };
  });
}

/** Known draw-vs-update inconsistencies to ignore (documented, not regressions). */
const ALLOWLIST = {
  // updateBranchLabels omits text-anchor/fill/font-family and hardcodes x=xTip-5
  // (drawBranchLabels is orientation-aware) — a real draw/update divergence tracked
  // separately, not something an incremental *tree* op regresses.
  branchLabels: new Set(["x"]),
};

const KEYED = ["tips", "branchS", "branchT", "conf"];

/** Compare two id-keyed element maps; returns mismatch records. */
function diffKeyed(cls, ref, incr) {
  const mismatches = [];
  const only = { ref: 0, incr: 0 };
  const allow = ALLOWLIST[cls] || new Set();
  const ids = new Set([...Object.keys(ref), ...Object.keys(incr)]);
  for (const id of ids) {
    const a = ref[id], b = incr[id];
    if (!a) { only.incr++; continue; }
    if (!b) { only.ref++; continue; }
    for (const k of Object.keys(a)) {
      if (allow.has(k)) continue;
      if (a[k] !== b[k]) mismatches.push({ cls, id, prop: k, ref: a[k], incr: b[k] });
    }
  }
  return { mismatches, only };
}

/** Compare label lists (order-independent) after allowlisting props. */
function diffLabels(cls, ref, incr) {
  const allow = ALLOWLIST[cls] || new Set();
  const key = (r) => JSON.stringify(Object.fromEntries(Object.entries(r).filter(([k]) => !allow.has(k))));
  const rc = ref.map(key).sort(), ic = incr.map(key).sort();
  const mismatches = [];
  if (rc.length !== ic.length) mismatches.push({ cls, id: "(count)", prop: "length", ref: rc.length, incr: ic.length });
  for (let i = 0; i < Math.max(rc.length, ic.length); i++) {
    if (rc[i] !== ic[i]) { mismatches.push({ cls, id: `[${i}]`, prop: "record", ref: rc[i], incr: ic[i] }); break; }
  }
  return { mismatches, only: { ref: 0, incr: 0 } };
}

/** Full comparison of two snapshots. Returns {total, byClass, examples}. */
export function compare(ref, incr) {
  const byClass = {};
  const examples = [];
  let total = 0;
  for (const cls of KEYED) {
    const { mismatches, only } = diffKeyed(cls, ref[cls], incr[cls]);
    byClass[cls] = { diffs: mismatches.length, onlyRef: only.ref, onlyIncr: only.incr };
    total += mismatches.length + only.ref + only.incr;
    for (const m of mismatches.slice(0, 4)) examples.push(m);
  }
  for (const cls of ["tipLabels", "branchLabels"]) {
    const { mismatches } = diffLabels(cls, ref[cls], incr[cls]);
    byClass[cls] = { diffs: mismatches.length };
    total += mismatches.length;
    for (const m of mismatches.slice(0, 2)) examples.push(m);
  }
  return { total, byClass, examples: examples.slice(0, 8) };
}

/** Count how many element records changed between two snapshots (for the "op did something" guard). */
export function countChanged(a, b) {
  let n = 0;
  for (const cls of KEYED) {
    const ids = new Set([...Object.keys(a[cls]), ...Object.keys(b[cls])]);
    for (const id of ids) {
      const x = a[cls][id], y = b[cls][id];
      if (!x || !y) { n++; continue; }
      if (Object.keys(x).some((k) => x[k] !== y[k])) n++;
    }
  }
  return n;
}

/** A cheap signature for settle-detection (do positions/paths still change?). */
export function signature(page) {
  return page.evaluate(() => {
    const t = [...document.querySelectorAll("circle.tip")].slice(0, 50)
      .map((e) => (e.getAttribute("cx") || "") + (e.style.visibility || "")).join(",");
    const b = [...document.querySelectorAll("path.branch.S")].slice(0, 25)
      .map((e) => e.getAttribute("d") || "").join("|");
    const counts = ["circle.tip", "path.branch.S", "path.branch.T", "path.conf"]
      .map((s) => document.querySelectorAll(s).length).join("/");
    return counts + "##" + t + "##" + b;
  });
}
