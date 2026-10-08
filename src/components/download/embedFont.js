/* eslint no-restricted-syntax: 0, no-console: 0 */
import latoRegularUrl from "typeface-lato/files/lato-latin-400.woff2";
import latoLightUrl from "typeface-lato/files/lato-latin-300.woff2";

/**
 * Embed the Lato faces the app renders on screen (Light 300 & Regular 400) into the exported
 * SVG as @font-face rules. Without this, a standalone SVG relies on the viewer's own fonts: a
 * viewer that resolves bare "Lato" to a different installed face (e.g. "Lato Hairline") renders
 * the text far too light, and a viewer without Lato substitutes another font entirely. These
 * are the same woff2 files the app loads via `import 'typeface-lato'`, so the SVG matches the UI.
 */

const LOG = "[SVG export]";

/** fetch a (same-origin, already-cached) font asset and return its base64-encoded bytes */
async function fetchAsBase64(url) {
  const buf = await (await fetch(url)).arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return window.btoa(binary);
}

/* built once, then reused for subsequent exports */
let cached;

/**
 * Resolve to an SVG `<defs>` string embedding the Lato faces, or "" (with a warning) if the
 * fonts can't be fetched — so a download still succeeds, just relying on the viewer's fonts.
 */
export function latoFontDefs() {
  if (!cached) {
    cached = (async () => {
      try {
        const [regular, light] = await Promise.all([
          fetchAsBase64(latoRegularUrl),
          fetchAsBase64(latoLightUrl),
        ]);
        return [
          `<defs><style type="text/css">`,
          `@font-face{font-family:"Lato";font-style:normal;font-weight:400;src:url(data:font/woff2;base64,${regular}) format("woff2");}`,
          `@font-face{font-family:"Lato";font-style:normal;font-weight:300;src:url(data:font/woff2;base64,${light}) format("woff2");}`,
          `</style></defs>`,
        ].join("\n");
      } catch (e) {
        console.warn(`${LOG} could not embed the Lato font; exported text will rely on the viewer's installed fonts`, e);
        return "";
      }
    })();
  }
  return cached;
}
