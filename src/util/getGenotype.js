
const genPosParser = (gt) => {
  if (gt.length === 1) {
    return ["nuc", +gt[0] - 1];
  }
  return [gt[0], +gt[1] - 1];
};

/* this function should be replaced by parseEncodedGenotype in entropy.js (or vice versa)
any modifications here must be replicated there */
export const parseGenotype = (colorBy, geneLength) => {
  const gt = colorBy.split("-");
  if (gt.length === 2) { /* currently we only allow 1 genotype to be selected */
    const positions = gt[1].split(";");
    const gene_pos = positions.map((d) => genPosParser(d.split("_")));
    const valid_pos = gene_pos.filter((d) => (geneLength[d[0]]
                                              && d[1].toString().length
                                              && /^[0-9]+$/.test(d[1])
                                              && (+d[1] <= geneLength[d[0]])));
    if (valid_pos.length) {
      return valid_pos;
    }
  }
  return null;
};

export const getGenotype = (gene, pos, node, sequences) => {
  if (sequences[node.clade][gene][pos]) {
    return sequences[node.clade][gene][pos];
  }
  return sequences["root"][gene][pos];
};
