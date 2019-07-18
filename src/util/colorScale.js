import { scaleLinear, scaleOrdinal } from "d3-scale";
import { min, max, range as d3Range } from "d3-array";
import { rgb } from "d3-color";
import { interpolateHcl } from "d3-interpolate";
import { genericDomain, colors, genotypeColors } from "./globals";
import { countTraitsAcrossTree } from "./treeCountingHelpers";
import { getExtraVals } from "./colorHelpers";
import { isColorByGenotype, decodeColorByGenotype } from "./getGenotype";
import { setGenotype, orderOfGenotypeAppearance } from "./setGenotype";

const unknownColor = "#AAAAAA";

const getMinMaxFromTree = (nodes, nodesToo, attr) => {
  const arr = nodesToo ? nodes.concat(nodesToo) : nodes.slice();
  const vals = arr.map((n) => n.attr[attr]);
  vals.filter((n) => n !== undefined)
    .filter((item, i, ar) => ar.indexOf(item) === i);
  return [min(vals), max(vals)];
};

/* this creates a (ramped) list of colours
   this is necessary as ordinal scales can't interpololate colours.
   range: [a,b], the colours to go between */
const createListOfColors = (n, range) => {
  const scale = scaleLinear().domain([0, n])
    .interpolate(interpolateHcl)
    .range(range);
  return d3Range(0, n).map(scale);
};

/* AA colours taken from
 * Taylor WR (1997) Residual colours: a proposal for aminochromography. Protein Engineering 10(7) 743-746
 * https://watermark.silverchair.com/100743.pdf
 */
const colorsAA = {
  D: "#FF0000", /* Asp Aspartate */
  S: "#FF3300", /* Ser Serine */
  T: "#FF6600", /* Thr Threonine */
  G: "#FF9900", /* Gly Glycine */
  P: "#FFCC00", /* Pro Proline */
  C: "#FFFF00", /* Cys Cystine */
  A: "#CCFF00", /* Ala Alanine */
  V: "#99FF00", /* Val Valine */
  I: "#66FF00", /* Ile Isoleucine */
  L: "#33FF00", /* Leu Leucine */
  M: "#00FF00", /* Met Methionine */
  F: "#00FF66", /* Phe Phenylalanine */
  Y: "#00FFCC", /* Tyr Tyrosine */
  W: "#00CCFF", /* Trp Tryptophan */
  H: "#0066FF", /* His Histidine */
  R: "#0000FF", /* Arg Argnine */
  K: "#6600FF", /* Lys Lysine */
  N: "#CC00FF", /* Asn Asparagine */
  Q: "#FF00CC", /* Gln Glutamine */
  E: "#FF0066" /* Glu Glutamate */
};

// const colorsNuc = { /* taken from https://www.umass.edu/molvis/drums/codes.html */
//   A: "#5050ff",
//   T: "#e6e600",
//   U: "#cc9900", /* not yet in augur but is a valid code */
//   G: "#00c000",
//   C: "#e00000",
//   K: "#ae00fe", /* Keto - G or T - not taken from DRuMS */
//   M: "#fd0162", /* aMino - A or C - not taken from DRuMS */
//   R: "#2e8b57", /* puRine - A or G */
//   Y: "#ff8c00" /* pYramidine - C or T */
// };


const colorsNuc = { /* alternative taken from http://life.nthu.edu.tw/~fmhsu/rasframe/SHAPELY.HTM */
  A: "#3F4DCB",
  R: "#4681C9", /* puRine - A or G */
  G: "#78B67E",
  C: "#C5B945",
  Y: "#E0A23A", /* pYramidine - C or T */
  T: "#DC2F24",
  U: "#E0A23A", /* not yet in augur but is a valid code (same as T here) */
  K: "#5AA4A8", /* Keto - G or T - not taken from DRuMS */
  M: "#C5B945" /* aMino - A or C - not taken from DRuMS */
};


