import { rgb } from "d3-color";
import { errorNotification, successNotification, warningNotification } from "../notifications";
import { ADD_EXTRA_METADATA } from "../types";
import { parseCsvTsv } from "./parseCsvTsv";


const handleMetadata = async (dispatch, getState, file) => {
  const fileName = file.name;

  try {
    /* Parse & interrogate the CSV file */
    const {errors, data, meta} = await parseCsvTsv(file);
    if (errors.length) {
      console.error(errors);
      throw new Error(errors.map((e) => e.message).join(", "));
    }
    const {coloringInfo, strainKey, latLongKeys, ignoredFields} = processHeader(meta.fields);
    const rows = {};
    data.forEach((d) => {rows[d[strainKey]]=d;});

    /* For each coloring, extract values defined in each row etc */
    const newNodeAttrs = {};
    const newColorings = processColorings(newNodeAttrs, coloringInfo, rows, fileName); // modifies `newNodeAttrs`
    const newGeoResolution = latLongKeys ? processLatLongs(newNodeAttrs, latLongKeys, rows, fileName) : undefined;
    /* Fix errors in data & dispatch warnings here, as we cannot dispatch in the reducers */
    const ok = checkDataForErrors(dispatch, getState, newNodeAttrs, newColorings, ignoredFields, fileName);
    if (!ok) return undefined;

    dispatch({type: ADD_EXTRA_METADATA, newColorings, newGeoResolution, newNodeAttrs});
    return dispatch(successNotification({
      message: `Adding metadata from ${fileName}`,
      details: `${Object.keys(newColorings).length} new coloring${Object.keys(newColorings).length > 1 ? "s" : ""} for ${Object.keys(newNodeAttrs).length} node${Object.keys(newNodeAttrs).length > 1 ? "s" : ""}`
    }));

  } catch (err) {
    return dispatch(errorNotification({
      message: `Parsing of ${fileName} failed`,
      details: err.message
    }));
  }
};

export default handleMetadata;


/* ---------------------- helper functions to parse data ---------------------------- */


function processHeader(fields) {
  const strainKey = fields[0];

  /* There are a number of "special case" columns we currently ignore */
  const fieldsToIgnore = new Set(["name", "div", "vaccine", "labels", "hidden", "mutations", "url", "authors", "accession", "traits", "children"]);
  fieldsToIgnore.add("num_date").add("year").add("month").add("date"); /* TODO - implement date parsing */
  const latLongFields = new Set(["__latitude", "__longitude", "latitude", "longitude"]);
  const ignoredFields = new Set();

  const coloringInfo = fields.slice(1)
    .map((fieldName) => {
      if (fieldsToIgnore.has(fieldName)) {
        ignoredFields.add(fieldName);
        return null;
      }
      if (latLongFields.has(fieldName)) {
        return null;
      }
      let name = fieldName;
      const lookupKey = fieldName;
      const scaleType = "categorical"; // TODO
      /* interpret column names using microreact-style syntax */
      if (fieldName.includes("__")) {
        const [prefix, suffix] = fieldName.split("__");
        if (["shape", "colour", "color"].includes(suffix)) {
          ignoredFields.add(fieldName);
          return null;
        }
        if (suffix === "autocolour") {
          name = prefix; /* MicroReact uses this to colour things, but we do this by default */
        }
      }
      return {name, lookupKey, scaleKey: undefined, scaleType};
    })
    .filter((x) => !!x)
    .map((data) => {
      if (fields.includes(`${data.name}__colour`)) {
        data.scaleKey = `${data.name}__colour`;
      } else if (fields.includes(`${data.name}__color`)) {
        data.scaleKey = `${data.name}__color`;
      }
      return data;
    });

  /* check for the presense of lat/long fields */
  const latLongKeys = (fields.includes("latitude") && fields.includes("longitude")) ?
    {latitude: "latitude", longitude: "longitude"} :
    (fields.includes("__latitude") && fields.includes("__longitude")) ?
      {latitude: "__latitude", longitude: "__longitude"} :
      undefined;

  return {coloringInfo, header: fields, strainKey, latLongKeys, ignoredFields};
}

/**
 * Add colorings defined by the CSV header (`coloringInfo`) and specified in each CSV
 * row (`rows`) to the nodes (`newNodeAttrs`) and returns a `newColorings` object.
 */
