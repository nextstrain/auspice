import { genotypeColors } from "./globals";
import { defaultEntropyState } from "../reducers/entropy";
import jsonCache from "../reducers/jsonCache";

type JsonAnnotations = Record<string, JsonAnnotation>
// enum Strand {'+', '-'} // other GFF-valid options are '.' and '?'
type Strand = string;
type JsonSegmentRange = {start: number, end: number}; // Start is 1-based, End is 1-based closed (GFF)
type JsonCdsFeature = {
  start?: number;
  end?: number;
  color?: string;
  display_name?: string;
  segments?: JsonSegmentRange[];
}
interface JsonAnnotation {
  end?: number;
  start?: number;
  segments?: JsonSegmentRange[];
  strand: Strand;
  type?: string; // unused by auspice
  gene?: string; // for testing purposes only?
  color?: string; // for testing purposes only?
  display_name?: string;
  features?: Record<string, JsonCdsFeature>;
}

/* Specifies the range of the each segment's corresponding position in the genome,
or defines the range of the genome (chromosome) itself.
Start is always less than or equal to end. 
Start is 1-based, End is 1-based closed. I.e. GFF. */
type RangeGenome = [number, number];
/* Same as RangeGenome but now relative to the nucleotides which make up the CDS
(i.e. after slippage, splicing etc). The first CDS segment's RangeLocal will always
start at 1, and the end value (of the last segment) corresponds to the number of nt in the CDS:
range_segLast[1] - range_seg1[0] + 1 = 3 * number_of_amino_acids_in_translated_CDS */
type RangeLocal = [number, number];

type CdsFeature = {
  color: string;
  name: string;
  displayName?: string;
  segments: RangeLocal[];
}

type GenomeAnnotation = Chromosome[];
interface Chromosome {
  name: string;
  range: RangeGenome;
  genes: Gene[];
}
interface Gene {
  name: string;
  cds: CDS[];
}
interface CDS {
  length: number; /* length of the CDS in nucleotides. Will be a multiple of 3 */
  segments: CdsSegment[]; // NOTE: [CdsSegment, ...CdsSegment[]] would be better
  strand: Strand;
  color: string;
  name: string;
  displayName?: string;
  features?: CdsFeature[];
}
interface CdsSegment {
  rangeLocal: RangeLocal;
  rangeGenome: RangeGenome;
  phase: number; /* 0, 1 or 2. Indicates where the next codon begins relative to the 5' end of this segment */
  frame: number; /* 0, 1 or 2. The frame the codons are in, relative to the 5' end of the genome. It thus takes into account the phase */
}

/**
 * This is in flux -- Richard's working on an updated representation for the JSON
 * Here we do our best to massage the JSON annotations block into a hierarchical
 * representation of Genome → Chromosome[] → Gene[] → CDS[] → CDS_Segment[].
 * The intention is for this structure to entirely replace the various other pieces of redux
 * state such as 'annotations', 'geneMap', 'geneLengths', 'genomeAnnotations'.
 *
 * Each key:value entry in the JSON annotation block, where key!=='nuc', is interpreted as
 * a CDS. There is currently no way to encode multiple CDS segments¹. Each CDS name
 * is unique, as JavaScript JSON parsing guarantees the keys to be unique (even if there are
 * duplicates in the JSON).
 *
 * By default, each CDS name (key) is set as the gene name as well, so 1 gene = 1 CDS.
 * We extend the JSON to allow `value.gene` which, if set, can group multiple CDSs into
 * a single gene. We also allow `value.color`, which sets the _gene_ colour (optional).
 *
 * ¹ The exception being a single CDS which wraps around the origin, which we are able
 * to split into two segments here.
 * 
 * TODO XXX - negative strand CDSs
 * TODO XXX - throwing an Error here prevents a dataset from loading
 * TODO XXX - standardise a new (or extended) format in the JSON.
 */
