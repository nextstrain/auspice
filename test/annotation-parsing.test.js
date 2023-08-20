import { genomeMap } from "../src/util/entropyCreateStateFromJsons";
import dataset from './data/test_complex-genome-annotation.json';
import { getNucCoordinatesFromAaPos, getCdsRangeLocalFromRangeGenome,
  nucleotideToAaPosition} from "../src/util/entropy";

const genome = genomeMap(dataset.meta.genome_annotations)
const chromosome = genome[0];

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
    isWrapping: false,
    segments: [
      {rangeGenome: [23, 28], rangeLocal: [1, length], phase: 0, frame: 1, segmentNumber: 1}
    ]
  }))
});

test("-ve strand CDS with a single segment", () => {
  const cds = getCds('neg-single');
  const length = 3*3;
  expect(cds).toEqual(expect.objectContaining({
    length, strand: '-',
    isWrapping: false,
    segments: [
      {rangeGenome: [72, 80], rangeLocal: [1, length], phase: 0, frame: 2, segmentNumber: 1}
    ]
  }))
});

test("+ve strand CDS which wraps the origin", () => {
  const cds = getCds('pos-wrapping')
  const length = 6*3;
  expect(cds).toEqual(expect.objectContaining({
    length, strand: '+',
    isWrapping: true,
    segments: [
      {rangeGenome: [93, 100], rangeLocal: [1, 8],      phase: 0, frame: 2, segmentNumber: 1},
      {rangeGenome: [1, 10],   rangeLocal: [9, length], phase: 1, frame: 1, segmentNumber: 2},
    ]
  }))
});

test("-ve strand CDS which wraps the origin", () => {
  const cds = getCds('neg-wrapping')
  const length = 6*3;
  expect(cds).toEqual(expect.objectContaining({
    length, strand: '-',
    isWrapping: true,
    segments: [
      // segment order is based on the direction of the CDS, so for -ve strand it's 3' to 5'
      // but within each segment the rangeGenome is still 5' to 3'
      {rangeGenome: [1, 8],    rangeLocal: [1, 8],      phase: 0, frame: 2, segmentNumber: 1},
      {rangeGenome: [91, 100], rangeLocal: [9, length], phase: 1, frame: 1, segmentNumber: 2},
    ]
  }))
});

test("+ve strand CDS with multiple (non-wrapping) segments", () => {
  const cds = getCds('pos-multi')
  const length = 7*3;
  expect(cds).toEqual(expect.objectContaining({
    length, strand: '+',
    isWrapping: false,
    segments: [
      // -1 frameshift (e.g. ribosome slip) between 1st & 2nd segments
      {rangeGenome: [31, 36], rangeLocal: [1, 6],       phase: 0, frame: 0, segmentNumber: 1}, // 2 amino acids
      {rangeGenome: [36, 43], rangeLocal: [7, 14],      phase: 0, frame: 2, segmentNumber: 2}, // 2 2/3 amino acids
      {rangeGenome: [63, 69], rangeLocal: [15, length], phase: 1, frame: 0, segmentNumber: 3}  // 1/3 + 2 amino acids
    ]
  }))
});


test("-ve strand CDS with multiple (non-wrapping) segments", () => {
  const cds = getCds('neg-multi')
  const length = 8*3;
  expect(cds).toEqual(expect.objectContaining({
    length, strand: '-',
    isWrapping: false,
    segments: [
      // segment order is based on the direction of the CDS, so for -ve strand it's 3' to 5'
      // but within each segment the rangeGenome is still 5' to 3'
      // This example has a -1 frameshift between 1st & 2nd segments (so nuc 53 is in both)
      // and then a 27nt jump to the 3rd segment.
      {rangeGenome: [53, 60], rangeLocal: [1, 8],       phase: 0, frame: 1, segmentNumber: 1}, // 2 2/3 amino acids
      {rangeGenome: [46, 53], rangeLocal: [9, 16],      phase: 1, frame: 0, segmentNumber: 2}, // 1/3 + 2 + 1/3  amino acids
      {rangeGenome: [12, 19], rangeLocal: [17, length], phase: 2, frame: 2, segmentNumber: 3}  // 2/3 + 2 amino acids
    ]
  }))
});

