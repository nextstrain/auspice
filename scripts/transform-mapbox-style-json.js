#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Fetches a Mapbox/MapLibre style document from a given style URL and rewrites the
 * proprietary `mapbox://` references it contains into the plain `https://api.mapbox.com/...`
 * URLs that MapLibre can fetch directly. This is the build-time equivalent of a runtime
 * `transformRequest` callback in src/components/map/map.js, and lets us inline a
 * self-contained style document into the codebase so MapLibre needs no `transformRequest`.
 *
 * The access token is NOT baked into the output: wherever a token would be required it is
 * left as the provider-neutral placeholder `<ACCESS_TOKEN>`, to be substituted at runtime in
 * JS (e.g. `url.replaceAll('<ACCESS_TOKEN>', token)`). The placeholder is the token *value*
 * only — the surrounding query parameter (`?access_token=`, `?key=`, etc.) comes from the
 * provider's own URL structure — so a single substitution works across providers. (The token
 * supplied in the style URL argument is only used to authenticate this one fetch.)
 *
 * Usage:
 *   node scripts/transform-mapbox-style-json.js '<style-url>' > src/.../style.json
 *
 * e.g.
 *   node scripts/transform-mapbox-style-json.js \
 *     'https://api.mapbox.com/styles/v1/trvrb/ciu03v244002o2in5hlm3q6w2?access_token=pk....'
 */

const TOKEN_PLACEHOLDER = "<ACCESS_TOKEN>";

main();

/* -------------------------------------------------------------- */

async function main() {
  const styleUrl = process.argv[2];
  if (!styleUrl) {
    console.error("Usage: node scripts/transform-mapbox-style-json.js '<style-url>'");
    process.exit(1);
  }

  let style;
  try {
    const res = await fetch(styleUrl);
    if (!res.ok) {
      console.error(`Failed to fetch style (HTTP ${res.status} ${res.statusText}): ${styleUrl}`);
      process.exit(1);
    }
    style = await res.json();
  } catch (err) {
    console.error(`Failed to fetch/parse style from ${styleUrl}`);
    console.error(err);
    process.exit(1);
  }

  const transformed = transformNode(style);
  process.stdout.write(`${JSON.stringify(transformed, null, 2)}\n`);
}

/**
 * Recursively walk the style document, applying transformUrl() to every string value.
 * Non-URL strings (layer names, expressions, etc.) are returned unchanged because
 * transformUrl() only touches strings starting with `http://` or `mapbox://`.
 */
function transformNode(node) {
  if (typeof node === "string") return transformUrl(node);
  if (Array.isArray(node)) return node.map(transformNode);
  if (node && typeof node === "object") {
    return Object.fromEntries(
      Object.entries(node).map(([key, value]) => [key, transformNode(value)])
    );
  }
  return node;
}

/**
 * Mirror of the former runtime `transformRequest` in src/components/map/map.js, except the
 * access token is emitted as TOKEN_PLACEHOLDER rather than an actual token. Any `{...}`
 * MapLibre templating (e.g. `{fontstack}`, `{range}`) is preserved because we only slice
 * off known prefixes and append a query string.
 */
function transformUrl(url) {
  // Mapbox's TileJSON responses reference tile URLs over http:// which fails CORS
  if (url.startsWith("http://")) {
    return url.replace("http://", "https://");
  }
  if (!url.startsWith("mapbox://")) return url;
  const path = url.slice("mapbox://".length);
  // mapbox://fonts/{user}/{stack}/{range}.pbf → /fonts/v1/{user}/{stack}/{range}.pbf
  if (path.startsWith("fonts/")) {
    return `https://api.mapbox.com/fonts/v1/${path.slice("fonts/".length)}?access_token=${TOKEN_PLACEHOLDER}`;
  }
  // mapbox://sprites/{user}/{styleId}{suffix} → /styles/v1/{user}/{styleId}/sprite{suffix}
  if (path.startsWith("sprites/")) {
    const match = path.match(/^sprites\/([^/]+)\/([^@.]+)(.*)/);
    if (match) {
      const [, user, styleId, suffix] = match;
      return `https://api.mapbox.com/styles/v1/${user}/${styleId}/sprite${suffix}?access_token=${TOKEN_PLACEHOLDER}`;
    }
  }
  // mapbox://{tileset_id} → /v4/{tileset_id}.json (TileJSON metadata for vector sources)
  return `https://api.mapbox.com/v4/${path}.json?access_token=${TOKEN_PLACEHOLDER}`;
}
