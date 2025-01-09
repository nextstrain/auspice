import { genotypeColors } from "./globals";
import { defaultEntropyState } from "../reducers/entropy";

/**
 * Object used for user-provided JSON.
 * Stricter than simply `object` which implicitly types values as `any`.
 */
interface UnknownJsonObject {
  [key: string]: unknown
}

type Strand = '+' | '-' // other GFF-valid options are '.' and '?'

/**
 * Specifies the range of the each segment's corresponding position in the genome,
 * or defines the range of the genome (chromosome) itself.
 * Start is always less than or equal to end. 
 * Start is 1-based, End is 1-based closed. I.e. GFF.
 */
type RangeGenome = [number, number]

/**
 * Same as RangeGenome but now relative to the nucleotides which make up the CDS
 * (i.e. after slippage, splicing etc). The first CDS segment's RangeLocal will always
 * start at 1, and the end value (of the last segment) corresponds to the number of nt in the CDS:
 * range_segLast[1] - range_seg1[0] + 1 = 3 * number_of_amino_acids_in_translated_CDS
 */
type RangeLocal = [number, number]

interface ChromosomeMetadata {
  strandsObserved: Set<Strand>
  posStrandStackHeight: number
  negStrandStackHeight: number
}

interface Chromosome {
  name: string
  range: RangeGenome
  genes: Gene[]
  metadata: ChromosomeMetadata
}

interface Gene {
  name: string
  cds: CDS[]
}

interface CDS {
  /** length of the CDS in nucleotides. Will be a multiple of 3 */
  length: number
  segments: CdsSegment[]
  strand: Strand
  color: string
  name: string
  isWrapping: boolean
  displayName?: string
  description?: string
  stackPosition?: number
}

type Phase = 0 | 1 | 2

type Frame = 0 | 1 | 2

interface CdsSegment {
  rangeLocal: RangeLocal
  rangeGenome: RangeGenome

  /** 1-based */
  segmentNumber: number

  /** Indicates where the next codon begins relative to the 5' end of this segment */
  phase: Phase

