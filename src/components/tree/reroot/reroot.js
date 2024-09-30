import { errorNotification } from "../../../actions/notifications";
import { updateVisibleTipsAndBranchThicknesses } from "../../../actions/tree";

/*
move flip node pair to move root from parent to node
     ----a        ----a
 ----|newRoot     |newRoot
 |   ---b        |---b
 |oldRoot    ->   |
 |           |----oldRoot----e
 -----e

 */
const flipNode = (node, parent, mutations) => {
  console.log(`flipNode, moving ${parent.name} to now be a child of ${node.name}`)

  const _l = parent.children.length;
  parent.children = parent.children.filter((d) => {return d!==node;});
  console.assert(_l - 1 === parent.children.length, "BUG FIXME")
  
  const grandParent = parent.parent;

  node.children.push(parent); // old parent is now a child of node,
  parent.parent = node;       // so its parent is the node
  // Branch length changes done separately (cumulative, not per-node)

  //flip mutations
  node.mutations = {}
  parent.mutations = Object.fromEntries(
    Object.entries(mutations[node.arrayIdx]).map(([name, data]) => {
      const flipped = data.map((m) => m[m.length-1] + m.substring(1,m.length-1) + m[0])
      return [name,flipped]
    })
  )

  console.log(`\tConsidering parent of ${parent.name}: ${grandParent.name}...`)
  
  if (parent===grandParent) {
    console.log("\t\t *** ABORT ***");
    return
  }

  flipNode(parent,grandParent, mutations)

}


function storePreviousBranchInformation(root) {
  const branchLengths = {}
  const mutations = {}
  const stack = [root]
  while (stack.length) {
    const node = stack.pop()
    for (const child of (node.children || [])) {
      branchLengths[child.arrayIdx] = child.node_attrs.div - node.node_attrs.div;
      mutations[child.arrayIdx] = child.branch_attrs.mutations
      stack.push(child)
    }
  }
  return {branchLengths, mutations};
}

function recalculateDivergence(root, branchLengths) {
  const stack = [root]
  root.node_attrs.div = 0
  while (stack.length) {
    const node = stack.pop()
    for (const child of (node.children || [])) {
      child.node_attrs.div = node.node_attrs.div + branchLengths[child.arrayIdx]
      stack.push(child)
    }
  }
}

/*
Add a node that is a new root node between parent and node
 */
const addNewRoot = (node, parent, branchSplit=0.5) => {
  // should assert that 1) node is child of parent and 2) that parent is root
  const newNode = {};
  for (let key in node){
    newNode[key] = node[key];
  }
  newNode.strain = node.strain + '_root';
  newNode.children = [node, parent];
  newNode.branchLength = undefined;
  node.branchLength = branchSplit*node.branchLength;
  parent.branchLength = (1-branchSplit)*node.branchLength;
  parent.children = parent.children.filter((d) => {return d!==node;});
  // DO SOMETHING WITH MUTATIONS
}

/*
remove node if it has only one child. Such nodes arise when the
previous root was bifurcating. Upon rerooting this bifurcating
node turns into a single-child node.
 */
const bridgeNode = (node) => {
  if (node.children.length===1) {
    node.parent.branchLength += node.branchLength;
    node.parent.muts = node.parent.muts.concat(node.muts);
    for (gene in aa_muts){
      node.parent.aa_muts[gene] = node.parent.aa_muts[gene].concat(node.aa_muts[gene]);
    }
    node.children[0].parent = node.parent;
    node.parent.children = node.parent.children((d) => {return d!==node;});
    node.parent.children.push(node.children[0]);
  }
}

/*
change the root of the tree from node oldRoot to node newRoot
 */
export const reroot = (newPhyloRootNode) => (dispatch, getState) => {

  /**
   * TODO - make sure we can't reroot if in:
   * temporal tree
   * exploded tree
   * 
   */

  const {tree} = getState();
  const newRootNode = newPhyloRootNode.n;
  console.log("REROOT", newRootNode, tree)

  if (!newRootNode.hasChildren) {
    dispatch(errorNotification({
      message: "Can't reroot on a terminal branch!",
    }));
    return;
  }


  const {branchLengths, mutations} = storePreviousBranchInformation(tree.nodes[0])
  console.log("mutations", mutations)
  flipNode(newRootNode, newRootNode.parent, mutations)
  newRootNode.parent = newRootNode;
  tree.nodes[0].children = [newRootNode]; // TODO - handle subtrees
  recalculateDivergence(tree.nodes[0], branchLengths)

  console.log("tree", tree)

  dispatch(updateVisibleTipsAndBranchThicknesses())

}
