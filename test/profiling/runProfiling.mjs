/**
 * Auspice profiling harness — entrypoint (MEASURE-ONLY).
 *
 * Ensures a --includeTiming production build, serves the local data/ dir, drives
 * a set of scenarios headless while capturing perf.js console timers, and writes
 * a baseline JSON + a ranked markdown report.
 *
 *   node test/profiling/runProfiling.mjs [flags]
 *     --build                 force a fresh --includeTiming production build
 *     --throttle N            CPU throttle rate (default 1 = off; e.g. 4 = 4x slower)
 *     --only a,b,c            run only these scenario ids
 *     --baseline <file>       diff results against a prior baseline JSON
 *     --out <dir>             output dir (default test/profiling/baselines)
 */

import { chromium } from "playwright";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureTimingBuild, startServer, stopServer, ROOT } from "./buildAndServe.mjs";
import { scenarios as ALL_SCENARIOS } from "./scenarios.mjs";
import { runScenarioTrial } from "./driveScenario.mjs";
import { aggregate } from "./aggregate.mjs";
import { writeBaselineJson, writeRankedMarkdown, loadBaseline } from "./report.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

function parseFlags(argv) {
  const flags = { build: false, throttle: 1, only: null, baseline: null, out: path.join(HERE, "baselines") };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--build") flags.build = true;
    else if (a === "--throttle") flags.throttle = Number(argv[++i]);
    else if (a === "--only") flags.only = argv[++i].split(",").map((s) => s.trim());
    else if (a === "--baseline") flags.baseline = argv[++i];
    else if (a === "--out") flags.out = path.resolve(argv[++i]);
  }
  return flags;
}

function gitInfo() {
  const run = (cmd) => {
    try { return execSync(cmd, { cwd: ROOT }).toString().trim(); } catch { return "unknown"; }
  };
  return { gitSha: run("git rev-parse --short HEAD"), gitBranch: run("git rev-parse --abbrev-ref HEAD") };
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const scenarioList = flags.only
    ? ALL_SCENARIOS.filter((s) => flags.only.includes(s.id))
    : ALL_SCENARIOS;
  if (scenarioList.length === 0) {
    throw new Error(`no scenarios matched --only ${flags.only}`);
  }

  await ensureTimingBuild({ force: flags.build });
  await startServer();

  const browser = await chromium.launch({ headless: true });
  const allSamples = [];
  let sawAnyTimer = false;

  try {
    for (const scenario of scenarioList) {
      const total = (scenario.warmup || 0) + (scenario.repeat || 1);
      console.log(`\n[scenario] ${scenario.id}  (${scenario.warmup || 0} warmup + ${scenario.repeat || 1} measured)`);
      for (let t = 0; t < total; t++) {
        const isWarmup = t < (scenario.warmup || 0);
        const { samples, hadTimers, renderOk } = await runScenarioTrial(browser, scenario, {
          throttle: flags.throttle,
          trial: t,
        });
        sawAnyTimer = sawAnyTimer || hadTimers;
        const tag = isWarmup ? "warmup" : "measured";
        console.log(`  trial ${t} (${tag}): ${samples.filter((s) => !s.name.startsWith("__")).length} timer samples, renderOk=${renderOk}`);
        if (!isWarmup) allSamples.push(...samples);
      }

      // Global guard: after the first (fast) scenario, fail loudly if no timers
      // were seen — means the served build has timers stripped.
      if (scenario === scenarioList[0] && !sawAnyTimer) {
        throw new Error(
          "No 'Timer …' console lines captured on the first scenario. The served dist/ build likely has timers stripped — rerun with --build."
        );
      }
    }
  } finally {
    await browser.close();
    await stopServer();
  }

  const rows = aggregate(allSamples);
  const meta = {
    date: new Date().toISOString(),
    node: process.version,
    cpuThrottle: flags.throttle,
    scenarioIds: scenarioList.map((s) => s.id),
    ...gitInfo(),
  };

  const baseline = loadBaseline(flags.baseline);
  const { shaPath, latestPath } = writeBaselineJson(rows, meta, flags.out);
  const mdPath = path.join(flags.out, `report-${meta.gitSha}.md`);
  const md = writeRankedMarkdown(rows, meta, mdPath, baseline);

  console.log("\n" + md);
  console.log(`\n[done] baseline: ${shaPath}`);
  console.log(`[done] latest:   ${latestPath}`);
  console.log(`[done] report:   ${mdPath}`);
}

main().catch((e) => {
  console.error("\n[FATAL]", e);
  stopServer().finally(() => process.exit(1));
});