  /** The frame the codons are in, relative to the 5' end of the genome. It thus takes into account the phase */
  frame: Frame
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
 */
export const genomeMap = (annotations: UnknownJsonObject): Chromosome[] => {

  const nucAnnotation = Object.entries(annotations)
    .filter(([name,]) => name==='nuc')
    .map(([, annotation]) => annotation)[0];

  if (!nucAnnotation) {
    throw new Error("Genome annotation missing 'nuc' definition");
  }
  if (typeof nucAnnotation !== 'object') {
    throw new Error("Genome annotation for 'nuc' is not a JSON object.");
  }
  if (!('start' in nucAnnotation) || !('end' in nucAnnotation)) {
    throw new Error("Genome annotation for 'nuc' missing start or end");
  }
  if (typeof nucAnnotation.start !== 'number' || typeof nucAnnotation.end !== 'number') {
    throw new Error("Genome annotation for 'nuc.start' or 'nuc.end' is not a number.");
  }
  if ('strand' in nucAnnotation && nucAnnotation.strand === '-') {
    throw new Error("Auspice can only display genomes represented as positive strand." +
      "Note that -ve strand RNA viruses are typically annotated as 5' → 3'.");
  }

  const rangeGenome: RangeGenome =  [nucAnnotation.start, nucAnnotation.end];


  /* Group by genes -- most JSONs will not include this information, so it'll essentially be
  one CDS per gene, but that's just fine! */
  const annotationsPerGene: Record<string,Record<string, UnknownJsonObject>> = {};
  Object.entries(annotations)
    .filter(([name,]) => name!=='nuc')
    .map(([annotationKey, annotation]) => {

      if (typeof annotation !== 'object') {
        throw new Error(`Genome annotation for '${annotationKey}' is not a JSON object.`);
      }

      let geneName = annotationKey;

      if ('gene' in annotation) {
        if (typeof annotation.gene !== 'string') {
          throw new Error(`Genome annotation '${annotationKey}.gene' is not a string.`);
        }
        geneName = annotation.gene;
      }

      if (!(geneName in annotationsPerGene)) annotationsPerGene[geneName] = {};

      /* Assertion is safe: see docstring of UnknownJsonObject
       */
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      annotationsPerGene[geneName][annotationKey] = annotation as UnknownJsonObject;
    })

  const nextColor = nextColorGenerator();

  const strandsObserved: Set<Strand> = new Set();

  const genes = Object.entries(annotationsPerGene)
    .map(([geneName, cdsAnnotations]) => {
      const gene: Gene = {
        name: geneName,
        cds: []
      }
      const defaultColor = nextColor.next().value; // default colours are per-gene (not per-CDS)

      gene.cds = Object.entries(cdsAnnotations)
        .map(([cdsName, annotation]) => cdsFromAnnotation(cdsName, annotation, rangeGenome, defaultColor))
        .filter((cds) => cds.name!=='__INVALID__');
      gene.cds.forEach((cds) => strandsObserved.add(cds.strand));
      return gene;
    })

  const metadata: ChromosomeMetadata = {
    strandsObserved,
    posStrandStackHeight: calculateStackPosition(genes, '+'),
    negStrandStackHeight: calculateStackPosition(genes, '-'),
  }

  const chromosome: Chromosome = {
    name: 'source',
    range: rangeGenome,
    genes,
    metadata
  }
  return [chromosome];
}

export const entropyCreateState = (genomeAnnotations: UnknownJsonObject) => {
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


function validColor(color: string | undefined | unknown) {
  if (typeof color !== "string") return false;
  return color; // TODO XXX
}

function* nextColorGenerator() {
  let i=0;
  while (true) {
    yield genotypeColors[i++];
    if (i===genotypeColors.length) i=0;
  }
}

/**
 * Returns a CDS object parsed from the provided JsonAnnotation block
 */
function cdsFromAnnotation(
  cdsName: string,
  annotation: UnknownJsonObject,
  rangeGenome: RangeGenome,
  defaultColor: string | void,
): CDS {
  const invalidCds: CDS = {
    name: '__INVALID__',
    length: 0,
    segments: [],
    strand: '+',
    isWrapping: false,
    color: '#000',
  }
  const strand = annotation.strand;
  if (!(strand==='+' || strand==='-')) {
    /** GFF allows for strands '?' (features whose strandedness is relevant, but unknown) and '.' (features that are not stranded),
     * which are represented by augur as '?' and null, respectively. (null comes from `None` in python.)
     * In both cases it's not a good idea to make an assumption of strandedness, or to assume it's even a CDS. */
    console.error(`[Genome annotation]  ${cdsName} has strand ` + 
      (annotation.strand !== undefined ? annotation.strand : '(missing)') +
      ". This CDS will be ignored.");
    return invalidCds;
  }
  const positive = strand==='+';
  
  let length = 0;  // rangeLocal length
  const segments: CdsSegment[] = [];
  if (annotation.start && annotation.end) {

    if (typeof annotation.start !== 'number' || typeof annotation.end !== 'number') {
      console.error(`[Genome annotation] ${cdsName} start (${annotation.start}) and/or end (${annotation.end}) is not a number.`);
      return invalidCds;
    }

    /* The simplest case is where a JSON annotation block defines a
    contiguous CDS, however it may be a wrapping CDS (i.e. cds end > genome
    end */
    if (annotation.end <= rangeGenome[1]) {
      length = annotation.end-annotation.start+1;    
      segments.push({
        segmentNumber: 1,
        rangeLocal: [1, length],
        rangeGenome: [annotation.start, annotation.end],
        phase: 0,
        frame: _frame(annotation.start, annotation.end, 0, rangeGenome[1], positive),
      })
    } else {
      /* We turn this into the equivalent JsonSegments to minimise code duplication */
      annotation.segments = [
        {start: annotation.start, end: rangeGenome[1]},
        {start: 1, end: annotation.end-rangeGenome[1]}
      ]
      // TypeScript is unable to infer that annotation.segments is an array,
      // hence the explicit type guard.
      if (Array.isArray(annotation.segments)){
        /* -ve strand segments are 3' -> 5', so segment[0] is at the start of the genome */
        if (!positive) annotation.segments.reverse();
      }
    }
  }

  if (annotation.segments && Array.isArray(annotation.segments)) {
    if (segments.length) { // indicates we've already created one from start/stop coords
      console.error(`[Genome annotation] ${cdsName} defines both start/stop and segments, but they are mutually exclusive.`);
      return invalidCds;
    }
    let previousRangeLocalEnd = 0;
    let segmentNumber = 1;
    for (const segment of annotation.segments) {
      /* The segments, as defined in the JSON, must be ordered according to the order the appear in the CDS.
      For -ve strand that's 3' to 5'. The rangeGenome within each segment is always 5' to 3'. */
      const segmentLength = segment.end - segment.start + 1; // in nucleotides
      /* phase is the number of nucs we need to add to the so-far-observed length to make it mod 3 */
      const phase: Phase = length%3===0 ? 0 : (length%3===1 ? 2 : 1);

      const s: CdsSegment = {
        segmentNumber: segmentNumber++,
        rangeLocal: [previousRangeLocalEnd+1, previousRangeLocalEnd+segmentLength],
        rangeGenome: [segment.start, segment.end],
        phase,
        frame: _frame(segment.start, segment.end, phase, rangeGenome[1], positive)
      };
      segments.push(s);
      length += segmentLength;
      previousRangeLocalEnd += segmentLength;

    }
  }
  if (!segments.length) {
    console.error(`[Genome annotation] ${cdsName} requires either start+end or segments to be defined`);
    return invalidCds;
  }

  if (length%3) {
    console.error(`[Genome annotation] ${cdsName} has length ${length} which is not a multiple of 3`);
    return invalidCds; // skip parsing of this CDS's annotation block
  }

  const cds: CDS = {
    name: cdsName,
    length,
    segments,
    strand,
    isWrapping: _isCdsWrapping(strand, segments),
    color: validColor(annotation.color) || defaultColor || '#000',
  }
  if (typeof annotation.display_name === 'string') {
    cds.displayName = annotation.display_name;
  }
  if (typeof annotation.description === 'string') {
    cds.description = annotation.description;
  }
  return cds
}

/**
 * Calculates the (open reading) frame the provided segment is in.
 * For +ve strand this is calculated 5'->3', for -ve strand it's 3'->5'.
 * The frame is calculated once the CDS is back in phase.
 */
function _frame(
  /** 1 based, rangeGenome[0] of the segment */
  start: number,

  /**
   * 1 based, rangeGenome[1] of the segment.
   * start < end always
   */
  end: number,

  phase: Phase,

  /** 1 based */
  genomeLength: number,
  positiveStrand: boolean,
): Frame {
  /* TypeScript cannot infer the exact range of values from a modulo operation,
   * so it is manually provided.
   */
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return (positiveStrand ?
    (start+phase-1)%3 :
    Math.abs((end-phase-genomeLength)%3)) as 0 | 1 | 2;
}

/**
 * Given a list of genes (each with CDSs), we want to calculate and assign each
 * CDS a "stack position" such that each CDS can be plotted with no overlaps.
 * All segments of a given CDS will have the same stack position. (Stack here
 * refers to this being a stacking problem.) The stack position starts at 1.
 * Returns the maximum position observed.
 */
function calculateStackPosition(
  genes: Gene[],
  strand: Strand,
): number {
  /* List of CDSs, sorted by their earliest occurrence in the genome (for any segment) */
  const cdss = genes
    .reduce((acc: CDS[], gene) => [...acc, ...gene.cds], [])
    .filter((cds) => cds.strand===strand)
    .sort((a, b) =>
      Math.min(...a.segments.map((s) => s.rangeGenome[0])) < Math.min(...b.segments.map((s) => s.rangeGenome[0])) ?
        -1 : 1
    );
  let stack: CDS[] = []; // current CDSs in stack
  for (const newCds of cdss) {
    /* remove any CDS from the stack which has ended (completely) before this one starts */
    const newMinStart = Math.min(...newCds.segments.map((s) => s.rangeGenome[0]));
    stack = stack.filter((cds) =>
     !(Math.max(...cds.segments.map((s) => s.rangeGenome[1])) < newMinStart)
    );
    // console.log("\nstacK:", stack.map((cds) => cds.name).join(", "));
    // console.log("\tconsideing", newCds.name)
    /* If there are any empty slots in the current stack, take the lowest! */
    const existingY = stack.map((cds) => cds.stackPosition || 0).sort();
    const empty = _emptySlots(existingY);
    if (empty) {
      // console.log("\t\ttaking empty slot", empty)
      newCds.stackPosition = empty;
      stack.push(newCds);
      continue;
    }
    /* If any CDS in the stack has a single space (i.e. between 2 segments) into which the entire
    new CDS (i.e. all segments of newCds) can fit into, then we can re-use that position */
    const reuseablePosition = _fitCdssTogether(stack, newCds);
    if (reuseablePosition) {
      // console.log("\t\treusing position", reuseablePosition)
      newCds.stackPosition = reuseablePosition;
      stack.push(newCds);
      continue;
    }
    /* fallthrough: use a higher position! */
    newCds.stackPosition = (existingY[existingY.length-1] || 0) + 1;
    // console.log("\t\tAdding to the top!", newCds.stackPosition)
    stack.push(newCds);
  }

  return Math.max(...cdss.map((cds) => cds.stackPosition || 0));
}

/**
 * Given an array of sorted integers, if there are any spaces (starting with 1)
 * then return the value which can fill that space. Returns 0 if no spaces.
 */
function _emptySlots(values: number[]): number {
  if ((values[0] || 0) > 1) return 1;
  for (let i=1; i<values.length; i++) {
    /* intermediate variables because of https://github.com/microsoft/TypeScript/issues/46253 */
    const [a, b] = [values[i-1], values[i]];
    if (a && b && b-a>1) return a+1;
  }
  return 0;
}

/**
 * If the newCds completely (i.e. all of its segments) fits inside a single
 * between-segment space of an existing segment, then return the stackPosition
 * of that existing CDS. Otherwise return 0;
 */
function _fitCdssTogether(
  existing: CDS[],
  newCds: CDS,
): number {
  const a = Math.min(...newCds.segments.map((s) => s.rangeGenome[0]));
  const b = Math.max(...newCds.segments.map((s) => s.rangeGenome[1]));
  for (const cds of existing) {
    if (cds.segments.length===1) continue;
    const segments = [...cds.segments]
    segments.sort((a, b) => a.rangeGenome[0]<b.rangeGenome[1] ? -1 : 1)
    for (let i = 0; i<segments.length-1; i++) {
      const end = segments[i]?.rangeGenome[1] || 0;
      const nextStart = segments[i+1]?.rangeGenome[0] || 0;
      const stackPosition = cds.stackPosition || 0;
      if (end<a && nextStart>b) {
        /* yes - we can fit into the same position as this cds, but check if
        another CDS in the stack is occupying this space first! */
        let spaceTaken = false;
        existing.forEach((el) => {
          if (el.stackPosition!==stackPosition) return; // only consider same row
          if (spaceTaken) return; // saves time
          el.segments.forEach((s) => {
            if (s.rangeGenome[1]>=a && s.rangeGenome[0]<=b) {
              spaceTaken = true
            }
          })
        })
        if (!spaceTaken) {
          return stackPosition;
        }
      }
    }
  }
  return 0;
}


/* Does a CDS wrap the origin? */
function _isCdsWrapping(
  strand: Strand,
  segments: CdsSegment[],
): boolean {
  const positive = strand==='+';
  // segments ordered to guarantee rangeLocal will always be greater (than the previous segment)
  let prevSegment: CdsSegment;
  for (const segment of segments) {
    if (prevSegment) {
      if (positive && prevSegment.rangeGenome[0] > segment.rangeGenome[0]) {
        return true;
      }
      if (!positive && prevSegment.rangeGenome[0] < segment.rangeGenome[0]) {
        return true;
      }
    }
    prevSegment = segment;
  }
  return false; // fallthrough
}