const aaToNuc = {
  'pos-single': [
    [1, [23,24,25]], /* The codon for the first AA is at genome coordinates 23,24,25 (1-based) */
    [2, [26,27,28]]
  ],
  'pos-multi': [
    [2, [34,35,36]], [3, [36,37,38]], [5, [42,43,63]], [7, [67,68,69]]
  ],
  'pos-wrapping': [
    [3, [99,100,1]]
  ],
  'neg-single': [
    [1, [80,79,78]], [3, [74,73,72]]
  ],
  'neg-multi': [
    [1, [60,59,58]], [3, [54,53, 53]], [6, [46,19,18]] 
  ],
  'neg-wrapping': [
    [1, [8,7,6]], [3, [2,1,100]], [6, [93,92,91]]
  ]
}

describe('AA positions mapped to nucleotide positions on the genome', () => {
  for (const [name, data] of Object.entries(aaToNuc)) {
    const cds = getCds(name);
    test(prettifyName(name), () => {
      data.forEach(([aaPos, nucPosns]) => {
        const res = getNucCoordinatesFromAaPos(cds, aaPos);
        expect(res.nucCoordinates).toStrictEqual(nucPosns);
      })
    })
  }
})

const genomeZoomToCdsLocalZoom = {
  'pos-single': [
    // genome zoom bounds     cds rangeLocal  valid?
    [[21, 25],                [[1, 6],       false]],
    [[21, 30],                [[1, 6],       false]],
    [[25, 30],                [[1, 6],       false]],
    [[23, 28],                [[1, 6],       true]],
    [[24, 28],                [[1, 6],       true]],
    [[27, 28],                [[4, 6],       true]],
    [[26, 27],                [[4, 6],       true]],
    [[24, 26],                [[1, 6],       true]],
  ],
  'pos-multi': [
    // either (or both) zoom bound(s) beyond the entire CDS is invalid
    [[30, 35],                [[1, 21],       false]],
    [[30, 70],                [[1, 21],       false]],
    [[31, 70],                [[1, 21],       false]],
    // zoom bounds match CDS bounds
    [[31, 69],                [[1, 21],       true]],
    // Test zoom bounds where one falls in-between CDS segments
    //          note that local pos 15 is genome nuc 63
    [[31, 60],                [[1, 15],       true]],
    //          note that local pos 13,14 are genome pos 42,43
    [[45, 69],                [[13, 21],      true]],
    // Each zoom bound is within a segment
    [[31, 39],                [[1, 12],       true]],
    [[35, 65],                [[4, 18],       true]],
    [[63, 67],                [[13, 21],      true]],
    // Pos 36 is in 2 segments and 2 different AAs. The results here are perhaps
    // not the intuitive ones, and we can improve the algorithm if we genuinely
    // run into this edge case.
    [[36, 67],                [[7, 21],      true]],
    [[31, 36],                [[1, 9],       true]],
  ],
  'pos-wrapping': [
    // either (or both) zoom bound(s) beyond the entire CDS is invalid
    [[20, 90],                [[1, 18],       false]],
    [[10, 90],                [[1, 18],       false]],
    [[20, 99],                [[1, 18],       false]],
    // zoom bounds match CDS bounds
    [[10, 93],                [[1, 18],       true]],
    // Valid coords - i.e. within the extent of the CDS
    [[10, 98],                [[4, 18],       true]],
    [[1, 96],                 [[4, 9],        true]],
    // Note that the following will fail, because the UI forces that the zoom bounds
    // are either side of the origin
    // [[4, 8],              [[10, 18],      true]],
  ],
  'neg-single': [
    // following have one (or both) zoom coords beyond the CDS => invalid
    [[71, 77],                [[1, 9],       false]],
    [[71, 100],               [[1, 9],       false]],
    [[10, 77],                [[1, 9],       false]],
    [[1, 100],                [[1, 9],       false]],
    // following are valid as both zoom coords are inside (or on) CDS boundary
    [[72, 80],                [[1, 9],       true]],
    [[72, 76],                [[4, 9],       true]],
    [[74, 76],                [[4, 9],       true]],
    [[77, 78],                [[1, 6],       true]],
  ],
  'neg-multi': [
    // either (or both) zoom bound(s) beyond the entire CDS is invalid
    [[11, 17],                [[1, 24],       false]],
    [[11, 70],                [[1, 24],       false]],
    [[50, 70],                [[1, 24],       false]],
    // zoom bounds match CDS bounds
    [[12, 60],                [[1, 24],       true]],
    // Test zoom bounds where one falls in-between CDS segments
    [[12, 40],                [[16, 24],      true]],
    [[40, 60],                [[1, 18],       true]],
    // Each zoom bound is within a segment
    [[16, 55],                [[4, 21],       true]],
    [[48, 59],                [[1, 15],       true]],
    [[12, 16],                [[19, 24],      true]],
    // Pos 53 is in 2 segments but the same AA
    [[53, 60],                [[1, 9],        true]],
    [[12, 53],                [[7, 24],       true]],
  ],
  'neg-wrapping': [
    // either (or both) zoom bound(s) beyond the entire CDS is invalid
    [[20, 90],                [[1, 18],       false]],
    [[5, 90],                 [[1, 18],       false]],
    [[20, 95],                [[1, 18],       false]],
    // zoom bounds match CDS bounds
    [[8, 91],                 [[1, 18],       true]],
    // Valid coords - i.e. within the extent of the CDS
    [[5, 95],                 [[4, 15],       true]],
    // Note that the following will fail, because the UI forces that the zoom bounds
    // are either side of the origin
    // [[91, 99],                [[10, 18],      true]],
  ],
}

