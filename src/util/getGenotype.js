import { nucleotide_gene } from "./globals";

export const isColorByGenotype = (colorBy) => colorBy === "gt" || colorBy.startsWith("gt-");

/* Examples:
 *   { positions: [142] }                     → gt-nuc_142
 *   { positions: [142,144] }                 → gt-nuc_142,144
 *   { gene: "HA1",  positions: [144,142] }   → gt-HA1_144,142
 */
export const encodeColorByGenotype = ({ gene, positions }) => {
  if (!gene) {
    gene = nucleotide_gene;
  }

  if (!positions || !positions.length) {
    console.error("encodeColorByGenotype failed: no positions");
    return null;
  }

  return `gt-${gene}_${positions.join(",")}`;
};

/* Examples:
 *   gt-nuc_142       → { gene: "nuc", aa: false, positions: [142] }
 *   gt-nuc_142,144   → { gene: "nuc", aa: false, positions: [142,144] }
 *   gt-HA1_144,142   → { gene: "HA1", aa: true,  positions: [144,142] }
 */
export const decodeColorByGenotype = (colorBy, genomeMap) => {
  // If we're passed a genomeMap, then validate the decoded
  // gene name and positions.  Otherwise, just decode without validation.
  const validate = !!genomeMap;

  // Split the encoded string into tokens of gene and positions.
  const match = colorBy.match(/^gt-(.+)_([0-9,]+)$/);

  if (match) {
    const [, cdsName, encodedPositions] = match;

    const geneLength = validate ? getCdsLength(genomeMap, cdsName) : 'Infinity';

    if (validate && !geneLength) {
      console.error(`decodeColorByGenotype failed for color-by ${colorBy} (cds name: ${cdsName}) ` + 
      "as it wasn't found in the genome map;");
      return null;
    }

    const positions = decodePositions(encodedPositions, geneLength);
    if (!positions.length) {
      console.error("decodeColorByGenotype failed: no valid positions", colorBy, encodedPositions, geneLength);
      return null;
    }

    return {
      gene: cdsName,
      positions,
      aa: cdsName!==nucleotide_gene,
    };
  }

  console.error("Unable to decode colorBy genotype:", colorBy);
  return null;
};

/**
 * Similar to `encodeColorByGenotype` except we attempt to combine the requested gene+position with
 * the existing genotype. If such a combination is not possible then we return the genotype of the
 * requested gene+position (i.e. the fallback behaviour is that of `encodeColorByGenotype`).
 * If the requested position already exists in the current color-by then we _remove_ it, unless
 * it's the only position in which case we return the current color-by.
 */
export function encodeColorByGenotypeCumulative({ currentColorBy, genomeMap, gene, position }) {

  if (typeof(position)==='string') {
    position = parseInt(position, 10);
  }

  if (isNaN(position)) {
    console.error(`encodeColorByGenotypeCumulative position argument isn't parseable as an integer`)
    return currentColorBy;
  }

  if (!isColorByGenotype(currentColorBy)) {
    /* simply change to the requested genotype color-by */
    return encodeColorByGenotype({gene, positions: [position]})
  }

  const currentState = decodeColorByGenotype(currentColorBy, genomeMap);

  if (currentState.gene !== gene) {
    /* currently can't combine multiple genes in a single color-by (or nuc + some other gene),
    so instead we change to an entirely new (genotype) coloring */
    return encodeColorByGenotype({gene, positions: [position]})
  }

  let newPositions;
  if (currentState.positions.includes(position)) {
    // If it's the only position then this is a no-op
    if (currentState.positions.length===1) {
      return currentColorBy;
    }
    // else remove the position
    newPositions = currentState.positions.filter((pos) => pos!==position);
  } else {
    newPositions = [...currentState.positions, position];
  }

  newPositions.sort((a,b) => a<b ? -1 : a>b ? 1 : 0);
  return encodeColorByGenotype({gene, positions: newPositions})
}

export function decodePositions(positions, geneLength = 'Infinity') {
  return positions
    .split(",")
    .map((x) => parseInt(x, 10))
    .filter((x) => x > 0 && x <= Math.floor(geneLength));
}

/**
 * Encode genotype filters for storage in URL query state.
 * (Query schema is undocumented, see `tests/genotype.test.js` for examples)
 */
export const encodeGenotypeFilters = (values) => {
  const geneToMuts = values
    .filter((item) => item.active) // only active filters in the URL
    .map((item) => item.value)
    .reduce((map, value) => {
      const [gene, mut] = value.split(" ");
      if (!map.has(gene)) map.set(gene, []);
      map.get(gene).push(mut);
      return map;
    }, new Map());
  return Array.from(geneToMuts.entries())
    .map(([gene, muts]) => `${gene}.${muts.join(',')}`)
    .join(",");
};

/**
 * Decode genotype filters stored in URL query state.
 * Returns array of type FilterValue (i.e. object with props `value` {str} and `active` {bool})
 */
export const decodeGenotypeFilters = (query) => {
  let currentGene;
  return query.split(',')
    .map((x) => {
      if (x.includes('.')) {
        const parts = x.split(".");
        currentGene = parts[0];
        return parts.join(" ");
      }
      return `${currentGene} ${x}`;
    })
    .filter((value) => !!value)
    .map((value) => ({active: true, value})); // all URL filters _start_ active
};

export const makeGenotypeLabel = (colorBy) => {
  const genotype = isColorByGenotype(colorBy) ? decodeColorByGenotype(colorBy) : false;
  if (!genotype) return false;
  return `Genotype ${genotype.gene}: ${genotype.positions.join(", ")}`;
};

export const getCdsFromGenotype = (name, genomeMap) => {
  if (!Array.isArray(genomeMap) || !genomeMap.length || !name) return null;
  if (name==='nuc') return nucleotide_gene;
  for (const gene of genomeMap[0].genes) {
    for (const cds of gene.cds) {
      if (cds.name===name) {
        return cds;
      }
    }
  }
  return null;
}
 
/**
 * Returns the length of the genome (in nucleotides, if cdsName='nuc')
 * or the length of the CDS (in codons, including the stop codon)
 * @param {GenomeAnnotation} genomeMap 
 * @param {string} cdsName (may include "nuc")
 * @returns {number}
 */
export function getCdsLength(genomeMap, cdsName) {
  if (cdsName===nucleotide_gene) {
    return genomeMap[0].range[1];
  }
  for (const gene of genomeMap[0].genes) {
    for (const cds of gene.cds) {
      // length is checked to be a multiple of 3 when genomeMap is created
      if (cds.name===cdsName) return cds.length/3;
    }
  }
  return 0; // should never happen, as the cdsName originates from the genomeMap
}