import { getUrlFromNode, getAccessionFromNode, getBranchMutations, categoriseSeqChanges } from "../src/util/treeMiscHelpers";
import { treeJsonToState } from "../src/util/treeJsonProcessing";
import { parseIntervalsOfNsOrGaps } from "../src/components/tree/infoPanels/MutationTable";

/**
 * `dummyTree` is a simple tree with three tips: tipX-Z
 * root to tipX mutations:
 *      single mutation at position 100 in gene "GENE" of A->B
 *      a reversion of C->D->C at position 200
 *      multiple mutations at 300 E->F->G (F300G is a homoplasy)
 * root to tipY mutations:
 *      ["A100B", "C200D", "E300F"]
 * root to tipZ mutations:
 *      the three root mutations + F300G (homoplasy)
 */
const dummyTree = treeJsonToState({
  name: "ROOT",
  children: [
    {
      name: "node1",
      branch_attrs: {mutations: {GENE: ["A100B", "C200D", "E300F", "A400-"]}},
      children: [
        { // start 1st child of node1
          name: "node1.1",
          branch_attrs: {mutations: {GENE: ["D200C", "F300G"]}},
          children: [
            {
              name: "tipX"
            }
          ]
        },
        { // start 2nd child of node1
          name: "tipY"
        },
        { // 3rd child of node1
          name: "tipZ",
          branch_attrs: {mutations: {GENE: ["F300G", "B100A", "-400A"]}}
        }
      ]
    }
  ]
});

describe('Parse and summarise mutations', () => {
  test("Collection of all mutations", () => {
    // note that the function we are testing, collectObservedMutations,
    // is part of treeJsonToState so we are testing it indirectly
    expect(dummyTree.observedMutations)
      .toEqual({ // exactly equal all Obj keys and values
        "GENE:A400-": 1,
        "GENE:-400A": 1,
        "GENE:A100B": 1,
        "GENE:C200D": 1,
        "GENE:E300F": 1,
        "GENE:D200C": 1,
        "GENE:F300G": 2,
        "GENE:B100A": 1,
      });
  });

  test("Branch mutations are correctly interpreted", () => {
    const node_1 = getBranchMutations(
      getNodeByName(dummyTree.nodes, "node1"),
      dummyTree.observedMutations
    );
    expect(node_1).toEqual({
      GENE: {
        unique: ["A100B", "C200D", "E300F"],
        homoplasies: [],
        gaps: ["A400-"],
        undeletions: [],
        reversionsToRoot: []
      }
    });
    const node_1_1 = getBranchMutations(
      getNodeByName(dummyTree.nodes, "node1.1"),
      dummyTree.observedMutations
    );
    expect(node_1_1).toEqual({
      GENE: {
        unique: ["D200C"],
        homoplasies: ["F300G"],
        gaps: [],
        undeletions: [],
        reversionsToRoot: ["D200C"]
      }
    });
    const branch_tipZ = getBranchMutations(
      getNodeByName(dummyTree.nodes, "tipZ"),
      dummyTree.observedMutations
    );
    expect(branch_tipZ).toEqual({
      GENE: {
        unique: ["B100A"],
        homoplasies: ["F300G"],
        gaps: [],
        undeletions: ["-400A"],
        reversionsToRoot: ["B100A"]
      }
    });
  });

  test("Tip mutations are correctly categorised", () => {

    expect(categoriseSeqChanges({nuc: []}))
      .toEqual({
        nuc: {gaps: [], ns: [], reversionsToRoot: [], changes: []}
      });

    expect(categoriseSeqChanges({nuc: {
      100: ['A', 'N'], // typical unknown base due to low coverage
      101: ['A', '-'], // typical gap
      102: ['A', 'T'], // typical change
      103: ['A', 'A'], // typical reversion to root
      104: ['-', 'T'], // strange, but can happen via `augur ancestral` when ref (root) seq has been pruned
      105: ['-', '-'], // stranger, but occurs when we have situations like the above
      106: ['N', 'N']
    }}))
      .toEqual({
        nuc: {gaps: ["A101-", "-105-"], ns: ["A100N", "N106N"], reversionsToRoot: ["A103A"], changes: ["A102T", "-104T"]}
      });

  });
});


