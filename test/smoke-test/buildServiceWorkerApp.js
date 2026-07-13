/**
 * Builds Auspice with the service worker enabled into the directory given as the
 * first CLI argument, by calling the webpack config generator directly
 * (bypassing `auspice build`'s CLI/argparse layer, which we don't need here).
 *
 * This runs as a standalone `node` process (spawned by serviceWorker.test.js)
 * rather than in-process within the Playwright worker. webpack.config.cjs
 * require()s TypeScript files (e.g. cli/utils.ts), which rely on Node's native
 * type stripping; running them inside Playwright's module loader instead
 * conflicts with that and fails to load. A plain Node process avoids this.
 *
 * webpack is loaded via a CommonJS require rather than an ESM `import` to keep
 * it (and its internally require()d JSON schema files) entirely in the CJS
 * module cache, avoiding a Node.js "missed cache" bug.
 */
import {createRequire} from 'module';
import path from 'path';
import {fileURLToPath} from 'url';

const require = createRequire(import.meta.url);
const webpack = require('webpack');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const outputDir = process.argv[2];
if (!outputDir) {
  console.error('Usage: node buildServiceWorkerApp.js <outputDir>');
  process.exit(1);
}

// webpack.config.cjs reads from process.env to decide whether to include the
// service worker plugin. This is a dedicated child process, so setting it here
// has no effect on the parent Playwright process.
process.env.AUSPICE_ENABLE_SERVICE_WORKER = 'true';

const generateConfig = require(path.join(REPO_ROOT, 'webpack.config.cjs')).default;
const config = generateConfig({devMode: false, customOutputPath: outputDir});

// Disable minimization and compression to speed up the test build
config.optimization = {
  ...config.optimization,
  minimize: false,
};
config.plugins = config.plugins.filter(
  (plugin) => plugin.constructor.name !== "CompressionPlugin"
);

webpack(config).run((err, stats) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  if (stats.hasErrors()) {
    console.error(stats.toString({colors: false}));
    process.exit(1);
  }
  process.exit(0);
});
