let Papa: typeof import("papaparse"); /* lazily imported once a file is dropped on */
let XLSX: typeof import("xlsx/xlsx.mini"); /* lazily imported once a file is dropped on */
import { rgb } from "d3-color";
import { NewMetadata, ColoringInfo } from "../updateMetadata/updateMetadata.types"

/**
 * ------------------------------------------------------
 * General notes about our handling of metadata TSVs/CSVs
 * ------------------------------------------------------
 *
 * NOTIFICATIONS are dispatched in a somewhat piecemeal fashion (and some
 * simply use the console). One day we will have a sidebar-style logging
 * interface which should improve this.
 *
 * BOOLEAN SCALES are not well handled in auspice. When we improve this the
 * values of the existence scale can be booleans themselves.
 *
 * DATE is a skipped field, but this should be improved
 *
 * SCALE TYPES are always categorical (except for the existence coloring)
 *
 */


interface CsvParseError {
  type: string;
  code: string;
  message: string;
  row?: number;
}

interface CsvMetadata {
  delimiter: string;
  linebreak: string;
  aborted: boolean;
  truncated: boolean;
  fields?: string[];
}

interface ParseResults {
  data: Record<string, string>[];
  errors: CsvParseError[];
  meta: CsvMetadata;
}

interface LatLongKeys {
  latitude: string;
  longitude: string;
}

/** A similar type to `ColoringInfo` */
interface AttrColoring {
  attrName: string;
  fieldName?: string;
  scaleType: ColoringInfo['scaleType'];
  strains: ColoringInfo['strains'];
  colours: ColoringInfo['colours'];
  colorScaleFieldName: string | undefined;
}

interface Header {
  fields: string[];
  strainKey: string;
  latLongKeys: LatLongKeys | undefined;
  ignoredFields: NonNullable<NewMetadata['info']['ignoredAttrNames']>
}


/**
 * Reads the dropped file and coverts it to the canonical `NewMetadata` structure
 * for merging with redux state. Errors result in a rejected promise. The resolved
 * data structure has not been cross-referenced with redux state, it's simply
 * a representation of the file contents.
 */
export async function handleCsvLikeDroppedFile(file: File, nodeNames: Set<string>): Promise<NewMetadata> {
  const {fileName, csvString} = await readDroppedFile(file);
  const { errors, data, meta } = await parseCsv(csvString);
  if (errors.length) throw new Error(errors.map((e) => e.message).join(", "));
  let { colorings, header } = processHeader(meta.fields);
  processRows(colorings, header, data, nodeNames);
  // Drop coloring for which no valid strains were found
  colorings = colorings.filter((coloring) => Object.keys(coloring.strains).length)
  addExistenceColoring(colorings, fileName);

  const geographic = header.latLongKeys ?
    processLatLongs(data, colorings, header, `${fileName}_geo`) :
    [];

  return {
    attributes: Object.fromEntries(colorings.map((c) => [
      c.attrName,
      {
        key: c.attrName,
        name: c.attrName,
        scaleType: c.scaleType,
        strains: c.strains,
        colours: c.colours,
      }
    ])),
    geographic,
    info: {
      fileName,
      ignoredAttrNames: header.ignoredFields
    }
  }
}

/**
 * A promise-ified version of Papa.parse()
 * A note on encoding here: It will be common that people drop CSVs from microsoft excel
 * in here and, you guessed it, this causes all sorts of problems.
 * https://github.com/mholt/PapaParse/issues/169 suggests adding encoding: "ISO-8859-1"
 * to the config, which may work
 */
async function parseCsv(csvString: string): Promise<ParseResults> {
  if (!Papa) Papa = (await import("papaparse")).default;
  return new Promise((resolve, reject) => {
    Papa.parse(csvString, {
      header: true,
      complete: (results: ParseResults) => {
        resolve(results);
      },
      error: (error: Error) => {
        reject(error);
      },
      encoding: "UTF-8",
      comments: "#",
      delimiter: ",",
      skipEmptyLines: true,
      dynamicTyping: false
    });
  });
}

