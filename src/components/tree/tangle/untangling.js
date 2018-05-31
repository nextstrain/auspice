import { setYValues } from "../phyloTree/helpers";


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
    const n2=phylotree2.nodes[i].n;
    if ((!n2.children) && phylotree1.strainToNode[n2.strain]) {
      const y1 = phylotree1.strainToNode[n2.strain].n.yvalue;
      const y2 = n2.yvalue;
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
    if (phyloNode.children) {
      phyloNode.children.reverse();
      reduxNode.children.reverse();
      setYValues(phylotree2.nodes); // looks at the order of the phylotree nodes
      const new_corr = calculatePearsonCorrelationCoefficient(phylotree1, phylotree2);
      if (correlation > new_corr) {
        phyloNode.children.reverse();
        reduxNode.children.reverse();
        setYValues(phylotree2.nodes);
      } else {
        correlation = new_corr;
      }
    }
  }
};


export const untangleTreeToo = (phylotree1, phylotree2) => {
  console.time("untangle");
  console.log("beginning to untangle. Initial correlation", calculatePearsonCorrelationCoefficient(phylotree1, phylotree2));
  flipChildrenPostorder(phylotree1, phylotree2);
  console.log("Finished untangling. correlation", calculatePearsonCorrelationCoefficient(phylotree1, phylotree2));
  console.timeEnd("untangle");
};
