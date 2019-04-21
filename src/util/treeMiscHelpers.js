
/**
 * Given a "trait", e.g. "author", "country" etc, extract it's value from a node.
 * Returns `undefined` if not set.
 * If entropy, then extract the entropy value
 * If confidence, then extract the confidence value
 */
export const getTraitFromNode = (node, trait, {entropy=false, confidence=false}={}) => {
  if (!entropy && !confidence) {
    if (trait === "num_date") return node.num_date.value;
    if (node[trait]) return node[trait];
    if (node.traits && node.traits[trait]) return node.traits[trait].value;
    if (node.attr && node.attr[trait]) return node.attr[trait]; // DEPRECATED
  } if (entropy) {
    if (node.traits && node.traits[trait]) return node.traits[trait].entropy;
    const entropyKey = trait + "_entropy";
    if (node.attr && node.attr[entropyKey]) return node.attr[entropyKey]; // DEPRECATED
  } if (confidence) {
    if (node.traits && node.traits[trait]) return node.traits[trait].confidence;
    const confidenceKey = trait + "_confidence";
    if (node.attr && node.attr[confidenceKey]) return node.attr[confidenceKey]; // DEPRECATED
  }
  return undefined;
};