async function readDroppedFile(file: File): Promise<{fileName: string; csvString: string}> {
  const fileName = file.name;
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = async (_event: ProgressEvent<FileReader>): Promise<void> => {
      try {
        /* the XLSX library will handle CSV, TSV, Excel etc, converting to a CSV string */
        /* If dropped file is Excel workbook, only reads in the data from the first sheet */
        if (!XLSX) XLSX = (await import("xlsx/xlsx.mini")).default;
        const workbook = XLSX.read(reader.result, { type: 'binary', raw: true });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const csvString = XLSX.utils.sheet_to_csv(firstSheet);
        resolve({ fileName, csvString });
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  })
}


/**
 * Parses the header row of the CSV file to intitialise `colorings` and return info about the header
 */
function processHeader(fields: string[]): {
  colorings: AttrColoring[];
  header: Header;
} {
  const strainKey = fields[0];

  /* There are a number of "special case" columns we currently ignore */
  const fieldsToIgnore = new Set(["name", "div", "vaccine", "labels", "hidden", "mutations", "url", "authors", "accession", "traits", "children"]);
  fieldsToIgnore.add("num_date").add("year").add("month").add("date");
  const latLongFields = new Set(["__latitude", "__longitude", "latitude", "longitude"]);

  const ignoredFields = new Set<string>();

  const colorings: AttrColoring[] = fields.slice(1)
    .map((fieldName): AttrColoring | null => {
      if (fieldsToIgnore.has(fieldName)) {
        ignoredFields.add(fieldName);
        return null;
      }
      if (latLongFields.has(fieldName)) {
        return null;
      }
      let attrName = fieldName;
      const scaleType = "categorical";
      /* interpret column names using microreact-style syntax */
      if (fieldName.includes("__")) {
        const [prefix, suffix] = fieldName.split("__");
        if (["shape", "colour", "color"].includes(suffix)) {
          // don't track in `ignoredFields` as we don't want a user-facing warning
          return null;
        }
        if (suffix === "autocolour") {
          attrName = prefix; /* MicroReact uses this to colour things, but we do this by default */
        }
      }
      return { attrName, colours: {}, fieldName, colorScaleFieldName: undefined, scaleType, strains: {} };
    })
    .filter((x): x is AttrColoring => !!x)
    .map((data) => {
      if (fields.includes(`${data.attrName}__colour`)) {
        data.colorScaleFieldName = `${data.attrName}__colour`;
      } else if (fields.includes(`${data.attrName}__color`)) {
        data.colorScaleFieldName = `${data.attrName}__color`;
      }
      return data;
    });

  /* check for the presence of lat/long fields */
  const latLongKeys: LatLongKeys | undefined = (fields.includes("latitude") && fields.includes("longitude")) ?
    {latitude: "latitude", longitude: "longitude"} :
    (fields.includes("__latitude") && fields.includes("__longitude")) ?
      {latitude: "__latitude", longitude: "__longitude"} :
      undefined;

  const header = { fields, strainKey, latLongKeys, ignoredFields }
  return {colorings, header};
}

/**
 * Adds a (boolean) coloring to show presence of strains in the file
 */
function addExistenceColoring(colorings: AttrColoring[], fileName: string): void {
  colorings.push({
    attrName: fileName,
    scaleType: 'boolean',
    strains: Object.fromEntries(
      colorings
        .flatMap((c) => Array.from(Object.keys(c.strains)))
        .map((s) => [s, { value: `Strains in ${fileName}` }])
    ),
    colours: {},
    colorScaleFieldName: undefined,
  })
}

