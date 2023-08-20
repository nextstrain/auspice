import { calcEntropyInView, getCdsByName } from "../src/util/entropy";
import { treeJsonToState } from "../src/util/treeJsonProcessing";
import {NODE_VISIBLE, NODE_NOT_VISIBLE, nucleotide_gene} from "../src/util/globals";

function tree1() {
  const nodes = treeJsonToState({
    name: "ROOT",
    children: [
      {
        name: "tipX",
        branch_attrs: {mutations: {
          nuc: ["A5T", "A10T"],
          CDS2: ["L4M"] 
        }}
      },
      {
        name: "tipY",
        branch_attrs: {mutations: {
          nuc: ["A5G"],
          CDS2: ["L4P"]
        }}
      },
      {
        name: "internalNodeZ",
        branch_attrs: {mutations: {
          nuc: ["A5C", "A15T"],
          CDS1: ["A1B"]
        }},
        children: [
          {
            name: "tipZ",
            branch_attrs: {mutations: {
              nuc: ["A5G"],  // NOTE this is nonsensical - A→C followed by A→G
              CDS2: ["L4S"] // Codon 4 should be stop, but auspice doesn't check
            }}
          }
        ]
      }
    ]
  }).nodes;

  const visibility = nodes.map(() => NODE_VISIBLE)

  const genomeMap = [
    {
      name: 'source',
      range: [1,18],
      genes: [
        {
          name: "GENE1", color: "NA",
          cds: [
            {
              name: "CDS1", length: 9, strand: "+",
              segments: [
                {rangeGenome: [6,14], rangeLocal: [1, 9], phase: 0, frame: 2},
              ]
            }
          ]
        },
        {
          name: "GENE2", color: "NA",
          cds: [
            {
              name: "CDS2", length: 12, strand: "-",
              segments: [
                {rangeGenome: [5,16], rangeLocal: [1, 12], phase: 0, frame: 1},
              ]
            }
          ]
        }
      ]
    }
  ]

  return {nodes, visibility, genomeMap};
}

test("Basic mutation counts", () => {
  const {nodes, visibility, genomeMap} = tree1();

  /* Very simple counting of nucleotide changes across all nodes */
  let [counts, max] = calcEntropyInView(nodes, visibility, nucleotide_gene, true);
  expect(max).toBe(4);
  expect(counts).toStrictEqual([{x:5,y:4}, {x:10,y:1}, {x:15,y:1}]);

  [counts, max] = calcEntropyInView(nodes, visibility, getCdsByName(genomeMap, 'CDS1'), true);
  let result = [{codon:1,y:1}]
  expect(max).toBe(getMax(result));
  expect(noFill(counts)).toStrictEqual(result);

  [counts, max] = calcEntropyInView(nodes, visibility, getCdsByName(genomeMap, 'CDS2'), true);
  result = [{codon:4,y:3}]
  expect(max).toBe(getMax(result));
  expect(noFill(counts)).toStrictEqual(result)
});

test("Visibility mask + counts", () => {
  const {nodes, visibility} = tree1();

  nodes.forEach((n, i) => {
    if (n.name==='tipZ') visibility[i]=NODE_NOT_VISIBLE;
  });
  const [counts, max] = calcEntropyInView(nodes, visibility, nucleotide_gene, true);
  expect(max).toBe(3);
  expect(counts).toStrictEqual([{x:5,y:3}, {x:10,y:1}, {x:15,y:1}]);
})

test("Basic entropy calculations", () => {
  const {nodes, visibility, genomeMap} = tree1();

  let [counts, max] = calcEntropyInView(nodes, visibility, nucleotide_gene, false);
  let result = [
    {x:5,  y:entropy(1,2)},     // T,G,G
    {x:10, y:entropy(1,2)},     // T,A,A
    {x:15, y:entropy(1,2)}]     // A,A,T
  expect(max).toBe(getMax(result));
  expect(noFill(counts)).toStrictEqual(stringifyY(result));

  [counts, max] = calcEntropyInView(nodes, visibility, getCdsByName(genomeMap, 'CDS1'), false);
  result = [{codon:1, y:entropy(1,2)}];       // A,A,B
  expect(max).toBe(getMax(result));
  expect(noFill(counts)).toStrictEqual(stringifyY(result));

  [counts, max] = calcEntropyInView(nodes, visibility, getCdsByName(genomeMap, 'CDS2'), false);
  result = [{codon:4, y:entropy(1,1,1)}];     // M,P,S
  expect(max).toBe(getMax(result));
  expect(noFill(counts)).toStrictEqual(stringifyY(result));
});


test("Visibility mask + entropy", () => {
  const {nodes, visibility, genomeMap} = tree1();

  nodes.forEach((n, i) => {
    if (n.name==='tipX' || n.name==='tipY') visibility[i]=NODE_NOT_VISIBLE;
  });
  let [counts, max] = calcEntropyInView(nodes, visibility, nucleotide_gene, false);
  let result = [
    {x:5,y:entropy(1)},     // G
    // NOTE - position 10 is not reported as no visible nodes have it
    {x:15,y:entropy(1)}];   // T
  expect(max).toBe(getMax(result));
  expect(noFill(counts)).toStrictEqual(stringifyY(result));


  [counts, max] = calcEntropyInView(nodes, visibility, getCdsByName(genomeMap, 'CDS1'), false);
  result = [{codon:1,y:entropy(1)}]  // B
  expect(max).toBe(getMax(result));
  expect(noFill(counts)).toStrictEqual(stringifyY(result));

  [counts, max] = calcEntropyInView(nodes, visibility, getCdsByName(genomeMap, 'CDS2'), false);
  result = [{codon:4,y:entropy(1)}];  // B
  expect(max).toBe(getMax(result));
  expect(noFill(counts)).toStrictEqual(stringifyY(result));
});


function noFill(data) {
  return data.map((d) => {
    delete d.fill; // currently calculated based on gene order, but we'll remove this concept shortly
    return d;
  })
}

function entropy(...observations) {
  let s = 0;
  const total = observations.reduce((acc, cv) => acc+cv, 0);
  observations.forEach((obs) => {
    s-=obs/total * Math.log(obs/total);
  });
  return s
}

function stringifyY(data) {
  data.forEach((d) => d.y = d.y.toFixed(3));
  return data;
}

function getMax(data) {
  return data.reduce((acc, cv) => cv.y>acc?cv.y:acc, 0)
}