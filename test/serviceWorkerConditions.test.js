/**
 * This checks that the service worker is only included in the webpack build
 * when explicitly opted into via `AUSPICE_ENABLE_SERVICE_WORKER`, and never in
 * dev mode.
 *
 * This only checks the build-time conditional logic; it does not build Auspice or
 * exercise the service worker in a browser.
 */
const generateConfig = require("../webpack.config.cjs").default;

const hasServiceWorkerPlugin = (config) =>
  config.plugins.some((plugin) => plugin.constructor.name === "GenerateSW");

describe("check conditions that enable the service worker plugin", () => {
  const originalEnv = process.env.AUSPICE_ENABLE_SERVICE_WORKER;

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.AUSPICE_ENABLE_SERVICE_WORKER;
    else process.env.AUSPICE_ENABLE_SERVICE_WORKER = originalEnv;
  });

  it("is absent when the environment variable is unset", () => {
    delete process.env.AUSPICE_ENABLE_SERVICE_WORKER;
    expect(hasServiceWorkerPlugin(generateConfig({devMode: false}))).toBe(false);
  });

  it("is absent when the environment variable is not exactly \"true\"", () => {
    process.env.AUSPICE_ENABLE_SERVICE_WORKER = "1";
    expect(hasServiceWorkerPlugin(generateConfig({devMode: false}))).toBe(false);
  });

  it("is present in a production build when explicitly enabled", () => {
    process.env.AUSPICE_ENABLE_SERVICE_WORKER = "true";
    expect(hasServiceWorkerPlugin(generateConfig({devMode: false}))).toBe(true);
  });

  it("is absent in dev mode even when explicitly enabled", () => {
    process.env.AUSPICE_ENABLE_SERVICE_WORKER = "true";
    expect(hasServiceWorkerPlugin(generateConfig({devMode: true}))).toBe(false);
  });
});
