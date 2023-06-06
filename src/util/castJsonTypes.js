/**
 * Values in the JSON should be appropriately typed however this may not always be the case.
 * For instance, certain values of a continuous trait may be strings, and we should cast
 * these to numbers. See https://github.com/nextstrain/auspice/issues/1626 for more discussion
 * of this particular case. Feel free to add more checks / casts to this function!
 * @param {Object} metadata
 * @param {Object} tree
 * @returns {undefined} Any type casting is in-place
 */
export const castIncorrectTypes = (metadata, tree) => {
  try {
    const continuousKeys = new Set();
    Object.entries(metadata.colorings || {}).forEach(([key, details]) => {
      if (details.type==="continuous") {
        continuousKeys.add(key);
      }
    });
    tree.nodes.forEach((node) => {
      for (const key of continuousKeys) {
        const attr = node?.node_attrs?.[key];
        if (!attr) continue;
        continuousAttrValueToNumber(attr);
      }
    });
  } catch (err) {
    // type casting shouldn't be required (the JSON should be correctly typed)
    // so any errors shouldn't prevent Auspice loading
    console.error(err);
  }
};

/**
 * Cast `attr.value` to either a Number or undefined.
 * Note that "Infinity" (string) is changed to undefined, but `Infinity` (Number)
 * is left alone as the latter is not possible to encode in JSON.
 * @param {Record<string, any>} attr
 */
export function continuousAttrValueToNumber(attr) {
  switch (typeof attr.value) {
    case "number":
      break;
    case "string": {
      const value = attr.value.trim();
      if (value === "" || isNaN(value) || value ==="Infinity" || value ==="-Infinity") {
        // Note: Number("")=0
        // undefined values are handled appropriately (e.g. scatterplots, tooltips etc)
        attr.value = undefined;
      } else {
        attr.value = Number(value);
      }
      break;
    }
    default:
      // any other types (Boolean, Null ('object')) are not valid for a continuous scale
      attr.value = undefined;
  }
}
