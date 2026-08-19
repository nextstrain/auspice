import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/* In a development checkout the TypeScript CLI sources are present and Node strips their
 * types on the fly. The published package ships only the transpiled `cli-build/` directory,
 * because Node refuses to type-strip files under node_modules
 * (ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING).
 *
 * Set AUSPICE_CLI=build to run the transpiled code from a source checkout (i.e. what
 * consumers of the published package will run), or AUSPICE_CLI=source to force the
 * TypeScript sources. Unset means: use the sources if they're present. */
const override = process.env.AUSPICE_CLI;
if (override !== undefined && override !== "source" && override !== "build") {
  throw new Error(`AUSPICE_CLI must be "source" or "build", not "${override}"`);
}

const fromSource = override
  ? override === "source"
  : existsSync(fileURLToPath(new URL('./cli/', import.meta.url)));

export const cliModule = (name) =>
  new URL(fromSource ? `cli/${name}.ts` : `cli-build/${name}.js`, import.meta.url).href;