const getDiscreteValuesFromTree = (nodes, nodesToo, attr) => {
  const stateCount = countTraitsAcrossTree(nodes, [attr], false, false)[attr];
  if (nodesToo) {
    const sc = countTraitsAcrossTree(nodesToo, [attr], false, false)[attr];
    for (let state in sc) { // eslint-disable-line
      if (stateCount[state]) {
        stateCount[state] += sc[state];
      } else {
        stateCount[state] = sc[state];
      }
    }
  }
  const domain = Object.keys(stateCount);
  /* sorting technique depends on the colorBy */
  if (attr === "clade_membership") {
    domain.sort();
  } else {
    domain.sort((a, b) => stateCount[a] > stateCount[b] ? -1 : 1);
  }
  return domain;
};

const createDiscreteScale = (domain) => {
  // note: colors[n] has n colors
  const colorList = domain.length <= colors.length ?
    colors[domain.length].slice() :
    colors[colors.length - 1].slice();
  /* set unknowns which appear in the domain to the unknownColor */
  const unknowns = ["unknown", "undefined", "unassigned", "NA", "NaN", "?"];
  for (const key of unknowns) {
    if (domain.indexOf(key) !== -1) {
      colorList[domain.indexOf(key)] = unknownColor;
    }
  }
  const scale = scaleOrdinal().domain(domain).range(colorList);
  return (val) => ((!val || domain.indexOf(val) === -1)) ? unknownColor : scale(val);
};

const createLegendBounds = (legendValues) => {
  const valBetween = (x0, x1) => x0 + 0.5*(x1-x0);
  const len = legendValues.length;
  const legendBounds = {};
  legendBounds[legendValues[0]] = [0, valBetween(legendValues[0], legendValues[1])];
  for (let i = 1; i < len - 1; i++) {
    legendBounds[legendValues[i]] = [valBetween(legendValues[i-1], legendValues[i]), valBetween(legendValues[i], legendValues[i+1])];
  }
  legendBounds[legendValues[len-1]] = [valBetween(legendValues[len-2], legendValues[len-1]), 10000];
  return legendBounds;
};


