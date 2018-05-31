
/** applyToNodesPostOrder
 * recursivly apply the callback to each node postorder (root to tip, go left as far as you can, then backtrack...)
 */
// const applyToNodesPostOrder = (node, callback) => {
//   if (node.children) {
//     for (let i=0; i<node.children.length; i++) {
//       applyToNodesPostOrder(node.children[i], callback);
//     }
//   }
//   callback(node);
// };

/** calculateNodeRank
 *
 */
// export const calculateNodeRank = (nodes) => {
//   let yvalue = nodes[0].fullTipCount;
//   const assignNodeOrder = (node) => {
//     if (!node.children) {
//       yvalue--;
//       node.yvalue = yvalue;
//       node.maxYvalue = yvalue;
//       node.minYvalue = yvalue;
//     } else {
//       let s=0;
//       for (let i=0; i<node.children.length; i++) {
//         s+=node.children[i].yvalue;
//       }
//       s/=node.children.length;
//       node.yvalue = s;
//       node.maxYvalue = node.children[node.children.length-1].yvalue;
//       node.minYvalue = node.children[0].yvalue;
//     }
//   };
//   applyToNodesPostOrder(nodes[0], assignNodeOrder);
// };

/** calculateOtherTreeRank
 * to the nodes, add node.otherYvalue (the y value from the other tree)
 * for terminal nodes, this is simple
 * for internal nodes, this is the sum of the children's y-value
 * all values are scaled into [0, 1]
 */
// const calculateOtherTreeRank = (phylotree1, phylotree2) => {
//   const numTips = phylotree1.numberOfTips;
//   // console.log(numTips)
//   const assignNodeOrder = (node) => {
//     if (!node.children) {
//       if (phylotree1.strainToNode[node.strain]) {
//         // console.log(phylotree1.strainToNode[node.strain].n.yvalue)
//         node.otherYvalue = phylotree1.strainToNode[node.strain].n.yvalue / numTips;
//       } else {
//         node.otherYvalue = 0;
//       }
//     } else {
//       let s=0;
//       for (let i=0; i<node.children.length; i++) {
//         if (node.children[i].otherYvalue) {
//           s += node.children[i].otherYvalue;
//         }
//       }
//       node.otherYvalue = 1.0*s / node.children.length;
//     }
//     // console.log(node.otherYvalue)
//   };
//   applyToNodesPostOrder(phylotree2.nodes[0], assignNodeOrder);
//   // phylotree2.nodes.forEach((n) => {n.otherYvalue/=n.fullTipCount;});
// };
