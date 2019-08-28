
import { UNDEFINED_VALUE, isValueValid } from "./globals";

/**
 * Given a "trait", e.g. "author", "country" etc, extract it's value from a node.
 * If entropy, then extract the entropy value
 * If confidence, then extract the confidence value
 * When getting value:
 *    Returns `UNDEFINED_VALUE` if not set OR if the value is not valid.
 * When getting entropy or confidence:
 *    Returns `undefined` if not set OR if the value is not valid.
 */
export const getTraitFromNode = (node, trait, {entropy=false, confidence=false, fullAuthorInfo=false}={}) => {
  if (!entropy && !confidence) {
    let value = UNDEFINED_VALUE;
    if (trait === "author") {
      if (fullAuthorInfo) value = node.author ? node.author : undefined;
      else value = node.author ? node.author.value : undefined;
    } else if (trait === "num_date" && node.num_date) value = node.num_date.value;
    else if (node[trait]) value = node[trait];
    else if (node.traits && node.traits[trait]) value = node.traits[trait].value;
    if (value !== UNDEFINED_VALUE && !isValueValid(value)) {
      value = UNDEFINED_VALUE;
    }
    return value;
  } else if (entropy) {
    if (node.traits && node.traits[trait]) return node.traits[trait].entropy;
    return undefined;
  } else if (confidence) {
    if (node.traits && node.traits[trait]) return node.traits[trait].confidence;
    if (trait === "num_date" && node.num_date) return node.num_date.confidence;
    return undefined;
  }
};

