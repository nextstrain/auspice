/**
 * Run a single trial of one scenario in an isolated browser context.
 *
 * Isolation: a fresh BrowserContext per trial resets perf.js's module-scoped
 * `dbsingle` accumulator, so timer samples never bleed across scenarios/trials.
 * Every captured line is tagged with the active interaction marker.
 */

import { scenarioUrl } from "./scenarios.mjs";
import { TimerCollector } from "./consoleTimers.mjs";
import { BASE_URL } from "./buildAndServe.mjs";

const RENDER_SPAN = "phyloTree render()";
const CHANGE_SPAN = "phylotree.change()";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function runScenarioTrial(browser, scenario, { throttle = 1, trial = 0 } = {}) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const collector = new TimerCollector();
  collector.attach(page);
  page.on("pageerror", (e) => console.error(`  [pageerror ${scenario.id}] ${e.message}`));

  if (throttle && throttle !== 1) {
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });
  }

  const url = BASE_URL + scenarioUrl(scenario);
  const loadTimeout = scenario.loadTimeoutMs || 60000;
  const settle = scenario.settleAfterMs ?? 800;

  // --- initial load: wait for the render-complete timer line, not networkidle ---
  collector.setMarker("load");
  const rendered = collector.waitForSpan(RENDER_SPAN, loadTimeout);
  await page.goto(url, { waitUntil: "commit", timeout: loadTimeout });
  const renderOk = await rendered;
  if (!renderOk) {
    try {
      await page.locator("svg#MainTree circle.tip").first().waitFor({ timeout: 15000 });
    } catch {
      console.warn(`  [warn ${scenario.id}] no '${RENDER_SPAN}' line and no tips within timeout`);
    }
  }
  await sleep(settle);

  // --- animation window (URL-driven auto-start): capture ticks + cascade ---
  if (scenario.animateMs) {
    collector.setMarker("animation");
    await sleep(scenario.animateMs);
  }

  // --- best-effort DOM interaction steps ---
  for (const step of scenario.steps || []) {
    collector.setMarker(step.label);
    try {
      await runStep(page, collector, step);
    } catch (e) {
      console.warn(`  [skip ${scenario.id}/${step.label}] ${e.message || e}`);
      collector.samples.push({ marker: step.label, name: "__step_skipped__", took: 0 });
    }
    await sleep(settle);
  }

  collector.setMarker(null);
  const hadTimers = collector.hadAnyTimer();
  const samples = collector.all().map((s) => ({ ...s, scenario: scenario.id, trial }));
  await context.close();
  return { samples, hadTimers, renderOk };
}

async function runStep(page, collector, step) {
  if (step.kind === "wait") {
    await sleep(step.waitMs || 500);
    return;
  }
  const changed = collector.waitForSpan(CHANGE_SPAN, 30000);
  if (step.kind === "layout") {
    await page.getByRole("button", { name: step.value, exact: true }).click({ timeout: 8000 });
  } else if (step.kind === "colorby") {
    await page.locator("#selectColorBy").click({ timeout: 8000 });
    await page.keyboard.type(step.value, { delay: 20 });
    await page.keyboard.press("Enter");
  } else {
    throw new Error(`unknown step kind '${step.kind}'`);
  }
  await changed;
}
