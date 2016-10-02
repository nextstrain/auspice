
const genPosParser = (gt) => {
  if (gt.length === 1) {
    return ["nuc", +gt[0] - 1];
  } else {
    return [gt[0], +gt[1] - 1];
  }
};

export const parseGenotype = (colorBy, geneLength) => {
  const gt = colorBy.split("-");
  if (gt.length < 2) {
    console.log("parseGenotype", colorBy, "incomplete");
    return null;
  } else {
    const positions = gt[1].split(";");
    const gene_pos = positions.map((d) => genPosParser(d.split("_")));
    const valid_pos = gene_pos.filter((d) => (geneLength[d[0]]
                                              && d[1].toString().length
                                              && /^[0-9]+$/.test(d[1])
                                              && (+d[1] <= geneLength[d[0]])));
    if (valid_pos.length) {
      console.log("parseGenotype", colorBy, valid_pos);
      return valid_pos;
    } else {
      console.log("parseGenotype", colorBy, "invalid");
      return null;
    }
  }
};

export const getGenotype = (gene, pos, node, sequences) => {
  if (sequences[node.clade][gene][pos]) {
    return sequences[node.clade][gene][pos];
  } else {
    return sequences["root"][gene][pos];
  }
};
