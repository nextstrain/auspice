/**
 * Public entrypoint for embedding Auspice via a single imperative `render()`
 * function. See `EMBED_RENDER_PLAN.md`.
 *
 * This module is the entry for a self-contained, browser-importable ESM build
 * (see `webpack.embed.config.cjs`): all dependencies are bundled in, so a host
 * page can `import { render } from "./embed.js"` over a relative path with no
 * bundler and no import map.
 */
/* Our browser targets ("cover 95%") cause babel to down-level async/await to
 * regenerator, which needs this runtime global. The standard app pulls it in via
 * `src/index.js`; the self-contained embed bundle must provide it itself. */
import "regenerator-runtime/runtime";

export { render } from "./render";
export type { RenderData, RenderOptions, RenderHandle } from "./render";