export const calcColorScale = (colorBy, controls, tree, treeToo, metadata) => {

  if (colorBy === "none") {
    console.warn("ColorScale fallthrough for colorBy set to none");
    const colorScale = () => unknownColor;
    const genotype = null;
    const legendValues = ["unknown"];
    const legendBounds = createLegendBounds(legendValues);
    return {
      scale: colorScale,
      continuous: false,
      colorBy: colorBy,
      version: controls.colorScale === undefined ? 1 : controls.colorScale.version + 1,
      legendValues,
      legendBounds,
      genotype
    };
  }

  let genotype;
  if (isColorByGenotype(colorBy) && controls.geneLength) {
    genotype = decodeColorByGenotype(colorBy, controls.geneLength);
    setGenotype(tree.nodes, genotype.gene, genotype.positions); /* modifies nodes recursively */
  }
  const colorOptions = metadata.colorOptions;
  const treeTooNodes = treeToo ? treeToo.nodes : undefined;
  let error = false;
  let continuous = false;
  let colorScale, legendValues, legendBounds;

  if (!tree.nodes) {
    console.error("calcColorScale called before tree is ready.");
    error = true;
  } else if (genotype) { /* G E N O T Y P E */
    const gtOrder = orderOfGenotypeAppearance(tree.nodes);
    if (genotype.aa){
      legendValues = gtOrder;
    }else{ // always have ACTG, add gap, N, or ambiguous nucleotides on demand
      legendValues = ['A', 'C', 'G', 'T'];
      for (let ni in gtOrder){
        if (!legendValues.includes(gtOrder[ni])){
          legendValues.push(gtOrder[ni]);
        }
      }
    }
    console.log(legendValues);
    if (genotype.positions.length === 1) {
      /* use pre-set colours for single AA / NUC values */
      colorScale = (val) => {
        const presetColors = genotype.aa ? colorsAA : colorsNuc;
        return presetColors[val.toUpperCase()] || unknownColor;
      };
    } else {
      /* we don't have pre-set colours for multiple values. This can be improved */
      colorScale = scaleOrdinal()
        .domain([undefined, ...legendValues])
        .range([unknownColor, ...genotypeColors]);
    }
  } else if (colorOptions && colorOptions[colorBy]) {
    if (colorOptions[colorBy].color_map) {
      // console.log("Sweet - we've got a color_map for ", colorBy)
      continuous = false; /* colorMaps can't be continuous */
      let domain = colorOptions[colorBy].color_map.map((d) => { return d[0]; });
      let range = colorOptions[colorBy].color_map.map((d) => { return d[1]; });
      const extraVals = getExtraVals(tree.nodes, treeTooNodes, colorBy, colorOptions[colorBy].color_map);
      if (extraVals.length) {
        // we must add these to the domain + provide a value in the range
        domain = domain.concat(extraVals);
        const extrasColorAB = [rgb(192, 192, 192), rgb(32, 32, 32)];
        range = range.concat(createListOfColors(extraVals.length, extrasColorAB));
      }
      colorScale = scaleOrdinal()
        .domain(domain)
        .range(range);
      legendValues = domain;
    } else if (colorOptions && colorOptions[colorBy].type === "discrete") {
      // console.log("making a discrete color scale for ", colorBy)
      continuous = false;
      legendValues = getDiscreteValuesFromTree(tree.nodes, treeTooNodes, colorBy);
      colorScale = createDiscreteScale(legendValues);
    } else if (colorOptions && colorOptions[colorBy].type === "continuous") {
      // console.log("making a continuous color scale for ", colorBy)
      continuous = true;
      let minMax;
      switch (colorBy) {
        case "lbi":
          minMax = [0, 0.7];
          break;
        case "num_date":
          break; /* minMax not needed for num_date */
        default:
          minMax = getMinMaxFromTree(tree.nodes, treeTooNodes, colorBy, colorOptions[colorBy]);
      }

      /* make the continuous scale */
      let domain, range;
      switch (colorBy) {
        case "num_date":
          /* we want the colorScale to "focus" on the tip dates, and be spaced according to sampling */
          let rootDate = tree.nodes[0].attr.num_date;
          let vals = tree.nodes.filter((n) => !n.hasChildren).map((n) => n.attr.num_date);
          if (treeTooNodes) {
            if (treeTooNodes[0].attr.num_date < rootDate) rootDate = treeTooNodes[0].attr.num_date;
            vals.concat(treeTooNodes.filter((n) => !n.hasChildren).map((n) => n.attr.num_date));
          }
          vals = vals.sort();
          domain = [rootDate];
          const n = 10;
          const spaceBetween = parseInt(vals.length / (n - 1), 10);
          for (let i = 0; i < (n-1); i++) domain.push(vals[spaceBetween*i]);
          domain.push(vals[vals.length-1]);
          domain = [...new Set(domain)]; /* filter to unique values only */
          range = colors[domain.length]; /* use the right number of colours */
          break;
        default:
          range = colors[9];
          domain = genericDomain.map((d) => minMax[0] + d * (minMax[1] - minMax[0]));
      }
      const scale = scaleLinear().domain(domain).range(range);
      colorScale = (val) => (val === undefined || val === false) ? unknownColor : scale(val);

      /* construct the legend values & their respective bounds */
      switch (colorBy) {
        case "lbi":
          legendValues = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7];
          break;
        case "num_date":
          legendValues = domain.slice(1);
          break;
        default:
          const spread = minMax[1] - minMax[0];
          const dp = spread > 5 ? 2 : 3;
          legendValues = genericDomain.map((d) => parseFloat((minMax[0] + d*spread).toFixed(dp)));
      }
      if (legendValues[0] === -0) legendValues[0] = 0; /* hack to avoid bugs */
      legendBounds = createLegendBounds(legendValues);
    } else {
      console.error("ColorBy", colorBy, "invalid type --", colorOptions[colorBy].type);
      error = true;
    }
  } else {
    error = true;
  }

  if (error) {
    console.error("ColorScale fallthrough for ", colorBy);
    continuous = false;
    legendValues = ["unknown"];
    colorScale = () => unknownColor;
  }

  return {
    scale: colorScale,
    continuous: continuous,
    colorBy: colorBy,
    version: controls.colorScale === undefined ? 1 : controls.colorScale.version + 1,
    legendValues,
    legendBounds,
    genotype
  };
};
