
const genPosParser = (gt) => {
  if (gt.length === 1) {
    return ["nuc", +gt[0] - 1];
  } else {
    return [gt[0], +gt[1] - 1];
  }
}

export const parseGenotype = (colorBy) => {
  console.log("parseGenotype", colorBy);
  const gt = colorBy.split(":");
  if (gt.length<2) {
    return null;
  } else {
    const positions = gt[1].split(";");
    const gene_pos = positions.map((d) => genPosParser(d.split("_")));
    console.log("parseGenotype", gene_pos, positions);
    return gene_pos;
  }
}

export const getGenotype = (gene, pos, node, sequences) => {
  if (sequences[node.clade][gene][pos]){
    return sequences[node.clade][gene][pos];
  } else {
    return sequences["root"][gene][pos];
  }
}
