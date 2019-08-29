
import { UNDEFINED_VALUE, isValueValid } from "./globals";

/**
 * Given a coloring key or a geographic resolution key
 * (sometimes referred to as a "trait")
 * e.g. "author", "country" etc, extract it's value from a node.
 *
 * If `entropy` is truthy, then extract the entropy value instead
 * If `confidence` is truthy, then extract the confidence value instead
 *
 * When getting value:
 *    Returns `UNDEFINED_VALUE` if not set OR if the value is not valid.
 * When getting entropy or confidence:
 *    Returns `undefined` if not set OR if the value is not valid.
 *
 * NOTE: this only accesses `node_attrs` -- if you want the name or a branch
 * attr then this function is not the one you are looking for.
 *
 * NOTE: do not use this for "div", "vaccine" or other traits set on `node_attrs`
 * which don't share the same structure as tratis. See the JSON spec for more details.
 */
export const getTraitFromNode = (node, trait, {entropy=false, confidence=false}={}) => {

  if (!node.node_attrs) return (!entropy && !confidence) ? UNDEFINED_VALUE : undefined;

  if (!entropy && !confidence) {
    let value = node.node_attrs[trait] ? node.node_attrs[trait].value : UNDEFINED_VALUE;
    if (value !== UNDEFINED_VALUE && !isValueValid(value)) {
      value = UNDEFINED_VALUE;
    }
    return value;
  } else if (entropy) {
    if (node.node_attrs[trait]) return node.node_attrs[trait].entropy;
    return undefined;
  } else if (confidence) {
    if (node.node_attrs[trait]) return node.node_attrs[trait].confidence;
    return undefined;
  }
};

export const getDivFromNode = (node) => {
  if (node.node_attrs && node.node_attrs.div !== undefined) {
    return node.node_attrs.div;
  }
  return undefined;
};

export const getVaccineFromNode = (node) => {
  if (node.node_attrs && node.node_attrs.vaccine) {
    return node.node_attrs.vaccine;
  }
  return undefined;
};

export const getFullAuthorInfoFromNode = (node) =>
  (node.node_attrs && node.node_attrs.author) ?
    node.node_attrs.author :
    undefined;
