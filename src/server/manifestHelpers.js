/* eslint no-console: off */

/* this function is only temporary (I hope!) */
const oldToNew = (old) => {
  const allParts = [];
  const recurse = (partsSoFar, obj) => {
    if (typeof obj === "string") {
      // done
      allParts.push(partsSoFar);
    }
    let keys = Object.keys(obj);
    if (keys.length === 1) {
      obj = obj[keys[0]]; // eslint-disable-line
      keys = Object.keys(obj); // skip level
    }
    const defaultValue = obj.default;
    if (!defaultValue) {
      return;
    }
    const orderedKeys = [defaultValue];
    keys.forEach((k) => {
      if (obj[k] !== defaultValue && k !== "default") {
        orderedKeys.push(k);
      }
    });
    orderedKeys.forEach((key) => {
      const newParts = partsSoFar.slice();
      newParts.push(key);
      recurse(newParts, obj[key]);
    });
  };

  recurse([], old.pathogen);
  return allParts;
};


const checkFieldsAgainstManifest = (fields, source) => {
  const manifest = source === "local" ? global.LOCAL_MANIFEST :
    source === "live" ? global.LIVE_MANIFEST :
      undefined;

  if (!manifest) {
    return fields;
  }

  /* is there an exact match in the manifest? */
  let exactMatch = false;
  const matchString = fields.join("--");
  manifest.forEach((n) => {
    if (matchString === n.join("--")) exactMatch = true;
  });
  if (exactMatch) return fields;

  /* is there a partial match in the manifest? If so, use the manifest to return the correct path */
  let applicable = manifest.slice(); // shallow
  fields.forEach((field, idx) => {
    applicable = applicable.filter((entry) => entry[idx] === field);
    // console.log("after idx", idx, "(", field, "), num applicable:", applicable.length);
  });
  if (applicable.length) {
    return applicable[0];
  }

  /* fallthrough: return the original query */
  return fields;
};


module.exports = {
  oldToNew,
  checkFieldsAgainstManifest
};
