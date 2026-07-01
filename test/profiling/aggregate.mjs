/**
 * Aggregate flat timer samples into per-(scenario x marker x span) statistics.
 * Uses the per-call `took` values; reports median/p95 (robust to outliers)
 * rather than mean.
 */

function median(sorted) {
  const n = sorted.length;
  if (n === 0) return 0;
  return n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
}

function percentile(sorted, p) {
  const n = sorted.length;
  if (n === 0) return 0;
  const idx = Math.min(n - 1, Math.max(0, Math.ceil(p * n) - 1));
  return sorted[idx];
}

function stats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    count: sorted.length,
    median: median(sorted),
    p95: percentile(sorted, 0.95),
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
    total: values.reduce((a, b) => a + b, 0),
  };
}

// Field delimiter for group keys. Span names contain spaces (e.g.
// "phyloTree render()"), so we use the NUL char, which cannot appear in a field.
// Built via fromCharCode to keep the source file pure ASCII (no raw NUL byte).
const SEP = String.fromCharCode(0);

/** @returns {Array<{scenario,marker,name,count,median,p95,min,max,total,samples}>} */
export function aggregate(samples) {
  const real = samples.filter((s) => typeof s.took === "number" && !s.name.startsWith("__"));
  const groups = new Map();
  for (const s of real) {
    const key = `${s.scenario}${SEP}${s.marker}${SEP}${s.name}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s.took);
  }
  const rows = [];
  for (const [key, vals] of groups) {
    const [scenario, marker, name] = key.split(SEP);
    rows.push({ scenario, marker, name, ...stats(vals), samples: vals });
  }
  rows.sort((a, b) => b.median - a.median);
  return rows;
}

export function rowKey(r) {
  return `${r.scenario}${SEP}${r.marker}${SEP}${r.name}`;
}
