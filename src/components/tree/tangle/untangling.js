import { setDisplayOrderRecursively, setDisplayOrder } from "../phyloTree/helpers";


/** calculatePearsonCorrelationCoefficient
 * "a measure of the linear correlation between two variables X and Y"
 * covariance / (stdev(tree1) * stdev(tree2))
 * @param {obj} phylotree1 Left tree
 * @param {obj} phylotree2 Right tree
 * @return {float} tangle score
 */
const calculatePearsonCorrelationCoefficient = (phylotree1, phylotree2) => {
  let count=0, my1=0, my2=0, sqy1=0, sqy2=0, y12=0;
  for (let i=0; i<phylotree2.nodes.length; i++) {
    const n2=phylotree2.nodes[i];
    if ((!n2.n.children) && phylotree1.strainToNode[n2.n.name]) {
      const y1 = phylotree1.strainToNode[n2.n.name].displayOrder;
      const y2 = n2.displayOrder;
      count++;
      my1+=y1;
      my2+=y2;
      sqy1+=y1**2;
      sqy2+=y2**2;
      y12 += y1*y2;
    }
  }
  my1/=count;
  my2/=count;
  sqy1/=count;
  sqy2/=count;
  y12/=count;
  const corr = (y12-my1*my2)/Math.sqrt((sqy1 - my1**2)*(sqy2 - my2**2));
  return corr;
};


/** flipChildrenPostorder
 * re-order the children - if the correlation is improved, keep the flip, else restore original
 */
const flipChildrenPostorder = (phylotree1, phylotree2) => {
  let correlation = calculatePearsonCorrelationCoefficient(phylotree1, phylotree2);
  for (let i=0; i<phylotree2.nodes.length; i++) {
    const phyloNode = phylotree2.nodes[i];
    const reduxNode = phyloNode.n;
    if (reduxNode.children) {

      /* step 1: find the left-most y value descendent from this node.
      This is needed to recursively set new y-values downstream of this node
      instead of setting them for everything. */
      let leftMostNode = reduxNode;
      while (leftMostNode.hasChildren) {
        let nodeWithSmallestY = leftMostNode.children[0];
        leftMostNode.children.forEach((node) => {
          if (node.shell.displayOrder < nodeWithSmallestY.shell.displayOrder) {
            nodeWithSmallestY = node;
          }
        });
        leftMostNode = nodeWithSmallestY;
      }
      const originalStartingY = leftMostNode.shell.displayOrder - 1; // setDisplayOrderRecursively expects the previous Y value

      /* step 2: reverse the children, recalc the y-values, and see if things improved */
      reduxNode.children.reverse();
      setDisplayOrderRecursively(phyloNode, originalStartingY);
      const new_corr = calculatePearsonCorrelationCoefficient(phylotree1, phylotree2);
      if (correlation > new_corr) {
        reduxNode.children.reverse();
        setDisplayOrderRecursively(phyloNode, originalStartingY);
        // setDisplayOrderRecursively(phylotree2.nodes[0], 0);
      } else {
        correlation = new_corr;
      }
    }
  }
};

export const untangleTreeToo = (phylotree1, phylotree2) => {
  // console.time("untangle");
  // const init_corr = calculatePearsonCorrelationCoefficient(phylotree1, phylotree2);
  flipChildrenPostorder(phylotree1, phylotree2);
  // console.log(`Untangling ${init_corr} -> ${calculatePearsonCorrelationCoefficient(phylotree1, phylotree2)}`);
  // TODO: check the value of focus
  setDisplayOrder({nodes: phylotree2.nodes, focus: false});
  // console.timeEnd("untangle");
};