const genomeMap = (annotations: JsonAnnotations): GenomeAnnotation => {

  const nucAnnotation = Object.entries(annotations)
    .filter(([name,]) => name==='nuc')
    .map(([, annotation]) => annotation)[0];
  if (!nucAnnotation) throw new Error("Genome annotation missing 'nuc' definition")
  if (!nucAnnotation.start || !nucAnnotation.end) throw new Error("Genome annotation for 'nuc' missing start or end")

  const chrom: Chromosome = {
    name: 'source',
    range: [nucAnnotation.start, nucAnnotation.end],
    genes: [],
  }

  /* Group by genes -- most JSONs will not include this information, so it'll essentially be
  one CDS per gene, but that's just fine! */
  const annotationsPerGene: Record<string,JsonAnnotations> = {};
  Object.entries(annotations)
    .filter(([name,]) => name!=='nuc')
    .map(([annotationKey, annotation]) => {
      const geneName = annotation.gene || annotationKey;
      if (!(geneName in annotationsPerGene)) annotationsPerGene[geneName] = {};
      const gene = annotationsPerGene[geneName] as JsonAnnotations;  // TODO - why do I need to cast?
      gene[annotationKey] = annotation;
    })

  const nextColor = nextColorGenerator();

  chrom.genes = Object.entries(annotationsPerGene)
    .map(([geneName, cdsAnnotations]) => {
      const gene: Gene = {
        name: geneName,
        cds: []
      }
      const defaultColor = nextColor.next().value; // default colours are per-gene (not per-CDS)

      gene.cds = Object.entries(cdsAnnotations)
        .map(([cdsName, annotation]) => cdsFromAnnotation(cdsName, annotation, chrom, defaultColor))
        .filter((cds) => cds.name!=='__INVALID__');
      return gene;
    })
    console.log("genomeMap:", JSON.stringify([chrom], undefined, 2))
    return [chrom];
}


export const entropyCreateState = (genomeAnnotations: JsonAnnotations) => {
  if (genomeAnnotations) {
    try {
      return {
        showCounts: false,
        loaded: true,
        genomeMap: genomeMap(genomeAnnotations)
      };
    } catch (e) {
      if (e instanceof Error) console.error(e.message);
      console.error("Genotype colorings and the entropy panel will not be available.")
      // fallthrough
    }
  }
  return defaultEntropyState();
};


function validColor(color:(string|undefined)) {
  if (!color) return false;
  return color; // TODO XXX
}

function* nextColorGenerator() {
  let i=0;
  while (true) {
    yield genotypeColors[i++] as string;
    if (i===genotypeColors.length) i=0;
  }
}

/**
 * Returns a CDS object parsed from the provided JsonAnnotation block
 */
