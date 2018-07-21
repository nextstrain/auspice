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
      obj = obj[keys[0]];
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
    })
    orderedKeys.forEach((key) => {
      const newParts = partsSoFar.slice();
      newParts.push(key);
      recurse(newParts, obj[key]);
    })
  }

  recurse([], old.pathogen);
  return allParts;
}


const checkFieldsAgainstManifest = (fields, manifestIsLocal) => {
  const manifest = manifestIsLocal ? global.LOCAL_MANIFEST : global.LIVE_MANIFEST;

  if (!manifest) {
    return fields.join("_");
  }

  let applicable = manifest.slice(); // shallow
  fields.forEach((field, idx) => {
    applicable = applicable.filter((entry) => entry[idx] === field);
    // console.log("after idx", idx, "(", field, "), num applicable:", applicable.length);
  })
  if (!applicable.length) {
    return fields.join("_");
  }
  return applicable[0].join("_");

}


module.exports = {
  oldToNew,
  checkFieldsAgainstManifest
};
