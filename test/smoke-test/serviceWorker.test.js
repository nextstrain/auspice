/**
 * This exercises the actual offline behaviour of the service worker feature,
 * which can only be meaningfully verified in a real browser: it builds a
 * standalone copy of Auspice with `AUSPICE_ENABLE_SERVICE_WORKER=true` into a
 * temporary directory, serves it with `auspice view` on its own port
 * (independent of the default build / server used by the other smoke tests),
 * and drives it with Playwright.
 *
 * This is unrelated to the default build used by ../smoke-test/urls.test.js, so
 * it does not require `npm run get-data`.
 */
const {test, expect} = require('@playwright/test');
const {spawn} = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const webpack = require('webpack');

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
 * Builds Auspice into `outputDir/dist` with the service worker enabled, by
 * calling the webpack config generator directly (bypassing `auspice build`'s
 * CLI/argparse layer, which we don't need here).
 */
function buildWithServiceWorkerEnabled(outputDir) {
  const generateConfig = require(path.join(REPO_ROOT, 'webpack.config.js')).default;

  // webpack.config.js reads from process.env to decide whether to include the service worker plugin.
  // Temporarily set it here, then restore the original value to avoid global env side effects.
  const originalEnv = process.env.AUSPICE_ENABLE_SERVICE_WORKER;
  process.env.AUSPICE_ENABLE_SERVICE_WORKER = 'true';
  let config;
  try {
    config = generateConfig({devMode: false, customOutputPath: outputDir});
    // Disable minimization and compression to speed up the test build
    config.optimization = {
      ...config.optimization,
      minimize: false,
    };
    config.plugins = config.plugins.filter(
      (plugin) => plugin.constructor.name !== "CompressionPlugin"
    );
  } finally {
    if (originalEnv === undefined) delete process.env.AUSPICE_ENABLE_SERVICE_WORKER;
    else process.env.AUSPICE_ENABLE_SERVICE_WORKER = originalEnv;
  }

  return new Promise((resolve, reject) => {
    webpack(config).run((err, stats) => {
      if (err) return reject(err);
      if (stats.hasErrors()) return reject(new Error(stats.toString({colors: false})));
      resolve();
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