function processRows(colorings: AttrColoring[], header: Header, data: ParseResults['data'], nodeNames: Set<string>): void {
  for (const attrInfo of colorings) {
    if (!attrInfo.fieldName) {
      console.error("[internal error] fieldName not set")
      continue;
    }
    const colours: Record<string, string[]> = {}
    const fieldName = attrInfo.fieldName;
    if (header.ignoredFields.has(fieldName) || fieldName === header.strainKey) continue;
    for (const row of data) {
      const strain = row[header.strainKey];
      if (!nodeNames.has(strain)) continue;
      const value = row[fieldName];
      if (!value) continue; // skip empty strings (Note: values of `0`, `false` etc are all strings so not skipped)
      attrInfo.strains[strain] = { value };
      // Colours are defined per strain, so store them in a list so we can average as needed
      if (attrInfo.colorScaleFieldName) {
        const hex = row[attrInfo.colorScaleFieldName];
        if (hex) {
          if (!colours[value]) colours[value] = [];
          colours[value].push(hex);
        }
      }
    }
    attrInfo.colours = Object.fromEntries(
      Object.entries(colours).map(([value, hexes]) => {
        return [value, _averageColour(hexes)];
      }).filter((x) => !!x[1])
    )
  }
}

/**
 * Returns the average of a list of hex colour values.
 */
function _averageColour(hexes: string[]): string | null {
  if (hexes.length === 0) return null
  const validatedHexes = hexes.filter((h) => h.match(/^#[A-Fa-f0-9]{3}([A-Fa-f0-9]{3})?$/));
  if (validatedHexes.length !== hexes.length) {
    const dropped = Array.from((new Set(hexes)).difference(new Set(validatedHexes)));
    console.warn(`Validation of colour hexes dropped these invalid values: ${dropped.join(', ')}`);
  }
  if (validatedHexes.length === 0) return null;
  if (validatedHexes.length === 1) return hexes[0]
  let r=0, g=0, b=0; // same algorithm as `getAverageColorFromNodes`
  validatedHexes.forEach((c) => {
    const tmpRGB = rgb(c);
    r += tmpRGB.r;
    g += tmpRGB.g;
    b += tmpRGB.b;
  });
  const total = validatedHexes.length;
  return rgb(r / total, g / total, b / total).toString();
}


/**
 * Metadata defines lat/longs per-sample which is orthogonal to Nextstrain's approach
 * which associates lat/longs to specific metadata values (e.g. to a specific country).
 * We get around this by creating a new placeholder attribute which represents the unique
 * lat/longs provided here.
 * P.S. Latitude: [-90, 90], Longitude: [-180, 180]
 */
function processLatLongs(
  data: ParseResults['data'],
  colorings: AttrColoring[],
  header: Header,
  attrName: string
): NewMetadata['geographic'] {
  const [latKey, longKey] = [header.latLongKeys.latitude, header.latLongKeys.longitude];
  const coordsStrains = new Map();
  let demeCounter = 0;

  /* Collect groups of strains with identical lat/longs */
  for (const row of data) {
    const strain = row[header.strainKey];
    const [latitude, longitude] = [Number(row[latKey]), Number(row[longKey])];
    if (isNaN(latitude) || isNaN(longitude) || latitude > 90 || latitude < -90 || longitude > 180 || longitude < -180) {
      continue;
    }
    const strKey = String(row[latKey])+String(row[longKey]);
    if (!coordsStrains.has(strKey)) {
      const deme = `deme_${demeCounter++}`; // visible to user as the attr value!
      coordsStrains.set(strKey, {deme, latitude, longitude, strains: new Set<string>()});
    }
    coordsStrains.get(strKey).strains.add(strain);
  }

  /* invert map to link each strain to a dummy value with lat/longs */
  // TODO XXX what about the shape here?
  const newGeoResolution = {key: attrName, demes: {}};
  const attrColoring: AttrColoring = {
    attrName,
    scaleType: 'categorical',
    strains: {},
    colours: {},
    colorScaleFieldName: undefined,
  }
  for (const { deme, latitude, longitude, strains } of coordsStrains.values()) {
    newGeoResolution.demes[deme] = { latitude, longitude };
    for (const strain of strains) {
      attrColoring.strains[strain] = { value: deme }
    }
  }
  colorings.push(attrColoring);
  return [newGeoResolution];
}
