import { calcEntropyInView } from "../src/util/entropy";
import { treeJsonToState } from "../src/util/treeJsonProcessing";
import {NODE_VISIBLE, NODE_NOT_VISIBLE} from "../src/util/globals";

function tree1() {
  const nodes = treeJsonToState({
    name: "ROOT",
    children: [
      {
        name: "tipX",
        branch_attrs: {mutations: {
          nuc: ["A5T", "A10T"],
          GENE2: ["L4M"] 
        }}
      },
      {
        name: "tipY",
        branch_attrs: {mutations: {
          nuc: ["A5G"],
          GENE2: ["L4P"]
        }}
      },
      {
        name: "internalNodeZ",
        branch_attrs: {mutations: {
          nuc: ["A5C", "A15T"],
          GENE1: ["A1B"]
        }},
        children: [
          {
            name: "tipZ",
            branch_attrs: {mutations: {
              nuc: ["A5G"],  // NOTE this is nonsensical - A→C followed by A→G
              GENE2: ["L4S"] // Codon 4 should be stop, but auspice doesn't check
            }}
          }
        ]
      }
    ]
  }).nodes;

  const visibility = nodes.map(() => NODE_VISIBLE)

  const geneMap = {
    // P.S. start/end are GFF-like 1-based, close ended feature annotations in JSON
    // but start is converted to 0-based (by `getAnnotations()`) prior to geneMap creation
    GENE1: {prot: 'GENE1', start: 5, end: 14, strand: '+', fill: "NA", idx: 1}, // length=3 codons
    GENE2: {prot: 'GENE2', start: 4, end: 16, strand: '-', fill: "NA", idx: 0}, // length=4 codons
  }

  return {nodes, visibility, geneMap};
}

test("Basic mutation counts", () => {
  const {nodes, visibility, geneMap} = tree1();

  /* Very simple counting of nucleotide changes across all nodes */
  let [counts, max] = calcEntropyInView(nodes, visibility, "nuc", {}, true);
  expect(max).toBe(4);
  expect(counts).toStrictEqual([{x:5,y:4,prot:false},{x:10,y:1,prot:false},{x:15,y:1,prot:false}]);

  [counts, max] = calcEntropyInView(nodes, visibility, "aa", geneMap, true);
  const result = [{codon:1,y:1,prot:'GENE1'}, {codon:4,y:3,prot:'GENE2'}, ]
  expect(max).toBe(getMax(result));
  expect(noFill(counts)).toStrictEqual(result)

});

test("Visibility mask + counts", () => {
  const {nodes, visibility} = tree1();

  nodes.forEach((n, i) => {
    if (n.name==='tipZ') visibility[i]=NODE_NOT_VISIBLE;
  });
  const [counts, max] = calcEntropyInView(nodes, visibility, "nuc",  {}, true);
  expect(max).toBe(3);
  expect(counts).toStrictEqual([{x:5,y:3,prot:false},{x:10,y:1,prot:false},{x:15,y:1,prot:false}]);
})

test("Basic entropy counts", () => {
  const {nodes, visibility, geneMap} = tree1();

  let [counts, max] = calcEntropyInView(nodes, visibility, "nuc", {}, false);
  let result = [
    {x:5,y:entropy(1,2),prot:false},    // T,G,G
    {x:10,y:entropy(1,2),prot:false},   // T,A,A
    {x:15,y:entropy(1,2),prot:false}]   // A,A,T
  expect(max).toBe(getMax(result));
  expect(noFill(counts)).toStrictEqual(stringifyY(result));

  [counts, max] = calcEntropyInView(nodes, visibility, "aa", geneMap, false);
  result = [
    {codon:1,y:entropy(1,2),prot:'GENE1'},    // A,A,B
    {codon:4,y:entropy(1,1,1),prot:'GENE2'}   // M,P,S
  ]
  expect(max).toBe(getMax(result));
  expect(noFill(counts)).toStrictEqual(stringifyY(result));
});


test("Visibility mask + entropy", () => {
  const {nodes, visibility, geneMap} = tree1();

  nodes.forEach((n, i) => {
    if (n.name==='tipX' || n.name==='tipY') visibility[i]=NODE_NOT_VISIBLE;
  });
  let [counts, max] = calcEntropyInView(nodes, visibility, "nuc", {}, false);
  let result = [
    {x:5,y:entropy(1),prot:false},    // G
    // NOTE - position 10 is not reported as no visible nodes have it
    {x:15,y:entropy(1),prot:false}];   // T
  expect(max).toBe(getMax(result));
  expect(noFill(counts)).toStrictEqual(stringifyY(result));

  [counts, max] = calcEntropyInView(nodes, visibility, "aa", geneMap, false);
  result = [
    {codon:1,y:entropy(1),prot:'GENE1'},  // B
    {codon:4,y:entropy(1),prot:'GENE2'}   // S
  ]
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