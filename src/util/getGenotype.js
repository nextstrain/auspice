import { nucleotide_gene } from "./globals";

export const isColorByGenotype = (colorBy) => colorBy === "gt" || colorBy.startsWith("gt-");

/* Examples:
 *   { positions: [142] }                     → gt-nuc_142
 *   { positions: [142,144] }                 → gt-nuc_142,144
 *   { gene: "HA1",  positions: [144,142] }   → gt-HA1_144,142
 */
export const encodeColorByGenotype = ({ gene, positions }) => {
  if (!gene) {
    gene = nucleotide_gene; // eslint-disable-line no-param-reassign
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
export const decodeColorByGenotype = (colorBy, geneLengths) => {
  // If we're passed a map of gene name → length, then validate the decoded
  // gene name and positions.  Otherwise, just decode without validation.
  const validate = typeof geneLengths === "object" && Object.keys(geneLengths).length;

  // Split the encoded string into tokens of gene and positions.
  const match = colorBy.match(/^gt-(.+)_([0-9,]+)$/);

  if (match) {
    const [, gene, encodedPositions] = match;
    const geneLength = validate ? geneLengths[gene] : 'Infinity';

    if (validate && !geneLength) {
      console.error("decodeColorByGenotype failed: no gene length", colorBy, gene, geneLengths);
      return null;
    }

    const positions = decodePositions(encodedPositions, geneLength); // eslint-disable-line no-use-before-define

    if (!positions.length) {
      console.error("decodeColorByGenotype failed: no valid positions", colorBy, encodedPositions, geneLength);
      return null;
    }

    return {
      gene,
      positions,
      aa: gene !== nucleotide_gene
    };
  }

  console.error("Unable to decode colorBy genotype:", colorBy);
  return null;
};

export const decodePositions = (positions, geneLength = 'Infinity') => {
  return positions
    .split(",")
    .map((x) => parseInt(x, 10))
    .filter((x) => x > 0 && x <= Math.floor(geneLength));
};
