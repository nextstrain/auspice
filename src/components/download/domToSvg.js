/* eslint no-restricted-syntax: 0, no-console: 0 */

/**
 * Convert an on-screen HTML (sub)tree into SVG markup for the "download SVG" feature.
 *
 * The guiding principle is that we never re-implement layout. The browser has already
 * laid the element out on screen, so we read its answer back — geometry from
 * `getBoundingClientRect()` / Range client-rects, and appearance from
 * `getComputedStyle()` — and transcribe it into SVG primitives. This keeps the export
 * in sync with what the user sees without us having to understand flexbox, text
 * wrapping, etc.
 *
 * What we deliberately support: element boxes (background / border / border-radius),
 * text (single- and multi-line, with hyperlinks), <img>, and nested <svg> (inlined
 * as-is, since it's already vector). Anything outside that set is logged *loudly* and
 * skipped — the export is best-effort and must never throw. Grep the console for
 * `${LOG}` to see everywhere the conversion was uncertain.
 *
 * SVG export is a minor feature; the point of logging rather than trying harder is so
 * that when the (HTML) UI grows something this converter can't represent, we find out
 * from the console instead of from a silently-wrong image.
 */

const LOG = "[SVG export]";

/** round to 2dp to keep the output readable */
const r2 = (n) => Math.round(n * 100) / 100;

/** escape a string for use as XML text / attribute content */
const esc = (s) => String(s)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

/**
 * Parse a computed-style colour (always `rgb(...)` or `rgba(...)` from getComputedStyle)
 * into `{color, opacity}`, or `null` if fully transparent / unparseable.
 */
function parseColor(value) {
  if (!value || value === "transparent" || value === "none") return null;
  const m = value.match(/rgba?\(([^)]+)\)/);
  if (!m) {
    console.warn(`${LOG} could not parse colour "${value}"; treating as black`);
    return {color: "#000", opacity: 1};
  }
  const parts = m[1].split(",").map((p) => parseFloat(p.trim()));
  const [red, green, blue, alpha = 1] = parts;
  if (alpha === 0) return null;
  return {color: `rgb(${red},${green},${blue})`, opacity: alpha};
}

/**
 * Emit a `<rect>` for the element's background &/or border, if any.
 * Coordinates are relative to `rootRect` (the top-left of the exported block).
 */
function emitBox(rect, cs, rootRect, out) {
  const attrs = [];

  const bg = parseColor(cs.backgroundColor);
  if (bg) {
    attrs.push(`fill="${bg.color}"`);
    if (bg.opacity !== 1) attrs.push(`fill-opacity="${r2(bg.opacity)}"`);
  } else {
    attrs.push(`fill="none"`);
  }

  /* Only uniform borders are representable as a single rect stroke. */
  const widths = ["Top", "Right", "Bottom", "Left"].map((s) => parseFloat(cs[`border${s}Width`]) || 0);
  const maxWidth = Math.max(...widths);
  if (maxWidth > 0) {
    const uniform = widths.every((w) => Math.abs(w - widths[0]) < 0.5);
    if (!uniform) {
      console.warn(`${LOG} non-uniform border ${widths.join("/")}px not supported; approximating with the thickest side`);
    }
    const border = parseColor(cs.borderTopColor) || parseColor(cs.borderLeftColor);
    if (border && cs.borderTopStyle !== "none") {
      attrs.push(`stroke="${border.color}"`);
      attrs.push(`stroke-width="${r2(maxWidth)}"`);
      if (border.opacity !== 1) attrs.push(`stroke-opacity="${r2(border.opacity)}"`);
    }
  }

  if (cs.boxShadow && cs.boxShadow !== "none") {
    console.warn(`${LOG} box-shadow "${cs.boxShadow}" is ignored (not representable as plain SVG)`);
  }

  /* nothing visible to draw */
  if (!bg && maxWidth === 0) return;

  const radius = parseFloat(cs.borderTopLeftRadius) || 0;
  const radiusAttr = radius > 0 ? ` rx="${r2(radius)}"` : "";

  out.push(
    `<rect x="${r2(rect.left - rootRect.left)}" y="${r2(rect.top - rootRect.top)}" ` +
    `width="${r2(rect.width)}" height="${r2(rect.height)}"${radiusAttr} ${attrs.join(" ")} />`
  );
}

/**
 * Split a text node into per-line `{text, rect}` entries by reading back where the
 * browser actually broke the line. We walk the characters and watch for the client-rect
 * top jumping down — that's a wrap. This is approximate (whitespace at wrap points, etc.)
 * but driven entirely by the browser's own layout.
 */
