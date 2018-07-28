/* eslint no-console: off */
const fetch = require('node-fetch');
const fs = require('fs');

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
      if (k !== defaultValue && k !== "default") {
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

/* We need to get lists of files available...
Option 1: crawl the directories (S3? local?)
Option 2: fetch pre-generated files
For option 2, we'd have to periodically update this... or have a API trigger
*/
const buildManifest = (dest) => {
  if (dest === "local") {
    /* currently only for version 1.0 JSONs... */
    fs.readdir(global.LOCAL_DATA_PATH, (err, files) => {
      if (err) {
        console.log("ERROR. Failed to build local manifest.", err);
        return;
      }
      const manifest = files
        .filter((file) => file.endsWith("_tree.json"))
        .map((file) => file.replace("_tree.json", "").split("_"));
      global.LOCAL_MANIFEST = manifest;
      console.log("Successfully created local manifest");
    });
    return;
  }
  let baseUrl;
  if (dest === "live") {
    baseUrl = global.REMOTE_DATA_LIVE_BASEURL;
  } else if (dest === "staging") {
    baseUrl = global.REMOTE_DATA_STAGING_BASEURL;
  } else {
    console.log("ERROR: unknown manifest type requested");
    return;
  }
  fetch(baseUrl + "/manifest_guest.json")
    .then((result) => result.json())
    .then((json) => {
      const manifest = oldToNew(json);
      if (dest === "live") global.LIVE_MANIFEST = manifest;
      else global.STAGING_MANIFEST = manifest;
      console.log(`Successfully created ${dest} manifest`);
    })
    .catch(() => {
      console.log(`ERROR. Failed to build ${dest} manifest.`);
    });
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
  checkFieldsAgainstManifest,
  buildManifest
};
