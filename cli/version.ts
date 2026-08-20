import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/* The version is read from package.json at runtime rather than imported from
 * `src/version.js` so that everything the CLI needs lives under `cli/`. That in turn
 * keeps the transpiled output (`cli-build/`) a 1:1 mirror of `cli/`, so `../package.json`
 * resolves to the repo/package root from either directory.
 * package.json is the single source of truth for the version -- the client reads it too,
 * via src/version.js, and our GitHub Actions "release" workflow bumps only package.json. */
export const version: string = require('../package.json').version;