function measureTextLines(textNode) {
  const str = textNode.nodeValue;
  const range = document.createRange();
  range.selectNodeContents(textNode);
  const allRects = range.getClientRects();

  if (allRects.length === 0) {
    return [];
  }
  if (allRects.length === 1) {
    return [{text: str, rect: allRects[0]}];
  }

  /* multi-line: find the character offsets where the line breaks */
  const lines = [];
  let lineStart = 0;
  let prevTop = null;
  for (let i = 1; i <= str.length; i++) {
    range.setStart(textNode, lineStart);
    range.setEnd(textNode, i);
    const rects = range.getClientRects();
    const last = rects[rects.length - 1];
    if (!last) continue;
    if (prevTop === null) prevTop = last.top;
    if (last.top > prevTop + 0.5) {
      /* char (i-1) started a new line; close off the previous one */
      range.setStart(textNode, lineStart);
      range.setEnd(textNode, i - 1);
      const lineRects = range.getClientRects();
      lines.push({text: str.slice(lineStart, i - 1), rect: lineRects[lineRects.length - 1]});
      lineStart = i - 1;
      prevTop = last.top;
    }
  }
  range.setStart(textNode, lineStart);
  range.setEnd(textNode, str.length);
  const lineRects = range.getClientRects();
  lines.push({text: str.slice(lineStart), rect: lineRects[lineRects.length - 1]});
  return lines;
}

/** Emit `<text>` for a text node, one per visual line, using the parent element's font. */
function emitText(textNode, parentCs, rootRect, out) {
  if (!textNode.nodeValue || !textNode.nodeValue.trim()) return;

  const fill = parseColor(parentCs.color) || {color: "#000", opacity: 1};
  const fontSize = parseFloat(parentCs.fontSize);
  if (!fontSize) {
    console.warn(`${LOG} text node has no resolvable font-size ("${parentCs.fontSize}"); skipping "${textNode.nodeValue.trim().slice(0, 40)}"`);
    return;
  }
  /* approximate the alphabetic baseline as 80% of the font size below the line-box top */
  const ascent = fontSize * 0.8;
  const fontAttrs =
    `font-family="${esc(parentCs.fontFamily)}" font-size="${r2(fontSize)}" ` +
    `font-weight="${parentCs.fontWeight}" font-style="${parentCs.fontStyle}" ` +
    `fill="${fill.color}"` + (fill.opacity !== 1 ? ` fill-opacity="${r2(fill.opacity)}"` : "");

  /* a text node inside an <a href> becomes an SVG hyperlink */
  const anchor = textNode.parentElement && textNode.parentElement.closest("a[href]");
  const href = anchor ? anchor.getAttribute("href") : null;

  for (const line of measureTextLines(textNode)) {
    if (!line.rect || !line.text.trim()) continue;
    const x = r2(line.rect.left - rootRect.left);
    const y = r2(line.rect.top - rootRect.top + ascent);
    let el = `<text x="${x}" y="${y}" ${fontAttrs}>${esc(line.text)}</text>`;
    if (href) el = `<a xlink:href="${esc(href)}">${el}</a>`;
    out.push(el);
  }
}

/** Inline a nested <svg> as-is (it's already vector), positioned at its on-screen spot. */
function emitNestedSvg(el, rect, rootRect, out) {
  const clone = el.cloneNode(true);
  /* We position the nested <svg> ourselves from its on-screen rect, which already reflects any
     CSS transform on the element itself (e.g. Leaflet positions its overlay <svg> with a
     translate in layer-point space — often thousands of px — and maps the content back via a
     viewBox). Leaving that transform on the clone would shift it a second time, off-canvas, so
     strip the element's own transform; its descendants keep their transforms. */
  if (clone.style) clone.style.transform = "";
  clone.removeAttribute("transform");
  clone.setAttribute("x", r2(rect.left - rootRect.left));
  clone.setAttribute("y", r2(rect.top - rootRect.top));
  if (!clone.getAttribute("width")) clone.setAttribute("width", r2(rect.width));
  if (!clone.getAttribute("height")) clone.setAttribute("height", r2(rect.height));
  out.push(new XMLSerializer().serializeToString(clone));
}

/**
 * Rasterise a `<canvas>` (e.g. a WebGL basemap) to a PNG data URI and emit it as an `<image>`.
 * This is the one place the export is knowingly raster rather than vector — a canvas has no
 * vector description to recover. Reading a WebGL canvas back requires it to have been created
 * with `preserveDrawingBuffer: true`; without that, `toDataURL()` returns a blank image (it does
 * not throw), which we can't reliably detect, so enabling that flag is the caller's job.
 */
