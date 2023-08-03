import { genotypeColors, nucleotide_gene } from "./globals";

type JsonAnnotations = Record<string, JsonAnnotation>
// enum Strand {'+', '-'} // other GFF-valid options are '.' and '?'
type Strand = string;
interface JsonAnnotation {
  end: number;
  start: number;
  strand: Strand;
  type?: string; // unused by auspice
  gene?: string; // for testing purposes only?
  color?: string; // for testing purposes only?
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
  segments: CdsSegment[];
  strand: Strand;
  color: string;
  name: string;
}
interface CdsSegment {
  rangeLocal: RangeLocal;
  rangeGenome: RangeGenome;
  phase: number; /* 0, 1 or 2. Indicates where the next codon begins relative to the 5' end of this segment */
  frame: number; /* 0, 1 or 2. The frame the codons are in, relative to the 5' end of the genome. It thus takes into account the phase */
}


/* a Note on co-ordinates.
Auspice v1 (and the JSONs it consumed) used 1-based mutations and
0-based, BED-like feature annotations.
Auspice v2 JSONs (which the client will always receive) uses GFF-like
1-based, close ended feature annotations. We adjust the starts here so that
the display remains unchanged, however this should be revisited at a later date.
*/

const getAnnotations = (jsonData: JsonAnnotations) => {
  const annotations = [];
  const nuc = [];
  let aaCount = 0;
  for (const prot of Object.keys(jsonData)) {
    const annotation = jsonData[prot] as JsonAnnotation;
    if (prot !== nucleotide_gene) {
      aaCount++;
      annotations.push({
        prot: prot,
        start: annotation.start - 1, // see above
        end: annotation.end,
        strand: annotation.strand,
        fill: genotypeColors[aaCount % 10]
      });
    } else {
      nuc.push({
        start: annotation.start - 1, // see above
        end: annotation.end
      });
    }
  }
  return [annotations, nuc];
};

const processAnnotations = (annotations: any) => {
  const m:Record<string,any> = {}; /* m === geneMap */
  annotations.forEach((d) => {
    m[d.prot] = d;
  });
  const sorted = Object.keys(m).sort((a, b) =>
    m[a].start < m[b].start ? -1 : m[a].start > m[b].start ? 1 : 0
  );
  for (const gene of Object.keys(m)) {
    m[gene].idx = sorted.indexOf(gene);
  }
  return m;
};

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
      gene.cds = Object.entries(cdsAnnotations).map(([cdsName, annotation]) => {
        // currently each cdsAnnotations (in the JSON) corresponds to a contiguous CDS
        // so we can easily compute the length without needing to collect the associated
        // segments
        const length = annotation.end-annotation.start+1;
        if (length%3) {
          // TODO XXX - following for dev purposes only
          console.log(`PROBLEM! JSON defined ${cdsName} has length ${length} which is not a multiple of 3`);
        }
        /* The only way we have multiple CDS _segments_ from the current JSON schema is if they wrap around */
        const segments: CdsSegment[] = [];
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
        return cds;
      })
      return gene;
    });

    console.log("genomeMap:", JSON.stringify([chrom], undefined, 2))
    return [chrom];
}


export const entropyCreateState = (genomeAnnotations: JsonAnnotations) => {
  if (genomeAnnotations && genomeAnnotations.nuc) {
    const ant = getAnnotations(genomeAnnotations);
    const annotations = ant[0];
    const nucAnnotation: any = ant[1];
    const lengthSequence = nucAnnotation[0].end;
    return {
      showCounts: false,
      loaded: true,
      annotations,
      lengthSequence,
      geneMap: processAnnotations(annotations),
      genomeMap: genomeMap(genomeAnnotations)
    };
  }
  return {
    showCounts: false,
    loaded: false,
    annotations: [],
    geneMap: {}
  };
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