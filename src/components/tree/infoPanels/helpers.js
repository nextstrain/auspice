import { getTraitFromNode } from "../../../util/treeMiscHelpers";
import { numericToCalendar } from "../../../util/dateHelpers";


/**
 * Attempt to display the best name we can for a node, depending on how we are looking at a node.
 * The returned string will be rendered on a line of its own, so an empty string will look ok
 * Future enhancement: we could examine the coloring metadata (if available) and format the value accordingly
 */
export function nodeDisplayName(t, node, tipLabelKey, branch) {
  let tipLabel = getTraitFromNode(node, tipLabelKey)
  if (tipLabelKey==='num_date' && tipLabel) tipLabel = numericToCalendar(tipLabel)
  const terminal = !node.hasChildren;

  if (branch) {
    if (terminal) {
      return tipLabel ? t("Branch leading to {{tipLabel}}", {tipLabel}) : t("Terminal branch") // hover + click
    }
    return t("Internal branch")  // branch click only
  }
  /* TIP */
  return tipLabel;
}

export function dateInfo(node, isTerminal) {
  const num_date = getTraitFromNode(node, "num_date");
  if (!num_date) return {};
    
  // Decide if the date is inferred and, if so, attempt to get the underlying ambiguous date (for tips)
  let inferred, ambiguousDate;
  const dateUncertainty = getTraitFromNode(node, "num_date", {confidence: true});
  if (!isTerminal) {
    inferred=true;
  } else if (Object.hasOwn(node.node_attrs.num_date, "inferred")) {
    inferred = node.node_attrs.num_date.inferred;
    ambiguousDate = getTraitFromNode(node, "num_date", {raw: true});
  } else {
    inferred = dateUncertainty && dateUncertainty[0] !== dateUncertainty[1];
  }

  const dateRange = dateUncertainty ?
    [numericToCalendar(dateUncertainty[0]), numericToCalendar(dateUncertainty[1])] :
    undefined;
  const date = numericToCalendar(num_date);

  return {date, dateRange, inferred, ambiguousDate};
}