describe('Genome zoom bounds mapped to cds local coordinates', () => {
  for (const [name, data] of Object.entries(genomeZoomToCdsLocalZoom)) {
    const cds = getCds(name);
    test(prettifyName(name), () => {
      data.forEach(([genomeZoomBounds, expectedResult]) => {
        expect(getCdsRangeLocalFromRangeGenome(cds, genomeZoomBounds))
          .toStrictEqual(expectedResult);
      })
    })
  }
})


/**
 * Note that order of CDSs (if multiple matches) is the order they
 * appear in the JSON
 */
const nucleotideToAaPositionData = [
  [23, [{cds: getCds('pos-single'),   nucLocal: 1,  aaLocal: 1}]],
  [75, [{cds: getCds('neg-single'),   nucLocal: 6,  aaLocal: 2}]],
  [9,  [{cds: getCds('pos-wrapping'), nucLocal: 17, aaLocal: 6}]],
  [92, [{cds: getCds('neg-wrapping'), nucLocal: 17, aaLocal: 6}]],
  [4,  [{cds: getCds('pos-wrapping'), nucLocal: 12, aaLocal: 4}, 
        {cds: getCds('neg-wrapping'), nucLocal: 5,  aaLocal: 2}]],
  [93, [{cds: getCds('pos-wrapping'), nucLocal: 1,  aaLocal: 1}, 
        {cds: getCds('neg-wrapping'), nucLocal: 16, aaLocal: 6}]],
  [48, [{cds: getCds('neg-multi'),    nucLocal: 14, aaLocal: 5}]],
  [63, [{cds: getCds('pos-multi'),    nucLocal: 15, aaLocal: 5}]],
  // Pos 36 appears in 2 segments of the pos-multi CDS, in different codons
  [36, [{cds: getCds('pos-multi'),    nucLocal: 6, aaLocal: 2},
        {cds: getCds('pos-multi'),    nucLocal: 7, aaLocal: 3}]],
  // Pos 53 appears in 2 segments of the neg-multi CDS, both in the same codon
  [53, [{cds: getCds('neg-multi'),    nucLocal: 8,  aaLocal: 3},
        {cds: getCds('neg-multi'),    nucLocal: 9, aaLocal: 3}]],
]


test("Single nucleotide positions are correctly mapped to amino acid positions", () => {
  for (const [nucPos, expectedResult] of nucleotideToAaPositionData) {
    expect(nucleotideToAaPosition(genome, nucPos)).toStrictEqual(expectedResult);
  }
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

function prettifyName(name) {
  return `${name.startsWith('pos')?'+ve':'-ve'} strand CDS ${name.replace(/.+-/,'')}`;
}