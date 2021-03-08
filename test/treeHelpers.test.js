import { collectMutations } from "../src/util/treeMiscHelpers";
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
