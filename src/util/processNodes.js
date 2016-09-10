import * as treeHelpers from "./treeHelpers";
import * as globals from "./globals";

export const processNodes = (nodes) => {
  const rootNode = nodes[0];
  nodes.forEach((d) => {if (typeof d.attr === "undefined") {d.attr = {};} });
  treeHelpers.calcFullTipCounts(rootNode);
  treeHelpers.calcBranchLength(rootNode);
  treeHelpers.calcTipCounts(rootNode);
  treeHelpers.calcDates(nodes);

  // colorByTrait();
  //var nodesWithFrequencyAdded = treeHelpers.adjust_freq_by_date(nodes, rootNode);
  nodes.forEach((d) => d.hasChildren = typeof d.children !== "undefined");

  return nodes;

};

const rectangularLayout = (node, distanceMeasure) => {
    return {'xVal':(distanceMeasure=='div')?node.xvalue:node.attr[distanceMeasure],
            'yVal':node.yvalue,
            'xValMidpoint':(distanceMeasure=='div')?node.parent.xvalue:node.parent.attr[distanceMeasure],
            'yValMidpoint':node.yvalue
            };
};

const vsDateLayout = (node, distanceMeasure) => {
    return {'xVal':node.attr['num_date'], 'yVal':node.attr[distanceMeasure],
            'xValMidpoint':node.attr['num_date'], 'yValMidpoint':node.attr[distanceMeasure]
           };
};

const radialLayout = (node, distanceMeasure, nTips) => {
    const circleFraction = 0.95;
    const radius = (distanceMeasure=='div')?node.xvalue:node.attr[distanceMeasure];
    const parentRadius = (distanceMeasure=='div')?node.parent.xvalue:node.parent.attr[distanceMeasure];
    const angle = circleFraction*2.0*Math.PI*node.yvalue/nTips;
    const parentAngle = circleFraction*2.0*Math.PI*node.parent.yvalue/nTips;
    const leftRight = node.yvalue>node.parent.yvalue;
    const smallBigArc = Math.abs(angle - parentAngle)>Math.Pi*0.5;
    return {'xVal':radius*Math.sin(angle), 'yVal':radius*Math.cos(angle),
            'xValMidpoint':parentRadius*Math.sin(angle),
            'yValMidpoint':parentRadius*Math.cos(angle),
            'radius':radius,'radiusInner':parentRadius,
            'angle':angle, 'smallBigArc':smallBigArc, 'leftRight':leftRight};
};

/* Calculate layout geometry for radial and rectangular layouts
 * nodes: array of nodes for which x/y coordinates are to be calculated
 * nTips: total number of tips  (optional)
 * distanceMeasures: the different types of distances used to measure
                     distances on the tree (date, mutations, etc) (optional)
*/
export const calcLayouts = (nodes, distanceMeasures, nTips) => {
    if (typeof distanceMeasures==='undefined'){
        distanceMeasures = globals.defaultDistanceMeasures;
    }
    if (typeof nTips==='undefined'){
        nTips = nodes.filter((d) => {return !d.hasChildren;} ).length;
    }
    nodes.forEach( (node, ni) => {
        node.geometry = {};
        distanceMeasures.forEach((distanceMeasure, di) => {
            node.geometry[distanceMeasure]={};
            node.geometry[distanceMeasure]['rectangular'] = rectangularLayout(node, distanceMeasure);
            node.geometry[distanceMeasure]['radial'] = radialLayout(node, distanceMeasure, nTips);
            node.geometry[distanceMeasure]['vsDate'] = vsDateLayout(node, distanceMeasure);
        });
    });
};


/* Map the precomputed geometries to the coordinates in the SVG
 * nodes: array of nodes for which x/y coordinates are to be mapped
 * xScale: map of tree layout to coordinate space
 * yScale: map of tree layout to coordinate space
 * layout: type of layout to use (radial vs rectangular)
 * distanceMeasure: data type used to determine tree distances (date, mutations, etc)
*/
export const mapToCoordinates = (nodes, xScale, yScale, layout, distanceMeasure) => {
    nodes.forEach( (node, ni) => {
        node.geometry[distanceMeasure][layout]['x'] = xScales(node.geometry[distanceMeasure][layout]['xVal']);
        node.geometry[distanceMeasure][layout]['y'] = yScales(node.geometry[distanceMeasure][layout]['yVal']);
    });
}

