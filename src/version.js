/* Read from package.json so the version has a single source of truth. webpack inlines
 * this at build time and tree-shakes away the rest of package.json, so the client bundle
 * ends up with just the version string. Compare cli/version.ts, which does the same thing
 * at runtime via createRequire (unavailable in the browser).
 */
import packageJson from "../package.json";

export const version = packageJson.version;