function cdsFromAnnotation(cdsName: string, annotation: JsonAnnotation, chrom: Chromosome, defaultColor: (string|void)): CDS {
  const invalidCds: CDS = {
    name: '__INVALID__',
    length: 0,
    segments: [],
    strand: '+',
    color: '#000',
  }
  let length = 0;
  const segments: CdsSegment[] = [];
  if (annotation.start && annotation.end) {
    /* The simplest case is where a JSON annotation block defines a
    contiguous CDS, however it may be a wrapping CDS (i.e. cds end > genome
    end */
    length = annotation.end-annotation.start+1;    
    if (annotation.end <= chrom.range[1]) {
      segments.push({
        rangeLocal: [1, length],
        rangeGenome: [annotation.start, annotation.end],
        phase: 0,
        frame: (annotation.start-1)%3,
      })
    } else {
      /* first segment ends at the 3' end of the genome */
      const firstSegmentRangeLocal: RangeLocal = [1, chrom.range[1]-annotation.start+1];
      segments.push({
        rangeLocal: firstSegmentRangeLocal,
        rangeGenome: [annotation.start, chrom.range[1]], // gene wraps around
        phase: 0,
        frame: (annotation.start-1)%3,
      })
      /* second (and final) segment starts at the 5' end */
      const phase = (3-firstSegmentRangeLocal[1]%3)%3;
      segments.push({
        rangeLocal: [firstSegmentRangeLocal[1]+1, length],
        rangeGenome: [1, annotation.end-chrom.range[1]],
        phase,
        frame: phase,
      })
    }
  } else if (annotation.segments && Array.isArray(annotation.segments)) {
    let previousRangeLocalEnd = 0;
    for (const segment of annotation.segments) {
      /* The segments, as defined in the JSON, must be ordered appropriately */
      const segmentLength = segment.end - segment.start + 1; // in nucleotides
      length += segmentLength;
      segments.push({
        rangeLocal: [previousRangeLocalEnd+1, previousRangeLocalEnd+segmentLength],
        rangeGenome: [segment.start, segment.end],
        phase: length%3===0 ? 0 : (length%3===1 ? 2 : 1),
        frame: (segment.start-1)%3,
      })
      previousRangeLocalEnd += segmentLength;
    }
  } else {
    console.error(`[Genome annotation] ${cdsName} requires either start+end or segments to be defined`);
    return invalidCds;
  }

  if (length%3) {
    console.error(`[Genome annotation] ${cdsName} has length ${length} which is not a multiple of 3`);
    return invalidCds; // skip parsing of this CDS's annotation block
  }

  /* ensure segments are sorted according to how the make up the CDS itself,
  irregardless of where they appear in the genome */
  segments.sort((a, b) => (a.rangeLocal < b.rangeLocal) ? -1 : 1);
  const cds: CDS = {
    name: cdsName,
    length,
    segments,
    strand: '+',
    color: validColor(annotation.color) || defaultColor || '#000',
  }
  if (typeof annotation.display_name === 'string') {
    cds.displayName = annotation.display_name;
  }
  extractFeatures(cds, annotation.features);
  return cds
}

function extractFeatures(cds:CDS, jsonFeatures: (Record<string,JsonCdsFeature> | undefined)): void {
  if (typeof jsonFeatures !== 'object' || Array.isArray(jsonFeatures)) return;

  function _processSegment(featureName:string, start:number, end:number): (false|RangeLocal) {
    // check multiple of 3
    if ((end - start + 1)%3 !== 0) {
      console.warn(`[CDS feature] ${featureName} has a length which is not a multiple of 3. Skipping.`);
      return false;
    }
    if (cds.segments.length<1) {
      console.error(`[Internal error] CDS ${cds.name} has zero segments.`, cds);
      /* Should guard against this upstream by using better types */
      return false;
    }
    if (cds.segments.length>1) {
      console.warn(`[CDS feature] ${featureName} is on a segmented CDS, which is not yet allowed.`);
      // This should be possible, it just makes the accounting harder. We have written the projection logic within
      // the entropy d3 code, BTW
      return false;
    }
    const rangeLocal: RangeLocal = [
      /* TODO - cds.segments should be typed to have a minimum of 1 element */
      // @ts-expect-error: see comment above
      start-cds.segments[0].rangeGenome[0]+1,
      // @ts-expect-error: see comment above
      end-cds.segments[0].rangeGenome[0]+1, 
    ];
    if (rangeLocal[0]%3 !== 1) {
      console.warn(`[CDS feature] ${featureName} is not aligned with the codon positions of the CDS`);
      return false;
    }
    return rangeLocal;
  }

  for (const [name, jsonFeature] of Object.entries(jsonFeatures)) {
    const segments = [];
    if (jsonFeature.end && jsonFeature.start) {
      const s = _processSegment(name, jsonFeature.start, jsonFeature.end);
      if (s) segments.push(s);
    } else {
      for (const segment of (jsonFeature.segments || [])) {
        const s = _processSegment(name, segment.start, segment.end);
        if (s) {
          segments.push(s);
        } else {
          continue; // don't save a feature if _any_ of the segments are invalid
        }
      }
    }
    if (segments.length) {
      const feature: CdsFeature = {
        name,
        segments,
        color: validColor(jsonFeature.color) || "#000"
      }
      if (jsonFeature.display_name) feature.displayName = jsonFeature.display_name;
      if (cds.features) {
        cds.features.push(feature)
      } else {
        cds.features = [feature];
      }
    }
  }
}