function processColorings(newNodeAttrs, coloringInfo, rows, fileName) {
  const newColorings = {};
  for (const info of coloringInfo) {
    const scaleMap = new Map(); // will only be populated if coloringInfo.scaleKey is defined

    for (const [strain, row] of Object.entries(rows)) {
      const value = row[info.lookupKey];
      if (value) { // ignore empty strings (which arise from an empty CSV field)
        if (!newNodeAttrs[strain]) newNodeAttrs[strain] = {};
        newNodeAttrs[strain][info.name] = {value};

        if (info.scaleKey && row[info.scaleKey] && row[info.scaleKey].match(/^#[A-Fa-f0-9]{6}$/)) {
          if (!scaleMap.has(value)) scaleMap.set(value, []);
          scaleMap.get(value).push(row[info.scaleKey]);
        }

      }
    }
    newColorings[info.name] = {
      title: info.name,
      type: info.scaleType /* TODO - attempt to guess this if no info supplied */
    };
    if (scaleMap.size) newColorings[info.name].scale = makeScale(info.name, scaleMap);
  }
  /* Add a boolean scale for presence/absence in this file */
  newColorings[fileName] = {title: fileName, type: 'boolean'};
  Object.keys(rows).forEach((strain) => {
    if (!newNodeAttrs[strain]) newNodeAttrs[strain] = {};
    /* Ideally the value here would be `true` but this causes UI issues in <Info> */
    newNodeAttrs[strain][fileName] = {value: `Strains in ${fileName}`};
  });
  return newColorings;
}

function makeScale(colorBy, scaleMap) {
  const scale = [];
  for (const [traitValue, colors] of scaleMap) {
    if (new Set(colors).size===1) {
      scale.push([traitValue, colors[0]]);
    } else {
      // console.log(`Averaging colours for ${traitValue}`);
      let r=0, g=0, b=0; // same algorithm as `getAverageColorFromNodes`
      colors.forEach((c) => {
        const tmpRGB = rgb(c);
        r += tmpRGB.r;
        g += tmpRGB.g;
        b += tmpRGB.b;
      });
      const total = colors.length;
      scale.push([traitValue, rgb(r/total, g/total, b/total).toString()]);
    }
  }
  return scale;
}

/**
 * Metadata defines lat-longs _per-sample_ which is orthogonal to Nextstrain's approach
 * (where we associate coords to a metadata trait). The approach here is to create a new
 * `node_attr` which represents the unique lat/longs provided here.
 */
function processLatLongs(newNodeAttrs, latLongKeys, rows, fileName) {
  const coordsStrains = new Map();
  /* Collect groups of strains with identical lat/longs */
  Object.entries(rows).forEach(([strain, row]) => {
    const [latitude, longitude] = [Number(row[latLongKeys.latitude]), Number(row[latLongKeys.longitude])];
    if (isNaN(latitude) || isNaN(longitude) || latitude > 90 || latitude < -90 || longitude > 180 || longitude < -180) return;
    const strKey = String(row[latLongKeys.latitude])+String(row[latLongKeys.longitude]);
    if (!coordsStrains.has(strKey)) {
      coordsStrains.set(strKey, {latitude, longitude, strains: new Set()});
    }
    coordsStrains.get(strKey).strains.add(strain);
  });
  /* invert map to link each strain to a dummy value with lat/longs */
  const traitName = fileName+"_geo"; /* dummy trait name, but will be visible to the user! */
  const newGeoResolution = {key: traitName, demes: {}};
  let counter = 0;
  coordsStrains.values().forEach(({latitude, longitude, strains}) => {
    const traitValue = `deme_${counter++}`;/* dummy variable, but will be visible to the user! */
    newGeoResolution.demes[traitValue] = {latitude, longitude};
    strains.forEach((strain) => {
      if (!newNodeAttrs[strain]) newNodeAttrs[strain] = {};
      newNodeAttrs[strain][traitName] = {value: traitValue};
    });
  });
  return newGeoResolution;
}

function checkDataForErrors(dispatch, getState, newNodeAttrs, newColorings, ignoredFields, fileName) {
  const {controls, tree} = getState();
  const [droppedColorings, droppedNodes] = [new Set(), new Set()];

  /* restrict the newNodeAttrs to nodes which are actually in the tree! */
  const nodeNamesInTree = new Set(tree.nodes.map((n) => n.name)); // can be internal nodes
  for (const name of Object.keys(newNodeAttrs)) {
    if (!nodeNamesInTree.has(name)) {
      droppedNodes.add(name);
      delete newNodeAttrs[name];
    }
  }

  /* restrict added colorings to those which have at least one valid value in the tree! */
  for (const colorName of Object.keys(newColorings)) {
    if (!Object.keys(newNodeAttrs).filter((strainName) => newNodeAttrs[strainName][colorName]).length) {
      droppedColorings.add(colorName);
      delete newColorings[colorName];
    }
  }
  /* restrict added colorings to those _not_ currently present on the tree. This could be relaxed. TODO. */
  for (const colorName of Object.keys(newColorings)) {
    if (controls.coloringsPresentOnTree.has(colorName)) {
      droppedColorings.add(colorName);
      delete newColorings[colorName];
    }
  }
  /* strip those droppedColorings out of `newNodeAttrs` */
  for (const colorName of droppedColorings) {
    for (const nodeAttr of Object.values(newNodeAttrs)) {
      delete nodeAttr[colorName]; // Note that this works even if `colorName` is not a property
    }
  }

  if (!Object.keys(newNodeAttrs).length || !Object.keys(newColorings).length) {
    dispatch(errorNotification({
      message: `${fileName} had no (relevent) information`,
      details: Object.keys(newNodeAttrs).length ? "No columns to add as colorings" : "No taxa which match those in the tree"
    }));
    return false;
  }

  if (droppedColorings.size) {
    dispatch(warningNotification({
      message: `Ignoring ${droppedColorings.size} columns as they are already set as colorings or are "special" cases to be ignored`,
      details: droppedColorings.join(", ")
    }));
  }
  if (droppedNodes.size) {
    dispatch(warningNotification({
      message: `Ignoring ${droppedNodes.size} taxa (CSV rows) nodes (rows) as they don't appear in the tree`,
      details: droppedNodes.join(", ")
    }));
  }

  return true;
}