function getNodeByName(tree, name) {
  let namedNode;
  const recurse = (node) => {
    if (node.name === name) namedNode = node;
    else if (node.children) node.children.forEach((n) => recurse(n));
  };
  recurse(tree[0]);
  return namedNode;
}

describe('Extract various values from node_attrs', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  // the following test also covers `validateUrl`
  test("getUrlFromNode correctly handles various URLs", () => {
    expect(getUrlFromNode({}, "trait")).toEqual(undefined); // no node_attrs on node
    expect(getUrlFromNode({node_attrs: {}}, "trait")).toEqual(undefined); // no "trait" defined in node_attrs
    expect(getUrlFromNode({node_attrs: {trait: "str_value"}}, "trait")).toEqual(undefined); // incorrectly formatted "trait"
    expect(getUrlFromNode({node_attrs: {trait: {}}}, "trait")).toEqual(undefined); // correctly formatted "trait", no URL
    expect(getUrlFromNode({node_attrs: {trait: {url: 1234}}}, "trait")).toEqual(undefined); // invalid URL
    expect(getUrlFromNode({node_attrs: {trait: {url: "bad url"}}}, "trait")).toEqual(undefined); // invalid URL
    expect(getUrlFromNode({node_attrs: {trait: {url: "https://nextstrain.org"}}}, "trait")).toEqual("https://nextstrain.org/");
    expect(getUrlFromNode({node_attrs: {trait: {url: "http://nextstrain.org"}}}, "trait")).toEqual("http://nextstrain.org/");
    expect(getUrlFromNode({node_attrs: {trait: {url: "https_//nextstrain.org"}}}, "trait")).toEqual("https://nextstrain.org/"); // see code for details
    expect(getUrlFromNode({node_attrs: {trait: {url: "http_//nextstrain.org"}}}, "trait")).toEqual("http://nextstrain.org/"); // see code for details
  });

  test("extract accession & corresponding URL from a node", () => {
    expect(getAccessionFromNode({}))
      .toStrictEqual({accession: undefined, url: undefined});  // no node_attrs on node
    expect(getAccessionFromNode({node_attrs: {}}))
      .toStrictEqual({accession: undefined, url: undefined}); // no "accession" on node_attrs
    expect(getAccessionFromNode({node_attrs: {accession: "MK049251", url: "https://www.ncbi.nlm.nih.gov/nuccore/MK049251"}}))
      .toStrictEqual({accession: "MK049251", url: "https://www.ncbi.nlm.nih.gov/nuccore/MK049251"});
    expect(getAccessionFromNode({node_attrs: {url: "https://www.ncbi.nlm.nih.gov/nuccore/MK049251"}}))
      .toStrictEqual({accession: undefined, url: "https://www.ncbi.nlm.nih.gov/nuccore/MK049251"}); // url can be defined without accession
    expect(getAccessionFromNode({node_attrs: {accession: "MK049251", url: "nuccore/MK049251"}}))
      .toStrictEqual({accession: "MK049251", url: undefined}); // invalid URL
  });

});

test("Parse intervals of gaps or Ns", () => {
  expect(parseIntervalsOfNsOrGaps(["T200N", "T100N", "C101N", "G102N"]))
    .toStrictEqual(
      [{start: 100, end: 102, count: 3, char: 'N'}, {start: 200, end: 200, count: 1, char: 'N'}]
    );
  expect(parseIntervalsOfNsOrGaps(["T5N", "T3N", "C1N", "G7N"]))
    .toStrictEqual(
      [{start: 1, end: 1, count: 1, char: 'N'}, {start: 3, end: 3, count: 1, char: 'N'}, {start: 5, end: 5, count: 1, char: 'N'}, {start: 7, end: 7, count: 1, char: 'N'}]
    );
  expect(parseIntervalsOfNsOrGaps(["T5-", "T3-", "C4-", "G7-", "G8-"]))
    .toStrictEqual(
      [{start: 3, end: 5, count: 3, char: '-'}, {start: 7, end: 8, count: 2, char: '-'}]
    );
});
