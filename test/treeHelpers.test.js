import { collectMutations, getUrlFromNode, getAccessionFromNode } from "../src/util/treeMiscHelpers";
import { treeJsonToState } from "../src/util/treeJsonProcessing";

/**
 * `dummyTree` is a simple tree with two tips: tipX and tipY
 * root to tipX mutations:
 *      single mutation at position 100 in gene "GENE" of A->B
 *      a reversion of C->D->C at position 200
 *      multiple mutations at 300 E->F->G
 * root to tipY mutations:
 *      ["A100B", "C200D", "E300F"]
 */
const dummyTree = treeJsonToState({
  name: "ROOT",
  children: [
    {
      name: "node1",
      branch_attrs: {mutations: {GENE: ["A100B", "C200D", "E300F"]}},
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
        }
      ]
    }
  ]
}).nodes;


test("Tip->root mutations are correctly parsed", () => {
  const tipXMutations = collectMutations(getNodeByName(dummyTree, "tipX")).GENE;
  const tipYMutations = collectMutations(getNodeByName(dummyTree, "tipY")).GENE;
  expect(tipXMutations.sort())
    .toEqual(["A100B", "E300G"].sort()); // note that pos 200 (reversion) has no mutations here
  expect(tipYMutations.sort())
    .toEqual(["A100B", "C200D", "E300F"].sort());
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
