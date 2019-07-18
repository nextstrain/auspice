
/**
 * Given a "trait", e.g. "author", "country" etc, extract it's value from a node.
 * Returns `undefined` if not set.
 * If entropy, then extract the entropy value
 * If confidence, then extract the confidence value
 */
export const getTraitFromNode = (node, trait, {entropy=false, confidence=false}={}) => {
  if (!entropy && !confidence) {
    if (trait === "author") return node.author ? node.author.value : undefined;
    if (trait === "num_date") return node.num_date.value;
    if (node[trait]) return node[trait];
    if (node.traits && node.traits[trait]) return node.traits[trait].value;
  } else if (entropy) {
    if (node.traits && node.traits[trait]) return node.traits[trait].entropy;
  } else if (confidence) {
    if (node.traits && node.traits[trait]) return node.traits[trait].confidence;
    if (trait === "num_date" && node.num_date) return node.num_date.confidence;
  }
  return undefined;
};

