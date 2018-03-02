
/* genotype string examples: gt-nuc_142  gt-nuc_142,144 gt-HA1_144,142
 * gt-HA1_144-HA2-50
 */
export const parseEncodedGenotype = (colorBy, geneLength) => {
  const parts = colorBy.slice(3).split('-');
  const ret = parts.map((part) => {
    const gene = part.split('_')[0];
    if (!geneLength[gene]) return false;
    const positions = part.split('_')[1].split(',')
      .map((x) => parseInt(x, 10))
      .filter((x) => x > 0 && x < geneLength[gene]);
    if (!positions.length) return false;
    return {
      aa: gene !== 'nuc',
      prot: gene === 'nuc' ? false : gene,
      positions
    };
  }).filter((x) => x !== false);
  /* check that we don't have both aa & nuc parts */
  if (colorBy.indexOf("nuc") !== -1 && ret.length !== 1) {
    console.error("Can't specify both nuc & aa genotypes.");
  }
  // console.log("parseEncodedGenotype:", colorBy, ret)
  return ret;
};
