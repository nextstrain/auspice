import marked from "marked";
import dompurify from "dompurify";

dompurify.addHook("afterSanitizeAttributes", (node) => {
  // Set external links to open in a new tab
  if ('href' in node && location.hostname !== node.hostname) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noreferrer nofollow');
  }
  // Find nodes that contain images and add imageContainer class to update styling
  const nodeContainsImg = ([...node.childNodes].filter((child) => child.localName === 'img')).length > 0;
  if (nodeContainsImg) {
    // For special case of image links, set imageContainer on outer parent
    if (node.localName === 'a') {
      node.parentNode.className += ' imageContainer';
    } else {
      node.className += ' imageContainer';
    }
  }
});

const ALLOWED_TAGS = ['div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'em', 'strong', 'del', 'ol', 'ul', 'li', 'a', 'img'];
ALLOWED_TAGS.push('#text', 'code', 'pre', 'hr', 'table', 'thead', 'tbody', 'th', 'tr', 'td', 'sub', 'sup');
// We want to support SVG elements, requiring the following tags (we exclude "foreignObject", "style" and "script")
ALLOWED_TAGS.push("svg", "altGlyph", "altGlyphDef", "altGlyphItem", "animate", "animateColor", "animateMotion", "animateTransform");
ALLOWED_TAGS.push("circle", "clipPath", "color-profile", "cursor", "defs", "desc", "ellipse", "feBlend", "feColorMatrix", "feComponentTransfer");
ALLOWED_TAGS.push("feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feFlood", "feFuncA");
ALLOWED_TAGS.push("feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset");
ALLOWED_TAGS.push("fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence", "filter", "font", "font-face");
ALLOWED_TAGS.push("font-face-format", "font-face-name", "font-face-src", "font-face-uri", "g", "glyph", "glyphRef");
ALLOWED_TAGS.push("hkern", "image", "line", "linearGradient", "marker", "mask", "metadata", "missing-glyph", "mpath", "path");
ALLOWED_TAGS.push("pattern", "polygon", "polyline", "radialGradient", "rect", "set", "stop", "switch", "symbol");
ALLOWED_TAGS.push("text", "textPath", "title", "tref", "tspan", "use", "view", "vkern");

const ALLOWED_ATTR = ['href', 'src', 'width', 'height', 'alt'];
// We add the following Attributes for SVG via https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute
// Certain values have been excluded here, e.g. "style"
ALLOWED_ATTR.push("accent-height", "accumulate", "additive", "alignment-baseline", "allowReorder", "alphabetic", "amplitude", "arabic-form", "ascent", "attributeName", "attributeType", "autoReverse", "azimuth");
ALLOWED_ATTR.push("baseFrequency", "baseline-shift", "baseProfile", "bbox", "begin", "bias", "by");
ALLOWED_ATTR.push("calcMode", "cap-height", "class", "clip", "clipPathUnits", "clip-path", "clip-rule", "color", "color-interpolation", "color-interpolation-filters", "color-profile", "color-rendering", "cursor", "cx", "cy");
ALLOWED_ATTR.push("d", "decelerate", "descent", "diffuseConstant", "direction", "display", "divisor", "dominant-baseline", "dur", "dx", "dy");
ALLOWED_ATTR.push("edgeMode", "elevation", "enable-background", "end", "exponent", "externalResourcesRequired");
ALLOWED_ATTR.push("fill", "fill-opacity", "fill-rule", "filter", "filterRes", "filterUnits", "flood-color", "flood-opacity", "font-family", "font-size", "font-size-adjust", "font-stretch", "font-style", "font-variant", "font-weight", "format", "from", "fr", "fx", "fy");
ALLOWED_ATTR.push("g1", "g2", "glyph-name", "glyph-orientation-horizontal", "glyph-orientation-vertical", "glyphRef", "gradientTransform", "gradientUnits");
ALLOWED_ATTR.push("hanging", "height", "href", "hreflang", "horiz-adv-x", "horiz-origin-x");
ALLOWED_ATTR.push("id", "ideographic", "image-rendering", "in", "in2", "intercept");
ALLOWED_ATTR.push("k", "k1", "k2", "k3", "k4", "kernelMatrix", "kernelUnitLength", "kerning", "keyPoints", "keySplines", "keyTimes");
ALLOWED_ATTR.push("lang", "lengthAdjust", "letter-spacing", "lighting-color", "limitingConeAngle", "local");
ALLOWED_ATTR.push("marker-end", "marker-mid", "marker-start", "markerHeight", "markerUnits", "markerWidth", "mask", "maskContentUnits", "maskUnits", "mathematical", "max", "media", "method", "min", "mode");
ALLOWED_ATTR.push("name", "numOctaves");
ALLOWED_ATTR.push("offset", "opacity", "operator", "order", "orient", "orientation", "origin", "overflow", "overline-position", "overline-thickness");
ALLOWED_ATTR.push("panose-1", "paint-order", "path", "pathLength", "patternContentUnits", "patternTransform", "patternUnits", "ping", "pointer-events", "points", "pointsAtX", "pointsAtY", "pointsAtZ", "preserveAlpha", "preserveAspectRatio", "primitiveUnits");
ALLOWED_ATTR.push("r", "radius", "referrerPolicy", "refX", "refY", "rel", "rendering-intent", "repeatCount", "repeatDur", "requiredExtensions", "requiredFeatures", "restart", "result", "rotate", "rx", "ry");
ALLOWED_ATTR.push("scale", "seed", "shape-rendering", "slope", "spacing", "specularConstant", "specularExponent", "speed", "spreadMethod", "startOffset", "stdDeviation", "stemh", "stemv", "stitchTiles", "stop-color", "stop-opacity", "strikethrough-position", "strikethrough-thickness", "string", "stroke", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "stroke-width", "surfaceScale", "systemLanguage");
ALLOWED_ATTR.push("tabindex", "tableValues", "target", "targetX", "targetY", "text-anchor", "text-decoration", "text-rendering", "textLength", "to", "transform", "type");
ALLOWED_ATTR.push("u1", "u2", "underline-position", "underline-thickness", "unicode", "unicode-bidi", "unicode-range", "units-per-em");
ALLOWED_ATTR.push("v-alphabetic", "v-hanging", "v-ideographic", "v-mathematical", "values", "vector-effect", "version", "vert-adv-y", "vert-origin-x", "vert-origin-y", "viewBox", "viewTarget", "visibility");
ALLOWED_ATTR.push("width", "widths", "word-spacing", "writing-mode");
ALLOWED_ATTR.push("x", "x-height", "x1", "x2", "xChannelSelector");
ALLOWED_ATTR.push("y", "y1", "y2", "yChannelSelector");
ALLOWED_ATTR.push("z", "zoomAndPan");

export const parseMarkdown = (mdString) => {
  const sanitizer = dompurify.sanitize;
  const sanitizerConfig = {ALLOWED_TAGS, ALLOWED_ATTR, KEEP_CONTENT: false, ALLOW_DATA_ATTR: false};
  const rawDescription = marked(mdString);
  const cleanDescription = sanitizer(rawDescription, sanitizerConfig);
  return cleanDescription;
};
