/**
 * Orchestrate a timers-enabled production build and an `auspice view` server.
 *
 * - ensureTimingBuild(): guarantees dist/ holds a `--includeTiming` production
 *   bundle (rebuilds if missing/stripped), asserting timers survived.
 * - startServer()/stopServer(): serve the top-level `data/` dir (which the stock
 *   playwright.config.ts webServer does NOT do) on :4000, reusing an already
 *   running server if present.
 */

import { spawn } from "node:child_process";
import { readdirSync, readFileSync, existsSync, openSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, "..", "..");
const PORT = 4000;
const BASE_URL = `http://localhost:${PORT}`;
const AVAILABLE_URL = `${BASE_URL}/charon/getAvailable`;

// A string literal from perf.js's timerEnd() output — present in the bundle only
// when timer calls were NOT stripped (i.e. built with --includeTiming).
const TIMER_MARKER = "ms. Average:";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function distHasTimers() {
  const distDir = path.join(ROOT, "dist");
  if (!existsSync(distDir)) return false;
  const jsFiles = readdirSync(distDir).filter((f) => f.endsWith(".js"));
  return jsFiles.some((f) =>
    readFileSync(path.join(distDir, f), "utf8").includes(TIMER_MARKER)
  );
}

function runBuild() {
  return new Promise((resolve, reject) => {
    console.log("[build] node auspice.js build --includeTiming (production, timers on) …");
    const proc = spawn("node", ["auspice.js", "build", "--includeTiming"], {
      cwd: ROOT,
      stdio: "inherit",
    });
    proc.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`build exited with code ${code}`))
    );
    proc.on("error", reject);
  });
}

export async function ensureTimingBuild({ force = false } = {}) {
  if (!force && distHasTimers()) {
    console.log("[build] reusing existing timers-enabled dist/ build");
    return;
  }
  await runBuild();
  if (!distHasTimers()) {
    throw new Error(
      "[build] FATAL: production build did not retain timers — check babel.config.cjs strip logic / --includeTiming"
    );
  }
  console.log("[build] timers-enabled build confirmed in dist/");
}

async function isServerUp() {
  try {
    const r = await fetch(AVAILABLE_URL);
    return r.ok;
  } catch {
    return false;
  }
}

let serverProc = null;

export async function startServer() {
  if (await isServerUp()) {
    console.log(`[serve] reusing server already listening on ${BASE_URL}`);
    return { spawned: false };
  }
  const logPath = path.join(HERE, ".server.log");
  const out = openSync(logPath, "a");
  console.log(`[serve] starting: auspice view data test/data test/fetched-jsons  (log: ${logPath})`);
  serverProc = spawn(
    "node",
    ["auspice.js", "view", "data", "test/data", "test/fetched-jsons"],
    { cwd: ROOT, stdio: ["ignore", out, out] }
  );
  serverProc.on("error", (e) => console.error("[serve] spawn error:", e));

  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    if (await isServerUp()) {
      console.log(`[serve] up at ${BASE_URL}`);
      return { spawned: true };
    }
    if (serverProc.exitCode !== null) {
      throw new Error(`[serve] server exited early (code ${serverProc.exitCode}); see ${logPath}`);
    }
    await sleep(500);
  }
  throw new Error(`[serve] server did not become ready within 60s; see ${logPath}`);
}

export async function stopServer() {
  if (serverProc && serverProc.exitCode === null) {
    serverProc.kill("SIGTERM");
    console.log("[serve] stopped spawned server");
  }
  serverProc = null;
}

export { BASE_URL };
