/**
 * This exercises the actual offline behaviour of the service worker feature,
 * which can only be meaningfully verified in a real browser: it builds a
 * standalone copy of Auspice with `AUSPICE_ENABLE_SERVICE_WORKER=true` into a
 * temporary directory, serves it with `auspice view` on its own port
 * (independent of the default build / server used by the other smoke tests),
 * and drives it with Playwright.
 *
 * This is unrelated to the default build used by ../smoke-test/urls.test.js, so
 * it does not require `npm run fetch-test-data`.
 */
import {test, expect} from '@playwright/test';
import {spawn} from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {fileURLToPath} from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const PORT = process.env.SERVICE_WORKER_TEST_PORT || '4001';
const BASE_URL = `http://localhost:${PORT}`;

test.use({baseURL: BASE_URL});

// serial so all tests can share one build
test.describe.configure({mode: 'serial'});

let buildDir;
let serverProcess;

test.beforeAll(async () => {
  // build may take longer than the default timeout of 30s
  test.setTimeout(60_000);
  buildDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auspice-service-worker-test-'));
  await buildWithServiceWorkerEnabled(buildDir);
  serverProcess = await startServer(buildDir);
});

test("registers a service worker which serves the root path while offline", async ({page, context}) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);

  await context.setOffline(true);
  const response = await page.reload();
  expect(response.status()).toEqual(200);
});

test("does not serve non-root navigations while offline", async ({page, context}) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);

  await context.setOffline(true);
  await expect(page.goto('/foo')).rejects.toThrow();
});

test.afterAll(async () => {
  if (serverProcess) serverProcess.kill();
  if (buildDir) fs.rmSync(buildDir, {recursive: true, force: true});
});

/**
 * Builds Auspice into `outputDir/dist` with the service worker enabled by
 * spawning ./buildServiceWorkerApp.js as its own `node` process. The build must
 * not run in-process here: webpack.config.cjs require()s TypeScript files that
 * rely on Node's native type stripping, which Playwright's module loader breaks.
 * (We use a custom builder script in order to (a) control the output location
 * and (b) take shortcuts to speed up the build time.)
 */
function buildWithServiceWorkerEnabled(outputDir) {
  const proc = spawn(
    'node',
    [path.join(__dirname, 'buildServiceWorkerApp.js'), outputDir],
    {stdio: ['ignore', 'inherit', 'inherit']}
  );

  return new Promise((resolve, reject) => {
    proc.on('error', reject);
    proc.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Service worker build exited with code ${code}`));
    });
  });
}

/**
 * Starts `auspice view` serving `buildDir/dist`, with an empty dataset
 * directory (this test doesn't need real datasets).
 */
function startServer(dir) {
  const emptyDir = path.join(dir, 'data');
  fs.mkdirSync(emptyDir);

  const proc = spawn(
    'node',
    [path.join(REPO_ROOT, 'auspice.js'), 'view', '--customBuildOnly', '--datasetDir', emptyDir],
    {cwd: dir, env: {...process.env, PORT}}
  );

  return waitForServer(proc);
}

function waitForServer(proc) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        proc.kill();
        reject(new Error(`Auspice server did not start listening on port ${PORT} in time`));
      }
    }, 30_000);

    const onData = (data) => {
      if (settled) return;
      if (data.toString().includes('now running at')) {
        settled = true;
        clearTimeout(timer);
        proc.stdout.off('data', onData);
        resolve(proc);
      }
    };
    proc.stdout.on('data', onData);
    proc.on('error', (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(err);
      }
    });
    proc.on('exit', (code) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(new Error(`Auspice server exited early with code ${code}`));
      }
    });
  });
}