function emitCanvas(el, rect, rootRect, out) {
  let dataUrl;
  try {
    dataUrl = el.toDataURL("image/png");
  } catch (e) {
    console.warn(`${LOG} <canvas> could not be read back (is it tainted by cross-origin content?); skipping`, e);
    return;
  }
  if (!dataUrl || dataUrl.length < 10) {
    console.warn(`${LOG} <canvas> produced no image data; skipping`);
    return;
  }
  console.warn(`${LOG} <canvas> rasterised to a PNG <image> (${el.width}×${el.height}px); this region of the export is raster, not vector`);
  out.push(
    `<image x="${r2(rect.left - rootRect.left)}" y="${r2(rect.top - rootRect.top)}" ` +
    `width="${r2(rect.width)}" height="${r2(rect.height)}" xlink:href="${dataUrl}" />`
  );
}

/** Emit an `<img>` as an SVG `<image>`. Only embedded (data:) sources are self-contained. */
function emitImage(el, rect, rootRect, out) {
  const src = el.currentSrc || el.src;
  if (!src) {
    console.warn(`${LOG} <img> has no resolvable src; skipping`);
    return;
  }
  if (!src.startsWith("data:")) {
    console.warn(`${LOG} <img src="${src.slice(0, 60)}..."> is a remote URL; the exported SVG will reference it rather than embed it`);
  }
  out.push(
    `<image x="${r2(rect.left - rootRect.left)}" y="${r2(rect.top - rootRect.top)}" ` +
    `width="${r2(rect.width)}" height="${r2(rect.height)}" xlink:href="${esc(src)}" />`
  );
}

/** Recursively transcribe `el` and its descendants into `out` (document/paint order). */
function walk(el, rootRect, out, skip) {
  if (skip && skip(el)) return;

  const cs = window.getComputedStyle(el);
  if (cs.display === "none") return;

  const rect = el.getBoundingClientRect();
  const hidden = cs.visibility === "hidden" || parseFloat(cs.opacity) === 0;

  const tag = el.tagName.toLowerCase();

  if (tag === "svg") {
    if (!hidden) emitNestedSvg(el, rect, rootRect, out);
    return; /* don't descend into SVG — we inlined it whole */
  }
  if (tag === "img") {
    if (!hidden) emitImage(el, rect, rootRect, out);
    return;
  }
  if (tag === "canvas") {
    if (!hidden) emitCanvas(el, rect, rootRect, out);
    return;
  }

  if (!hidden) emitBox(rect, cs, rootRect, out);

  if (cs.overflowY === "auto" || cs.overflowY === "scroll") {
    if (el.scrollHeight > el.clientHeight + 1) {
      console.warn(`${LOG} element is scrolled/clipped on screen (scrollHeight ${el.scrollHeight} > clientHeight ${el.clientHeight}); the export will include all of its content`);
    }
  }

  for (const child of el.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      if (!hidden) emitText(child, cs, rootRect, out);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      walk(child, rootRect, out, skip);
    }
  }
}

/**
 * Convert an on-screen HTML element (and its subtree) into SVG markup.
 *
 * @param {Element} root the element to convert (must be laid out / visible on screen)
 * @param {object} [options]
 * @param {(el: Element) => boolean} [options.skip] called for each element; return true to omit
 *   it and its subtree (e.g. on-screen chrome like map zoom controls that shouldn't be exported)
 * @returns {{width:number, height:number, markup:string}} the block's size and a string
 *   of SVG elements whose coordinates are relative to the top-left of `root`. Wrap
 *   `markup` in an `<svg>`/`<g>` positioned wherever the block should appear.
 */
export function htmlToSvg(root, {skip} = {}) {
  if (!(root instanceof Element)) {
    console.error(`${LOG} htmlToSvg() called with a non-element; returning empty`, root);
    return {width: 0, height: 0, markup: ""};
  }
  const rootRect = root.getBoundingClientRect();
  if (!rootRect.width || !rootRect.height) {
    console.warn(`${LOG} root element has zero size (${r2(rootRect.width)}×${r2(rootRect.height)}); it may be hidden, so the output will be empty`, root);
  }
  const out = [];
  walk(root, rootRect, out, skip);
  return {width: rootRect.width, height: rootRect.height, markup: out.join("\n")};
}
