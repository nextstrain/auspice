import { genomeMap } from "../src/util/entropyCreateStateFromJsons";
import dataset from './data/test_complex-genome-annotation.json';

const chromosome = genomeMap(dataset.meta.genome_annotations)[0];

test("Chromosome coordinates", () => {
  expect(chromosome.range[0]).toBe(1);
  expect(chromosome.range[1]).toBe(100);
});

test("+ve strand CDS with a single segment", () => {
  const cds = getCds('pos-single')
  const length = 2*3; // expect CDS is 2 AA long, which is 2*3 nucleotides
  /* Test certain properties -- we don't care about colour, display name for these tests */
  expect(cds).toEqual(expect.objectContaining({
    length, strand: '+',
    segments: [
      {rangeGenome: [23, 28], rangeLocal: [1, length], phase: 0, frame: 1}
    ]
  }))
});

test("-ve strand CDS with a single segment", () => {
  const cds = getCds('neg-single');
  const length = 3*3;
  expect(cds).toEqual(expect.objectContaining({
    length, strand: '-',
    segments: [
      {rangeGenome: [72, 80], rangeLocal: [1, length], phase: 0, frame: 2}
    ]
  }))
});

test("+ve strand CDS which wraps the origin", () => {
  const cds = getCds('pos-wrapping')
  const length = 6*3;
  expect(cds).toEqual(expect.objectContaining({
    length, strand: '+',
    segments: [
      {rangeGenome: [93, 100], rangeLocal: [1, 8],      phase: 0, frame: 2},
      {rangeGenome: [1, 10],   rangeLocal: [9, length], phase: 1, frame: 1},
    ]
  }))
});

test("-ve strand CDS which wraps the origin", () => {
  const cds = getCds('neg-wrapping')
  const length = 6*3;
  expect(cds).toEqual(expect.objectContaining({
    length, strand: '-',
    segments: [
      // segment order is based on the direction of the CDS, so for -ve strand it's 3' to 5'
      // but within each segment the rangeGenome is still 5' to 3'
      {rangeGenome: [1, 8],    rangeLocal: [1, 8], phase: 0, frame: 2},
      {rangeGenome: [91, 100], rangeLocal: [9, length], phase: 1, frame: 1},
    ]
  }))
});

test("+ve strand CDS with multiple (non-wrapping) segments", () => {
  const cds = getCds('pos-multi')
  const length = 7*3;
  expect(cds).toEqual(expect.objectContaining({
    length, strand: '+',
    segments: [
      // -1 frameshift (e.g. ribosome slip) between 1st & 2nd segments
      {rangeGenome: [31, 36], rangeLocal: [1, 6],       phase: 0, frame: 0}, // 2 amino acids
      {rangeGenome: [36, 43], rangeLocal: [7, 14],      phase: 0, frame: 2}, // 2 2/3 amino acids
      {rangeGenome: [63, 69], rangeLocal: [15, length], phase: 1, frame: 0}  // 1/3 + 2 amino acids
    ]
  }))
});


test("-ve strand CDS with multiple (non-wrapping) segments", () => {
  const cds = getCds('neg-multi')
  const length = 8*3;
  expect(cds).toEqual(expect.objectContaining({
    length, strand: '-',
    segments: [
      // segment order is based on the direction of the CDS, so for -ve strand it's 3' to 5'
      // but within each segment the rangeGenome is still 5' to 3'
      // This example has a -1 frameshift between 1st & 2nd segments (so nuc 53 is in both)
      // and then a 27nt jump to the 3rd segment.
      {rangeGenome: [53, 60], rangeLocal: [1, 8],       phase: 0, frame: 1}, // 2 2/3 amino acids
      {rangeGenome: [46, 53], rangeLocal: [9, 16],      phase: 1, frame: 0}, // 1/3 + 2 + 1/3  amino acids
      {rangeGenome: [12, 19], rangeLocal: [17, length], phase: 2, frame: 2}  // 2/3 + 2 amino acids
    ]
  }))
});


/** Assumes that the gene name wasn't specified in the JSON and thus
 * we have one gene with one CDS
 */
function getCds(name) {
  const genes = chromosome.genes.filter((g) => g.name===name);
  if (genes.length!==1) throw new Error("Multiple (or no!) matching genes");
  if (genes[0].cds.length!==1) throw new Error("Multiple (or no!) matching CDSs");
  const cds = genes[0].cds[0];
  expect(cds.name).toBe(name)
  return cds;
}
