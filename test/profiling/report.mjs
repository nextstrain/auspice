/**
 * Write the machine-readable baseline JSON and the human-readable ranked report.
 * Both support before/after diffing against a prior baseline (measure-only —
 * no code change is required to compare two runs).
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { rowKey } from "./aggregate.mjs";

export function writeBaselineJson(rows, meta, outDir) {
  mkdirSync(outDir, { recursive: true });
  const payload = { meta, rows };
  const shaName = `baseline-${meta.gitSha || "unknown"}.json`;
  const shaPath = path.join(outDir, shaName);
  const latestPath = path.join(outDir, "baseline-latest.json");
  const json = JSON.stringify(payload, null, 2);
  writeFileSync(shaPath, json);
  writeFileSync(latestPath, json);
  return { shaPath, latestPath };
}

export function loadBaseline(file) {
  if (!file || !existsSync(file)) return null;
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8"));
    const map = new Map();
    for (const r of parsed.rows || []) map.set(rowKey(r), r);
    return { meta: parsed.meta, map };
  } catch {
    return null;
  }
}

const pad = (s, n) => String(s).padEnd(n);
const padL = (s, n) => String(s).padStart(n);
const ms = (v) => `${Math.round(v)}`;

function deltaCell(cur, base) {
  if (!base) return "—";
  const d = cur - base.median;
  const pct = base.median ? (d / base.median) * 100 : 0;
  const sign = d > 0 ? "+" : "";
  return `${sign}${ms(d)} (${sign}${pct.toFixed(0)}%)`;
}

function table(rows, baseline) {
  const cols = [
    ["span", 26],
    ["scenario", 22],
    ["marker", 18],
    ["median", 8],
    ["p95", 7],
    ["max", 7],
    ["n", 4],
  ];
  if (baseline) cols.push(["Δ median", 16]);
  const header = cols.map(([h, w]) => (h === "median" || h === "p95" || h === "max" || h === "n" ? padL(h, w) : pad(h, w))).join("  ");
  const lines = [header, "-".repeat(header.length)];
  for (const r of rows) {
    const base = baseline ? baseline.map.get(rowKey(r)) : null;
    const cells = [
      pad(r.name, 26),
      pad(r.scenario, 22),
      pad(r.marker, 18),
      padL(ms(r.median), 8),
      padL(ms(r.p95), 7),
      padL(ms(r.max), 7),
      padL(r.count, 4),
    ];
    if (baseline) cells.push(pad(deltaCell(r.median, base), 16));
    lines.push(cells.join("  "));
  }
  return lines.join("\n");
}

export function buildRankedReport(rows, meta, baseline) {
  const byMedian = [...rows].sort((a, b) => b.median - a.median);
  const byTotal = [...rows].sort((a, b) => b.total - a.total);

  const out = [];
  out.push(`# Auspice profiling baseline`);
  out.push("");
  out.push(`- date: ${meta.date}`);
  out.push(`- git: ${meta.gitSha} (${meta.gitBranch})`);
  out.push(`- node: ${meta.node}  cpuThrottle: ${meta.cpuThrottle}x`);
  out.push(`- scenarios: ${meta.scenarioIds.join(", ")}`);
  if (baseline) out.push(`- Δ vs baseline: ${baseline.meta?.gitSha} @ ${baseline.meta?.date}`);
  out.push("");
  out.push(`## Top 15 hotspots by per-call median (ms)`);
  out.push("");
  out.push("```");
  out.push(table(byMedian.slice(0, 15), baseline));
  out.push("```");
  out.push("");
  out.push(`## Top 15 by total time across all calls (ms)`);
  out.push("");
  out.push("```");
  out.push(table(byTotal.slice(0, 15), baseline));
  out.push("```");
  out.push("");
  out.push(`## All spans (by median)`);
  out.push("");
  out.push("```");
  out.push(table(byMedian, baseline));
  out.push("```");
  out.push("");
  return out.join("\n");
}

export function writeRankedMarkdown(rows, meta, outPath, baseline) {
  const md = buildRankedReport(rows, meta, baseline);
  writeFileSync(outPath, md);
  return md;
}
