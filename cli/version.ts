import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/* The version is read from package.json at runtime rather than imported from
 * `src/version.js` so that everything the CLI needs lives under `cli/`. That in turn
 * keeps the transpiled output (`cli-build/`) a 1:1 mirror of `cli/`, so `../package.json`
 * resolves to the repo/package root from either directory.
 * Note that `releaseNewVersion.sh` updates both package.json and src/version.js. */
export const version: string = require('../package.json').version;
